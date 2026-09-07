import * as THREE from 'three'

export type Easing = (t: number) => number

export const easeOutCubic: Easing = (t) => 1 - (1 - t) ** 3
export const easeOutBack: Easing = (t) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}

interface ActiveTween {
  elapsed: number
  duration: number
  easing: Easing
  onUpdate: (value: number) => void
  onComplete?: () => void
}

export class TweenManager {
  private readonly tweens: ActiveTween[] = []

  tween(
    durationSec: number,
    onUpdate: (value: number) => void,
    easing: Easing = easeOutCubic,
    onComplete?: () => void,
  ): void {
    this.tweens.push({ elapsed: 0, duration: durationSec, easing, onUpdate, onComplete })
  }

  update(delta: number): void {
    for (let i = this.tweens.length - 1; i >= 0; i -= 1) {
      const t = this.tweens[i]
      t.elapsed += delta
      const k = Math.min(t.elapsed / t.duration, 1)
      t.onUpdate(t.easing(k))
      if (t.elapsed >= t.duration) {
        t.onComplete?.()
        this.tweens.splice(i, 1)
      }
    }
  }
}

function pseudoNoise(t: number, seed: number): number {
  const x = Math.sin(t * 12.9898 + seed * 78.233) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

export class ShakeRig {
  private trauma = 0
  private time = 0

  addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount)
  }

  update(delta: number, camera: THREE.PerspectiveCamera): void {
    this.time += delta
    this.trauma = Math.max(0, this.trauma - 1.4 * delta)
    if (this.trauma <= 0) return
    const shake = this.trauma * this.trauma
    const freq = this.time * 32
    camera.position.x += 0.18 * shake * pseudoNoise(freq, 1)
    camera.position.y += 0.14 * shake * pseudoNoise(freq, 2)
    camera.rotation.z += 0.045 * shake * pseudoNoise(freq, 3)
  }
}

export class FeelClock {
  timeScale = 1
  private hitstopRemaining = 0
  fovPunch = 0

  hitstop(durationMs: number, scale = 0.35): void {
    this.hitstopRemaining = Math.max(this.hitstopRemaining, durationMs / 1000)
    this.timeScale = Math.min(this.timeScale, scale)
  }

  slowMo(durationMs: number, scale = 0.42): void {
    this.hitstopRemaining = Math.max(this.hitstopRemaining, durationMs / 1000)
    this.timeScale = scale
  }

  punchFov(degrees: number): void {
    this.fovPunch = Math.min(10, this.fovPunch + degrees)
  }

  step(realDelta: number): number {
    if (this.hitstopRemaining > 0) {
      this.hitstopRemaining -= realDelta
      if (this.hitstopRemaining <= 0) this.timeScale = 1
    }
    this.fovPunch *= Math.exp(-realDelta / 0.2)
    if (this.fovPunch < 0.001) this.fovPunch = 0
    return realDelta * this.timeScale
  }
}
