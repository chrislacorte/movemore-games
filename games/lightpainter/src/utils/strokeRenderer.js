import { FADE_DURATION_MS } from '../constants/gameConfig'

/**
 * Stroke shape: { points: [{ x, y, t }], color, width, glow }
 * Points are normalized to the canvas (0..1) so strokes survive resizes.
 */

function strokePath(ctx, points, w, h) {
  ctx.beginPath()
  ctx.moveTo(points[0].x * w, points[0].y * h)
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x * w, points[i].y * h)
  }
  if (points.length === 1) {
    ctx.lineTo(points[0].x * w + 0.01, points[0].y * h)
  }
  ctx.stroke()
}

function drawStrokePasses(ctx, points, w, h, { color, width, glow }, alpha) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (glow) {
    // Wide soft halo
    ctx.globalAlpha = alpha * 0.28
    ctx.strokeStyle = color
    ctx.lineWidth = width * 3
    ctx.shadowColor = color
    ctx.shadowBlur = width * 3.2
    strokePath(ctx, points, w, h)

    // Bright colored core
    ctx.globalAlpha = alpha * 0.95
    ctx.lineWidth = width
    ctx.shadowBlur = width * 1.6
    strokePath(ctx, points, w, h)

    // Hot white center — the "light" of the light painting
    ctx.globalAlpha = alpha * 0.85
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = Math.max(1.2, width * 0.4)
    ctx.shadowBlur = 0
    strokePath(ctx, points, w, h)
  } else {
    ctx.globalAlpha = alpha
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.shadowBlur = 0
    strokePath(ctx, points, w, h)
  }

  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}

/**
 * Renders all strokes. With fadeOn, per-segment alpha decreases with point
 * age (Magic Fade). Uses additive blending for the cinematic light look.
 */
export function renderStrokes(ctx, strokes, w, h, { now = performance.now(), fadeOn = false } = {}) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  for (const stroke of strokes) {
    const { points } = stroke
    if (!points.length) continue

    if (!fadeOn) {
      drawStrokePasses(ctx, points, w, h, stroke, 1)
      continue
    }

    // Fade mode: group consecutive points into small chunks that share a
    // similar age so we don't stroke every single segment separately.
    const CHUNK = 6
    for (let i = 0; i < points.length - 1; i += CHUNK) {
      const slice = points.slice(i, Math.min(i + CHUNK + 1, points.length))
      const age = now - slice[slice.length - 1].t
      const alpha = Math.max(0, 1 - age / FADE_DURATION_MS)
      if (alpha <= 0.01) continue
      drawStrokePasses(ctx, slice, w, h, stroke, alpha)
    }
    if (points.length === 1) {
      const alpha = Math.max(0, 1 - (now - points[0].t) / FADE_DURATION_MS)
      if (alpha > 0.01) drawStrokePasses(ctx, points, w, h, stroke, alpha)
    }
  }

  ctx.restore()
}

/** Removes points that have fully faded out. Mutates the array, returns it. */
export function pruneFadedStrokes(strokes, now = performance.now()) {
  for (let s = strokes.length - 1; s >= 0; s -= 1) {
    const stroke = strokes[s]
    while (stroke.points.length && now - stroke.points[0].t > FADE_DURATION_MS) {
      stroke.points.shift()
    }
    if (!stroke.points.length) strokes.splice(s, 1)
  }
  return strokes
}

/** Draws the glowing fingertip cursor. */
export function renderCursor(ctx, cursor, w, h, color, isDrawing) {
  if (!cursor) return
  const x = cursor.x * w
  const y = cursor.y * h

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  ctx.shadowColor = color
  ctx.shadowBlur = isDrawing ? 26 : 14
  ctx.fillStyle = color
  ctx.globalAlpha = isDrawing ? 0.95 : 0.55
  ctx.beginPath()
  ctx.arc(x, y, isDrawing ? 9 : 7, 0, Math.PI * 2)
  ctx.fill()

  if (!isDrawing) {
    ctx.globalAlpha = 0.8
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 13, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    ctx.globalAlpha = 0.9
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath()
    ctx.arc(x, y, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}
