import * as THREE from 'three'
import { rand } from '../core/math'
import { WALL_Z } from './Stage'
import { makeGlowTexture, makeSplatTexture } from './textures'

const MAX_PARTICLES = 900
const MAX_SPLATS = 28
const MAX_FLASHES = 12

const tmpM = new THREE.Matrix4()
const tmpQ = new THREE.Quaternion()
const tmpS = new THREE.Vector3()
const tmpP = new THREE.Vector3()

interface Particle {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  max: number
  size: number
  drag: number
}

/** Juice droplets, wall splats and slice flashes. */
export class Fx {
  private readonly droplets: THREE.InstancedMesh
  private readonly particles: Particle[] = []
  private readonly free: number[] = []
  private readonly splats: THREE.Mesh[] = []
  private readonly splatLife: number[] = []
  private splatCursor = 0
  private readonly splatTextures: THREE.Texture[]
  private readonly flashes: THREE.Sprite[] = []
  private readonly flashLife: number[] = []
  private readonly glowTex = makeGlowTexture()

  constructor(scene: THREE.Scene) {
    const geo = new THREE.IcosahedronGeometry(0.075, 1)
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.05 })
    this.droplets = new THREE.InstancedMesh(geo, mat, MAX_PARTICLES)
    this.droplets.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.droplets.frustumCulled = false
    this.droplets.count = MAX_PARTICLES
    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      this.particles.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, size: 1, drag: 1 })
      this.free.push(i)
      tmpM.makeScale(0, 0, 0)
      this.droplets.setMatrixAt(i, tmpM)
      this.droplets.setColorAt(i, new THREE.Color(1, 1, 1))
    }
    scene.add(this.droplets)

    this.splatTextures = [0, 1, 2, 3].map((v) => makeSplatTexture(256, v))
    for (let i = 0; i < MAX_SPLATS; i += 1) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          map: this.splatTextures[i % this.splatTextures.length],
          transparent: true,
          depthWrite: false,
          opacity: 0,
        }),
      )
      m.visible = false
      m.position.z = WALL_Z + 0.03 + i * 0.001
      m.renderOrder = 1
      this.splats.push(m)
      this.splatLife.push(0)
      scene.add(m)
    }

    for (let i = 0; i < MAX_FLASHES; i += 1) {
      const s = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: this.glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }),
      )
      s.visible = false
      s.renderOrder = 5
      this.flashes.push(s)
      this.flashLife.push(0)
      scene.add(s)
    }
  }

  /** Burst of juice droplets at `pos`, biased along `dir`. */
  juice(pos: THREE.Vector3, dir: THREE.Vector3, color: THREE.Color, count: number, speed = 7): void {
    for (let n = 0; n < count; n += 1) {
      const i = this.free.pop()
      if (i === undefined) return
      const p = this.particles[i]
      p.x = pos.x + rand(-0.25, 0.25)
      p.y = pos.y + rand(-0.25, 0.25)
      p.z = pos.z + rand(-0.25, 0.25)
      const s = speed * rand(0.35, 1.15)
      p.vx = dir.x * s * 0.5 + rand(-s, s)
      p.vy = dir.y * s * 0.5 + rand(-s * 0.4, s * 1.1)
      p.vz = dir.z * s * 0.3 + rand(-s * 0.7, s * 0.7)
      p.life = 0
      p.max = rand(0.55, 1.1)
      p.size = rand(0.5, 1.6)
      p.drag = rand(0.6, 1.6)
      const c = color.clone().offsetHSL(rand(-0.02, 0.02), rand(-0.05, 0.05), rand(-0.08, 0.1))
      this.droplets.setColorAt(i, c)
    }
    if (this.droplets.instanceColor) this.droplets.instanceColor.needsUpdate = true
  }

  /** Grey smoke-ish puff + sparks for a bomb. */
  explosion(pos: THREE.Vector3): void {
    this.juice(pos, new THREE.Vector3(0, 1, 0), new THREE.Color('#ffb347'), 90, 14)
    this.juice(pos, new THREE.Vector3(0, 0, 1), new THREE.Color('#444'), 60, 6)
    this.flash(pos, new THREE.Color('#ffd28a'), 9)
  }

  /** Stain the wall behind `pos` (projected straight back). */
  splat(pos: THREE.Vector3, color: THREE.Color, size: number): void {
    const i = this.splatCursor
    this.splatCursor = (this.splatCursor + 1) % MAX_SPLATS
    const m = this.splats[i]
    const mat = m.material as THREE.MeshBasicMaterial
    mat.color.copy(color)
    mat.opacity = 0.85
    m.visible = true
    // wall is farther than the fruit → scale so the splat looks sized like the fruit
    m.position.x = pos.x * 1.35
    m.position.y = pos.y * 1.35 - 0.3
    m.rotation.z = Math.random() * Math.PI * 2
    m.scale.setScalar(size * rand(2.2, 3.0))
    this.splatLife[i] = 9
  }

  flash(pos: THREE.Vector3, color: THREE.Color, size = 3): void {
    let idx = this.flashLife.findIndex((l) => l <= 0)
    if (idx < 0) idx = 0
    const s = this.flashes[idx]
    s.position.copy(pos)
    s.position.z += 0.6
    s.scale.setScalar(size)
    s.material.color.copy(color)
    s.material.opacity = 1
    s.visible = true
    this.flashLife[idx] = 0.22
  }

  update(dt: number, gravity: number): void {
    for (let i = 0; i < MAX_PARTICLES; i += 1) {
      const p = this.particles[i]
      if (p.life >= p.max) continue
      p.life += dt
      if (p.life >= p.max) {
        tmpM.makeScale(0, 0, 0)
        this.droplets.setMatrixAt(i, tmpM)
        this.free.push(i)
        continue
      }
      const drag = Math.exp(-p.drag * dt)
      p.vx *= drag
      p.vz *= drag
      p.vy = p.vy * drag - gravity * 0.75 * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      const t = p.life / p.max
      const s = p.size * (t < 0.15 ? t / 0.15 : 1 - Math.pow((t - 0.15) / 0.85, 2))
      tmpP.set(p.x, p.y, p.z)
      tmpS.set(s, s * (1 + Math.min(1.2, Math.abs(p.vy) * 0.08)), s)
      tmpQ.identity()
      tmpM.compose(tmpP, tmpQ, tmpS)
      this.droplets.setMatrixAt(i, tmpM)
    }
    this.droplets.instanceMatrix.needsUpdate = true

    for (let i = 0; i < MAX_SPLATS; i += 1) {
      if (!this.splats[i].visible) continue
      this.splatLife[i] -= dt
      const mat = this.splats[i].material as THREE.MeshBasicMaterial
      const l = this.splatLife[i]
      if (l <= 0) {
        this.splats[i].visible = false
        continue
      }
      // drip: slide slowly down the wall
      this.splats[i].position.y -= dt * 0.12
      mat.opacity = Math.min(0.85, l / 2.5)
    }

    for (let i = 0; i < MAX_FLASHES; i += 1) {
      if (this.flashLife[i] <= 0) continue
      this.flashLife[i] -= dt
      const s = this.flashes[i]
      const t = Math.max(0, this.flashLife[i] / 0.22)
      s.material.opacity = t
      s.scale.multiplyScalar(1 + dt * 6)
      if (this.flashLife[i] <= 0) s.visible = false
    }
  }

  clearSplats(): void {
    for (let i = 0; i < MAX_SPLATS; i += 1) {
      this.splats[i].visible = false
      this.splatLife[i] = 0
    }
  }
}
