import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision'
import { assetPath } from '../core/assetPath'
import { clamp } from '../core/math'
import { OneEuro2D } from './OneEuro'
import type { BladePoint, Landmark, TrackingStats } from './types'

export const INDEX_TIP = 8
const WRIST = 0

/** How long a hand stays "alive" after MediaPipe loses it (ms). */
const HOLD_MS = 220
/** Extrapolate at most this far into the future to hide pipeline latency (ms). */
const MAX_EXTRAPOLATE_MS = 70
/** Hands whose wrists are closer than this (normalised) are considered the same hand across frames. */
const MATCH_RADIUS = 0.22
/**
 * Reach gain: the camera image edges are hard to reach comfortably,
 * so the central 80% of the frame is mapped onto the whole screen.
 */
const REACH_GAIN = 1.25

/** Blade filter: very low jitter when still, near-raw when fast. */
const TIP_FILTER = { minCutoff: 1.4, beta: 1.6, dCutoff: 1.2 }

interface HandState {
  id: string
  label: string
  /** filtered tip position (screen-normalised) */
  x: number
  y: number
  /** smoothed velocity (units/sec) */
  vx: number
  vy: number
  /** raw wrist position for matching */
  wx: number
  wy: number
  t: number
  filter: OneEuro2D
  landmarks: Landmark[]
}

const mapReach = (v: number): number => clamp((v - 0.5) * REACH_GAIN + 0.5, 0, 1)

async function openCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('getUserMedia missing')
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 60, max: 60 },
      },
      audio: false,
    })
  } catch (err) {
    const name = (err as { name?: string })?.name
    if (name === 'OverconstrainedError' || name === 'NotFoundError' || name === 'NotReadableError') {
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    }
    throw err
  }
}

export type TrackerStatus = 'idle' | 'starting' | 'running' | 'denied' | 'failed'

/**
 * Precise hand tracking built on MediaPipe Tasks HandLandmarker.
 *
 * - GPU delegate, VIDEO running mode (uses the temporal tracker between detections)
 * - runs exactly once per camera frame via requestVideoFrameCallback (no duplicated frames, no skipped frames)
 * - 1€ filtering on the fingertip: still hand = rock solid, fast swipe = no lag
 * - measures capture→result latency and extrapolates the blade forward to hide it
 * - stable per-hand identity so filters never reset while a hand is visible
 */
export class HandTracker {
  readonly video = document.createElement('video')
  status: TrackerStatus = 'idle'
  errorMessage = ''
  readonly stats: TrackingStats = { fps: 0, inferenceMs: 0, latencyMs: 0, hands: 0, delegate: 'none' }

  private stream: MediaStream | null = null
  private landmarker: HandLandmarker | null = null
  private readonly hands = new Map<string, HandState>()
  private lastTimestamp = 0
  private rafId = 0
  private rvfcId = 0
  private stopped = false
  private fpsWindow: number[] = []
  private latencyEma = 0
  private readonly tmp = { x: 0, y: 0 }

  constructor() {
    const v = this.video
    v.playsInline = true
    v.muted = true
    v.autoplay = true
    v.setAttribute('playsinline', 'true')
    v.setAttribute('muted', 'true')
  }

  get running(): boolean {
    return this.status === 'running'
  }

  async start(): Promise<void> {
    if (this.status === 'starting' || this.status === 'running') return
    this.status = 'starting'
    this.stopped = false
    try {
      this.stream = await openCamera()
      this.video.srcObject = this.stream
      await this.video.play()
      if (this.video.readyState < 2) {
        await new Promise<void>((resolve) => {
          this.video.onloadeddata = () => resolve()
        })
      }

      const vision = await FilesetResolver.forVisionTasks(assetPath('mediapipe/wasm'))
      const modelAssetPath = assetPath('mediapipe/models/hand_landmarker.task')
      const build = (delegate: 'GPU' | 'CPU') =>
        HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath, delegate },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.55,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.55,
        })
      try {
        this.landmarker = await build('GPU')
        this.stats.delegate = 'GPU'
      } catch (err) {
        console.warn('[tracker] GPU delegate unavailable, falling back to CPU', err)
        this.landmarker = await build('CPU')
        this.stats.delegate = 'CPU'
      }
      if (this.stopped) {
        this.stop()
        return
      }
      this.status = 'running'
      this.scheduleFrame()
    } catch (err) {
      const name = (err as { name?: string })?.name
      const denied = name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError'
      this.status = denied ? 'denied' : 'failed'
      this.errorMessage = (err as Error)?.message ?? String(err)
      console.warn('[tracker] start failed', err)
      this.releaseCamera()
    }
  }

  stop(): void {
    this.stopped = true
    if (this.rvfcId && 'cancelVideoFrameCallback' in this.video) {
      this.video.cancelVideoFrameCallback(this.rvfcId)
    }
    cancelAnimationFrame(this.rafId)
    this.landmarker?.close()
    this.landmarker = null
    this.releaseCamera()
    this.hands.clear()
    this.status = 'idle'
  }

  private releaseCamera(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.video.srcObject = null
  }

  private scheduleFrame(): void {
    if (this.stopped) return
    if ('requestVideoFrameCallback' in this.video) {
      this.rvfcId = this.video.requestVideoFrameCallback((now, meta) => {
        const captureTime = meta.captureTime ?? meta.receiveTime ?? now
        this.processFrame(now, captureTime)
        this.scheduleFrame()
      })
    } else {
      this.rafId = requestAnimationFrame((now) => {
        this.processFrame(now, now - 16)
        this.scheduleFrame()
      })
    }
  }

  private processFrame(now: number, captureTime: number): void {
    const lm = this.landmarker
    if (!lm || this.video.readyState < 2 || this.video.videoWidth === 0) return
    // MediaPipe requires strictly monotonic timestamps.
    const ts = Math.max(Math.floor(now), this.lastTimestamp + 1)
    this.lastTimestamp = ts
    let result: HandLandmarkerResult
    const t0 = performance.now()
    try {
      result = lm.detectForVideo(this.video, ts)
    } catch (err) {
      console.warn('[tracker] detect failed', err)
      return
    }
    const t1 = performance.now()
    this.stats.inferenceMs = t1 - t0
    const latency = clamp(t1 - captureTime, 0, 200)
    this.latencyEma = this.latencyEma ? this.latencyEma * 0.85 + latency * 0.15 : latency
    this.stats.latencyMs = this.latencyEma

    this.fpsWindow.push(t1)
    while (this.fpsWindow.length && t1 - this.fpsWindow[0] > 1000) this.fpsWindow.shift()
    this.stats.fps = this.fpsWindow.length

    this.ingest(result, t1)
  }

  private ingest(result: HandLandmarkerResult, now: number): void {
    const seen = new Set<string>()
    const lists = result.landmarks ?? []
    this.stats.hands = lists.length

    for (let i = 0; i < lists.length; i += 1) {
      const marks = lists[i]
      const tip = marks[INDEX_TIP]
      const wrist = marks[WRIST]
      if (!tip || !wrist) continue
      const label = result.handedness?.[i]?.[0]?.categoryName ?? 'Hand'
      // Mirror so the blade moves the way the player sees their hand.
      const rawX = mapReach(1 - tip.x)
      const rawY = mapReach(tip.y)
      const wx = 1 - wrist.x
      const wy = wrist.y

      const state = this.matchHand(wx, wy, seen, label)
      seen.add(state.id)
      const tSec = now / 1000
      state.filter.filter(rawX, rawY, tSec, this.tmp)
      const dt = Math.max(0.004, (now - state.t) / 1000)
      if (state.t > 0) {
        const vx = (this.tmp.x - state.x) / dt
        const vy = (this.tmp.y - state.y) / dt
        // light smoothing on velocity; it only drives extrapolation + slice-speed gating
        state.vx = state.vx * 0.35 + vx * 0.65
        state.vy = state.vy * 0.35 + vy * 0.65
      }
      state.x = this.tmp.x
      state.y = this.tmp.y
      state.wx = wx
      state.wy = wy
      state.t = now
      state.label = label
      state.landmarks = marks
    }
  }

  private matchHand(wx: number, wy: number, taken: Set<string>, label: string): HandState {
    let best: HandState | null = null
    let bestD = MATCH_RADIUS
    for (const h of this.hands.values()) {
      if (taken.has(h.id)) continue
      const d = Math.hypot(h.wx - wx, h.wy - wy)
      if (d < bestD) {
        bestD = d
        best = h
      }
    }
    if (best) return best
    for (let i = 0; i < 4; i += 1) {
      const id = `hand-${i}`
      if (!this.hands.has(id) && !taken.has(id)) {
        const state: HandState = {
          id,
          label,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          wx,
          wy,
          t: 0,
          filter: new OneEuro2D(TIP_FILTER),
          landmarks: [],
        }
        this.hands.set(id, state)
        return state
      }
    }
    // All slots busy (should not happen with numHands=2): recycle the oldest.
    let oldest: HandState | null = null
    for (const h of this.hands.values()) if (!oldest || h.t < oldest.t) oldest = h
    const h = oldest as HandState
    h.filter.reset()
    h.t = 0
    return h
  }

  /**
   * Blade points extrapolated to `now`. Called every render frame (usually faster than the camera),
   * so the blade moves smoothly between detections and stays ahead of pipeline latency.
   */
  sample(now: number, out: BladePoint[]): BladePoint[] {
    out.length = 0
    for (const h of this.hands.values()) {
      const age = now - h.t
      if (h.t === 0) continue
      if (age > HOLD_MS) {
        this.hands.delete(h.id)
        continue
      }
      const lead = Math.min(age + this.latencyEma, MAX_EXTRAPOLATE_MS) / 1000
      // Fade extrapolation out as the hand goes stale so a lost hand doesn't fly away.
      const fade = age > 60 ? Math.max(0, 1 - (age - 60) / (HOLD_MS - 60)) : 1
      out.push({
        id: h.id,
        label: h.label,
        x: h.x + h.vx * lead * fade,
        y: h.y + h.vy * lead * fade,
        vx: h.vx * fade,
        vy: h.vy * fade,
        age,
        })
    }
    return out
  }

  /** Raw landmarks for the debug preview (image space, not mirrored). */
  landmarkSets(): Landmark[][] {
    const sets: Landmark[][] = []
    const now = performance.now()
    for (const h of this.hands.values()) {
      if (h.t > 0 && now - h.t < HOLD_MS && h.landmarks.length) sets.push(h.landmarks)
    }
    return sets
  }
}
