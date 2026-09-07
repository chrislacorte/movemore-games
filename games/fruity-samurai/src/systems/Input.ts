import * as THREE from 'three'
import { PLAY } from '../game/tuning'

export interface SwipeSample {
  x: number
  y: number
  t: number
}

export interface LabeledTrail {
  label: string
  points: SwipeSample[]
}

export class InputSystem {
  readonly pointerTrail: SwipeSample[] = []
  readonly handTrails = new Map<string, SwipeSample[]>()
  pointerActive = false
  private readonly trailCache: LabeledTrail[] = []
  private readonly ndc = new THREE.Vector2()
  private readonly raycaster = new THREE.Raycaster()
  private readonly plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  private readonly hit = new THREE.Vector3()

  constructor(
    private readonly camera: THREE.Camera,
    private readonly el: HTMLElement,
  ) {
    el.addEventListener('pointerdown', this.onDown)
    window.addEventListener('pointermove', this.onMove)
    window.addEventListener('pointerup', this.onUp)
    window.addEventListener('pointercancel', this.onUp)
  }

  dispose(): void {
    this.el.removeEventListener('pointerdown', this.onDown)
    window.removeEventListener('pointermove', this.onMove)
    window.removeEventListener('pointerup', this.onUp)
    window.removeEventListener('pointercancel', this.onUp)
  }

  trails(): LabeledTrail[] {
    this.trailCache.length = 0
    if (this.pointerTrail.length > 1) this.trailCache.push({ label: 'Pointer', points: this.pointerTrail })
    for (const [label, trail] of this.handTrails) {
      if (trail.length > 1) this.trailCache.push({ label, points: trail })
    }
    return this.trailCache
  }

  pushHand(label: string, nx: number, ny: number, now: number): void {
    if (this.pointerActive) return
    const x = (nx - 0.5) * PLAY.width
    const y = (0.5 - ny) * PLAY.height
    let trail = this.handTrails.get(label)
    if (!trail) {
      trail = []
      this.handTrails.set(label, trail)
    }
    this.push(trail, { x, y, t: now })
  }

  dropHand(label: string): void {
    this.handTrails.delete(label)
  }

  private project(clientX: number, clientY: number, t: number): SwipeSample | null {
    const rect = this.el.getBoundingClientRect()
    this.ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1
    this.raycaster.setFromCamera(this.ndc, this.camera)
    if (!this.raycaster.ray.intersectPlane(this.plane, this.hit)) return null
    this.hit.x = THREE.MathUtils.clamp(this.hit.x, -PLAY.width * 0.55, PLAY.width * 0.55)
    this.hit.y = THREE.MathUtils.clamp(this.hit.y, -PLAY.height * 0.55, PLAY.height * 0.55)
    return { x: this.hit.x, y: this.hit.y, t }
  }

  private push(trail: SwipeSample[], sample: SwipeSample): void {
    const last = trail[trail.length - 1]
    if (last && Math.hypot(sample.x - last.x, sample.y - last.y) < 0.02) {
      last.x = sample.x
      last.y = sample.y
      last.t = sample.t
      return
    }
    trail.push(sample)
    if (trail.length > 16) trail.shift()
  }

  private onDown = (e: PointerEvent) => {
    if (e.button > 0) return
    const target = e.target as HTMLElement | null
    if (target?.closest('button, a, input, .hud-over, .tab, .chip')) return
    this.pointerActive = true
    this.pointerTrail.length = 0
    const sample = this.project(e.clientX, e.clientY, performance.now() / 1000)
    if (sample) this.pointerTrail.push(sample)
    try {
      this.el.setPointerCapture?.(e.pointerId)
    } catch {
      /* untrusted events in automation */
    }
  }

  private onMove = (e: PointerEvent) => {
    if (!this.pointerActive) return
    const sample = this.project(e.clientX, e.clientY, performance.now() / 1000)
    if (sample) this.push(this.pointerTrail, sample)
  }

  private onUp = () => {
    this.pointerActive = false
  }

  prune(now = performance.now() / 1000): void {
    while (this.pointerTrail.length && now - this.pointerTrail[0].t > 0.18) this.pointerTrail.shift()
    for (const [label, trail] of this.handTrails) {
      while (trail.length && now - trail[0].t > 0.18) trail.shift()
      if (!trail.length) this.handTrails.delete(label)
    }
  }
}
