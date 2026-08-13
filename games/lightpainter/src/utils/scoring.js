import {
  TEMPLATE_AREA_SCALE,
  TRACE_SAMPLE_COUNT,
  TRACE_TOLERANCE,
} from '../constants/gameConfig'

/** Centered square region (in px) where the template guide is rendered. */
export function getTemplateRect(w, h) {
  const size = Math.min(w, h) * TEMPLATE_AREA_SCALE
  return {
    x: (w - size) / 2,
    y: (h - size) / 2,
    size,
  }
}

/** Maps a normalized template point [0..1] into canvas pixels. */
export function templatePointToPx(pt, rect) {
  return { x: rect.x + pt[0] * rect.size, y: rect.y + pt[1] * rect.size }
}

function polylineLength(stroke) {
  let len = 0
  for (let i = 1; i < stroke.length; i += 1) {
    len += Math.hypot(stroke[i][0] - stroke[i - 1][0], stroke[i][1] - stroke[i - 1][1])
  }
  return len
}

/**
 * Distributes ~TRACE_SAMPLE_COUNT sample points evenly along all template
 * strokes (in normalized template space).
 */
export function sampleTemplate(template) {
  const lengths = template.strokes.map(polylineLength)
  const total = lengths.reduce((a, b) => a + b, 0) || 1
  const samples = []

  template.strokes.forEach((stroke, sIdx) => {
    const count = Math.max(2, Math.round((lengths[sIdx] / total) * TRACE_SAMPLE_COUNT))
    const step = lengths[sIdx] / (count - 1)
    let target = 0
    let acc = 0
    let seg = 1
    samples.push([stroke[0][0], stroke[0][1]])
    for (let k = 1; k < count; k += 1) {
      target = k * step
      while (seg < stroke.length - 1) {
        const segLen = Math.hypot(
          stroke[seg][0] - stroke[seg - 1][0],
          stroke[seg][1] - stroke[seg - 1][1],
        )
        if (acc + segLen >= target) break
        acc += segLen
        seg += 1
      }
      const a = stroke[seg - 1]
      const b = stroke[seg]
      const segLen = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
      const f = Math.min(1, Math.max(0, (target - acc) / segLen))
      samples.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f])
    }
  })

  return samples
}

/**
 * Incremental trace tracker: feed drawn points as they arrive, get coverage.
 */
export class TraceTracker {
  constructor(template) {
    this.samples = sampleTemplate(template)
    this.hits = new Array(this.samples.length).fill(false)
    this.hitCount = 0
  }

  reset() {
    this.hits.fill(false)
    this.hitCount = 0
  }

  /**
   * @param points drawn points in canvas px ({x, y})
   * @param rect template rect from getTemplateRect
   * @param strokeWidthPx current stroke width in px
   */
  addPoints(points, rect, strokeWidthPx = 10) {
    if (!points.length) return this.coverage
    const tol = rect.size * TRACE_TOLERANCE + strokeWidthPx / 2
    const tolSq = tol * tol

    for (let s = 0; s < this.samples.length; s += 1) {
      if (this.hits[s]) continue
      const sp = templatePointToPx(this.samples[s], rect)
      for (const p of points) {
        const dx = p.x - sp.x
        const dy = p.y - sp.y
        if (dx * dx + dy * dy <= tolSq) {
          this.hits[s] = true
          this.hitCount += 1
          break
        }
      }
    }
    return this.coverage
  }

  get coverage() {
    return this.samples.length ? this.hitCount / this.samples.length : 0
  }
}

/** Draws the dashed guide outline plus a soft halo on already-hit samples. */
export function renderTemplateGuide(ctx, template, rect, tracker = null) {
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.setLineDash([10, 12])
  ctx.shadowColor = 'rgba(160, 200, 255, 0.6)'
  ctx.shadowBlur = 6

  for (const stroke of template.strokes) {
    ctx.beginPath()
    const first = templatePointToPx(stroke[0], rect)
    ctx.moveTo(first.x, first.y)
    for (let i = 1; i < stroke.length; i += 1) {
      const p = templatePointToPx(stroke[i], rect)
      ctx.lineTo(p.x, p.y)
    }
    ctx.stroke()
  }

  ctx.setLineDash([])

  if (tracker) {
    ctx.shadowBlur = 8
    ctx.shadowColor = 'rgba(255, 235, 120, 0.9)'
    ctx.fillStyle = 'rgba(255, 235, 120, 0.55)'
    for (let s = 0; s < tracker.samples.length; s += 1) {
      if (!tracker.hits[s]) continue
      const p = templatePointToPx(tracker.samples[s], rect)
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}
