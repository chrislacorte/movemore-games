import { useRef, useCallback, useEffect } from 'react'
import {
  LM,
  PALM_GAIN,
  PALM_SMOOTHING,
  PLAY_PADDING,
  COLS,
  GESTURE_COOLDOWN_MS,
  DROP_VELOCITY_THRESHOLD,
} from '../constants/gameConfig'
import {
  classifyHandPose,
  consumeOpenCloseRotate,
  detectDownwardMotion,
  getPalmCenter,
} from '../utils/handGestures'

function expandAroundCenter(v) {
  return 0.5 + (v - 0.5) * PALM_GAIN
}

function clampPlay(v) {
  return Math.max(PLAY_PADDING, Math.min(1 - PLAY_PADDING, v))
}

function palmToColumn(x) {
  const inner = 1 - PLAY_PADDING * 2
  const norm = (x - PLAY_PADDING) / inner
  return Math.max(0, Math.min(COLS - 1, Math.floor(norm * COLS)))
}

function mirroredPalmX(landmarks) {
  const center = getPalmCenter(landmarks)
  if (!center) return null
  return 1 - center.x
}

function splitHands(hands) {
  if (!hands?.length) return { control: null, drop: null }

  const valid = hands.filter((hand) => hand?.length && hand[LM.MIDDLE_MCP])
  if (!valid.length) return { control: null, drop: null }
  if (valid.length === 1) return { control: valid[0], drop: null }

  const sorted = [...valid].sort(
    (a, b) => (mirroredPalmX(a) ?? 0) - (mirroredPalmX(b) ?? 0),
  )
  return { control: sorted[0], drop: sorted[1] }
}

export function useTetrisInput() {
  const palmRef = useRef({ x: 0.5, y: 0.5, visible: false, column: 4 })
  const wasOpenRef = useRef(false)
  const lastGestureAtRef = useRef(0)
  const dropHandRef = useRef({ y: null, t: 0 })
  const keysRef = useRef({ rotate: false, softDrop: false })

  const resetInput = useCallback(() => {
    palmRef.current = { x: 0.5, y: 0.5, visible: false, column: 4 }
    wasOpenRef.current = false
    lastGestureAtRef.current = 0
    dropHandRef.current = { y: null, t: 0 }
  }, [])

  const updateInput = useCallback((hands, now = performance.now()) => {
    let rotationEvent = null
    let softDrop = keysRef.current.softDrop

    const { control, drop } = splitHands(hands)

    if (!control) {
      palmRef.current = { ...palmRef.current, visible: false }
      dropHandRef.current = { y: null, t: now }
      if (keysRef.current.rotate) rotationEvent = 'cw'
      keysRef.current.rotate = false
      keysRef.current.softDrop = false
      return {
        palm: palmRef.current,
        rotationEvent,
        pose: 'none',
        softDrop,
      }
    }

    const center = getPalmCenter(control)
    if (!center) {
      palmRef.current = { ...palmRef.current, visible: false }
      return {
        palm: palmRef.current,
        rotationEvent: null,
        pose: 'none',
        softDrop: false,
      }
    }

    const mirroredX = 1 - center.x
    const targetX = clampPlay(expandAroundCenter(mirroredX))
    const targetY = clampPlay(expandAroundCenter(center.y))
    const prev = palmRef.current

    const x = prev.visible
      ? prev.x + (targetX - prev.x) * PALM_SMOOTHING
      : targetX
    const y = prev.visible
      ? prev.y + (targetY - prev.y) * PALM_SMOOTHING
      : targetY

    const nextPose = classifyHandPose(control)
    const { event, wasOpen, lastGestureAt } = consumeOpenCloseRotate(
      nextPose,
      wasOpenRef.current,
      now,
      lastGestureAtRef.current,
      GESTURE_COOLDOWN_MS,
    )
    wasOpenRef.current = wasOpen
    lastGestureAtRef.current = lastGestureAt
    rotationEvent = event

    const column = palmToColumn(x)
    palmRef.current = { x, y, visible: true, column }

    if (drop) {
      const dropCenter = getPalmCenter(drop)
      if (dropCenter) {
        const prevDrop = dropHandRef.current
        const dtMs = prevDrop.t ? now - prevDrop.t : 16
        if (
          detectDownwardMotion(
            prevDrop.y,
            dropCenter.y,
            dtMs,
            DROP_VELOCITY_THRESHOLD,
          )
        ) {
          softDrop = true
        }
        dropHandRef.current = { y: dropCenter.y, t: now }
      }
    } else {
      dropHandRef.current = { y: null, t: now }
    }

    if (keysRef.current.rotate) rotationEvent = 'cw'
    keysRef.current.rotate = false
    keysRef.current.softDrop = false

    return {
      palm: palmRef.current,
      rotationEvent,
      pose: nextPose,
      softDrop,
    }
  }, [])

  const hasVisibleHand = useCallback((hands) => {
    const list = Array.isArray(hands?.[0]) ? hands : hands ? [hands] : []
    return list.some((hand) => hand?.length && hand[LM.MIDDLE_MCP])
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === ' ') keysRef.current.rotate = true
      if (e.key === 'ArrowDown') keysRef.current.softDrop = true
      if (e.key === 'ArrowLeft') {
        palmRef.current = {
          ...palmRef.current,
          column: Math.max(0, palmRef.current.column - 1),
        }
      }
      if (e.key === 'ArrowRight') {
        palmRef.current = {
          ...palmRef.current,
          column: Math.min(COLS - 1, palmRef.current.column + 1),
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return {
    palmRef,
    updateInput,
    resetInput,
    hasVisibleHand,
  }
}
