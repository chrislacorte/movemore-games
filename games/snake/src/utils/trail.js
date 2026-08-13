/**
 * Sample body segment positions at fixed arc-length intervals along a trail polyline.
 * trail: oldest → newest; head is the last point.
 */
export function sampleSegments(trail, segmentCount, spacing) {
  if (!trail?.length) return []
  if (trail.length === 1) {
    return Array.from({ length: segmentCount }, () => ({ ...trail[0] }))
  }

  const segments = [{ x: trail[trail.length - 1].x, y: trail[trail.length - 1].y }]
  let trailIdx = trail.length - 1
  let carry = 0

  for (let seg = 1; seg < segmentCount; seg++) {
    let distNeeded = spacing

    while (distNeeded > 0 && trailIdx > 0) {
      const a = trail[trailIdx]
      const b = trail[trailIdx - 1]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const segLen = Math.hypot(dx, dy)

      if (segLen <= 0) {
        trailIdx--
        continue
      }

      const available = segLen - carry
      if (available >= distNeeded) {
        const t = (carry + distNeeded) / segLen
        segments.push({
          x: a.x - dx * t,
          y: a.y - dy * t,
        })
        carry += distNeeded
        distNeeded = 0
      } else {
        distNeeded -= available
        carry = 0
        trailIdx--
      }
    }

    if (distNeeded > 0) {
      segments.push({ x: trail[0].x, y: trail[0].y })
    } else {
      carry = 0
    }
  }

  return segments
}

export function trimTrail(trail, maxLength) {
  if (trail.length <= maxLength) return trail
  return trail.slice(trail.length - maxLength)
}

export function trailArcLength(trail) {
  let len = 0
  for (let i = 1; i < trail.length; i++) {
    len += Math.hypot(trail[i].x - trail[i - 1].x, trail[i].y - trail[i - 1].y)
  }
  return len
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
