import { LM } from '../constants/gameConfig'

const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

export function drawHandOverlay(canvas, landmarks, action, clearCanvas = true) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  if (clearCanvas) ctx.clearRect(0, 0, w, h)

  if (!landmarks?.length) {
    if (action) drawLabel(ctx, w, h, action)
    return
  }

  const pt = (i) => {
    const lm = landmarks[i]
    if (!lm) return null
    return { x: lm.x * w, y: lm.y * h }
  }

  for (const [a, b] of BONES) {
    const p1 = pt(a)
    const p2 = pt(b)
    if (!p1 || !p2) continue
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.4)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
  }

  const aim = pt(LM.INDEX_TIP)
  if (aim) {
    ctx.shadowColor = 'rgba(57, 255, 20, 0.95)'
    ctx.shadowBlur = 18
    ctx.fillStyle = '#39ff14'
    ctx.beginPath()
    ctx.arc(aim.x, aim.y, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = 'rgba(57, 255, 20, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(aim.x, aim.y, 16, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (action) drawLabel(ctx, w, h, action)
}

function drawLabel(ctx, w, h, action) {
  ctx.fillStyle = 'rgba(255, 176, 0, 0.9)'
  ctx.font = '600 11px "Special Elite", monospace'
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 4
  ctx.fillText(String(action).toUpperCase(), 10, h - 12)
  ctx.shadowBlur = 0
}
