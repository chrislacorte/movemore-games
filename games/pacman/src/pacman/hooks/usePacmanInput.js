import { useRef, useCallback } from 'react'
import {
  LM,
  PLAY_PADDING,
  HEAD_GAIN,
  HEAD_SMOOTHING,
  DIRECTION_DEAD_ZONE,
} from '../constants/gameConfig'

function expandAroundCenter(v) {
  return 0.5 + (v - 0.5) * HEAD_GAIN
}

function clampPlay(v) {
  return Math.max(PLAY_PADDING, Math.min(1 - PLAY_PADDING, v))
}

export function usePacmanInput() {
  const fingerRef = useRef({ x: 0.5, y: 0.5, visible: false })
  const queuedDirRef = useRef('left')
  const hasInitialized = useRef(false)

  const resetInput = useCallback(() => {
    fingerRef.current = { x: 0.5, y: 0.5, visible: false }
    queuedDirRef.current = 'left'
    hasInitialized.current = false
  }, [])

  const updateInput = useCallback((landmarks) => {
    if (!landmarks?.length) {
      fingerRef.current = { ...fingerRef.current, visible: false }
      return { finger: fingerRef.current, queuedDir: queuedDirRef.current }
    }

    const tip = landmarks[LM.INDEX_TIP]
    if (!tip) {
      fingerRef.current = { ...fingerRef.current, visible: false }
      return { finger: fingerRef.current, queuedDir: queuedDirRef.current }
    }

    const mirroredX = 1 - tip.x
    const targetX = clampPlay(expandAroundCenter(mirroredX))
    const targetY = clampPlay(expandAroundCenter(tip.y))

    if (!hasInitialized.current) {
      fingerRef.current = { x: targetX, y: targetY, visible: true }
      hasInitialized.current = true
    } else {
      const prev = fingerRef.current
      fingerRef.current = {
        x: prev.x + (targetX - prev.x) * HEAD_SMOOTHING,
        y: prev.y + (targetY - prev.y) * HEAD_SMOOTHING,
        visible: true,
      }
    }

    return { finger: fingerRef.current, queuedDir: queuedDirRef.current }
  }, [])

  const updateQueuedDirection = useCallback((finger, pacmanNormX, pacmanNormY) => {
    if (!finger?.visible) return queuedDirRef.current

    const dx = finger.x - pacmanNormX
    const dy = finger.y - pacmanNormY

    if (Math.hypot(dx, dy) < DIRECTION_DEAD_ZONE) {
      return queuedDirRef.current
    }

    const next =
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? 'right'
          : 'left'
        : dy > 0
          ? 'down'
          : 'up'

    queuedDirRef.current = next
    return next
  }, [])

  const hasVisibleHand = useCallback((landmarks) => {
    return Boolean(landmarks?.length && landmarks[LM.INDEX_TIP])
  }, [])

  return {
    fingerRef,
    queuedDirRef,
    updateInput,
    updateQueuedDirection,
    resetInput,
    hasVisibleHand,
  }
}
