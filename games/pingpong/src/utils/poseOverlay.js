const BONES = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
]

const UPPER_INDICES = [11, 12, 13, 14, 15, 16]
const WRIST_INDICES = [15, 16]

export function drawPoseOverlay(canvas, landmarks, action, clearCanvas = true) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  if (clearCanvas) {
    ctx.clearRect(0, 0, w, h)
  }

  if (!landmarks?.length) return

  const pt = (i) => {
    const lm = landmarks[i]
    if (!lm) return null
    return { x: lm.x * w, y: lm.y * h }
  }

  const isActive = action && action !== 'no pose' && action !== 'Kalibrierung'

  for (const [a, b] of BONES) {
    const p1 = pt(a)
    const p2 = pt(b)
    if (!p1 || !p2) continue
    const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y)
    grad.addColorStop(0, isActive ? 'rgba(34, 211, 238, 0.5)' : 'rgba(100, 116, 139, 0.4)')
    grad.addColorStop(1, isActive ? 'rgba(251, 191, 36, 0.5)' : 'rgba(100, 116, 139, 0.25)')
    ctx.strokeStyle = grad
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
  }

  for (const i of UPPER_INDICES) {
    const p = pt(i)
    if (!p) continue
    const isWrist = WRIST_INDICES.includes(i)
    if (isWrist) {
      ctx.shadowColor = 'rgba(251, 191, 36, 0.9)'
      ctx.shadowBlur = 14
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'
      ctx.lineWidth = 2
      ctx.stroke()
    } else {
      ctx.fillStyle = isActive ? 'rgba(34, 211, 238, 0.85)' : 'rgba(148, 163, 184, 0.6)'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (action && action !== 'no pose') {
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = '600 11px Rajdhani, system-ui, sans-serif'
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = 4
    ctx.fillText(String(action).toUpperCase(), 10, h - 12)
    ctx.shadowBlur = 0
  }
}
