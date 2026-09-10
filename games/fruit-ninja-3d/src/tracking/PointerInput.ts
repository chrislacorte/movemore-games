import type { BladePoint } from './types'

/**
 * Mouse / touch fallback that produces the same BladePoint stream as the hand tracker.
 * Press and drag to slice.
 */
export class PointerInput {
  private active = false
  private x = 0
  private y = 0
  private vx = 0
  private vy = 0
  private t = 0

  constructor(private readonly el: HTMLElement) {
    el.addEventListener('pointerdown', this.onDown)
    el.addEventListener('pointermove', this.onMove)
    el.addEventListener('pointerup', this.onUp)
    el.addEventListener('pointercancel', this.onUp)
    el.addEventListener('pointerleave', this.onUp)
  }

  private onDown = (e: PointerEvent): void => {
    this.active = true
    this.vx = 0
    this.vy = 0
    this.set(e)
    this.el.setPointerCapture?.(e.pointerId)
  }

  private onMove = (e: PointerEvent): void => {
    if (!this.active) return
    const px = this.x
    const py = this.y
    const pt = this.t
    this.set(e)
    const dt = Math.max(0.004, (this.t - pt) / 1000)
    this.vx = this.vx * 0.4 + ((this.x - px) / dt) * 0.6
    this.vy = this.vy * 0.4 + ((this.y - py) / dt) * 0.6
  }

  private onUp = (): void => {
    this.active = false
  }

  private set(e: PointerEvent): void {
    const r = this.el.getBoundingClientRect()
    this.x = (e.clientX - r.left) / Math.max(1, r.width)
    this.y = (e.clientY - r.top) / Math.max(1, r.height)
    this.t = performance.now()
  }

  sample(now: number, out: BladePoint[]): void {
    if (!this.active) return
    const age = now - this.t
    const fade = age > 40 ? 0 : 1
    out.push({
      id: 'pointer',
      label: 'Pointer',
      x: this.x,
      y: this.y,
      vx: this.vx * fade,
      vy: this.vy * fade,
      age: 0,
    })
  }

  dispose(): void {
    this.el.removeEventListener('pointerdown', this.onDown)
    this.el.removeEventListener('pointermove', this.onMove)
    this.el.removeEventListener('pointerup', this.onUp)
    this.el.removeEventListener('pointercancel', this.onUp)
    this.el.removeEventListener('pointerleave', this.onUp)
  }
}
