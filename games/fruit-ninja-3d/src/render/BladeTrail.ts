import * as THREE from 'three'
import type { Blade } from '../tracking/BladeSystem'
import { makeGlowTexture } from './textures'

const MAX_POINTS = 48

const ribbonMaterial = (color: THREE.Color, additive: boolean, soft: number) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uColor: { value: color }, uSoft: { value: soft } },
    vertexShader: /* glsl */ `
      attribute float aAlpha;
      attribute float aSide;
      varying float vAlpha;
      varying float vSide;
      void main() {
        vAlpha = aAlpha;
        vSide = aSide;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uSoft;
      varying float vAlpha;
      varying float vSide;
      void main() {
        float edge = 1.0 - abs(vSide);
        float a = pow(smoothstep(0.0, uSoft, edge), 1.4) * vAlpha;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  })

class Ribbon {
  readonly mesh: THREE.Mesh
  private readonly pos: Float32Array
  private readonly alpha: Float32Array
  private readonly side: Float32Array
  private readonly geo: THREE.BufferGeometry

  constructor(color: THREE.Color, additive: boolean, soft: number, renderOrder: number) {
    this.geo = new THREE.BufferGeometry()
    this.pos = new Float32Array(MAX_POINTS * 2 * 3)
    this.alpha = new Float32Array(MAX_POINTS * 2)
    this.side = new Float32Array(MAX_POINTS * 2)
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3))
    this.geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1))
    this.geo.setAttribute('aSide', new THREE.BufferAttribute(this.side, 1))
    const idx: number[] = []
    for (let i = 0; i < MAX_POINTS - 1; i += 1) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    this.geo.setIndex(idx)
    this.geo.setDrawRange(0, 0)
    this.mesh = new THREE.Mesh(this.geo, ribbonMaterial(color, additive, soft))
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = renderOrder
  }

  build(
    pts: { x: number; y: number; t: number }[],
    now: number,
    maxWidth: number,
    maxAlpha: number,
    lifeMs: number,
    height: number,
  ): void {
    const n = Math.min(pts.length, MAX_POINTS)
    if (n < 2) {
      this.geo.setDrawRange(0, 0)
      return
    }
    const start = pts.length - n
    for (let i = 0; i < n; i += 1) {
      const p = pts[start + i]
      const prev = pts[Math.max(start, start + i - 1)]
      const next = pts[Math.min(pts.length - 1, start + i + 1)]
      let dx = next.x - prev.x
      let dy = next.y - prev.y
      const len = Math.hypot(dx, dy) || 1
      dx /= len
      dy /= len
      // normal
      const nx = -dy
      const ny = dx
      const k = i / (n - 1) // 0 oldest → 1 newest
      const age = (now - p.t) / lifeMs
      const life = Math.min(1, Math.max(0, 1 - age))
      const w = maxWidth * Math.pow(k, 0.55) * (0.35 + 0.65 * life)
      const a = maxAlpha * Math.pow(k, 0.8) * life
      const o = i * 6
      this.pos[o] = p.x + nx * w
      this.pos[o + 1] = height - (p.y + ny * w)
      this.pos[o + 2] = 0
      this.pos[o + 3] = p.x - nx * w
      this.pos[o + 4] = height - (p.y - ny * w)
      this.pos[o + 5] = 0
      this.alpha[i * 2] = a
      this.alpha[i * 2 + 1] = a
      this.side[i * 2] = 1
      this.side[i * 2 + 1] = -1
    }
    ;(this.geo.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
    ;(this.geo.getAttribute('aAlpha') as THREE.BufferAttribute).needsUpdate = true
    ;(this.geo.getAttribute('aSide') as THREE.BufferAttribute).needsUpdate = true
    this.geo.setDrawRange(0, (n - 1) * 6)
  }

  hide(): void {
    this.geo.setDrawRange(0, 0)
  }

  dispose(): void {
    this.geo.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }
}

interface TrailSet {
  glow: Ribbon
  core: Ribbon
  cursor: THREE.Sprite
  ring: THREE.Sprite
}

/** Draws every blade as a glowing katana streak plus a fingertip cursor. */
export class BladeTrailRenderer {
  private readonly sets = new Map<string, TrailSet>()
  private readonly glowTex = makeGlowTexture()

  constructor(private readonly overlay: THREE.Scene) {}

  private create(blade: Blade): TrailSet {
    const color = new THREE.Color().setHSL(blade.hue, 0.9, 0.6)
    const glow = new Ribbon(color, true, 1.0, 10)
    const core = new Ribbon(new THREE.Color(1, 1, 1), false, 0.6, 11)
    const cursor = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.glowTex, color, transparent: true, depthTest: false, blending: THREE.AdditiveBlending }),
    )
    cursor.renderOrder = 12
    const ring = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffffff, transparent: true, depthTest: false, opacity: 0.9 }),
    )
    ring.renderOrder = 13
    this.overlay.add(glow.mesh, core.mesh, cursor, ring)
    const set = { glow, core, cursor, ring }
    this.sets.set(blade.id, set)
    return set
  }

  update(blades: Map<string, Blade>, now: number, height: number): void {
    const scale = height / 900
    for (const [id, set] of this.sets) {
      if (!blades.has(id)) {
        this.overlay.remove(set.glow.mesh, set.core.mesh, set.cursor, set.ring)
        set.glow.dispose()
        set.core.dispose()
        set.cursor.material.dispose()
        set.ring.material.dispose()
        this.sets.delete(id)
      }
    }
    for (const blade of blades.values()) {
      const set = this.sets.get(blade.id) ?? this.create(blade)
      const speedBoost = Math.min(1, blade.speed / 2.5)
      set.glow.build(blade.trail, now, (14 + 26 * speedBoost) * scale, 0.55 + 0.35 * speedBoost, 160, height)
      set.core.build(blade.trail, now, (3 + 5 * speedBoost) * scale, 0.95, 160, height)
      const visible = blade.alive
      set.cursor.visible = visible
      set.ring.visible = visible
      if (visible) {
        const s = (34 + 22 * speedBoost) * scale
        set.cursor.position.set(blade.x, height - blade.y, 1)
        set.cursor.scale.set(s, s, 1)
        set.ring.position.set(blade.x, height - blade.y, 2)
        set.ring.scale.set(10 * scale, 10 * scale, 1)
      }
    }
  }
}
