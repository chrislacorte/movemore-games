import * as THREE from 'three'

function canvas(size: number): { c: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const ctx = c.getContext('2d') as CanvasRenderingContext2D
  return { c, ctx }
}

let seed = 1337
const srand = (): number => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

/** Dark dojo wood wall with grain, plank seams and a soft vignette. */
export function makeWoodTexture(size = 1024): THREE.CanvasTexture {
  const { c, ctx } = canvas(size)
  seed = 4242
  ctx.fillStyle = '#2a1a10'
  ctx.fillRect(0, 0, size, size)

  const planks = 7
  const ph = size / planks
  for (let p = 0; p < planks; p += 1) {
    const y0 = p * ph
    const tone = 0.85 + srand() * 0.3
    const g = ctx.createLinearGradient(0, y0, 0, y0 + ph)
    g.addColorStop(0, `rgba(${Math.round(70 * tone)}, ${Math.round(42 * tone)}, ${Math.round(24 * tone)}, 1)`)
    g.addColorStop(0.5, `rgba(${Math.round(58 * tone)}, ${Math.round(34 * tone)}, ${Math.round(19 * tone)}, 1)`)
    g.addColorStop(1, `rgba(${Math.round(48 * tone)}, ${Math.round(28 * tone)}, ${Math.round(16 * tone)}, 1)`)
    ctx.fillStyle = g
    ctx.fillRect(0, y0, size, ph)

    // grain
    ctx.lineWidth = 1
    for (let i = 0; i < 140; i += 1) {
      const y = y0 + srand() * ph
      const amp = 1 + srand() * 4
      const dark = srand() > 0.5
      ctx.strokeStyle = dark ? `rgba(20, 10, 4, ${0.08 + srand() * 0.18})` : `rgba(140, 90, 50, ${0.04 + srand() * 0.08})`
      ctx.beginPath()
      const freq = 0.004 + srand() * 0.01
      const phase = srand() * 10
      for (let x = 0; x <= size; x += 8) {
        const yy = y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 3.1 + phase) * amp * 0.3
        if (x === 0) ctx.moveTo(x, yy)
        else ctx.lineTo(x, yy)
      }
      ctx.stroke()
    }
    // knots
    for (let k = 0; k < 2; k += 1) {
      if (srand() > 0.5) continue
      const kx = srand() * size
      const ky = y0 + ph * (0.3 + srand() * 0.4)
      const kr = 10 + srand() * 22
      const kg = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr)
      kg.addColorStop(0, 'rgba(25, 12, 5, 0.9)')
      kg.addColorStop(0.5, 'rgba(60, 35, 18, 0.5)')
      kg.addColorStop(1, 'rgba(60, 35, 18, 0)')
      ctx.fillStyle = kg
      ctx.beginPath()
      ctx.ellipse(kx, ky, kr * 1.6, kr, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    // seam
    ctx.fillStyle = 'rgba(10, 5, 2, 0.85)'
    ctx.fillRect(0, y0 + ph - 3, size, 3)
    ctx.fillStyle = 'rgba(160, 110, 70, 0.18)'
    ctx.fillRect(0, y0, size, 2)
  }

  // vignette
  const v = ctx.createRadialGradient(size * 0.5, size * 0.42, size * 0.15, size * 0.5, size * 0.5, size * 0.78)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.72)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Soft blobby splat with satellite droplets. White; tinted via material color. */
export function makeSplatTexture(size = 256, variant = 0): THREE.CanvasTexture {
  const { c, ctx } = canvas(size)
  seed = 99 + variant * 31
  const cx = size / 2
  const cy = size / 2
  ctx.fillStyle = '#fff'
  const blobs = 5 + Math.floor(srand() * 4)
  for (let i = 0; i < blobs; i += 1) {
    const a = srand() * Math.PI * 2
    const d = srand() * size * 0.14
    const r = size * (0.12 + srand() * 0.16)
    ctx.globalAlpha = 0.85 + srand() * 0.15
    ctx.beginPath()
    ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.8 + srand() * 0.5), r, srand() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  const drops = 14 + Math.floor(srand() * 12)
  for (let i = 0; i < drops; i += 1) {
    const a = srand() * Math.PI * 2
    const d = size * (0.2 + srand() * 0.28)
    const r = size * (0.008 + srand() * 0.03)
    ctx.globalAlpha = 0.7 + srand() * 0.3
    ctx.beginPath()
    ctx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r, r * (1 + srand() * 1.5), a, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/** Radial glow for sprites (cursor, flashes). */
export function makeGlowTexture(size = 128): THREE.CanvasTexture {
  const { c, ctx } = canvas(size)
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.7)')
  g.addColorStop(0.6, 'rgba(255,255,255,0.18)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
