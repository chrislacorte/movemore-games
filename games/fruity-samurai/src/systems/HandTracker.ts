import { assetPath } from '../assets/assetPath'

type HandsApi = {
  initialize?: () => Promise<void>
  setOptions: (opts: Record<string, unknown>) => void
  onResults: (cb: (results: HandsResults) => void) => void
  send: (input: { image: HTMLVideoElement }) => Promise<void>
  close: () => void
}

interface HandsResults {
  multiHandLandmarks?: { x: number; y: number; z: number }[][]
  multiHandedness?: { label?: string }[]
}

export interface TrackedHand {
  x: number
  y: number
  label: string
}

class AxisFilter {
  private x = 0
  private dx = 0
  private t = 0
  ready = false

  next(value: number, now: number): number {
    if (!this.ready) {
      this.ready = true
      this.x = value
      this.t = now
      return value
    }
    const dt = Math.max(0.008, (now - this.t) / 1000)
    this.t = now
    const edx = (value - this.x) / dt
    this.dx += 0.4 * (edx - this.dx)
    const cutoff = 1.4 + 0.12 * Math.abs(this.dx)
    const a = 1 - Math.exp((-2 * Math.PI * cutoff * dt) / 1)
    this.x += a * (value - this.x)
    return this.x
  }
}

function loadHandsScript(): Promise<new (config: { locateFile: (file: string) => string }) => HandsApi> {
  const existing = (window as unknown as { Hands?: new (config: { locateFile: (file: string) => string }) => HandsApi }).Hands
  if (existing) return Promise.resolve(existing)

  return new Promise((resolve, reject) => {
    const prev = document.querySelector('script[data-mediapipe-hands]')
    if (prev) {
      prev.addEventListener('load', () => {
        const Hands = (window as unknown as { Hands?: new (config: { locateFile: (file: string) => string }) => HandsApi }).Hands
        if (!Hands) reject(new Error('Hands missing'))
        else resolve(Hands)
      }, { once: true })
      prev.addEventListener('error', () => reject(new Error('Failed to load MediaPipe Hands')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = assetPath('mediapipe/hands/hands.js')
    script.async = true
    script.dataset.mediapipeHands = 'true'
    script.onload = () => {
      const Hands = (window as unknown as { Hands?: new (config: { locateFile: (file: string) => string }) => HandsApi }).Hands
      if (!Hands) reject(new Error('Hands missing'))
      else resolve(Hands)
    }
    script.onerror = () => reject(new Error('Failed to load MediaPipe Hands'))
    document.head.appendChild(script)
  })
}

async function openCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('getUserMedia missing')
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 },
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

export class HandTracker {
  readonly video = document.createElement('video')
  hands: TrackedHand[] = []
  cameraOn = false
  ready = false
  denied = false
  failed = false
  starting = false
  private stream: MediaStream | null = null
  private api: HandsApi | null = null
  private raf = 0
  private busy = false
  private lastSend = 0
  private readonly filters = new Map<string, { x: AxisFilter; y: AxisFilter }>()

  constructor() {
    this.video.playsInline = true
    this.video.muted = true
    this.video.autoplay = true
    this.video.setAttribute('playsinline', 'true')
    this.video.setAttribute('muted', 'true')
    this.video.width = 640
    this.video.height = 480
    this.video.className = 'hand-preview'
  }

  async start(): Promise<void> {
    if (this.starting || this.ready) return
    if (this.api) return
    this.starting = true
    this.denied = false
    this.failed = false
    try {
      this.stream = await openCamera()
      this.video.srcObject = this.stream
      await this.video.play()
      if (this.video.readyState < 2) {
        await new Promise<void>((resolve) => {
          this.video.onloadeddata = () => resolve()
        })
      }
      this.cameraOn = true

      const Hands = await loadHandsScript()
      const hands = new Hands({
        locateFile: (file) => assetPath(`mediapipe/hands/${file}`),
      })
      hands.setOptions({
        maxNumHands: 4,
        modelComplexity: 0,
        minDetectionConfidence: 0.45,
        minTrackingConfidence: 0.45,
      })
      if (typeof hands.initialize === 'function') await hands.initialize()
      hands.onResults((results) => {
        const now = performance.now()
        const next: TrackedHand[] = []
        const seen = new Set<string>()
        results.multiHandLandmarks?.forEach((marks, i) => {
          const tip = marks[8]
          if (!tip) return
          const label = results.multiHandedness?.[i]?.label ?? `Hand_${i}`
          seen.add(label)
          let filter = this.filters.get(label)
          if (!filter) {
            filter = { x: new AxisFilter(), y: new AxisFilter() }
            this.filters.set(label, filter)
          }
          next.push({
            x: filter.x.next(1 - tip.x, now),
            y: filter.y.next(tip.y, now),
            label,
          })
        })
        for (const key of [...this.filters.keys()]) {
          if (!seen.has(key)) this.filters.delete(key)
        }
        this.hands = next
        this.ready = true
      })
      this.api = hands
      this.loop()
    } catch (err) {
      const name = (err as { name?: string })?.name
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
        this.denied = true
      } else {
        this.failed = true
        console.warn('MediaPipe init failed', err)
      }
    } finally {
      this.starting = false
    }
  }

  private loop = (): void => {
    const now = performance.now()
    if (
      this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      this.video.videoWidth > 0 &&
      this.api &&
      !this.busy &&
      now - this.lastSend >= 32
    ) {
      this.busy = true
      this.lastSend = now
      void this.api
        .send({ image: this.video })
        .catch((err) => console.warn('Hands send failed', err))
        .finally(() => {
          this.busy = false
        })
    }
    this.raf = requestAnimationFrame(this.loop)
  }

  stop(): void {
    cancelAnimationFrame(this.raf)
    this.stream?.getTracks().forEach((t) => t.stop())
    this.api?.close()
    this.api = null
    this.cameraOn = false
    this.ready = false
  }
}
