export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const rand = (lo: number, hi: number): number => lo + Math.random() * (hi - lo)
export const randInt = (lo: number, hi: number): number => Math.floor(rand(lo, hi + 1))
export const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]
export const chance = (p: number): boolean => Math.random() < p

/** Exponential smoothing factor that is frame-rate independent. */
export const damp = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt)

/**
 * Squared distance from point (px,py) to segment (ax,ay)-(bx,by).
 * Also returns the parametric t of the closest point.
 */
export function pointSegmentDist2(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): { d2: number; t: number } {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = 0
  if (len2 > 1e-9) {
    t = ((px - ax) * dx + (py - ay) * dy) / len2
    t = t < 0 ? 0 : t > 1 ? 1 : t
  }
  const cx = ax + dx * t - px
  const cy = ay + dy * t - py
  return { d2: cx * cx + cy * cy, t }
}
