/**
 * 1€ filter (Casiez et al. 2012).
 * Low cutoff when the hand is still (removes MediaPipe jitter), cutoff rises with speed
 * (beta) so fast swipes go through almost unfiltered → minimal lag on the blade.
 */
export interface OneEuroParams {
  minCutoff: number
  beta: number
  dCutoff: number
}

const alpha = (cutoff: number, dt: number): number => {
  const tau = 1 / (2 * Math.PI * cutoff)
  return 1 / (1 + tau / dt)
}

class LowPass {
  value: number | null = null
  filter(x: number, a: number): number {
    if (this.value === null) this.value = x
    else this.value = a * x + (1 - a) * this.value
    return this.value
  }
  reset(): void {
    this.value = null
  }
}

export class OneEuro1D {
  private readonly x = new LowPass()
  private readonly dx = new LowPass()
  private prev: number | null = null
  private lastT: number | null = null

  constructor(private readonly p: OneEuroParams) {}

  reset(): void {
    this.x.reset()
    this.dx.reset()
    this.prev = null
    this.lastT = null
  }

  /** @param t seconds */
  filter(value: number, t: number): number {
    if (this.lastT === null || this.prev === null) {
      this.lastT = t
      this.prev = value
      this.x.filter(value, 1)
      this.dx.filter(0, 1)
      return value
    }
    const dt = Math.max(1 / 240, t - this.lastT)
    this.lastT = t
    const rawDx = (value - this.prev) / dt
    this.prev = value
    const edx = this.dx.filter(rawDx, alpha(this.p.dCutoff, dt))
    const cutoff = this.p.minCutoff + this.p.beta * Math.abs(edx)
    return this.x.filter(value, alpha(cutoff, dt))
  }
}

export class OneEuro2D {
  private readonly fx: OneEuro1D
  private readonly fy: OneEuro1D

  constructor(p: OneEuroParams) {
    this.fx = new OneEuro1D(p)
    this.fy = new OneEuro1D(p)
  }

  reset(): void {
    this.fx.reset()
    this.fy.reset()
  }

  filter(x: number, y: number, t: number, out: { x: number; y: number }): void {
    out.x = this.fx.filter(x, t)
    out.y = this.fy.filter(y, t)
  }
}
