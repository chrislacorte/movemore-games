import type { BladePoint } from './types'

export interface TrailPoint {
  x: number
  y: number
  t: number
}

export interface Segment {
  x0: number
  y0: number
  x1: number
  y1: number
  /** normalised speed (screen heights / second) */
  speed: number
}

/** Fingertip must move at least this fast (screen heights / second) to cut. Resting fingers don't slice. */
export const MIN_SLICE_SPEED = 0.42
const TRAIL_MS = 160
const MAX_TRAIL_POINTS = 40

export class Blade {
  readonly trail: TrailPoint[] = []
  /** Segments swept since the last update (pixel space). */
  readonly segments: Segment[] = []
  /** smoothed speed in screen heights / second */
  speed = 0
  x = 0
  y = 0
  alive = false
  wasAlive = false
  lastSeen = 0
  hue: number

  constructor(
    readonly id: string,
    readonly label: string,
    index: number,
  ) {
    this.hue = index % 2 === 0 ? 0.55 : 0.08
  }
}

export class BladeSystem {
  readonly blades = new Map<string, Blade>()
  private created = 0

  update(points: BladePoint[], now: number, width: number, height: number): void {
    for (const b of this.blades.values()) {
      b.segments.length = 0
      b.wasAlive = b.alive
      b.alive = false
    }

    for (const p of points) {
      let blade = this.blades.get(p.id)
      const px = p.x * width
      const py = p.y * height
      if (!blade) {
        blade = new Blade(p.id, p.label, this.created++)
        blade.x = px
        blade.y = py
        this.blades.set(p.id, blade)
      }
      if (!blade.wasAlive) {
        // (re)appearing hand: start fresh, never sweep from a stale position
        blade.x = px
        blade.y = py
        blade.trail.length = 0
        blade.speed = 0
        blade.lastSeen = now
      }
      blade.alive = true
      const dx = px - blade.x
      const dy = py - blade.y
      const dist = Math.hypot(dx, dy)

      // Speed = max(reported tracker velocity, actually measured displacement / elapsed time).
      // The measured value makes slicing robust when the render loop stutters.
      const reported = Math.hypot(p.vx * (width / height), p.vy)
      const elapsed = Math.max(0.004, (now - blade.lastSeen) / 1000)
      const measured = blade.lastSeen ? dist / height / elapsed : 0
      const normSpeed = Math.max(reported, measured)
      blade.speed = blade.speed * 0.3 + normSpeed * 0.7
      blade.lastSeen = now
      if (dist > 0.5) {
        blade.segments.push({ x0: blade.x, y0: blade.y, x1: px, y1: py, speed: blade.speed })
      }
      blade.x = px
      blade.y = py

      if (dist > 0.5 || !blade.trail.length) blade.trail.push({ x: px, y: py, t: now })
      else blade.trail[blade.trail.length - 1].t = now
      while (blade.trail.length > MAX_TRAIL_POINTS) blade.trail.shift()
    }

    for (const [id, b] of this.blades) {
      while (b.trail.length && now - b.trail[0].t > TRAIL_MS) b.trail.shift()
      if (!b.alive) {
        b.speed *= 0.6
        if (now - b.lastSeen > 400 && !b.trail.length) this.blades.delete(id)
      }
    }
  }

  clear(): void {
    this.blades.clear()
  }
}
