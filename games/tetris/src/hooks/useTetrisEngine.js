import { useRef, useState, useCallback } from 'react'
import {
  GAME_PHASES,
  BASE_FALL_MS,
  MIN_FALL_MS,
  LINES_PER_LEVEL,
  LOCK_DELAY_MS,
  SOFT_DROP_MULTIPLIER,
  MAX_FALL_STEPS_PER_TICK,
} from '../constants/gameConfig'
import {
  createEmptyGrid,
  collides,
  mergePiece,
  clearFullLines,
  isGameOver,
  ghostRow,
  tryRotate,
  tryMoveColumn,
  scoreForLines,
  snapPieceToGround,
} from '../utils/board'
import { randomPieceType } from '../utils/tetrominoes'

function fallMsForLevel(level) {
  return Math.max(MIN_FALL_MS, BASE_FALL_MS - level * 70)
}

function spawnPiece(type) {
  return { type, rotation: 0, row: 0, col: 3 }
}

function createInitialState() {
  const first = spawnPiece(randomPieceType())
  return {
    grid: createEmptyGrid(),
    active: first,
    next: randomPieceType(),
    score: 0,
    lines: 0,
    level: 0,
    fallMs: fallMsForLevel(0),
    fallTimer: 0,
    lockTimer: 0,
    locking: false,
    gameOver: false,
  }
}

function toDisplayState(state) {
  const ghost =
    state.active && !state.gameOver
      ? { ...state.active, row: ghostRow(state.grid, state.active) }
      : null
  return {
    grid: state.grid,
    active: state.active,
    ghost,
    next: state.next,
    score: state.score,
    lines: state.lines,
    level: state.level + 1,
    gameOver: state.gameOver,
  }
}

export function useTetrisEngine() {
  const [phase, setPhase] = useState(GAME_PHASES.INTRO)
  const [displayState, setDisplayState] = useState(() => toDisplayState(createInitialState()))
  const gameStateRef = useRef(createInitialState())

  const syncDisplay = useCallback(() => {
    setDisplayState(toDisplayState(gameStateRef.current))
  }, [])

  const startCalibration = useCallback(() => {
    setPhase(GAME_PHASES.CALIBRATE)
  }, [])

  const startPlay = useCallback(() => {
    gameStateRef.current = createInitialState()
    syncDisplay()
    setPhase(GAME_PHASES.PLAY)
  }, [syncDisplay])

  const resetToIntro = useCallback(() => {
    gameStateRef.current = createInitialState()
    syncDisplay()
    setPhase(GAME_PHASES.INTRO)
  }, [syncDisplay])

  const lockPiece = useCallback((state) => {
    const grounded = snapPieceToGround(state.grid, state.active)
    let grid = mergePiece(state.grid, grounded)
    const { grid: clearedGrid, cleared } = clearFullLines(grid)
    grid = clearedGrid
    const lines = state.lines + cleared
    const level = Math.floor(lines / LINES_PER_LEVEL)
    const score = state.score + scoreForLines(cleared, level)
    const nextActive = spawnPiece(state.next)
    const gameOver = isGameOver(grid) || collides(grid, nextActive.type, nextActive.rotation, nextActive.row, nextActive.col)

    return {
      ...state,
      grid,
      active: gameOver ? null : nextActive,
      next: randomPieceType(),
      score,
      lines,
      level,
      fallMs: fallMsForLevel(level),
      fallTimer: 0,
      lockTimer: 0,
      locking: false,
      gameOver,
    }
  }, [])

  const tick = useCallback(
    (dtSec, input) => {
      if (phase !== GAME_PHASES.PLAY) return null

      const state = gameStateRef.current
      if (state.gameOver) return { event: 'game_over' }

      let next = { ...state, active: { ...state.active } }

      if (input?.rotationEvent) {
        next.active = tryRotate(next.grid, next.active, input.rotationEvent)
      }

      if (input?.palm?.visible) {
        next.active = tryMoveColumn(next.grid, next.active, input.palm.column)
      }

      const onGround = collides(
        next.grid,
        next.active.type,
        next.active.rotation,
        next.active.row + 1,
        next.active.col,
      )

      if (onGround) {
        next.lockTimer += dtSec * 1000
        next.locking = true
        if (next.lockTimer >= LOCK_DELAY_MS) {
          next = lockPiece(next)
          gameStateRef.current = next
          syncDisplay()
          if (next.gameOver) {
            setPhase(GAME_PHASES.GAME_OVER)
            return { event: 'game_over' }
          }
          return null
        }
      } else {
        next.locking = false
        next.lockTimer = 0
        const fallRate = input?.softDrop ? SOFT_DROP_MULTIPLIER : 1
        next.fallTimer += dtSec * 1000 * fallRate

        let steps = 0
        while (next.fallTimer >= next.fallMs && steps < MAX_FALL_STEPS_PER_TICK) {
          next.fallTimer -= next.fallMs
          steps += 1
          if (
            !collides(
              next.grid,
              next.active.type,
              next.active.rotation,
              next.active.row + 1,
              next.active.col,
            )
          ) {
            next.active = { ...next.active, row: next.active.row + 1 }
          } else {
            next.locking = true
            next.lockTimer += dtSec * 1000
            if (next.lockTimer >= LOCK_DELAY_MS) {
              next = lockPiece(next)
              gameStateRef.current = next
              syncDisplay()
              if (next.gameOver) {
                setPhase(GAME_PHASES.GAME_OVER)
                return { event: 'game_over' }
              }
              return null
            }
            break
          }
        }
      }

      gameStateRef.current = next
      syncDisplay()
      return null
    },
    [phase, lockPiece, syncDisplay],
  )

  return {
    phase,
    displayState,
    gameStateRef,
    startCalibration,
    startPlay,
    resetToIntro,
    tick,
  }
}
