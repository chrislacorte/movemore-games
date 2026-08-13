import { dist } from './trail'

/**
 * Move each segment to stay `spacing` behind the one in front.
 * Segments that haven't caught up yet keep their position (visible stretch after eating).
 */
export function updateSegmentChain(segments, head, spacing) {
  if (!segments?.length) {
    return [{ x: head.x, y: head.y }]
  }

  const next = [{ x: head.x, y: head.y }]

  for (let i = 1; i < segments.length; i++) {
    const prev = next[i - 1]
    const curr = segments[i]
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    const d = Math.hypot(dx, dy)

    if (d < 1e-6) {
      next.push({ x: curr.x, y: curr.y })
      continue
    }

    if (d >= spacing) {
      next.push({
        x: prev.x + (dx / d) * spacing,
        y: prev.y + (dy / d) * spacing,
      })
    } else {
      next.push({ x: curr.x, y: curr.y })
    }
  }

  return next
}

export function appendTailSegment(segments) {
  if (!segments.length) return segments
  const tail = segments[segments.length - 1]
  return [...segments, { x: tail.x, y: tail.y }]
}

export { dist }
