import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import { getPointerState } from '../utils/handGestures'
import {
  renderStrokes,
  renderCursor,
  pruneFadedStrokes,
} from '../utils/strokeRenderer'
import {
  getTemplateRect,
  renderTemplateGuide,
  TraceTracker,
} from '../utils/scoring'
import { exportImage } from '../utils/exportImage'
import {
  CAMERA_WIDTH,
  CAMERA_HEIGHT,
  MODES,
  TRACE_SUCCESS_THRESHOLD,
} from '../constants/gameConfig'

const MIN_POINT_DISTANCE_PX = 2.5
const SCORE_INTERVAL_MS = 180

/**
 * Full-screen drawing surface. Reads the fingertip from handsRef every
 * frame, records glowing strokes, renders the trace guide, and reports
 * status / trace progress upwards.
 */
const PaintCanvas = forwardRef(function PaintCanvas(
  {
    videoElement,
    handsRef,
    refreshHand,
    color,
    strokeWidth,
    glowOn,
    fadeOn,
    mode,
    template,
    paused = false,
    onStatusChange,
    onProgress,
    onSuccess,
  },
  ref,
) {
  const canvasRef = useRef(null)
  const strokesRef = useRef([])
  const activeStrokeRef = useRef(null)
  const trackerRef = useRef(null)
  const pendingScorePointsRef = useRef([])
  const lastScoreTimeRef = useRef(0)
  const successFiredRef = useRef(false)
  const statusRef = useRef('')
  const rafRef = useRef(0)

  const settingsRef = useRef({})
  settingsRef.current = { color, strokeWidth, glowOn, fadeOn, mode, template, paused }

  const callbacksRef = useRef({})
  callbacksRef.current = { onStatusChange, onProgress, onSuccess }

  // Recreate the trace tracker whenever the template changes.
  useEffect(() => {
    if (mode === MODES.TRACE && template) {
      trackerRef.current = new TraceTracker(template)
    } else {
      trackerRef.current = null
    }
    successFiredRef.current = false
    pendingScorePointsRef.current = []
    strokesRef.current = []
    activeStrokeRef.current = null
    callbacksRef.current.onProgress?.(0)
  }, [mode, template])

  useImperativeHandle(ref, () => ({
    clear() {
      strokesRef.current = []
      activeStrokeRef.current = null
      pendingScorePointsRef.current = []
      if (trackerRef.current) {
        trackerRef.current.reset()
        successFiredRef.current = false
        callbacksRef.current.onProgress?.(0)
      }
    },
    save() {
      const canvas = canvasRef.current
      if (!canvas) return
      exportImage(strokesRef.current, canvas.width, canvas.height)
    },
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w
        canvas.height = h
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const setStatus = (status) => {
      if (statusRef.current !== status) {
        statusRef.current = status
        callbacksRef.current.onStatusChange?.(status)
      }
    }

    // Maps the mirrored, normalized fingertip into canvas pixels using the
    // same "object-cover" crop as the fullscreen camera background, so the
    // stroke lands exactly on the fingertip when painting over yourself.
    const mapTip = (tip, w, h) => {
      const vw = videoElement?.videoWidth || CAMERA_WIDTH
      const vh = videoElement?.videoHeight || CAMERA_HEIGHT
      const scale = Math.max(w / vw, h / vh)
      const offX = (w - vw * scale) / 2
      const offY = (h - vh * scale) / 2
      return {
        x: tip.x * vw * scale + offX,
        y: tip.y * vh * scale + offY,
      }
    }

    const handleDrawingInput = (now, w, h) => {
      refreshHand?.(now)
      const hands = handsRef?.current
      const pointer = hands?.length ? getPointerState(hands[0]) : null

      if (!pointer) {
        setStatus('noHand')
        activeStrokeRef.current = null
        return null
      }

      const px = mapTip(pointer.tip, w, h)
      const cursor = { x: px.x / w, y: px.y / h }

      if (!pointer.isDrawing) {
        setStatus('penUp')
        activeStrokeRef.current = null
        return { cursor, isDrawing: false }
      }

      setStatus('drawing')
      const s = settingsRef.current

      if (!activeStrokeRef.current) {
        activeStrokeRef.current = {
          points: [],
          color: s.color,
          width: s.strokeWidth,
          glow: s.glowOn,
        }
        strokesRef.current.push(activeStrokeRef.current)
      }

      const stroke = activeStrokeRef.current
      const last = stroke.points[stroke.points.length - 1]
      const lastPx = last ? { x: last.x * w, y: last.y * h } : null
      if (!lastPx || Math.hypot(px.x - lastPx.x, px.y - lastPx.y) >= MIN_POINT_DISTANCE_PX) {
        stroke.points.push({ x: cursor.x, y: cursor.y, t: now })
        pendingScorePointsRef.current.push(px)
      }

      return { cursor, isDrawing: true }
    }

    const updateScore = (now, w, h) => {
      const tracker = trackerRef.current
      if (!tracker || successFiredRef.current) return
      if (!pendingScorePointsRef.current.length) return
      if (now - lastScoreTimeRef.current < SCORE_INTERVAL_MS) return

      lastScoreTimeRef.current = now
      const rect = getTemplateRect(w, h)
      const coverage = tracker.addPoints(
        pendingScorePointsRef.current,
        rect,
        settingsRef.current.strokeWidth,
      )
      pendingScorePointsRef.current = []
      callbacksRef.current.onProgress?.(coverage)

      if (coverage >= TRACE_SUCCESS_THRESHOLD) {
        successFiredRef.current = true
        activeStrokeRef.current = null
        callbacksRef.current.onSuccess?.()
      }
    }

    const loop = () => {
      const now = performance.now()
      const w = canvas.width
      const h = canvas.height
      const s = settingsRef.current

      let pointerInfo = null
      if (!s.paused) {
        pointerInfo = handleDrawingInput(now, w, h)
        if (s.mode === MODES.TRACE) updateScore(now, w, h)
      } else {
        activeStrokeRef.current = null
      }

      ctx.clearRect(0, 0, w, h)

      if (s.mode === MODES.TRACE && s.template) {
        renderTemplateGuide(ctx, s.template, getTemplateRect(w, h), trackerRef.current)
      }

      if (s.fadeOn) {
        pruneFadedStrokes(strokesRef.current, now)
        // The active stroke may fade out completely while the finger rests;
        // drop the reference so new points start a fresh, visible stroke.
        if (
          activeStrokeRef.current &&
          !strokesRef.current.includes(activeStrokeRef.current)
        ) {
          activeStrokeRef.current = null
        }
      }
      renderStrokes(ctx, strokesRef.current, w, h, { now, fadeOn: s.fadeOn })

      if (pointerInfo) {
        renderCursor(ctx, pointerInfo.cursor, w, h, s.color, pointerInfo.isDrawing)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [videoElement, handsRef, refreshHand])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
})

export default PaintCanvas
