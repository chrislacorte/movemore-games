import { useEffect, useRef } from 'react'
import { COLS, ROWS, BUFFER_ROWS } from '../constants/gameConfig'
import { PIECE_COLORS } from '../utils/tetrominoes'
import { getCells } from '../utils/tetrominoes'

function drawCell(ctx, col, row, color, cell, offsetY, alpha = 1) {
  const visibleRow = row - BUFFER_ROWS
  if (visibleRow < 0 || visibleRow >= ROWS) return

  const x = col * cell
  const y = (visibleRow + offsetY) * cell
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1)
  ctx.globalAlpha = 1
}

export default function TetrisCanvas({ displayState }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const cell = Math.min(rect.width / COLS, rect.height / ROWS)
    const boardW = cell * COLS
    const boardH = cell * ROWS
    const offsetX = (rect.width - boardW) / 2
    const offsetY = (rect.height - boardH) / 2

    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.save()
    ctx.translate(offsetX, offsetY)

    ctx.strokeStyle = 'rgba(57, 255, 20, 0.2)'
    ctx.lineWidth = 1
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath()
      ctx.moveTo(c * cell, 0)
      ctx.lineTo(c * cell, boardH)
      ctx.stroke()
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath()
      ctx.moveTo(0, r * cell)
      ctx.lineTo(boardW, r * cell)
      ctx.stroke()
    }

    const { grid, active, ghost } = displayState

    for (let r = BUFFER_ROWS; r < grid.length; r++) {
      for (let c = 0; c < COLS; c++) {
        const type = grid[r][c]
        if (type) {
          drawCell(ctx, c, r, PIECE_COLORS[type], cell, 0)
        }
      }
    }

    if (ghost) {
      for (const [r, c] of getCells(ghost.type, ghost.rotation, ghost.row, ghost.col)) {
        drawCell(ctx, c, r, PIECE_COLORS[ghost.type], cell, 0, 0.25)
      }
    }

    if (active) {
      for (const [r, c] of getCells(active.type, active.rotation, active.row, active.col)) {
        drawCell(ctx, c, r, PIECE_COLORS[active.type], cell, 0)
      }
    }

    ctx.restore()
  }, [displayState])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      aria-label="Tetris board"
    />
  )
}
