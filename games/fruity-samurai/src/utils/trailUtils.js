import {
  TRAIL_MAX_POINTS,
  TRAIL_LIFETIME_MS,
  TRAIL_MIN_DISTANCE,
} from '../constants/gameConfig'

export function pushTrailPoint(trail, x, y, timestamp) {
  const last = trail[trail.length - 1]

  if (last) {
    const dist = Math.hypot(x - last.x, y - last.y)
    if (dist >= TRAIL_MIN_DISTANCE) {
      trail.push({ x, y, time: timestamp })
    } else {
      last.x = x
      last.y = y
      last.time = timestamp
    }
  } else {
    trail.push({ x, y, time: timestamp })
  }

  if (trail.length > TRAIL_MAX_POINTS) {
    trail.shift()
  }
}

export function pruneTrail(trail, timestamp) {
  return trail.filter((p) => timestamp - p.time < TRAIL_LIFETIME_MS)
}

export function drawHandTrail(ctx, trail, color) {
  if (trail.length < 2) {
    if (trail.length === 1) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(trail[0].x, trail[0].y, 6, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.globalAlpha = 0.85
      ctx.fill()
      ctx.restore()
    }
    return
  }

  ctx.save()

  ctx.beginPath()
  ctx.moveTo(trail[0].x, trail[0].y)
  for (let i = 1; i < trail.length; i++) {
    ctx.lineTo(trail[i].x, trail[i].y)
  }

  ctx.strokeStyle = color
  ctx.lineWidth = 12
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalAlpha = 0.55
  ctx.stroke()

  ctx.strokeStyle = color
  ctx.lineWidth = 6
  ctx.globalAlpha = 0.75
  ctx.stroke()

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.5
  ctx.globalAlpha = 0.95
  ctx.stroke()

  const tip = trail[trail.length - 1]
  ctx.beginPath()
  ctx.arc(tip.x, tip.y, 7, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.globalAlpha = 0.9
  ctx.fill()
  ctx.beginPath()
  ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.globalAlpha = 1
  ctx.fill()

  ctx.restore()
}

export { TRAIL_LIFETIME_MS }
