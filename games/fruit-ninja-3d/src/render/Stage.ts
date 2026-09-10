import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { makeWoodTexture } from './textures'

export const WALL_Z = -6
export const PLAY_Z = 0
const CAM_Z = 14
const FOV = 44

export interface ViewBounds {
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * Owns the WebGL renderer, the 3D scene (fruit, particles, wall) and a 2D overlay scene
 * (blade trails, cursors) that is rendered in pixel coordinates on top.
 */
export class Stage {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly overlay = new THREE.Scene()
  readonly overlayCamera: THREE.OrthographicCamera
  readonly wall: THREE.Mesh
  readonly key: THREE.DirectionalLight
  width = 1
  height = 1
  /** camera shake state */
  private shakeAmp = 0
  private shakeT = 0
  private readonly basePos = new THREE.Vector3(0, 0.6, CAM_Z)
  private readonly lookAt = new THREE.Vector3(0, 0.2, 0)
  private readonly tmpV = new THREE.Vector3()

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.autoClear = false

    this.camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 60)
    this.camera.position.copy(this.basePos)
    this.camera.lookAt(this.lookAt)

    this.overlayCamera = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10)

    // Environment for PBR reflections (fruit skin sheen)
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environment = env
    this.scene.environmentIntensity = 0.55
    pmrem.dispose()

    const hemi = new THREE.HemisphereLight(0xfff1dc, 0x3a2416, 0.55)
    this.scene.add(hemi)
    this.key = new THREE.DirectionalLight(0xfff3e0, 2.6)
    this.key.position.set(-6, 9, 10)
    this.scene.add(this.key)
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.7)
    fill.position.set(7, 2, 8)
    this.scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffc27a, 1.1)
    rim.position.set(0, -4, -6)
    this.scene.add(rim)

    // Dojo wall
    const wood = makeWoodTexture()
    this.wall = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshStandardMaterial({ map: wood, roughness: 0.92, metalness: 0, color: 0xd8c2a8 }),
    )
    this.wall.position.set(0, 0, WALL_Z)
    this.scene.add(this.wall)

    // Warm spotlight pool on the wall
    const spot = new THREE.SpotLight(0xffe0b0, 40, 60, 0.7, 0.8, 1.2)
    spot.position.set(0, 10, 8)
    spot.target.position.set(0, -1, WALL_Z)
    this.scene.add(spot, spot.target)

    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  resize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    this.width = w
    this.height = h
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    // Standard (non-mirrored) ortho: a flipped y axis would invert triangle winding and
    // get everything back-face culled. Overlay code converts pixel y → h - y.
    this.overlayCamera.left = 0
    this.overlayCamera.right = w
    this.overlayCamera.top = h
    this.overlayCamera.bottom = 0
    this.overlayCamera.updateProjectionMatrix()

    // scale the wall so it always fills the view with margin
    const b = this.bounds(WALL_Z)
    this.wall.scale.set((b.right - b.left) * 1.25, (b.top - b.bottom) * 1.25, 1)
  }

  /** Visible world-space rectangle at depth z. */
  bounds(z: number): ViewBounds {
    const dist = this.basePos.z - z
    const halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * dist
    const halfW = halfH * this.camera.aspect
    // centre of view at depth z: follow the camera's forward ray
    const dir = this.tmpV.copy(this.lookAt).sub(this.basePos).normalize()
    const t = (z - this.basePos.z) / dir.z
    const cy = this.basePos.y + dir.y * t
    return { left: -halfW, right: halfW, top: cy + halfH, bottom: cy - halfH }
  }

  /** World → pixel coordinates (y down). */
  project(world: THREE.Vector3, out: { x: number; y: number }): void {
    this.tmpV.copy(world).project(this.camera)
    out.x = (this.tmpV.x * 0.5 + 0.5) * this.width
    out.y = (-this.tmpV.y * 0.5 + 0.5) * this.height
  }

  /** Radius in pixels of a sphere with `radius` at `world`. */
  pixelRadius(world: THREE.Vector3, radius: number): number {
    const dist = this.camera.position.distanceTo(world)
    const halfH = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * dist
    return (radius / halfH) * (this.height / 2)
  }

  /** Pixel → world at depth z (plane parallel to the screen). */
  unproject(px: number, py: number, z: number, out: THREE.Vector3): THREE.Vector3 {
    const ndcX = (px / this.width) * 2 - 1
    const ndcY = -(py / this.height) * 2 + 1
    out.set(ndcX, ndcY, 0.5).unproject(this.camera)
    const dir = out.sub(this.camera.position).normalize()
    const t = (z - this.camera.position.z) / dir.z
    return out.copy(this.camera.position).addScaledVector(dir, t)
  }

  shake(amount: number): void {
    this.shakeAmp = Math.max(this.shakeAmp, amount)
  }

  update(dt: number): void {
    if (this.shakeAmp > 0.001) {
      this.shakeT += dt * 38
      const a = this.shakeAmp
      this.camera.position.set(
        this.basePos.x + Math.sin(this.shakeT * 1.3) * a,
        this.basePos.y + Math.cos(this.shakeT * 1.7) * a * 0.7,
        this.basePos.z + Math.sin(this.shakeT * 0.9) * a * 0.3,
      )
      this.shakeAmp *= Math.exp(-dt * 5.5)
    } else {
      this.camera.position.copy(this.basePos)
    }
    this.camera.lookAt(this.lookAt)
  }

  render(): void {
    const r = this.renderer
    r.clear(true, true, false)
    r.render(this.scene, this.camera)
    r.clearDepth()
    r.render(this.overlay, this.overlayCamera)
  }
}
