import { useRef, useState, useCallback } from 'react'
import {
  GAME_PHASES,
  BASE_SEGMENT_COUNT,
  HEAD_RADIUS,
  SEGMENT_RADIUS,
  FOOD_RADIUS,
  PLAY_PADDING,
} from '../constants/gameConfig'
import { getLevel } from '../constants/levels'
import { dist } from '../utils/trail'
import { updateSegmentChain, appendTailSegment } from '../utils/snakeChain'

function gridToNorm(col, row, cols, rows) {
  const innerW = 1 - PLAY_PADDING * 2
  const innerH = 1 - PLAY_PADDING * 2
  return {
    x: PLAY_PADDING + ((col + 0.5) / cols) * innerW,
    y: PLAY_PADDING + ((row + 0.5) / rows) * innerH,
  }
}

function normToGrid(x, y, cols, rows) {
  const innerW = 1 - PLAY_PADDING * 2
  const innerH = 1 - PLAY_PADDING * 2
  const col = Math.floor(((x - PLAY_PADDING) / innerW) * cols)
  const row = Math.floor(((y - PLAY_PADDING) / innerH) * rows)
  return {
    col: Math.max(0, Math.min(cols - 1, col)),
    row: Math.max(0, Math.min(rows - 1, row)),
  }
}

function createInitialState(levelIndex = 0) {
  const level = getLevel(levelIndex)
  const start = gridToNorm(
    Math.floor(level.gridCols / 2),
    Math.floor(level.gridRows / 2),
    level.gridCols,
    level.gridRows,
  )
  const segments = Array.from({ length: BASE_SEGMENT_COUNT }, () => ({
    x: start.x,
    y: start.y,
  }))
  return {
    levelIndex,
    level,
    score: 0,
    foodCollected: 0,
    segments,
    food: null,
    handLostMs: 0,
    pulse: 0,
    deathReason: null,
    foodCooldownMs: 0,
  }
}

function spawnFood(state) {
  const { level, segments, food } = state
  const occupied = new Set()
  for (const s of segments) {
    const g = normToGrid(s.x, s.y, level.gridCols, level.gridRows)
    occupied.add(`${g.col},${g.row}`)
  }
  if (food) {
    occupied.add(`${food.col},${food.row}`)
  }

  const free = []
  for (let row = 0; row < level.gridRows; row++) {
    for (let col = 0; col < level.gridCols; col++) {
      const key = `${col},${row}`
      if (!occupied.has(key)) free.push({ col, row })
    }
  }

  if (!free.length) return null
  const pick = free[Math.floor(Math.random() * free.length)]
  const pos = gridToNorm(pick.col, pick.row, level.gridCols, level.gridRows)
  return { col: pick.col, row: pick.row, x: pos.x, y: pos.y }
}

function hitWall(x, y) {
  const min = PLAY_PADDING + HEAD_RADIUS * 0.5
  const max = 1 - PLAY_PADDING - HEAD_RADIUS * 0.5
  return x < min || x > max || y < min || y > max
}

function checkSelfCollision(head, segments) {
  const skip = 4
  for (let i = skip; i < segments.length; i++) {
    if (dist(head, segments[i]) < HEAD_RADIUS + SEGMENT_RADIUS) {
      return true
    }
  }
  return false
}

export function useSnakeEngine() {
  const [phase, setPhase] = useState(GAME_PHASES.INTRO)
  const [displayState, setDisplayState] = useState(createInitialState())
  const gameStateRef = useRef(createInitialState())
  const levelUpTimerRef = useRef(null)

  const syncDisplay = useCallback(() => {
    const s = gameStateRef.current
    setDisplayState({
      levelIndex: s.levelIndex,
      level: { ...s.level },
      score: s.score,
      foodCollected: s.foodCollected,
      segmentCount: s.segments.length,
      segments: s.segments.map((p) => ({ ...p })),
      food: s.food ? { ...s.food } : null,
      handLostMs: s.handLostMs,
      pulse: s.pulse,
      deathReason: s.deathReason,
    })
  }, [])

  const resetLevelState = useCallback(
    (levelIndex) => {
      const state = createInitialState(levelIndex)
      state.food = spawnFood(state)
      gameStateRef.current = state
      syncDisplay()
    },
    [syncDisplay],
  )

  const startCalibration = useCallback(() => {
    setPhase(GAME_PHASES.CALIBRATE)
  }, [])

  const startPlay = useCallback(() => {
    resetLevelState(0)
    setPhase(GAME_PHASES.PLAY)
  }, [resetLevelState])

  const resetToIntro = useCallback(() => {
    if (levelUpTimerRef.current) {
      clearTimeout(levelUpTimerRef.current)
      levelUpTimerRef.current = null
    }
    gameStateRef.current = createInitialState()
    syncDisplay()
    setPhase(GAME_PHASES.INTRO)
  }, [syncDisplay])

  const advanceLevel = useCallback(() => {
    const nextIndex = gameStateRef.current.levelIndex + 1
    resetLevelState(nextIndex)
    setPhase(GAME_PHASES.PLAY)
  }, [resetLevelState])

  const triggerLevelUp = useCallback(() => {
    setPhase(GAME_PHASES.LEVEL_UP)
    if (levelUpTimerRef.current) clearTimeout(levelUpTimerRef.current)
    levelUpTimerRef.current = setTimeout(() => {
      levelUpTimerRef.current = null
      advanceLevel()
    }, 2200)
  }, [advanceLevel])

  const triggerGameOver = useCallback(
    (reason) => {
      gameStateRef.current.deathReason = reason
      syncDisplay()
      setPhase(GAME_PHASES.GAME_OVER)
    },
    [syncDisplay],
  )

  const tick = useCallback(
    (dt, head, timeScale = 1) => {
      if (phase !== GAME_PHASES.PLAY) return { event: null }

      const scaledDt = dt * timeScale
      const state = gameStateRef.current
      state.pulse += scaledDt * 3
      state.foodCooldownMs = Math.max(0, state.foodCooldownMs - dt * 1000)

      if (!head?.visible) {
        state.handLostMs += dt * 1000
        if (state.handLostMs > 2500) {
          triggerGameOver('hand_lost')
          return { event: 'game_over' }
        }
        syncDisplay()
        return { event: null }
      }
      state.handLostMs = 0

      const spacing = state.level.segmentSpacing
      state.segments = updateSegmentChain(state.segments, head, spacing)

      const snakeHead = state.segments[0]
      if (!snakeHead) {
        syncDisplay()
        return { event: null }
      }

      if (hitWall(snakeHead.x, snakeHead.y)) {
        triggerGameOver('wall')
        return { event: 'game_over' }
      }

      if (checkSelfCollision(snakeHead, state.segments)) {
        triggerGameOver('self')
        return { event: 'game_over' }
      }

      if (!state.food) {
        state.food = spawnFood(state)
      }

      if (state.food && state.foodCooldownMs <= 0) {
        if (dist(snakeHead, state.food) < HEAD_RADIUS + FOOD_RADIUS) {
          state.score += 10
          state.foodCollected += 1
          state.segments = appendTailSegment(state.segments)
          state.foodCooldownMs = 180
          state.food = spawnFood(state)

          syncDisplay()

          if (state.foodCollected >= state.level.foodTarget) {
            triggerLevelUp()
            return { event: 'level_up' }
          }

          return { event: 'eat' }
        }
      }

      syncDisplay()
      return { event: null }
    },
    [phase, syncDisplay, triggerGameOver, triggerLevelUp],
  )

  return {
    phase,
    displayState,
    gameStateRef,
    startCalibration,
    startPlay,
    resetToIntro,
    advanceLevel,
    tick,
    setPhase,
  }
}
