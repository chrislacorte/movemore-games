import { useEffect, useRef } from 'react'
import { PLAY_PADDING } from '../constants/gameConfig'
import { TILE, GHOST_COLORS } from '../constants/maze'

const COLORS = {
  wall: '#39ff14',
  wallGlow: 'rgba(57, 255, 20, 0.35)',
  pellet: '#ffb000',
  powerPellet: '#ffb000',
  pacman: '#ffb000',
  pacmanGlow: 'rgba(255, 176, 0, 0.6)',
  frightened: '#2121ff',
  frightenedFlash: '#ffffff',
  eye: '#ffffff',
  pupil: '#0000ff',
}

const DIR_ANGLE = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
}

function tileRect(col, row, cols, rows, w, h) {
  const padX = PLAY_PADDING * w
  const padY = PLAY_PADDING * h
  const innerW = w - padX * 2
  const innerH = h - padY * 2
  const tw = innerW / cols
  const th = innerH / rows
  return {
    x: padX + col * tw,
    y: padY + row * th,
    w: tw,
    h: th,
  }
}

function drawMaze(ctx, tiles, cols, rows, w, h) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const type = tiles[row][col]
      const r = tileRect(col, row, cols, rows, w, h)

      if (type === TILE.WALL) {
        ctx.fillStyle = COLORS.wall
        ctx.shadowColor = COLORS.wallGlow
        ctx.shadowBlur = 8
        ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2)
        ctx.shadowBlur = 0
      } else if (type === TILE.PELLET) {
        ctx.fillStyle = COLORS.pellet
        ctx.beginPath()
        ctx.arc(r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.08, 0, Math.PI * 2)
        ctx.fill()
      } else if (type === TILE.POWER) {
        const pulse = 0.85 + Math.sin(Date.now() / 200) * 0.15
        ctx.fillStyle = COLORS.powerPellet
        ctx.shadowColor = COLORS.pacmanGlow
        ctx.shadowBlur = 10 * pulse
        ctx.beginPath()
        ctx.arc(r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) * 0.18 * pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }
  }
}

function drawPacman(ctx, pacman, cols, rows, w, h, pulse) {
  const padX = PLAY_PADDING * w
  const padY = PLAY_PADDING * h
  const innerW = w - padX * 2
  const innerH = h - padY * 2
  const px = padX + ((pacman.normX - PLAY_PADDING) / (1 - PLAY_PADDING * 2)) * innerW
  const py = padY + ((pacman.normY - PLAY_PADDING) / (1 - PLAY_PADDING * 2)) * innerH
  const radius = Math.min(innerW / cols, innerH / rows) * 0.42

  const mouth = 0.35 + Math.sin(pulse * 8) * 0.25
  const angle = DIR_ANGLE[pacman.dir] ?? 0

  ctx.fillStyle = COLORS.pacman
  ctx.shadowColor = COLORS.pacmanGlow
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.arc(px, py, radius, angle + mouth, angle - mouth, true)
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0
}

function drawGhost(ctx, ghost, cols, rows, w, h, powerModeMs) {
  const padX = PLAY_PADDING * w
  const padY = PLAY_PADDING * h
  const innerW = w - padX * 2
  const innerH = h - padY * 2
  const px = padX + (ghost.normX - PLAY_PADDING) / (1 - PLAY_PADDING * 2) * innerW
  const py = padY + (ghost.normY - PLAY_PADDING) / (1 - PLAY_PADDING * 2) * innerH
  const tw = innerW / cols
  const th = innerH / rows
  const radius = Math.min(tw, th) * 0.38

  if (ghost.mode === 'house') return

  const frightened = ghost.mode === 'frightened'
  const flash = frightened && powerModeMs < 2000 && Math.floor(Date.now() / 200) % 2 === 0
  ctx.fillStyle = flash ? COLORS.frightenedFlash : frightened ? COLORS.frightened : GHOST_COLORS[ghost.id]

  ctx.beginPath()
  ctx.arc(px, py - radius * 0.1, radius, Math.PI, 0)
  ctx.lineTo(px + radius, py + radius * 0.6)
  for (let i = 3; i >= 0; i--) {
    const sx = px - radius + (i * (2 * radius)) / 3
    ctx.lineTo(sx, py + radius * (i % 2 === 0 ? 0.35 : 0.6))
  }
  ctx.lineTo(px - radius, py + radius * 0.6)
  ctx.closePath()
  ctx.fill()

  if (!frightened) {
    ctx.fillStyle = COLORS.eye
    const eyeOffset = radius * 0.35
    ctx.beginPath()
    ctx.arc(px - eyeOffset, py - radius * 0.15, radius * 0.22, 0, Math.PI * 2)
    ctx.arc(px + eyeOffset, py - radius * 0.15, radius * 0.22, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = COLORS.pupil
    const pupilShift = { up: [0, -2], down: [0, 2], left: [-2, 0], right: [2, 0] }[ghost.dir] ?? [0, 0]
    ctx.beginPath()
    ctx.arc(px - eyeOffset + pupilShift[0], py - radius * 0.15 + pupilShift[1], radius * 0.1, 0, Math.PI * 2)
    ctx.arc(px + eyeOffset + pupilShift[0], py - radius * 0.15 + pupilShift[1], radius * 0.1, 0, Math.PI * 2)
    ctx.fill()
  } else if (!flash) {
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(px - radius * 0.4, py)
    ctx.lineTo(px + radius * 0.4, py)
    ctx.stroke()
  }
}

export default function PacmanCanvas({ displayState }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    const draw = () => {
      const ctx = canvas.getContext('2d')
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      ctx.clearRect(0, 0, w, h)

      const { tiles, maze, pacman, ghosts, pulse, powerModeMs } = displayState
      if (!tiles || !maze || !pacman) {
        raf = requestAnimationFrame(draw)
        return
      }

      drawMaze(ctx, tiles, maze.cols, maze.rows, w, h)
      for (const ghost of ghosts ?? []) {
        drawGhost(ctx, ghost, maze.cols, maze.rows, w, h, powerModeMs)
      }
      drawPacman(ctx, pacman, maze.cols, maze.rows, w, h, pulse ?? 0)

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [displayState])

  return (
    <canvas
      ref={canvasRef}
      className="crt-window h-full w-full"
      aria-label="Pacman game board"
    />
  )
}
