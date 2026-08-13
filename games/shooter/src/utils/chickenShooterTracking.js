/**
 * Gesture helpers ported from mediapipeexperiments/chickenshooter/game.js
 * (legacy @mediapipe/hands + pinch-to-shoot).
 */

export const PINCH_THRESHOLD = 0.05
export const PINCH_COOLDOWN_MS = 300

/** Euclidean distance in normalized image space (matches chickenshooter). */
export function pinchDistance(thumbTip, indexTip) {
  const dx = thumbTip.x - indexTip.x
  const dy = thumbTip.y - indexTip.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function isPinching(
  thumbTip,
  indexTip,
  threshold = PINCH_THRESHOLD,
) {
  if (!thumbTip || !indexTip) return false
  return pinchDistance(thumbTip, indexTip) < threshold
}

/**
 * Cooldown gate from chickenshooter triggerShoot().
 * Returns true when a new shot is allowed.
 */
export function consumePinchShot(now, lastShotAt, cooldownMs = PINCH_COOLDOWN_MS) {
  if (now - lastShotAt < cooldownMs) return { fired: false, lastShotAt }
  return { fired: true, lastShotAt: now }
}
