import { COLS, ROWS, BUFFER_ROWS, TOTAL_ROWS } from '../constants/gameConfig'
import { getCells } from './tetrominoes'

/** First row index below the visible playfield (exclusive). */
export const FLOOR_ROW = BUFFER_ROWS + ROWS

export function createEmptyGrid() {
  return Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(null))
}

export function cellsInBounds(cells) {
  return cells.every(([r, c]) => r >= 0 && r < FLOOR_ROW && c >= 0 && c < COLS)
}

export function collides(grid, type, rotation, row, col, ignoreRowCol = null) {
  const cells = getCells(type, rotation, row, col)
  for (const [r, c] of cells) {
    if (r < 0 || r >= FLOOR_ROW || c < 0 || c >= COLS) return true
    if (ignoreRowCol && r === ignoreRowCol[0] && c === ignoreRowCol[1]) continue
    if (grid[r][c]) return true
  }
  return false
}

export function snapPieceToGround(grid, piece) {
  if (!piece) return piece
  let row = piece.row
  while (!collides(grid, piece.type, piece.rotation, row + 1, piece.col)) {
    row += 1
  }
  return { ...piece, row }
}

export function mergePiece(grid, piece) {
  const grounded = snapPieceToGround(grid, piece)
  const next = grid.map((row) => [...row])
  for (const [r, c] of getCells(grounded.type, grounded.rotation, grounded.row, grounded.col)) {
    if (r >= 0 && r < FLOOR_ROW && c >= 0 && c < COLS) {
      next[r][c] = grounded.type
    }
  }
  return next
}

export function clearFullLines(grid) {
  const remaining = grid.filter((row) => row.some((cell) => cell === null))
  const cleared = TOTAL_ROWS - remaining.length
  while (remaining.length < TOTAL_ROWS) {
    remaining.unshift(Array(COLS).fill(null))
  }
  return { grid: remaining, cleared }
}

export function isGameOver(grid) {
  return grid[0].some((cell) => cell !== null) || grid[1].some((cell) => cell !== null)
}

export function ghostRow(grid, piece) {
  return snapPieceToGround(grid, piece).row
}

export function tryRotate(grid, piece, direction) {
  const nextRotation =
    direction === 'cw' ? (piece.rotation + 1) % 4 : (piece.rotation + 3) % 4
  const kicks = [0, -1, 1, -2, 2]
  for (const kick of kicks) {
    const col = piece.col + kick
    if (!collides(grid, piece.type, nextRotation, piece.row, col)) {
      return { ...piece, rotation: nextRotation, col }
    }
  }
  return piece
}

export function tryMoveColumn(grid, piece, targetCol) {
  const col = Math.max(0, Math.min(COLS - 1, targetCol))
  if (!collides(grid, piece.type, piece.rotation, piece.row, col)) {
    return { ...piece, col }
  }
  return piece
}

export function scoreForLines(lines, level) {
  const table = [0, 100, 300, 500, 800]
  return (table[lines] ?? 800) * (level + 1)
}
