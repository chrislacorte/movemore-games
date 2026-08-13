import { useEffect, useRef } from 'react'
import { PLAY_PADDING } from '../constants/gameConfig'

const COLORS = {
  gridLine: 'rgba(57, 255, 20, 0.18)',
  snakeHead: '#39ff14',
  snakeBody: '#2ecc12',
  snakeGlow: 'rgba(57, 255, 20, 0.6)',
  food: '#ffb000',
  foodGlow: 'rgba(255, 176, 0, 0.7)',
}

function toCanvas(x, y, w, h) {
  const padX = PLAY_PADDING * w
  const padY = PLAY_PADDING * h
  const innerW = w - padX * 2
  const innerH = h - padY * 2
  return {
    x: padX + x * innerW,
    y: padY + y * innerH,
  }
}

function drawGrid(ctx, w, h, cols, rows) {
  const padX = PLAY_PADDING * w
  const padY = PLAY_PADDING * h
  const innerW = w - padX * 2
  const innerH = h - padY * 2

  ctx.strokeStyle = COLORS.gridLine
  ctx.lineWidth = 1
  for (let c = 0; c <= cols; c++) {
    const x = padX + (c / cols) * innerW
    ctx.beginPath()
    ctx.moveTo(x, padY)
    ctx.lineTo(x, padY + innerH)
    ctx.stroke()
  }
  for (let r = 0; r <= rows; r++) {
    const y = padY + (r / rows) * innerH
    ctx.beginPath()
    ctx.moveTo(padX, y)
    ctx.lineTo(padX + innerW, y)
    ctx.stroke()
  }
}

export default function SnakeCanvas({ displayState, timeScale = 1 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w < 1 || h < 1) return
      canvas.width = w
      canvas.height = h
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let raf = 0
    const render = () => {
      const canvas = canvasRef.current
      if (!canvas) {
        raf = requestAnimationFrame(render)
        return
      }

      const ctx = canvas.getContext('2d')
      const w = canvas.width
      const h = canvas.height
      if (w < 1 || h < 1) {
        raf = requestAnimationFrame(render)
        return
      }

      ctx.clearRect(0, 0, w, h)

      const { level, segments, food, pulse } = displayState
      if (level) {
        drawGrid(ctx, w, h, level.gridCols, level.gridRows)
      }

      if (food) {
        const fp = toCanvas(food.x, food.y, w, h)
        const pulseScale = 1 + Math.sin(pulse) * 0.15
        const r = Math.min(w, h) * 0.014 * pulseScale
        ctx.shadowColor = COLORS.foodGlow
        ctx.shadowBlur = 16
        ctx.fillStyle = COLORS.food
        ctx.fillRect(fp.x - r, fp.y - r, r * 2, r * 2)
        ctx.shadowBlur = 0
      }

      if (segments?.length) {
        for (let i = segments.length - 1; i >= 0; i--) {
          const p = toCanvas(segments[i].x, segments[i].y, w, h)
          const t = i / Math.max(1, segments.length - 1)
          const r = Math.min(w, h) * (i === 0 ? 0.018 : 0.013 - t * 0.003)
          ctx.shadowColor = COLORS.snakeGlow
          ctx.shadowBlur = i === 0 ? 22 : 10
          ctx.fillStyle = i === 0 ? COLORS.snakeHead : COLORS.snakeBody
          ctx.globalAlpha = 1 - t * 0.25
          ctx.beginPath()
          ctx.arc(p.x, p.y, Math.max(3, r), 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0
      }

      if (timeScale < 1) {
        ctx.fillStyle = `rgba(0,0,0,${(1 - timeScale) * 0.12})`
        ctx.fillRect(0, 0, w, h)
      }

      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)
    return () => cancelAnimationFrame(raf)
  }, [displayState, timeScale])

  return (
    <canvas
      ref={canvasRef}
      className="crt-window pointer-events-none absolute inset-0 h-full w-full bg-transparent"
    />
  )
}
