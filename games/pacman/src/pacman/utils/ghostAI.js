import { DIRECTIONS, OPPOSITE } from '../constants/gameConfig'
import { SCATTER_TARGETS } from '../constants/maze'
import { canMove, getValidDirections } from './mazeGrid'

const GHOST_IDS = ['blinky', 'pinky', 'inky', 'clyde']

function manhattan(a, b) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row)
}

function aheadTile(pacman, tilesAhead = 4) {
  const { dc, dr } = DIRECTIONS[pacman.dir]
  return {
    col: pacman.col + dc * tilesAhead,
    row: pacman.row + dr * tilesAhead,
  }
}

function vectorAdd(a, b) {
  return { col: a.col + b.col, row: a.row + b.row }
}

function vectorSub(a, b) {
  return { col: a.col - b.col, row: a.row - b.row }
}

function vectorDouble(v) {
  return { col: v.col * 2, row: v.row * 2 }
}

export function getChaseTarget(ghost, pacman, blinkyPos, mode) {
  if (mode === 'frightened') {
    return {
      col: Math.floor(Math.random() * 18),
      row: Math.floor(Math.random() * 20),
    }
  }
  if (mode === 'scatter') {
    return SCATTER_TARGETS[ghost.id]
  }

  switch (ghost.id) {
    case 'blinky':
      return { col: pacman.col, row: pacman.row }
    case 'pinky':
      return aheadTile(pacman, 4)
    case 'inky': {
      const ahead = aheadTile(pacman, 2)
      const vec = vectorSub(ahead, blinkyPos)
      return vectorAdd(ahead, vec)
    }
    case 'clyde': {
      const dist = manhattan(ghost, pacman)
      if (dist > 8) return { col: pacman.col, row: pacman.row }
      return SCATTER_TARGETS.clyde
    }
    default:
      return { col: pacman.col, row: pacman.row }
  }
}

export function chooseGhostDirection(tiles, ghost, target, forbidReverse = true) {
  const reverse = OPPOSITE[ghost.dir]
  const options = getValidDirections(
    tiles,
    ghost.col,
    ghost.row,
    forbidReverse ? reverse : null,
  )

  if (!options.length) {
    const fallback = getValidDirections(tiles, ghost.col, ghost.row)
    return fallback[0] ?? ghost.dir
  }

  if (options.length === 1) return options[0]

  if (ghost.mode === 'frightened') {
    return options[Math.floor(Math.random() * options.length)]
  }

  let best = options[0]
  let bestDist = Infinity
  for (const dir of options) {
    const { dc, dr } = DIRECTIONS[dir]
    const next = { col: ghost.col + dc, row: ghost.row + dr }
    const dist = manhattan(next, target)
    if (dist < bestDist || (dist === bestDist && dirPriority(dir) < dirPriority(best))) {
      bestDist = dist
      best = dir
    }
  }
  return best
}

function dirPriority(dir) {
  const order = { up: 0, left: 1, down: 2, right: 3 }
  return order[dir] ?? 4
}

export function createGhosts(ghostStarts, cols, rows) {
  const start = ghostStarts[0] ?? { col: Math.floor(cols / 2), row: Math.floor(rows / 2) }
  return GHOST_IDS.map((id, i) => ({
    id,
    col: start.col + (i % 2),
    row: start.row + Math.floor(i / 2),
    dir: 'up',
    mode: 'house',
    tileOffset: 0,
    eatenScoreIndex: 0,
    releaseTimerMs: 0,
    normX: 0,
    normY: 0,
  }))
}

export function updateGhostRelease(ghost, elapsedMs, releaseDelayMs) {
  if (ghost.mode !== 'house') return
  ghost.releaseTimerMs += elapsedMs
  if (ghost.releaseTimerMs >= releaseDelayMs) {
    ghost.mode = 'scatter'
    ghost.dir = 'up'
  }
}

export function sendGhostHome(ghost, ghostStarts) {
  const home = ghostStarts[0]
  ghost.col = home.col
  ghost.row = home.row
  ghost.dir = 'up'
  ghost.mode = 'house'
  ghost.tileOffset = 0
  ghost.releaseTimerMs = 0
  ghost.eatenScoreIndex = 0
}
