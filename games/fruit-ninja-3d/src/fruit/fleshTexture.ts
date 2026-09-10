import * as THREE from 'three'

export type FleshPattern = 'plain' | 'seeds' | 'core' | 'segments' | 'rings' | 'strawberry' | 'passion' | 'stone' | 'bomb'

export interface FleshSpec {
  base: string
  light: string
  rim: string
  seed?: string
  pattern: FleshPattern
}

const TAU = Math.PI * 2

/**
 * Procedural cross-section texture used on the cut faces.
 * Circle centred at (0.5,0.5) with radius ~0.5 in UV space (matches buildCutCap UVs).
 */
export function makeFleshTexture(spec: FleshSpec, size = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d') as CanvasRenderingContext2D
  const cx = size / 2
  const cy = size / 2
  const R = size / 2

  // base radial gradient: light centre → base → darker rim
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
  g.addColorStop(0, spec.light)
  g.addColorStop(0.55, spec.base)
  g.addColorStop(0.88, spec.base)
  g.addColorStop(0.95, spec.rim)
  g.addColorStop(1, spec.rim)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  // subtle fibrous texture
  ctx.globalAlpha = 0.07
  for (let i = 0; i < 260; i += 1) {
    const a = Math.random() * TAU
    const r0 = Math.random() * R * 0.85
    const r1 = r0 + Math.random() * R * 0.12
    ctx.strokeStyle = Math.random() > 0.5 ? '#fff' : '#000'
    ctx.lineWidth = 1 + Math.random()
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0)
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  const seedColor = spec.seed ?? '#221108'
  const drawSeed = (x: number, y: number, w: number, h: number, rot: number) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.fillStyle = seedColor
    ctx.beginPath()
    ctx.ellipse(0, 0, w, h, 0, 0, TAU)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.beginPath()
    ctx.ellipse(-w * 0.25, -h * 0.3, w * 0.3, h * 0.25, 0, 0, TAU)
    ctx.fill()
    ctx.restore()
  }

  switch (spec.pattern) {
    case 'seeds': {
      // watermelon: seeds scattered in the middle band
      for (let i = 0; i < 26; i += 1) {
        const a = Math.random() * TAU
        const r = R * (0.18 + Math.random() * 0.5)
        drawSeed(cx + Math.cos(a) * r, cy + Math.sin(a) * r, size * 0.018, size * 0.032, a + Math.PI / 2)
      }
      break
    }
    case 'core': {
      // apple / pear: star shaped core with 5 seeds
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.beginPath()
      for (let i = 0; i < 10; i += 1) {
        const a = (i / 10) * TAU - Math.PI / 2
        const r = i % 2 === 0 ? R * 0.2 : R * 0.1
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * TAU - Math.PI / 2
        drawSeed(cx + Math.cos(a) * R * 0.11, cy + Math.sin(a) * R * 0.11, size * 0.014, size * 0.026, a + Math.PI / 2)
      }
      break
    }
    case 'segments': {
      // citrus: 10 wedges separated by pale membranes + pith ring
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = size * 0.012
      for (let i = 0; i < 10; i += 1) {
        const a = (i / 10) * TAU
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * R * 0.08, cy + Math.sin(a) * R * 0.08)
        ctx.lineTo(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9)
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.9, 0, TAU)
      ctx.lineWidth = size * 0.03
      ctx.stroke()
      // juicy vesicle texture
      ctx.globalAlpha = 0.18
      for (let i = 0; i < 400; i += 1) {
        const a = Math.random() * TAU
        const r = R * (0.12 + Math.random() * 0.75)
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.2, 3, a, 0, TAU)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.07, 0, TAU)
      ctx.fill()
      break
    }
    case 'rings': {
      // pineapple: fibrous core + concentric rings
      ctx.strokeStyle = 'rgba(120,80,20,0.25)'
      ctx.lineWidth = 2
      for (let r = R * 0.3; r < R * 0.9; r += R * 0.09) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, TAU)
        ctx.stroke()
      }
      ctx.fillStyle = 'rgba(255,240,180,0.85)'
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.18, 0, TAU)
      ctx.fill()
      break
    }
    case 'strawberry': {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.beginPath()
      ctx.ellipse(cx, cy, R * 0.25, R * 0.5, 0, 0, TAU)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'
      ctx.lineWidth = 2
      for (let i = 0; i < 14; i += 1) {
        const a = (i / 14) * TAU
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * R * 0.28, cy + Math.sin(a) * R * 0.4)
        ctx.lineTo(cx + Math.cos(a) * R * 0.88, cy + Math.sin(a) * R * 0.88)
        ctx.stroke()
      }
      break
    }
    case 'passion': {
      for (let i = 0; i < 70; i += 1) {
        const a = Math.random() * TAU
        const r = Math.sqrt(Math.random()) * R * 0.78
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        ctx.fillStyle = 'rgba(255,225,120,0.85)'
        ctx.beginPath()
        ctx.arc(x, y, size * 0.03, 0, TAU)
        ctx.fill()
        drawSeed(x, y, size * 0.012, size * 0.016, Math.random() * TAU)
      }
      break
    }
    case 'stone': {
      // peach / plum / mango: pit in the middle
      const pit = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.28)
      pit.addColorStop(0, '#8a5a3a')
      pit.addColorStop(0.7, '#5a331c')
      pit.addColorStop(1, spec.base)
      ctx.fillStyle = pit
      ctx.beginPath()
      ctx.ellipse(cx, cy, R * 0.22, R * 0.3, 0.3, 0, TAU)
      ctx.fill()
      ctx.strokeStyle = 'rgba(60,30,10,0.4)'
      ctx.lineWidth = 1.5
      for (let i = 0; i < 12; i += 1) {
        ctx.beginPath()
        ctx.ellipse(cx, cy, R * (0.08 + Math.random() * 0.14), R * (0.1 + Math.random() * 0.2), Math.random() * TAU, 0, TAU)
        ctx.stroke()
      }
      break
    }
    case 'bomb': {
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(cx, cy, R * 0.55, 0, TAU)
      ctx.fill()
      break
    }
    default:
      break
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}
