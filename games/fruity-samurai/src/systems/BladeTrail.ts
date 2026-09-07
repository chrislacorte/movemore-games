import * as THREE from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import type { LabeledTrail } from './Input'

const MAX_POINTS = 18
const Z = 0.08

function tintFor(label: string): { glow: number; core: number } {
  if (label === 'P1' || label === 'Left' || label === 'Pointer') return { glow: 0xc9a227, core: 0x120c09 }
  if (label === 'P2' || label === 'Right') return { glow: 0x8b1e1e, core: 0x1a0a08 }
  return { glow: 0xc9a227, core: 0x120c09 }
}

class Stroke {
  readonly glow: Line2
  readonly core: Line2
  private readonly glowGeo = new LineGeometry()
  private readonly coreGeo = new LineGeometry()
  private readonly scratch: number[] = []

  constructor() {
    this.glow = new Line2(
      this.glowGeo,
      new LineMaterial({
        color: 0xc9a227,
        linewidth: 9,
        transparent: true,
        opacity: 0.38,
        depthTest: false,
        toneMapped: false,
        fog: false,
      }),
    )
    this.core = new Line2(
      this.coreGeo,
      new LineMaterial({
        color: 0x120c09,
        linewidth: 3.2,
        transparent: true,
        opacity: 0.96,
        depthTest: false,
        toneMapped: false,
        fog: false,
      }),
    )
    this.glow.renderOrder = 8
    this.core.renderOrder = 9
    this.glow.frustumCulled = false
    this.core.frustumCulled = false
    this.hide()
  }

  setResolution(w: number, h: number): void {
    this.glow.material.resolution.set(w, h)
    this.core.material.resolution.set(w, h)
  }

  setColor(label: string, speed: number): void {
    const tint = tintFor(label)
    this.glow.material.color.setHex(tint.glow)
    this.core.material.color.setHex(tint.core)
    const width = THREE.MathUtils.clamp(5 + speed * 18, 5, 14)
    this.glow.material.linewidth = width
    this.core.material.linewidth = width * 0.38
  }

  hide(): void {
    this.glow.visible = false
    this.core.visible = false
  }

  apply(points: { x: number; y: number }[]): number {
    const n = Math.min(points.length, MAX_POINTS)
    if (n < 2) {
      this.hide()
      return 0
    }
    const positions = this.scratch
    positions.length = n * 3
    let speed = 0
    for (let i = 0; i < n; i += 1) {
      const p = points[i]
      const o = i * 3
      positions[o] = p.x
      positions[o + 1] = p.y
      positions[o + 2] = Z
      if (i > 0) speed = Math.max(speed, Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y))
    }
    this.glowGeo.setPositions(positions)
    this.coreGeo.setPositions(positions)
    this.glow.visible = true
    this.core.visible = true
    return speed
  }
}

export class BladeTrail {
  readonly group = new THREE.Group()
  private readonly strokes = [new Stroke(), new Stroke(), new Stroke(), new Stroke()]

  constructor() {
    this.strokes.forEach((s) => this.group.add(s.glow, s.core))
  }

  setResolution(w: number, h: number): void {
    this.strokes.forEach((s) => s.setResolution(w, h))
  }

  update(trails: LabeledTrail[]): void {
    this.strokes.forEach((s, i) => {
      const trail = trails[i]
      if (!trail || trail.points.length < 2) {
        s.hide()
        return
      }
      const speed = s.apply(trail.points)
      s.setColor(trail.label, speed)
    })
  }
}
