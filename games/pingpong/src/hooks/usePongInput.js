import { useRef, useCallback } from 'react'
import {
  POSE_MIN_VISIBILITY,
  PADDLE_SMOOTHING,
  TABLE_X_MIN,
  TABLE_X_MAX,
  TABLE_Y_MIN,
  TABLE_Y_MAX,
  PADDLE_EDGE_MARGIN,
} from '../constants/gameConfig'

const WRIST_LEFT = 15
const WRIST_RIGHT = 16

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

function mapToTable(x, y) {
  const rangeX = TABLE_X_MAX - TABLE_X_MIN
  const rangeY = TABLE_Y_MAX - TABLE_Y_MIN
  return {
    x: clamp(TABLE_X_MIN + x * rangeX, TABLE_X_MIN + PADDLE_EDGE_MARGIN, TABLE_X_MAX - PADDLE_EDGE_MARGIN),
    y: clamp(TABLE_Y_MIN + y * rangeY, TABLE_Y_MIN + PADDLE_EDGE_MARGIN, TABLE_Y_MAX - PADDLE_EDGE_MARGIN),
  }
}

function pickWrist(landmarks) {
  if (!landmarks?.length) return null

  const right = landmarks[WRIST_RIGHT]
  const left = landmarks[WRIST_LEFT]
  const rightVis = right?.visibility ?? 0
  const leftVis = left?.visibility ?? 0

  if (rightVis >= POSE_MIN_VISIBILITY && leftVis >= POSE_MIN_VISIBILITY) {
    return rightVis >= leftVis ? right : left
  }
  if (rightVis >= POSE_MIN_VISIBILITY) return right
  if (leftVis >= POSE_MIN_VISIBILITY) return left
  return null
}

export function usePongInput() {
  const paddleRef = useRef({ x: 0.5, y: 0.5 })
  const prevWristRef = useRef(null)
  const swingRef = useRef(0)

  const resetInput = useCallback(() => {
    paddleRef.current = { x: 0.5, y: 0.5 }
    prevWristRef.current = null
    swingRef.current = 0
  }, [])

  const hasVisibleHand = useCallback((landmarks) => {
    return pickWrist(landmarks) !== null
  }, [])

  const updateInput = useCallback((landmarks, dtSec = 1 / 60) => {
    const wrist = pickWrist(landmarks)
    if (!wrist) {
      swingRef.current *= 0.85
      return {
        paddle: { ...paddleRef.current },
        swing: swingRef.current,
        handVisible: false,
      }
    }

    const target = mapToTable(wrist.x, wrist.y)
    const p = paddleRef.current
    const t = 1 - Math.pow(1 - PADDLE_SMOOTHING, Math.max(1, dtSec * 60))

    paddleRef.current = {
      x: p.x + (target.x - p.x) * t,
      y: p.y + (target.y - p.y) * t,
    }

    const prev = prevWristRef.current
    if (prev) {
      const dx = wrist.x - prev.x
      const dy = wrist.y - prev.y
      const speed = Math.sqrt(dx * dx + dy * dy) / Math.max(dtSec, 1 / 120)
      swingRef.current = swingRef.current * 0.6 + speed * 0.4
    }
    prevWristRef.current = { x: wrist.x, y: wrist.y }

    return {
      paddle: { ...paddleRef.current },
      swing: swingRef.current,
      handVisible: true,
    }
  }, [])

  return {
    paddleRef,
    updateInput,
    resetInput,
    hasVisibleHand,
    getPaddle: () => ({ ...paddleRef.current }),
  }
}
