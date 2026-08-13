import { LM } from '../constants/gameConfig'

const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

const HAND_COLORS = [
  { stroke: 'rgba(57, 255, 20, 0.45)', fill: '#39ff14', glow: 'rgba(57, 255, 20, 0.95)' },
  { stroke: 'rgba(255, 176, 0, 0.45)', fill: '#ffb000', glow: 'rgba(255, 176, 0, 0.95)' },
]

function drawSingleHand(ctx, landmarks, w, h, palette) {
  const pt = (i) => {
    const lm = landmarks[i]
    if (!lm) return null
    return { x: lm.x * w, y: lm.y * h }
  }

  for (const [a, b] of BONES) {
    const p1 = pt(a)
    const p2 = pt(b)
    if (!p1 || !p2) continue
    ctx.strokeStyle = palette.stroke
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
  }

  const palm = pt(LM.MIDDLE_MCP) ?? pt(LM.WRIST)
  if (palm) {
    ctx.shadowColor = palette.glow
    ctx.shadowBlur = 14
    ctx.fillStyle = palette.fill
    ctx.beginPath()
    ctx.arc(palm.x, palm.y, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

export function drawHandsOverlay(canvas, hands, action, clearCanvas = true) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  if (clearCanvas) ctx.clearRect(0, 0, w, h)

  const list = Array.isArray(hands?.[0]) ? hands : hands ? [hands] : []

  if (!list.length) {
    if (action) drawLabel(ctx, w, h, action)
    return
  }

  list.forEach((landmarks, index) => {
    drawSingleHand(ctx, landmarks, w, h, HAND_COLORS[index] ?? HAND_COLORS[0])
  })

  if (action) drawLabel(ctx, w, h, action)
}

/** @deprecated use drawHandsOverlay */
export function drawHandOverlay(canvas, landmarks, action, clearCanvas = true) {
  drawHandsOverlay(canvas, landmarks, action, clearCanvas)
}

function drawLabel(ctx, w, h, action) {
  ctx.fillStyle = 'rgba(255, 176, 0, 0.9)'
  ctx.font = '600 11px "Special Elite", monospace'
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 4
  ctx.fillText(String(action).toUpperCase(), 10, h - 12)
  ctx.shadowBlur = 0
}
