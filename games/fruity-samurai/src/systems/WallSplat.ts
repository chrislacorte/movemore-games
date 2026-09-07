import * as THREE from 'three'
import { PLAY } from '../game/tuning'

const SIZE = 512

export class WallSplat {
  readonly mesh: THREE.Mesh
  private readonly canvas: HTMLCanvasElement
  private readonly ctx: CanvasRenderingContext2D
  private readonly texture: THREE.CanvasTexture
  private dirty = false
  private fadeAcc = 0
  private ink = 0

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = SIZE
    this.canvas.height = SIZE
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.clearRect(0, 0, SIZE, SIZE)
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace

    const geo = new THREE.PlaneGeometry(PLAY.width * 1.55, PLAY.height * 1.45)
    const mat = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(geo, mat)
    this.mesh.position.set(0, 0.15, PLAY.wallZ + 0.02)
    this.mesh.renderOrder = 2
  }

  stamp(worldX: number, worldY: number, color: string, power = 1, ink = false): void {
    const u = (worldX / (PLAY.width * 1.55) + 0.5) * SIZE
    const v = (1 - (worldY / (PLAY.height * 1.45) + 0.5)) * SIZE
    const drops = 5 + Math.floor(power * 8)
    if (ink) {
      this.ctx.fillStyle = '#120c09'
      this.ctx.globalAlpha = 0.55
      this.ctx.beginPath()
      this.ctx.ellipse(u, v, 18 * power, 11 * power, Math.random() * 2, 0, Math.PI * 2)
      this.ctx.fill()
      for (let i = 0; i < 10; i += 1) {
        const ang = Math.random() * Math.PI * 2
        const dist = 12 + Math.random() * 42 * power
        this.ctx.globalAlpha = 0.35 + Math.random() * 0.4
        this.ctx.beginPath()
        this.ctx.ellipse(u + Math.cos(ang) * dist, v + Math.sin(ang) * dist, 2 + Math.random() * 7, 1 + Math.random() * 3, ang, 0, Math.PI * 2)
        this.ctx.fill()
      }
    }
    for (let i = 0; i < drops; i += 1) {
      const ang = Math.random() * Math.PI * 2
      const dist = Math.random() ** 0.55 * 70 * power
      const x = u + Math.cos(ang) * dist
      const y = v + Math.sin(ang) * dist * 0.72
      const r = (5 + Math.random() * 16) * Math.max(0.35, power)
      this.ctx.fillStyle = color
      this.ctx.globalAlpha = 0.28 + Math.random() * 0.45
      this.ctx.beginPath()
      this.ctx.ellipse(x, y, r, r * (0.55 + Math.random() * 0.5), ang, 0, Math.PI * 2)
      this.ctx.fill()
      if (Math.random() < 0.45) {
        this.ctx.globalAlpha = 0.55
        this.ctx.beginPath()
        this.ctx.ellipse(
          x + Math.cos(ang) * r * 1.4,
          y + Math.sin(ang) * r * 1.1,
          r * 0.28,
          r * 0.18,
          ang,
          0,
          Math.PI * 2,
        )
        this.ctx.fill()
      }
    }
    this.ctx.globalAlpha = 1
    this.dirty = true
    this.ink = 1
  }

  fade(delta: number): void {
    if (this.ink <= 0) return
    this.fadeAcc += delta
    if (this.fadeAcc < 0.14) return
    this.fadeAcc = 0
    this.ink = Math.max(0, this.ink - 0.08)
    this.ctx.fillStyle = 'rgba(0,0,0,0.035)'
    this.ctx.globalCompositeOperation = 'destination-out'
    this.ctx.fillRect(0, 0, SIZE, SIZE)
    this.ctx.globalCompositeOperation = 'source-over'
    this.dirty = true
  }

  sync(): void {
    if (!this.dirty) return
    this.texture.needsUpdate = true
    this.dirty = false
  }

  clear(): void {
    this.ctx.clearRect(0, 0, SIZE, SIZE)
    this.ink = 0
    this.dirty = true
    this.sync()
  }
}
