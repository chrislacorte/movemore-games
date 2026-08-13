import { useRef, useCallback } from 'react'
import {
  LM,
  PLAY_PADDING,
  HEAD_GAIN,
  HEAD_SMOOTHING,
} from '../constants/gameConfig'

function expandAroundCenter(v) {
  return 0.5 + (v - 0.5) * HEAD_GAIN
}

function clampPlay(v) {
  return Math.max(PLAY_PADDING, Math.min(1 - PLAY_PADDING, v))
}

export function useSnakeInput() {
  const headRef = useRef({ x: 0.5, y: 0.5, visible: false })
  const hasInitialized = useRef(false)

  const resetInput = useCallback(() => {
    headRef.current = { x: 0.5, y: 0.5, visible: false }
    hasInitialized.current = false
  }, [])

  const updateInput = useCallback((landmarks) => {
    if (!landmarks?.length) {
      headRef.current = { ...headRef.current, visible: false }
      return headRef.current
    }

    const tip = landmarks[LM.INDEX_TIP]
    if (!tip) {
      headRef.current = { ...headRef.current, visible: false }
      return headRef.current
    }

    const mirroredX = 1 - tip.x
    const expandedX = expandAroundCenter(mirroredX)
    const expandedY = expandAroundCenter(tip.y)
    const targetX = clampPlay(expandedX)
    const targetY = clampPlay(expandedY)

    if (!hasInitialized.current) {
      headRef.current = { x: targetX, y: targetY, visible: true }
      hasInitialized.current = true
      return headRef.current
    }

    const prev = headRef.current
    headRef.current = {
      x: prev.x + (targetX - prev.x) * HEAD_SMOOTHING,
      y: prev.y + (targetY - prev.y) * HEAD_SMOOTHING,
      visible: true,
    }
    return headRef.current
  }, [])

  const hasVisibleHand = useCallback((landmarks) => {
    return Boolean(landmarks?.length && landmarks[LM.INDEX_TIP])
  }, [])

  return { headRef, updateInput, resetInput, hasVisibleHand }
}
