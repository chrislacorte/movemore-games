import * as THREE from 'three'
import { cloneFruitView, type FruitKind, type FruitTemplate } from '../assets/fruitKit'
import { clipGeometry } from '../systems/sliceGeometry'
import { PLAY, TOSS } from '../game/tuning'

const _center = new THREE.Vector3()
const _inv = new THREE.Matrix4()
const _localP = new THREE.Vector3()
const _localN = new THREE.Vector3()
const _box = new THREE.Box3()
const _size = new THREE.Vector3()
const _cutPlane = new THREE.Plane()

export class Fruit {
  readonly group = new THREE.Group()
  readonly kind: FruitKind
  readonly radius: number
  readonly juice: string
  readonly flesh: string
  readonly isBomb: boolean
  vx = 0
  vy = 0
  vz = 0
  alive = true
  sliced = false
  missed = false
  private peaked = false
  private readonly spin = new THREE.Vector3()

  board = 0

  constructor(template: FruitTemplate, x: number, rng: () => number, board = 0) {
    this.kind = template.kind
    this.radius = template.radius
    this.juice = template.juice
    this.flesh = template.flesh
    this.isBomb = template.isBomb
    this.board = board
    this.group.add(cloneFruitView(template, true))
    this.group.position.set(x, -PLAY.height * 0.58, PLAY.fruitZ + (rng() - 0.5) * 0.3)
    this.vx = (rng() - 0.5) * TOSS.vxJitter
    this.vy = TOSS.vyMin + rng() * (TOSS.vyMax - TOSS.vyMin)
    this.spin.set((rng() - 0.5) * 3.2, (rng() - 0.5) * 4.5, (rng() - 0.5) * 2.4)
    this.group.rotation.set(rng() * 1.2, rng() * 6, rng() * 0.6)
  }

  update(dt: number): void {
    if (this.sliced) return
    this.group.position.x += this.vx * dt
    this.group.position.y += this.vy * dt
    this.group.position.z += this.vz * dt
    this.vy -= PLAY.gravity * dt
    if (this.vy < 0) this.peaked = true
    this.group.rotation.x += this.spin.x * dt
    this.group.rotation.y += this.spin.y * dt
    this.group.rotation.z += this.spin.z * dt
    if (this.peaked && this.group.position.y < -PLAY.height * 0.62) {
      this.alive = false
      this.missed = true
    }
  }
}

export class FruitHalf {
  readonly group = new THREE.Group()
  vx = 0
  vy = 0
  vz = 0
  spin = new THREE.Vector3()
  life = 2.8
  private age = 0
  private readonly capMat: THREE.MeshStandardMaterial
  private readonly ownedGeos: THREE.BufferGeometry[] = []
  private disposed = false

  constructor(
    template: FruitTemplate,
    position: THREE.Vector3,
    quaternion: THREE.Quaternion,
    worldNormal: THREE.Vector3,
    side: 1 | -1,
  ) {
    this.group.position.copy(position)
    this.group.quaternion.copy(quaternion)

    const view = cloneFruitView(template, false)
    this.group.add(view)
    this.group.updateMatrixWorld(true)

    const keep = worldNormal.clone().normalize()
    if (side < 0) keep.negate()

    _box.setFromObject(view)
    _box.getCenter(_center)

    view.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || obj.userData.inkOutline) return
      obj.updateWorldMatrix(true, false)
      _inv.copy(obj.matrixWorld).invert()

      const geo = obj.geometry as THREE.BufferGeometry
      if (!geo.boundingBox) geo.computeBoundingBox()
      if (geo.boundingBox) geo.boundingBox.getCenter(_localP)
      else _localP.copy(_center).applyMatrix4(_inv)

      _localN.copy(keep).transformDirection(_inv).normalize()
      if (_localN.lengthSq() < 1e-8) _localN.set(0, 1, 0)
      _cutPlane.setFromNormalAndCoplanarPoint(_localN, _localP)

      const clipped = clipGeometry(geo, _cutPlane)
      if (!clipped) {
        obj.visible = false
        return
      }
      this.ownedGeos.push(clipped)
      obj.geometry = clipped
      obj.frustumCulled = false
    })

    const localKeep = keep.clone().applyQuaternion(quaternion.clone().invert()).normalize()
    _box.getSize(_size)
    const capRadius = Math.min(template.radius * 0.55, Math.max(_size.x, _size.y, _size.z) * 0.22)
    this.capMat = new THREE.MeshStandardMaterial({
      color: template.flesh,
      roughness: 0.58,
      metalness: 0,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
    const fleshGeo = new THREE.CircleGeometry(Math.max(0.06, capRadius), 28)
    const flesh = new THREE.Mesh(fleshGeo, this.capMat)
    flesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), localKeep)
    flesh.position.copy(localKeep).multiplyScalar(0.04)
    this.ownedGeos.push(fleshGeo)
    this.group.add(flesh)

    this.group.position.addScaledVector(worldNormal, side * template.radius * 0.36)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.capMat.dispose()
    this.ownedGeos.forEach((geo) => geo.dispose())
  }

  update(dt: number): void {
    this.age += dt
    this.life -= dt
    const fade = this.age < 0.7 ? 1 : Math.max(0, 1 - (this.age - 0.7) / 2.1)
    this.capMat.transparent = fade < 0.99
    this.capMat.opacity = fade
    this.group.visible = fade > 0.04
    this.group.position.x += this.vx * dt
    this.group.position.y += this.vy * dt
    this.group.position.z += this.vz * dt
    this.vy -= PLAY.gravity * 0.9 * dt
    this.group.rotation.x += this.spin.x * dt
    this.group.rotation.y += this.spin.y * dt
    this.group.rotation.z += this.spin.z * dt
  }
}
