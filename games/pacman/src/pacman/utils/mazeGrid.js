import { PLAY_PADDING } from '../constants/gameConfig'
import { MAZE_LAYOUT, TILE } from '../constants/maze'
import { DIRECTIONS } from '../constants/gameConfig'

export function parseMaze(layout = MAZE_LAYOUT) {
  const rows = layout.length
  const cols = layout[0].length
  const tiles = []
  let pacmanStart = null
  const ghostStarts = []

  for (let row = 0; row < rows; row++) {
    const rowTiles = []
    for (let col = 0; col < cols; col++) {
      const ch = layout[row][col]
      let type = TILE.EMPTY
      if (ch === '#') type = TILE.WALL
      else if (ch === '.') type = TILE.PELLET
      else if (ch === 'o') type = TILE.POWER
      else if (ch === 'P') {
        type = TILE.EMPTY
        pacmanStart = { col, row }
      } else if (ch === 'G') {
        type = TILE.EMPTY
        ghostStarts.push({ col, row })
      }
      rowTiles.push(type)
    }
    tiles.push(rowTiles)
  }

  if (!pacmanStart) {
    pacmanStart = { col: Math.floor(cols / 2), row: Math.floor(rows / 2) }
  }
  if (!ghostStarts.length) {
    ghostStarts.push({ col: Math.floor(cols / 2), row: Math.floor(rows / 2) - 2 })
  }

  return { tiles, cols, rows, pacmanStart, ghostStarts }
}

export function tileAt(tiles, col, row) {
  if (row < 0 || row >= tiles.length || col < 0 || col >= tiles[0].length) {
    return TILE.WALL
  }
  return tiles[row][col]
}

export function isWall(tiles, col, row) {
  return tileAt(tiles, col, row) === TILE.WALL
}

export function canMove(tiles, col, row, direction) {
  const { dc, dr } = DIRECTIONS[direction]
  return !isWall(tiles, col + dc, row + dr)
}

export function wrapCol(col, cols) {
  if (col < 0) return cols - 1
  if (col >= cols) return 0
  return col
}

export function gridToNorm(col, row, cols, rows) {
  const innerW = 1 - PLAY_PADDING * 2
  const innerH = 1 - PLAY_PADDING * 2
  return {
    x: PLAY_PADDING + ((col + 0.5) / cols) * innerW,
    y: PLAY_PADDING + ((row + 0.5) / rows) * innerH,
  }
}

export function normToGrid(x, y, cols, rows) {
  const innerW = 1 - PLAY_PADDING * 2
  const innerH = 1 - PLAY_PADDING * 2
  const col = Math.floor(((x - PLAY_PADDING) / innerW) * cols)
  const row = Math.floor(((y - PLAY_PADDING) / innerH) * rows)
  return {
    col: Math.max(0, Math.min(cols - 1, col)),
    row: Math.max(0, Math.min(rows - 1, row)),
  }
}

export function countPellets(tiles) {
  let n = 0
  for (const row of tiles) {
    for (const t of row) {
      if (t === TILE.PELLET || t === TILE.POWER) n++
    }
  }
  return n
}

export function eatPellet(tiles, col, row) {
  const type = tileAt(tiles, col, row)
  if (type === TILE.PELLET || type === TILE.POWER) {
    tiles[row][col] = TILE.EMPTY
    return type
  }
  return null
}

export function cloneTiles(tiles) {
  return tiles.map((row) => [...row])
}

export function getValidDirections(tiles, col, row, excludeDir = null) {
  const dirs = []
  for (const dir of Object.keys(DIRECTIONS)) {
    if (dir === excludeDir) continue
    if (canMove(tiles, col, row, dir)) dirs.push(dir)
  }
  return dirs
}

export function isAtTileCenter(entity, tolerance = 0.08) {
  return Math.abs(entity.tileOffset) < tolerance
}

export function tileSizeNorm(cols, rows) {
  const innerW = 1 - PLAY_PADDING * 2
  const innerH = 1 - PLAY_PADDING * 2
  return { w: innerW / cols, h: innerH / rows }
}
