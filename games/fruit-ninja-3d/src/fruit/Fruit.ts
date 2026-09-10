import * as THREE from 'three'
import type { FruitTemplate } from './FruitKit'
import { buildCutCap, clipGeometry, worldPlaneToLocal } from './slice'

const tmpQ = new THREE.Quaternion()
const tmpAxis = new THREE.Vector3()
const tmpPlane = new THREE.Plane()
const tmpN = new THREE.Vector3()

function integrateSpin(quat: THREE.Quaternion, spin: THREE.Vector3, dt: number): void {
  const w = spin.length()
  if (w < 1e-6) return
  tmpAxis.copy(spin).multiplyScalar(1 / w)
  tmpQ.setFromAxisAngle(tmpAxis, w * dt)
  quat.multiply(tmpQ).normalize()
}

export class Piece {
  readonly group = new THREE.Group()
  readonly pos = new THREE.Vector3()
  readonly vel = new THREE.Vector3()
  readonly spin = new THREE.Vector3()
  readonly quat = new THREE.Quaternion()
  life = 0
  private readonly geometries: THREE.BufferGeometry[] = []

  constructor(
    body: THREE.BufferGeometry,
    cap: THREE.BufferGeometry | null,
    material: THREE.Material,
    flesh: THREE.Material,
    scale: number,
  ) {
    const mesh = new THREE.Mesh(body, material)
    this.group.add(mesh)
    this.geometries.push(body)
    if (cap) {
      const capMesh = new THREE.Mesh(cap, flesh)
      this.group.add(capMesh)
      this.geometries.push(cap)
    }
    this.group.scale.setScalar(scale)
  }

  update(dt: number, gravity: number): void {
    this.vel.y -= gravity * dt
    this.pos.addScaledVector(this.vel, dt)
    integrateSpin(this.quat, this.spin, dt)
    this.group.position.copy(this.pos)
    this.group.quaternion.copy(this.quat)
    this.life += dt
  }

  dispose(): void {
    for (const g of this.geometries) g.dispose()
  }
}

export class Fruit {
  readonly mesh: THREE.Mesh
  readonly pos = new THREE.Vector3()
  readonly vel = new THREE.Vector3()
  readonly spin = new THREE.Vector3()
  readonly quat = new THREE.Quaternion()
  readonly radius: number
  readonly isBomb: boolean
  alive = true
  /** set once the fruit has entered the visible area (used for miss detection) */
  entered = false
  age = 0
  /** optional payload for menu items */
  tag: string | null = null
  /** menu fruits float instead of falling */
  floating = false
  bobPhase = Math.random() * 6.28
  baseY = 0
  /** cached screen-space centre + radius (pixels), refreshed every frame */
  sx = 0
  sy = 0
  sr = 0

  constructor(
    readonly template: FruitTemplate,
    readonly scale: number,
  ) {
    this.mesh = new THREE.Mesh(template.geometry, template.material)
    this.mesh.scale.setScalar(scale)
    this.radius = template.radius * scale
    this.isBomb = template.kind === 'bomb'
    this.quat.setFromEuler(new THREE.Euler(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28))
  }

  update(dt: number, gravity: number): void {
    this.age += dt
    if (this.floating) {
      this.pos.y = this.baseY + Math.sin(this.age * 1.6 + this.bobPhase) * 0.22
    } else {
      this.vel.y -= gravity * dt
      this.pos.addScaledVector(this.vel, dt)
    }
    integrateSpin(this.quat, this.spin, dt)
    this.mesh.position.copy(this.pos)
    this.mesh.quaternion.copy(this.quat)
  }

  /**
   * Physically cut the mesh with a world-space plane through the fruit centre.
   * Returns two pieces flying apart along the plane normal.
   */
  slice(worldNormal: THREE.Vector3, separation: number, bladeVel: THREE.Vector3): Piece[] {
    this.mesh.updateMatrixWorld(true)
    tmpN.copy(worldNormal).normalize()
    tmpPlane.setFromNormalAndCoplanarPoint(tmpN, this.pos)
    const local = worldPlaneToLocal(this.mesh, tmpPlane)
    const localNormal = local.normal.clone()

    const rimA: number[] = []
    const rimB: number[] = []
    const geoA = clipGeometry(this.template.sliceGeometry, local, rimA)
    const negated = local.clone().negate()
    const geoB = clipGeometry(this.template.sliceGeometry, negated, rimB)
    const pieces: Piece[] = []
    const make = (geo: THREE.BufferGeometry | null, rim: number[], capNormal: THREE.Vector3, dir: number) => {
      if (!geo) return
      const cap = buildCutCap(rim, capNormal)
      const piece = new Piece(geo, cap, this.template.material, this.template.fleshMaterial, this.scale)
      piece.pos.copy(this.pos)
      piece.quat.copy(this.quat)
      piece.vel.copy(this.vel).multiplyScalar(0.55).addScaledVector(tmpN, separation * dir).addScaledVector(bladeVel, 0.25)
      piece.vel.y += 1.2
      piece.spin
        .copy(this.spin)
        .multiplyScalar(0.5)
        .add(new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6))
      pieces.push(piece)
    }
    make(geoA, rimA, localNormal.clone().negate(), 1)
    make(geoB, rimB, localNormal, -1)
    return pieces
  }
}
