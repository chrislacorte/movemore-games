import * as THREE from 'three'
import { createSeededRandom } from '../core/rng'

const SIZE = 1024

function makeCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')!
  return [canvas, ctx]
}

function paintWood(ctx: CanvasRenderingContext2D, rng: ReturnType<typeof createSeededRandom>): void {
  ctx.fillStyle = '#2c1a11'
  ctx.fillRect(0, 0, SIZE, SIZE)

  for (let x = 0; x < SIZE; x += 3) {
    const shade = 38 + rng() * 28
    ctx.fillStyle = `rgba(${shade + 18}, ${shade * 0.62}, ${shade * 0.38}, 0.55)`
    const wobble = Math.sin(x * 0.035 + rng() * 2) * 18
    ctx.fillRect(x, 0, 2, SIZE)
    ctx.fillStyle = `rgba(18, 10, 6, ${0.04 + rng() * 0.08})`
    ctx.fillRect(x + wobble * 0.1, 0, 1, SIZE)
  }

  for (let i = 0; i < 14; i += 1) {
    const y = rng() * SIZE
    ctx.strokeStyle = `rgba(16, 9, 5, ${0.12 + rng() * 0.18})`
    ctx.lineWidth = 6 + rng() * 18
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(SIZE * 0.35, y + rng.range(-40, 40), SIZE * 0.7, y + rng.range(-40, 40), SIZE, y)
    ctx.stroke()
  }
}

function paintSlashes(ctx: CanvasRenderingContext2D, rng: ReturnType<typeof createSeededRandom>): void {
  const slashes = [
    { x1: 0.12, y1: 0.22, x2: 0.78, y2: 0.18, w: 1.6 },
    { x1: 0.18, y1: 0.58, x2: 0.86, y2: 0.41, w: 2.1 },
    { x1: 0.28, y1: 0.78, x2: 0.72, y2: 0.86, w: 1.3 },
    { x1: 0.62, y1: 0.16, x2: 0.88, y2: 0.48, w: 1.4 },
    { x1: 0.08, y1: 0.42, x2: 0.44, y2: 0.7, w: 1.15 },
    { x1: 0.4, y1: 0.3, x2: 0.93, y2: 0.27, w: 1.05 },
    { x1: 0.22, y1: 0.12, x2: 0.51, y2: 0.49, w: 1.25 },
    { x1: 0.55, y1: 0.62, x2: 0.91, y2: 0.74, w: 1.2 },
  ]

  slashes.forEach((cut) => {
    const x1 = cut.x1 * SIZE
    const y1 = cut.y1 * SIZE
    const x2 = cut.x2 * SIZE
    const y2 = cut.y2 * SIZE

    ctx.lineCap = 'round'
    ctx.globalCompositeOperation = 'multiply'
    ctx.strokeStyle = 'rgba(12, 6, 3, 0.72)'
    ctx.lineWidth = cut.w * 4.4
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = 'rgba(92, 58, 32, 0.7)'
    ctx.lineWidth = cut.w * 2.1
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    ctx.globalCompositeOperation = 'lighter'
    ctx.strokeStyle = `rgba(255, 214, 168, ${0.38 + rng() * 0.12})`
    ctx.lineWidth = cut.w * 1.15
    ctx.beginPath()
    ctx.moveTo(x1 + 1.6, y1 - 2.1)
    ctx.lineTo(x2 + 1.6, y2 - 2.1)
    ctx.stroke()

    ctx.strokeStyle = 'rgba(255, 244, 220, 0.55)'
    ctx.lineWidth = Math.max(1, cut.w * 0.55)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    const chips = 4 + Math.floor(rng() * 5)
    for (let i = 0; i < chips; i += 1) {
      const t = rng()
      const x = x1 + (x2 - x1) * t
      const y = y1 + (y2 - y1) * t
      ctx.fillStyle = `rgba(255, 228, 188, ${0.18 + rng() * 0.16})`
      ctx.beginPath()
      ctx.ellipse(x, y, 1.2 + rng() * 2.2, 0.5, Math.atan2(y2 - y1, x2 - x1), 0, Math.PI * 2)
      ctx.fill()
    }
  })

  ctx.globalCompositeOperation = 'source-over'
}

export function createWoodWallTextures(): {
  map: THREE.CanvasTexture
  roughnessMap: THREE.CanvasTexture
} {
  const rng = createSeededRandom(77)
  const [colorCanvas, color] = makeCanvas()
  paintWood(color, rng)
  paintSlashes(color, rng)

  const [roughCanvas, rough] = makeCanvas()
  rough.fillStyle = '#b9b9b9'
  rough.fillRect(0, 0, SIZE, SIZE)
  paintSlashes(rough, createSeededRandom(77))
  rough.globalCompositeOperation = 'source-over'
  rough.fillStyle = 'rgba(255,255,255,0.12)'
  rough.fillRect(0, 0, SIZE, SIZE)

  const map = new THREE.CanvasTexture(colorCanvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8

  const roughnessMap = new THREE.CanvasTexture(roughCanvas)
  roughnessMap.anisotropy = 4

  return { map, roughnessMap }
}
