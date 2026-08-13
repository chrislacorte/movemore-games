import { LM } from '../constants/gameConfig'
import { STRINGS } from '../constants/strings'
import { isPinching, pinchDistance } from './chickenShooterTracking'

/** MediaPipe hand skeleton connections */
const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17], // palm base
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

  // Bones
  for (const [a, b] of BONES) {
    const p1 = pt(a)
    const p2 = pt(b)
    if (!p1 || !p2) continue
    ctx.strokeStyle = 'rgba(56, 220, 255, 0.55)'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
  }

  // Joints
  for (let i = 0; i < landmarks.length; i++) {
    const p = pt(i)
    if (!p) continue
    ctx.fillStyle = 'rgba(200, 240, 255, 0.7)'
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // Index tip (aim point)
  const aim = pt(LM.INDEX_TIP)
  if (aim) {
    ctx.shadowColor = 'rgba(56, 220, 255, 0.9)'
    ctx.shadowBlur = 14
    ctx.fillStyle = '#38dcff'
    ctx.beginPath()
    ctx.arc(aim.x, aim.y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // Thumb tip (trigger) + pinch line to index (chickenshooter gesture)
  const thumb = pt(LM.THUMB_TIP)
  const index = pt(LM.INDEX_TIP)
  if (thumb && index) {
    const pinching = isPinching(
      landmarks[LM.THUMB_TIP],
      landmarks[LM.INDEX_TIP],
    )
    const dist = pinchDistance(
      landmarks[LM.THUMB_TIP],
      landmarks[LM.INDEX_TIP],
    )

    ctx.strokeStyle = pinching
      ? 'rgba(255, 180, 60, 0.95)'
      : 'rgba(255, 180, 60, 0.45)'
    ctx.lineWidth = pinching ? 4 : 2
    ctx.beginPath()
    ctx.moveTo(thumb.x, thumb.y)
    ctx.lineTo(index.x, index.y)
    ctx.stroke()

    ctx.shadowColor = pinching
      ? 'rgba(255, 180, 60, 0.9)'
      : 'rgba(255, 180, 60, 0.5)'
    ctx.shadowBlur = pinching ? 14 : 8
    ctx.fillStyle = pinching ? '#ffb43c' : '#c98a2a'
    ctx.beginPath()
    ctx.arc(thumb.x, thumb.y, pinching ? 7 : 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    if (pinching) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = '600 10px Rajdhani, system-ui, sans-serif'
      ctx.fillText(`${STRINGS.pinchOverlay} ${dist.toFixed(2)}`, thumb.x + 8, thumb.y - 8)
    }
  }

  if (action) drawLabel(ctx, w, h, action)
}

function drawLabel(ctx, w, h, action) {
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = '600 11px Rajdhani, system-ui, sans-serif'
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 4
  ctx.fillText(String(action).toUpperCase(), 10, h - 12)
  ctx.shadowBlur = 0
}
