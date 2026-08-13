import { LM } from '../constants/gameConfig'

function dist(a, b) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function fingerExtended(landmarks, tipIdx, pipIdx) {
  const wrist = landmarks[LM.WRIST]
  const tip = landmarks[tipIdx]
  const pip = landmarks[pipIdx]
  if (!wrist || !tip || !pip) return false
  return dist(tip, wrist) > dist(pip, wrist) * 1.12
}

export function countExtendedFingers(landmarks) {
  if (!landmarks?.length) return 0
  let count = 0
  if (fingerExtended(landmarks, LM.INDEX_TIP, LM.INDEX_PIP)) count++
  if (fingerExtended(landmarks, LM.MIDDLE_TIP, LM.MIDDLE_PIP)) count++
  if (fingerExtended(landmarks, LM.RING_TIP, LM.RING_PIP)) count++
  if (fingerExtended(landmarks, LM.PINKY_TIP, LM.PINKY_PIP)) count++
  return count
}

export function getPalmCenter(landmarks) {
  if (!landmarks?.length) return null
  const ids = [LM.WRIST, LM.INDEX_MCP, LM.MIDDLE_MCP, LM.RING_MCP, LM.PINKY_MCP]
  let x = 0
  let y = 0
  let n = 0
  for (const id of ids) {
    const p = landmarks[id]
    if (!p) continue
    x += p.x
    y += p.y
    n++
  }
  if (!n) return null
  return { x: x / n, y: y / n }
}

export function classifyHandPose(landmarks) {
  const extended = countExtendedFingers(landmarks)
  if (extended >= 4) return 'open'
  if (extended <= 1) return 'fist'
  return 'neutral'
}

export function consumeOpenCloseRotate(
  nextPose,
  wasOpen,
  now,
  lastGestureAt,
  cooldownMs,
) {
  if (nextPose === 'open') {
    return { event: null, wasOpen: true, lastGestureAt }
  }

  if (
    wasOpen &&
    nextPose === 'fist' &&
    now - lastGestureAt >= cooldownMs
  ) {
    return { event: 'cw', wasOpen: false, lastGestureAt: now }
  }

  return { event: null, wasOpen, lastGestureAt }
}

export function detectDownwardMotion(prevY, currentY, dtMs, threshold) {
  if (prevY == null || currentY == null || dtMs <= 0) return false
  const dy = currentY - prevY
  if (dy <= 0.008) return false
  const velocity = dy / (dtMs / 1000)
  return velocity >= threshold
}
