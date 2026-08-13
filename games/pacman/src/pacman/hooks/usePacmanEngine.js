import { useRef, useState, useCallback } from 'react'
import {
  GAME_PHASES,
  getLevel,
  DIRECTIONS,
  SCORE,
  POWER_MODE_MS,
  MODE_CYCLE_MS,
  GHOST_RELEASE_MS,
  LEVEL_UP_CARD_MS,
  HAND_LOST_MS,
} from '../constants/gameConfig'
import { TILE } from '../constants/maze'
import {
  parseMaze,
  canMove,
  wrapCol,
  gridToNorm,
  countPellets,
  eatPellet,
  cloneTiles,
  isAtTileCenter,
} from '../utils/mazeGrid'
import {
  createGhosts,
  getChaseTarget,
  chooseGhostDirection,
  updateGhostRelease,
  sendGhostHome,
} from '../utils/ghostAI'

const TUNNEL_ROWS = new Set([9])

function createInitialState(levelIndex = 0) {
  const level = getLevel(levelIndex)
  const maze = parseMaze()
  const tiles = cloneTiles(maze.tiles)
  const pacmanStart = maze.pacmanStart
  const ghosts = createGhosts(maze.ghostStarts, maze.cols, maze.rows)

  GHOST_RELEASE_MS.forEach((delay, i) => {
    if (ghosts[i]) ghosts[i].releaseDelayMs = delay
  })

  const norm = gridToNorm(pacmanStart.col, pacmanStart.row, maze.cols, maze.rows)

  return {
    levelIndex,
    level,
    maze,
    tiles,
    score: 0,
    pelletsRemaining: countPellets(tiles),
    pelletsTotal: countPellets(tiles),
    pacman: {
      col: pacmanStart.col,
      row: pacmanStart.row,
      dir: 'left',
      queuedDir: 'left',
      tileOffset: 0,
      normX: norm.x,
      normY: norm.y,
    },
    ghosts,
    ghostMode: 'scatter',
    modeTimerMs: 0,
    powerModeMs: 0,
    ghostsEatenChain: 0,
    handLostMs: 0,
    deathReason: null,
    pulse: 0,
    elapsedMs: 0,
  }
}

function syncNorm(entity, cols, rows) {
  const norm = gridToNorm(entity.col, entity.row, cols, rows)
  const { dc, dr } = DIRECTIONS[entity.dir]
  const innerW = 1 - 0.06 * 2
  const innerH = 1 - 0.06 * 2
  const tileW = innerW / cols
  const tileH = innerH / rows
  entity.normX = norm.x + dc * entity.tileOffset * tileW
  entity.normY = norm.y + dr * entity.tileOffset * tileH
}

function tryTurn(entity, tiles, queuedDir) {
  if (!isAtTileCenter(entity)) return
  if (queuedDir && canMove(tiles, entity.col, entity.row, queuedDir)) {
    entity.dir = queuedDir
    entity.queuedDir = queuedDir
  }
}

function resolveNextTile(entity, cols, rows) {
  const { dc, dr } = DIRECTIONS[entity.dir]
  let nextCol = entity.col + dc
  const nextRow = entity.row + dr

  if (TUNNEL_ROWS.has(entity.row) && (nextCol < 0 || nextCol >= cols)) {
    nextCol = wrapCol(nextCol, cols)
    return { col: nextCol, row: nextRow, isTunnel: true }
  }

  return { col: nextCol, row: nextRow, isTunnel: false }
}

function moveEntity(entity, tiles, cols, rows, speed, dt, queuedDir, onCenter) {
  tryTurn(entity, tiles, queuedDir)

  const next = resolveNextTile(entity, cols, rows)
  const blocked =
    !next.isTunnel &&
    (next.col < 0 ||
      next.col >= cols ||
      next.row < 0 ||
      next.row >= rows ||
      tiles[next.row][next.col] === TILE.WALL)

  if (blocked) {
    entity.tileOffset = 0
    syncNorm(entity, cols, rows)
    return
  }

  entity.tileOffset += speed * dt

  while (entity.tileOffset >= 1) {
    entity.tileOffset -= 1
    entity.col = next.col
    entity.row = next.row

    if (onCenter) onCenter(entity)

    tryTurn(entity, tiles, queuedDir)

    const nextAfter = resolveNextTile(entity, cols, rows)
    const blockedAfter =
      !nextAfter.isTunnel &&
      (nextAfter.col < 0 ||
        nextAfter.col >= cols ||
        nextAfter.row < 0 ||
        nextAfter.row >= rows ||
        tiles[nextAfter.row][nextAfter.col] === TILE.WALL)

    if (blockedAfter) {
      entity.tileOffset = 0
      break
    }
  }

  syncNorm(entity, cols, rows)
}

function distNorm(a, b) {
  return Math.hypot(a.normX - b.normX, a.normY - b.normY)
}

export function usePacmanEngine() {
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
      pelletsRemaining: s.pelletsRemaining,
      pelletsTotal: s.pelletsTotal,
      pacman: { ...s.pacman },
      ghosts: s.ghosts.map((g) => ({ ...g })),
      tiles: s.tiles.map((row) => [...row]),
      maze: { cols: s.maze.cols, rows: s.maze.rows },
      ghostMode: s.ghostMode,
      powerModeMs: s.powerModeMs,
      handLostMs: s.handLostMs,
      pulse: s.pulse,
      deathReason: s.deathReason,
    })
  }, [])

  const resetLevelState = useCallback(
    (levelIndex) => {
      gameStateRef.current = createInitialState(levelIndex)
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
    }, LEVEL_UP_CARD_MS)
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
    (dt, input, timeScale = 1) => {
      if (phase !== GAME_PHASES.PLAY) return { event: null }

      const scaledDt = dt * timeScale
      const state = gameStateRef.current
      const { cols, rows } = state.maze
      state.pulse += scaledDt * 3
      state.elapsedMs += dt * 1000

      const finger = input?.finger
      const queuedDir = input?.queuedDir ?? state.pacman.queuedDir

      if (!finger?.visible) {
        state.handLostMs += dt * 1000
        syncDisplay()
        if (state.handLostMs > HAND_LOST_MS) {
          triggerGameOver('hand_lost')
          return { event: 'game_over' }
        }
        return { event: null }
      }
      state.handLostMs = 0

      state.pacman.queuedDir = queuedDir

      if (state.powerModeMs > 0) {
        state.powerModeMs = Math.max(0, state.powerModeMs - dt * 1000)
        if (state.powerModeMs === 0) {
          state.ghosts.forEach((g) => {
            if (g.mode === 'frightened') g.mode = state.ghostMode
          })
          state.ghostsEatenChain = 0
        }
      } else {
        state.modeTimerMs += dt * 1000
        if (state.modeTimerMs >= MODE_CYCLE_MS) {
          state.modeTimerMs = 0
          state.ghostMode = state.ghostMode === 'scatter' ? 'chase' : 'scatter'
          state.ghosts.forEach((g) => {
            if (g.mode !== 'house') g.mode = state.ghostMode
          })
        }
      }

      const onPacmanCenter = (entity) => {
        const eaten = eatPellet(state.tiles, entity.col, entity.row)
        if (eaten === TILE.PELLET) {
          state.score += SCORE.pellet
          state.pelletsRemaining -= 1
        } else if (eaten === TILE.POWER) {
          state.score += SCORE.powerPellet
          state.pelletsRemaining -= 1
          state.powerModeMs = state.level.frightenedDurationMs ?? POWER_MODE_MS
          state.ghostsEatenChain = 0
          state.ghosts.forEach((g) => {
            if (g.mode !== 'house') g.mode = 'frightened'
          })
          state.lastEvent = 'power'
        }
      }

      moveEntity(
        state.pacman,
        state.tiles,
        cols,
        rows,
        state.level.pacmanSpeed,
        scaledDt,
        queuedDir,
        onPacmanCenter,
      )

      const blinky = state.ghosts.find((g) => g.id === 'blinky')
      const ghostGlobalMode =
        state.powerModeMs > 0 ? 'frightened' : state.ghostMode

      for (const ghost of state.ghosts) {
        if (ghost.mode === 'house') {
          updateGhostRelease(ghost, dt * 1000, ghost.releaseDelayMs ?? 0)
          syncNorm(ghost, cols, rows)
          continue
        }

        const effectiveMode = ghost.mode === 'frightened' ? 'frightened' : ghostGlobalMode
        ghost.mode = effectiveMode

        const onGhostCenter = (entity) => {
          const target = getChaseTarget(
            entity,
            state.pacman,
            blinky ?? entity,
            effectiveMode,
          )
          entity.dir = chooseGhostDirection(
            state.tiles,
            entity,
            target,
            true,
          )
        }

        const ghostSpeed =
          effectiveMode === 'frightened'
            ? state.level.frightenedSpeed
            : state.level.ghostSpeed

        moveEntity(
          ghost,
          state.tiles,
          cols,
          rows,
          ghostSpeed,
          scaledDt,
          null,
          onGhostCenter,
        )
      }

      for (const ghost of state.ghosts) {
        if (ghost.mode === 'house') continue
        if (distNorm(state.pacman, ghost) < 0.035) {
          if (ghost.mode === 'frightened') {
            const idx = Math.min(state.ghostsEatenChain, SCORE.ghost.length - 1)
            state.score += SCORE.ghost[idx]
            state.ghostsEatenChain += 1
            sendGhostHome(ghost, state.maze.ghostStarts)
          } else {
            triggerGameOver('ghost')
            return { event: 'game_over', reason: 'ghost' }
          }
        }
      }

      syncDisplay()

      if (state.lastEvent === 'power') {
        state.lastEvent = null
        return { event: 'power' }
      }

      if (state.pelletsRemaining <= 0) {
        triggerLevelUp()
        return { event: 'level_up' }
      }

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
    tick,
  }
}
