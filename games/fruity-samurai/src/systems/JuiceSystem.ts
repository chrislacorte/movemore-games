import * as THREE from 'three'
import { PLAY } from '../game/tuning'
import type { WallSplat } from './WallSplat'

type Kind = 'blob' | 'spray' | 'chunk'

interface Drop {
  kind: Kind
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  life: number
  max: number
  sx: number
  sy: number
  sz: number
  rx: number
  ry: number
  rz: number
  spinX: number
  spinY: number
  spinZ: number
  color: THREE.Color
  stamped: boolean
}

const MAX_BLOB = 90
const MAX_SPRAY = 140
const MAX_CHUNK = 70
const DIR = new THREE.Vector3()
const UP = new THREE.Vector3(0, 1, 0)
const ALIGN = new THREE.Quaternion()
const QSPIN = new THREE.Quaternion()
const EULER = new THREE.Euler()

function lumpGeometry(detail: number, flatten = 0.78): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, detail)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const n = 0.62 + ((Math.sin(x * 9.1 + y * 7.3) + 1) * 0.22 + (Math.cos(z * 11.4 + x * 5.2) + 1) * 0.14)
    pos.setXYZ(i, x * n, y * n * flatten, z * n * (2 - flatten))
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

function pulpGeometry(): THREE.BufferGeometry {
  const geo = new THREE.TetrahedronGeometry(1, 0)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const n = 0.7 + ((i * 17) % 10) * 0.045
    pos.setXYZ(i, x * n * 1.15, y * n * 0.7, z * n)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

export class JuiceSystem {
  readonly mesh = new THREE.Group()
  private readonly blobs: THREE.InstancedMesh
  private readonly spray: THREE.InstancedMesh
  private readonly chunks: THREE.InstancedMesh
  private readonly drops: Drop[] = []
  private readonly dummy = new THREE.Object3D()

  constructor() {
    const blobMat = new THREE.MeshStandardMaterial({
      roughness: 0.28,
      metalness: 0.02,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    })
    const sprayMat = new THREE.MeshStandardMaterial({
      roughness: 0.22,
      metalness: 0,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    })
    const chunkMat = new THREE.MeshStandardMaterial({
      roughness: 0.42,
      metalness: 0.01,
      transparent: true,
      opacity: 1,
      depthWrite: true,
    })

    this.blobs = new THREE.InstancedMesh(lumpGeometry(1, 0.72), blobMat, MAX_BLOB)
    this.spray = new THREE.InstancedMesh(lumpGeometry(0, 0.42), sprayMat, MAX_SPRAY)
    this.chunks = new THREE.InstancedMesh(pulpGeometry(), chunkMat, MAX_CHUNK)
    for (const mesh of [this.blobs, this.spray, this.chunks]) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(mesh.count * 3), 3)
      mesh.count = 0
      mesh.frustumCulled = false
      mesh.renderOrder = 4
      this.mesh.add(mesh)
    }
    this.spray.renderOrder = 5
  }

  burst(
    x: number,
    y: number,
    z: number,
    juice: string,
    flesh: string,
    normal: THREE.Vector3,
    rng: () => number,
  ): void {
    const juiceTint = new THREE.Color(juice)
    const fleshTint = new THREE.Color(flesh)

    for (let i = 0; i < 11; i += 1) {
      DIR.set((rng() - 0.5) * 2, (rng() - 0.28) * 2, -0.2 - rng() * 1.1)
      DIR.addScaledVector(normal, (rng() - 0.5) * 1.1)
      DIR.normalize()
      const speed = 3.2 + rng() * 6.5
      this.push({
        kind: 'blob',
        x,
        y,
        z,
        vx: DIR.x * speed,
        vy: DIR.y * speed + 1.4,
        vz: DIR.z * speed - 2.2,
        life: 0.7 + rng() * 0.45,
        max: 1,
        sx: 0.1 + rng() * 0.16,
        sy: 0.07 + rng() * 0.1,
        sz: 0.09 + rng() * 0.14,
        rx: rng() * 6,
        ry: rng() * 6,
        rz: rng() * 6,
        spinX: (rng() - 0.5) * 8,
        spinY: (rng() - 0.5) * 8,
        spinZ: (rng() - 0.5) * 6,
        color: juiceTint.clone().lerp(fleshTint, rng() * 0.35),
        stamped: false,
      })
    }

    for (let i = 0; i < 22; i += 1) {
      DIR.set((rng() - 0.5) * 2, (rng() - 0.4) * 2, -0.5 - rng() * 1.8)
      DIR.addScaledVector(normal, (rng() - 0.5) * 1.6)
      DIR.normalize()
      const speed = 7 + rng() * 13
      this.push({
        kind: 'spray',
        x,
        y,
        z,
        vx: DIR.x * speed,
        vy: DIR.y * speed + 2.4,
        vz: DIR.z * speed - 4.2,
        life: 0.38 + rng() * 0.32,
        max: 1,
        sx: 0.018 + rng() * 0.03,
        sy: 0.014 + rng() * 0.022,
        sz: 0.09 + rng() * 0.16,
        rx: 0,
        ry: 0,
        rz: 0,
        spinX: 0,
        spinY: 0,
        spinZ: 0,
        color: juiceTint.clone().multiplyScalar(0.85 + rng() * 0.25),
        stamped: false,
      })
    }

    for (let i = 0; i < 7; i += 1) {
      DIR.set((rng() - 0.5) * 2, (rng() - 0.35) * 2, -0.4 - rng())
      DIR.normalize()
      const speed = 4 + rng() * 7
      this.push({
        kind: 'spray',
        x,
        y,
        z,
        vx: DIR.x * speed,
        vy: DIR.y * speed,
        vz: DIR.z * speed - 2,
        life: 0.45 + rng() * 0.25,
        max: 1,
        sx: 0.03 + rng() * 0.04,
        sy: 0.02,
        sz: 0.12,
        rx: 0,
        ry: 0,
        rz: 0,
        spinX: 0,
        spinY: 0,
        spinZ: 0,
        color: new THREE.Color('#120c09'),
        stamped: false,
      })
    }

    for (let i = 0; i < 9; i += 1) {
      DIR.set((rng() - 0.5) * 2, rng() * 1.4, (rng() - 0.5) * 1.2)
      DIR.addScaledVector(normal, (rng() - 0.5) * 0.8)
      DIR.normalize()
      const speed = 2.4 + rng() * 5.2
      this.push({
        kind: 'chunk',
        x,
        y,
        z,
        vx: DIR.x * speed,
        vy: DIR.y * speed + 2.8,
        vz: DIR.z * speed - 1.4,
        life: 0.85 + rng() * 0.55,
        max: 1,
        sx: 0.055 + rng() * 0.09,
        sy: 0.04 + rng() * 0.07,
        sz: 0.05 + rng() * 0.08,
        rx: rng() * 6,
        ry: rng() * 6,
        rz: rng() * 6,
        spinX: (rng() - 0.5) * 14,
        spinY: (rng() - 0.5) * 12,
        spinZ: (rng() - 0.5) * 10,
        color: fleshTint.clone().lerp(juiceTint, rng() * 0.28),
        stamped: false,
      })
    }
  }

  private push(drop: Drop): void {
    const cap = drop.kind === 'blob' ? MAX_BLOB : drop.kind === 'spray' ? MAX_SPRAY : MAX_CHUNK
    const count = this.drops.reduce((n, d) => n + (d.kind === drop.kind ? 1 : 0), 0)
    if (count >= cap) {
      const idx = this.drops.findIndex((d) => d.kind === drop.kind)
      if (idx >= 0) this.drops.splice(idx, 1)
    }
    drop.max = drop.life
    this.drops.push(drop)
  }

  update(delta: number, wall: WallSplat): void {
    for (let i = this.drops.length - 1; i >= 0; i -= 1) {
      const p = this.drops[i]
      p.life -= delta
      p.vy -= (p.kind === 'spray' ? 20 : 16) * delta
      p.x += p.vx * delta
      p.y += p.vy * delta
      p.z += p.vz * delta
      p.rx += p.spinX * delta
      p.ry += p.spinY * delta
      p.rz += p.spinZ * delta
      if (!p.stamped && p.z <= PLAY.wallZ + 0.08) {
        p.stamped = true
        if (p.kind !== 'spray' || Math.random() < 0.22) {
          wall.stamp(p.x, p.y, `#${p.color.getHexString()}`, p.kind === 'blob' ? 0.2 : 0.1)
        }
        p.vz *= -0.12
        p.z = PLAY.wallZ + 0.1
        p.life *= 0.32
      }
      if (p.life <= 0) this.drops.splice(i, 1)
    }
    this.syncMesh(this.blobs, 'blob')
    this.syncMesh(this.spray, 'spray', true)
    this.syncMesh(this.chunks, 'chunk')
  }

  private syncMesh(mesh: THREE.InstancedMesh, kind: Kind, align = false): void {
    let n = 0
    for (const p of this.drops) {
      if (p.kind !== kind) continue
      const fade = Math.max(0.12, p.life / p.max)
      this.dummy.position.set(p.x, p.y, p.z)
      this.dummy.scale.set(p.sx * fade, p.sy * fade, p.sz * (align ? 0.55 + fade : fade))
      if (align) {
        DIR.set(p.vx, p.vy, p.vz)
        if (DIR.lengthSq() > 0.001) {
          ALIGN.setFromUnitVectors(UP, DIR.normalize())
          this.dummy.quaternion.copy(ALIGN)
        }
      } else {
        EULER.set(p.rx, p.ry, p.rz)
        QSPIN.setFromEuler(EULER)
        this.dummy.quaternion.copy(QSPIN)
      }
      this.dummy.updateMatrix()
      mesh.setMatrixAt(n, this.dummy.matrix)
      mesh.setColorAt(n, p.color)
      n += 1
    }
    mesh.count = n
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    const mat = mesh.material as THREE.MeshStandardMaterial
    mat.opacity = kind === 'spray' ? 0.7 : kind === 'blob' ? 0.9 : 1
  }

  clear(): void {
    this.drops.length = 0
    this.blobs.count = 0
    this.spray.count = 0
    this.chunks.count = 0
  }
}
