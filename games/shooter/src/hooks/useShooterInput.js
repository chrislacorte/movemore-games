import { useRef, useCallback } from 'react'
import {
  LM,
  CROSSHAIR_GAIN,
  CROSSHAIR_X_MIN,
  CROSSHAIR_X_MAX,
  CROSSHAIR_Y_MIN,
  CROSSHAIR_Y_MAX,
  CROSSHAIR_SMOOTHING,
  PINCH_THRESHOLD,
  PINCH_COOLDOWN_MS,
} from '../constants/gameConfig'
import {
  isPinching,
  pinchDistance,
  consumePinchShot,
} from '../utils/chickenShooterTracking'

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

/** Expand the reachable hand range around the center, then clamp to bounds. */
function mapAim(x, y) {
  const ex = clamp(0.5 + (x - 0.5) * CROSSHAIR_GAIN, 0, 1)
  const ey = clamp(0.5 + (y - 0.5) * CROSSHAIR_GAIN, 0, 1)
  return {
    x: clamp(ex, CROSSHAIR_X_MIN, CROSSHAIR_X_MAX),
    y: clamp(ey, CROSSHAIR_Y_MIN, CROSSHAIR_Y_MAX),
  }
}

export function useShooterInput() {
  const crosshairRef = useRef({ x: 0.5, y: 0.5 })
  const lastShotAtRef = useRef(0)
  const hasAimRef = useRef(false)
  const pinchingRef = useRef(false)

  const resetInput = useCallback(() => {
    crosshairRef.current = { x: 0.5, y: 0.5 }
    lastShotAtRef.current = 0
    hasAimRef.current = false
    pinchingRef.current = false
  }, [])

  const hasVisibleHand = useCallback((landmarks) => {
    return Boolean(
      landmarks?.[LM.INDEX_TIP] &&
        landmarks[LM.THUMB_TIP] &&
        landmarks[LM.WRIST],
    )
  }, [])

  const updateInput = useCallback((landmarks, dtSec = 1 / 60) => {
    if (!hasVisibleHand(landmarks)) {
      pinchingRef.current = false
      return {
        crosshair: { ...crosshairRef.current },
        fired: false,
        handVisible: false,
        pinching: false,
        pinchDistance: null,
      }
    }

    const indexTip = landmarks[LM.INDEX_TIP]
    const thumbTip = landmarks[LM.THUMB_TIP]

    // Aiming: index fingertip (enhancement over chickenshooter's fixed crosshair).
    const target = mapAim(1 - indexTip.x, indexTip.y)
    const c = crosshairRef.current
    if (!hasAimRef.current) {
      crosshairRef.current = { ...target }
      hasAimRef.current = true
    } else {
      const t = 1 - Math.pow(1 - CROSSHAIR_SMOOTHING, Math.max(1, dtSec * 60))
      crosshairRef.current = {
        x: c.x + (target.x - c.x) * t,
        y: c.y + (target.y - c.y) * t,
      }
    }

    // Fire: chickenshooter pinch (thumb tip + index tip distance).
    const distance = pinchDistance(thumbTip, indexTip)
    const pinching = isPinching(thumbTip, indexTip, PINCH_THRESHOLD)
    pinchingRef.current = pinching

    let fired = false
    if (pinching) {
      const now = performance.now()
      const shot = consumePinchShot(
        now,
        lastShotAtRef.current,
        PINCH_COOLDOWN_MS,
      )
      fired = shot.fired
      lastShotAtRef.current = shot.lastShotAt
    }

    return {
      crosshair: { ...crosshairRef.current },
      fired,
      handVisible: true,
      pinching,
      pinchDistance: distance,
    }
  }, [hasVisibleHand])

  return { crosshairRef, updateInput, resetInput, hasVisibleHand }
}
