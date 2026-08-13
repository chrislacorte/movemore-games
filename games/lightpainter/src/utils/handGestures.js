import { LM } from '../constants/gameConfig'

function dist(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

function fingerExtended(landmarks, tipIdx, pipIdx) {
  const wrist = landmarks[LM.WRIST]
  const tip = landmarks[tipIdx]
  const pip = landmarks[pipIdx]
  if (!wrist || !tip || !pip) return false
  return dist(tip, wrist) > dist(pip, wrist) * 1.05
}

/**
 * Reads the pointer state from a single hand.
 * Drawing = pointing gesture: index finger extended, middle finger curled.
 * Open palm (all fingers extended) or fist lifts the pen.
 *
 * Returns { tip: {x, y}, isDrawing } with tip in mirrored, normalized
 * camera coordinates (x already flipped for the mirrored view).
 */
export function getPointerState(landmarks) {
  if (!landmarks?.length) return null
  const tip = landmarks[LM.INDEX_TIP]
  if (!tip) return null

  const indexExtended = fingerExtended(landmarks, LM.INDEX_TIP, LM.INDEX_PIP)
  const middleExtended = fingerExtended(landmarks, LM.MIDDLE_TIP, LM.MIDDLE_PIP)
  const ringExtended = fingerExtended(landmarks, LM.RING_TIP, LM.RING_PIP)

  // Pointing = index out while middle and ring stay curled.
  const isDrawing = indexExtended && !middleExtended && !ringExtended

  return {
    tip: { x: 1 - tip.x, y: tip.y },
    isDrawing,
  }
}
