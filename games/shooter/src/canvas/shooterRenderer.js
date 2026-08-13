import {
  TARGET_HIT_RADIUS_SCALE,
  TARGET_DEATH_MS,
} from '../constants/gameConfig'

const GRAIN_TILE = 128

/** Ambient pollen / fireflies — seeded once per session */
const AMBIENT_SPECKS = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 0.137) % 1,
  y: 0.08 + ((i * 0.091) % 0.72),
  r: 1.2 + (i % 4) * 0.6,
  phase: i * 1.7,
  speed: 0.0008 + (i % 5) * 0.0003,
}))

function lerp(a, b, t) {
  return a + (b - a) * t
}

function easeOut(t) {
  return 1 - (1 - t) ** 3
}

/** Persistent offscreen grain tile (cheap film look). */
let grainCanvas = null
function getGrainTile() {
  if (grainCanvas) return grainCanvas
  grainCanvas = document.createElement('canvas')
  grainCanvas.width = GRAIN_TILE
  grainCanvas.height = GRAIN_TILE
  const g = grainCanvas.getContext('2d')
  const img = g.createImageData(GRAIN_TILE, GRAIN_TILE)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 100 + Math.random() * 55
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
    img.data[i + 3] = 18 + Math.random() * 28
  }
  g.putImageData(img, 0, 0)
  return grainCanvas
}

function drawSky(ctx, w, h, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.9)
  sky.addColorStop(0, '#0a1628')
  sky.addColorStop(0.18, '#1a3d6b')
  sky.addColorStop(0.42, '#4a8ec4')
  sky.addColorStop(0.62, '#8eb8d4')
  sky.addColorStop(0.78, '#d4a574')
  sky.addColorStop(0.9, '#f0d090')
  sky.addColorStop(1, '#fff4d6')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  const sunX = w * 0.78 + Math.sin(time * 0.00018) * w * 0.012
  const sunY = h * 0.2
  const sunCore = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.14)
  sunCore.addColorStop(0, 'rgba(255, 255, 245, 1)')
  sunCore.addColorStop(0.35, 'rgba(255, 230, 160, 0.85)')
  sunCore.addColorStop(1, 'rgba(255, 200, 100, 0)')
  ctx.fillStyle = sunCore
  ctx.beginPath()
  ctx.arc(sunX, sunY, w * 0.14, 0, Math.PI * 2)
  ctx.fill()

  const sunBloom = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, w * 0.48)
  sunBloom.addColorStop(0, 'rgba(255, 245, 210, 0.55)')
  sunBloom.addColorStop(0.2, 'rgba(255, 210, 130, 0.22)')
  sunBloom.addColorStop(0.5, 'rgba(255, 170, 80, 0.06)')
  sunBloom.addColorStop(1, 'rgba(255, 170, 80, 0)')
  ctx.fillStyle = sunBloom
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.translate(sunX, sunY)
  for (let i = 0; i < 9; i++) {
    const a = -0.55 + i * 0.14 + Math.sin(time * 0.00035 + i * 0.8) * 0.05
    const len = w * 1.05
    const ray = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len)
    ray.addColorStop(0, 'rgba(255, 240, 200, 0.22)')
    ray.addColorStop(0.35, 'rgba(255, 210, 140, 0.08)')
    ray.addColorStop(1, 'rgba(255, 200, 120, 0)')
    ctx.fillStyle = ray
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(a - 0.035) * len, Math.sin(a - 0.035) * len)
    ctx.lineTo(Math.cos(a + 0.035) * len, Math.sin(a + 0.035) * len)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function drawAmbientSpecks(ctx, w, h, time) {
  for (const s of AMBIENT_SPECKS) {
    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * s.speed * 1000 + s.phase))
    const px = ((s.x * w + time * s.speed * w * 0.08) % (w + 20)) - 10
    const py = s.y * h + Math.sin(time * 0.001 + s.phase) * 6
    ctx.fillStyle = `rgba(255, 248, 220, ${0.15 * twinkle})`
    ctx.beginPath()
    ctx.arc(px, py, s.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawLakeBand(ctx, w, h, time) {
  const top = h * 0.72
  const band = ctx.createLinearGradient(0, top, 0, h * 0.82)
  band.addColorStop(0, 'rgba(60, 120, 160, 0)')
  band.addColorStop(0.35, 'rgba(55, 110, 150, 0.35)')
  band.addColorStop(1, 'rgba(40, 90, 130, 0.5)')
  ctx.fillStyle = band
  ctx.fillRect(0, top, w, h * 0.12)

  ctx.save()
  ctx.globalAlpha = 0.25
  ctx.strokeStyle = 'rgba(200, 230, 255, 0.6)'
  ctx.lineWidth = 1.5
  for (let i = 0; i < 6; i++) {
    const y = top + h * 0.02 + i * h * 0.012
    ctx.beginPath()
    for (let x = 0; x <= w; x += 8) {
      const wave = Math.sin(x * 0.02 + time * 0.002 + i) * 3
      if (x === 0) ctx.moveTo(x, y + wave)
      else ctx.lineTo(x, y + wave)
    }
    ctx.stroke()
  }
  ctx.restore()
}

function drawBushSilhouettes(ctx, w, h, time) {
  ctx.save()
  ctx.fillStyle = 'rgba(18, 42, 22, 0.55)'
  for (let i = 0; i < 14; i++) {
    const bx = (i / 14) * w + Math.sin(time * 0.0002 + i) * 4
    const bh = 28 + (i % 5) * 14
    ctx.beginPath()
    ctx.ellipse(bx, h * 0.86, 36 + (i % 3) * 12, bh, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawCloudLayer(ctx, w, h, time, layer) {
  const clouds = layer.clouds
  for (const [cx, cy, cs] of clouds) {
    const drift =
      ((time * layer.speed + cx * 100) % (w + cs * w * 2)) - cs * w
    const x = drift
    const y = cy * h
    const r = cs * w

    ctx.save()
    ctx.fillStyle = `rgba(0, 0, 0, ${layer.alpha * 0.12})`
    ctx.beginPath()
    ctx.ellipse(x + r * 0.08, y + r * 0.12, r * 1.05, r * 0.52, 0, 0, Math.PI * 2)
    ctx.fill()

    const cloudGrad = ctx.createRadialGradient(x, y - r * 0.1, 0, x, y, r * 1.2)
    cloudGrad.addColorStop(0, `rgba(255, 255, 255, ${layer.alpha})`)
    cloudGrad.addColorStop(0.7, `rgba(245, 248, 255, ${layer.alpha * 0.85})`)
    cloudGrad.addColorStop(1, `rgba(220, 230, 245, ${layer.alpha * 0.4})`)
    ctx.fillStyle = cloudGrad
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * 0.52, 0, 0, Math.PI * 2)
    ctx.ellipse(x + r * 0.65, y + r * 0.06, r * 0.75, r * 0.44, 0, 0, Math.PI * 2)
    ctx.ellipse(x - r * 0.55, y + r * 0.08, r * 0.62, r * 0.4, 0, 0, Math.PI * 2)
    ctx.ellipse(x + r * 0.2, y - r * 0.15, r * 0.45, r * 0.32, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

function drawMountainSilhouette(ctx, w, h, baseY, color, parallax, time) {
  const shift = Math.sin(time * 0.00015) * w * parallax
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(-w * 0.05 + shift, h)
  ctx.lineTo(-w * 0.05 + shift, h * baseY)
  const peaks = 12
  for (let i = 0; i <= peaks; i++) {
    const x = (i / peaks) * w * 1.1 + shift
    const peak = Math.sin(i * 2.1 + baseY * 8) * h * 0.06
    const y = h * baseY - peak - (i % 3) * h * 0.02
    ctx.lineTo(x, y)
  }
  ctx.lineTo(w * 1.05 + shift, h)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawHill(ctx, w, h, baseY, color, alpha = 1, parallax = 0, time = 0) {
  const shift = Math.sin(time * 0.00025 + baseY) * w * parallax
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, h)
  ctx.lineTo(0, h * baseY)
  for (let i = 0; i <= 10; i++) {
    const x = (i / 10) * w + shift
    const y = h * baseY - Math.sin(i * 1.3 + baseY * 10) * h * 0.055
    ctx.lineTo(x, y)
  }
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawScene(ctx, w, h, time) {
  drawSky(ctx, w, h, time)

  drawCloudLayer(ctx, w, h, time, {
    alpha: 0.35,
    speed: 0.000008,
    clouds: [
      [0.1, 0.14, 0.14],
      [0.55, 0.1, 0.18],
      [0.85, 0.2, 0.12],
    ],
  })

  drawMountainSilhouette(ctx, w, h, 0.58, '#152a42', 0.008, time)
  drawMountainSilhouette(ctx, w, h, 0.66, '#1e3a52', 0.012, time)

  drawLakeBand(ctx, w, h, time)

  drawHill(ctx, w, h, 0.74, '#4a8f48', 0.88, 0.015, time)
  drawHill(ctx, w, h, 0.8, '#357038', 0.7, 0.02, time)
  drawHill(ctx, w, h, 0.86, '#5faa52', 1, 0.025, time)

  drawBushSilhouettes(ctx, w, h, time)

  drawCloudLayer(ctx, w, h, time, {
    alpha: 0.55,
    speed: 0.000018,
    clouds: [
      [0.2, 0.28, 0.1],
      [0.45, 0.32, 0.08],
      [0.7, 0.26, 0.09],
    ],
  })

  // Atmospheric haze over mid-ground
  const haze = ctx.createLinearGradient(0, h * 0.35, 0, h * 0.82)
  haze.addColorStop(0, 'rgba(200, 170, 120, 0)')
  haze.addColorStop(0.5, 'rgba(220, 190, 140, 0.08)')
  haze.addColorStop(1, 'rgba(180, 150, 100, 0.18)')
  ctx.fillStyle = haze
  ctx.fillRect(0, 0, w, h)

  drawAmbientSpecks(ctx, w, h, time)

  // Foreground marsh grass
  const grassTop = h * 0.84
  const grass = ctx.createLinearGradient(0, grassTop, 0, h)
  grass.addColorStop(0, '#3f6b2e')
  grass.addColorStop(0.4, '#2d5220')
  grass.addColorStop(1, '#1a3314')
  ctx.fillStyle = grass
  ctx.fillRect(0, grassTop, w, h - grassTop)

  ctx.strokeStyle = 'rgba(20, 45, 18, 0.75)'
  ctx.lineWidth = 2.5
  for (let i = 0; i < 55; i++) {
    const gx = (i / 55) * w + ((i * 47) % 23)
    const sway = Math.sin(time * 0.0012 + i * 0.7) * 10
    const bh = 22 + ((i * 29) % 34)
    const thick = 1 + (i % 3) * 0.5
    ctx.lineWidth = thick
    ctx.beginPath()
    ctx.moveTo(gx, h)
    ctx.quadraticCurveTo(gx + sway * 0.4, h - bh * 0.55, gx + sway, h - bh)
    ctx.stroke()
  }

  // Foreground reeds (depth framing)
  ctx.fillStyle = 'rgba(12, 28, 10, 0.55)'
  for (let i = 0; i < 8; i++) {
    const fx = (i / 8) * w
    ctx.beginPath()
    ctx.ellipse(fx, h - 8, 28 + i * 4, 60 + i * 8, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

const BIRD_PALETTES = [
  {
    name: 'golden',
    body: '#c98a38',
    bodyDark: '#8f5a1e',
    bodyLight: '#e8b45a',
    belly: '#f0c878',
    wing: ['#7a4010', '#a85c18', '#d48828', '#f0b040'],
    head: '#d9a048',
    crest: '#c62828',
    beak: '#f59e0b',
    beakDark: '#c2710c',
    ring: '#fff8f0',
    cheek: '#d84315',
    feet: '#e65100',
    eye: '#1a1208',
    outline: '#3e2723',
  },
  {
    name: 'azure',
    body: '#4a8eb0',
    bodyDark: '#1e4a68',
    bodyLight: '#8ec8e0',
    belly: '#b8dce8',
    wing: ['#123850', '#1e5878', '#3d85a8', '#7eb8d8'],
    head: '#7eb0c8',
    crest: '#0d47a1',
    beak: '#ffb300',
    beakDark: '#e68a00',
    ring: '#f0f8ff',
    cheek: '#e65100',
    feet: '#f57c00',
    eye: '#0a1820',
    outline: '#1a3040',
  },
  {
    name: 'marsh',
    body: '#9a7848',
    bodyDark: '#5a4020',
    bodyLight: '#c4a070',
    belly: '#d8c090',
    wing: ['#3a2810', '#5a4018', '#8a6830', '#b09050'],
    head: '#b89868',
    crest: '#4e342e',
    beak: '#e6a020',
    beakDark: '#b87818',
    ring: '#f5f0e0',
    cheek: '#bf360c',
    feet: '#bf360c',
    eye: '#1a1008',
    outline: '#2e2010',
  },
  {
    name: 'classic',
    body: '#c07830',
    bodyDark: '#7a4818',
    bodyLight: '#e8a848',
    belly: '#f0c060',
    wing: ['#8a4010', '#b85818', '#e08830', '#f0b048'],
    head: '#d89840',
    crest: '#8d3b1a',
    beak: '#f5a623',
    beakDark: '#d48818',
    ring: '#ffffff',
    cheek: '#e85d04',
    feet: '#e85d04',
    eye: '#1a1008',
    outline: '#4a3020',
    plump: true,
  },
]

function illuStroke(ctx, bw, color, width = 0.038) {
  ctx.strokeStyle = color
  ctx.lineWidth = bw * width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
}

function illuFillStroke(ctx, bw, palette) {
  illuStroke(ctx, bw, palette.outline)
  ctx.stroke()
}

function drawIllustratedFeather(ctx, x0, y0, x1, y1, x2, y2, fill, outline, bw) {
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.quadraticCurveTo(x1, y1, x2, y2)
  ctx.quadraticCurveTo(x1 + (x0 - x1) * 0.15, y1 + (y0 - y1) * 0.1, x0, y0)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  illuStroke(ctx, bw, outline, 0.022)
  ctx.stroke()
}

function drawIllustratedWing(ctx, bw, flap, palette, layer) {
  const isBack = layer === 'back'
  const lift = isBack ? -0.32 : -0.2
  const spread = isBack ? 0.78 : 0.62
  const rot = flap * (isBack ? 0.75 : 1.05)
  const feathers = isBack ? 4 : 5
  const baseAlpha = isBack ? 0.88 : 1

  ctx.save()
  ctx.globalAlpha *= baseAlpha
  ctx.rotate(rot)

  for (let i = 0; i < feathers; i++) {
    const t = i / (feathers - 1)
    const fx = -bw * (0.08 + t * spread * 0.85)
    const fy = bw * (lift + 0.06 + (i % 2) * 0.03)
    const tipX = fx - bw * (0.22 + t * 0.12)
    const tipY = fy + bw * (0.12 + t * 0.08)
    const color = palette.wing[Math.min(i, palette.wing.length - 1)]
    drawIllustratedFeather(
      ctx,
      -bw * 0.04,
      bw * (lift + 0.02),
      fx,
      fy,
      tipX,
      tipY,
      color,
      palette.outline,
      bw,
    )
  }
  ctx.restore()
}

function drawIllustratedTail(ctx, bw, palette) {
  const feathers = [
    { tip: [-1.05, 0.18], mid: [-0.72, 0.14], base: [-0.62, 0.06] },
    { tip: [-1.18, 0.02], mid: [-0.78, 0.02], base: [-0.65, 0.02] },
    { tip: [-1.08, -0.14], mid: [-0.74, -0.06], base: [-0.62, -0.02] },
  ]
  feathers.forEach((f, i) => {
    const fill = palette.wing[1 + (i % 2)]
    drawIllustratedFeather(
      ctx,
      bw * f.base[0],
      bw * f.base[1],
      bw * f.mid[0],
      bw * f.mid[1],
      bw * f.tip[0],
      bw * f.tip[1],
      fill,
      palette.outline,
      bw,
    )
  })
}

function drawIllustratedBody(ctx, bw, palette) {
  const plump = palette.plump

  // Dark underside (cel shade)
  ctx.fillStyle = palette.bodyDark
  ctx.beginPath()
  if (plump) {
    ctx.moveTo(-bw * 0.72, bw * 0.08)
    ctx.bezierCurveTo(-bw * 0.55, bw * 0.42, bw * 0.35, bw * 0.48, bw * 0.55, bw * 0.28)
    ctx.bezierCurveTo(bw * 0.42, bw * 0.12, bw * 0.1, bw * 0.02, -bw * 0.2, bw * 0.04)
    ctx.bezierCurveTo(-bw * 0.45, bw * 0.02, -bw * 0.62, -bw * 0.02, -bw * 0.72, bw * 0.08)
  } else {
    ctx.moveTo(-bw * 0.78, bw * 0.04)
    ctx.bezierCurveTo(-bw * 0.5, bw * 0.38, bw * 0.3, bw * 0.4, bw * 0.48, bw * 0.22)
    ctx.bezierCurveTo(bw * 0.35, bw * 0.08, bw * 0.05, -bw * 0.02, -bw * 0.25, bw * 0.02)
    ctx.bezierCurveTo(-bw * 0.5, -bw * 0.02, -bw * 0.68, -bw * 0.04, -bw * 0.78, bw * 0.04)
  }
  ctx.closePath()
  ctx.fill()

  // Main body
  ctx.fillStyle = palette.body
  ctx.beginPath()
  if (plump) {
    ctx.moveTo(-bw * 0.78, -bw * 0.06)
    ctx.bezierCurveTo(-bw * 0.55, -bw * 0.38, bw * 0.15, -bw * 0.42, bw * 0.58, -bw * 0.12)
    ctx.bezierCurveTo(bw * 0.62, bw * 0.08, bw * 0.38, bw * 0.38, bw * 0.08, bw * 0.35)
    ctx.bezierCurveTo(-bw * 0.22, bw * 0.38, -bw * 0.62, bw * 0.28, -bw * 0.78, -bw * 0.06)
  } else {
    ctx.moveTo(-bw * 0.85, -bw * 0.08)
    ctx.bezierCurveTo(-bw * 0.55, -bw * 0.42, bw * 0.2, -bw * 0.45, bw * 0.62, -bw * 0.15)
    ctx.bezierCurveTo(bw * 0.68, bw * 0.05, bw * 0.42, bw * 0.35, bw * 0.05, bw * 0.32)
    ctx.bezierCurveTo(-bw * 0.28, bw * 0.35, -bw * 0.68, bw * 0.25, -bw * 0.85, -bw * 0.08)
  }
  ctx.closePath()
  ctx.fill()
  illuFillStroke(ctx, bw, palette)

  // Belly patch
  ctx.fillStyle = palette.belly
  ctx.beginPath()
  ctx.ellipse(bw * 0.05, bw * 0.14, bw * (plump ? 0.38 : 0.34), bw * (plump ? 0.26 : 0.22), 0.1, 0, Math.PI * 2)
  ctx.fill()
  illuStroke(ctx, bw, palette.outline, 0.018)
  ctx.stroke()

  // Light shoulder patch
  ctx.fillStyle = palette.bodyLight
  ctx.globalAlpha *= 0.55
  ctx.beginPath()
  ctx.ellipse(-bw * 0.12, -bw * 0.08, bw * 0.28, bw * 0.18, -0.25, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha /= 0.55
}

function drawIllustratedNeckRing(ctx, bw, palette) {
  ctx.strokeStyle = palette.ring
  ctx.lineWidth = bw * 0.1
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(bw * 0.36, -bw * 0.05, bw * 0.27, -Math.PI * 0.62, Math.PI * 0.38)
  ctx.stroke()

  illuStroke(ctx, bw, palette.outline, 0.022)
  ctx.beginPath()
  ctx.arc(bw * 0.36, -bw * 0.05, bw * 0.27, -Math.PI * 0.62, Math.PI * 0.38)
  ctx.stroke()
}

function drawIllustratedHead(ctx, bw, palette) {
  const hx = bw * 0.72
  const hy = -bw * 0.22
  const hr = bw * (palette.plump ? 0.36 : 0.34)

  // Neck
  ctx.fillStyle = palette.head
  ctx.beginPath()
  ctx.moveTo(bw * 0.42, bw * 0.02)
  ctx.quadraticCurveTo(bw * 0.52, -bw * 0.12, hx - hr * 0.3, hy + hr * 0.2)
  ctx.quadraticCurveTo(hx - hr * 0.5, hy + hr * 0.5, hx - hr * 0.2, hy + hr * 0.55)
  ctx.quadraticCurveTo(bw * 0.48, bw * 0.12, bw * 0.38, bw * 0.08)
  ctx.closePath()
  ctx.fill()

  // Head
  ctx.fillStyle = palette.head
  ctx.beginPath()
  ctx.arc(hx, hy, hr, 0, Math.PI * 2)
  ctx.fill()
  illuFillStroke(ctx, bw, palette)

  // Crest / comb
  ctx.fillStyle = palette.crest
  const crestCount = palette.plump ? 3 : 4
  for (let i = 0; i < crestCount; i++) {
    const cx = hx - hr * (0.55 - i * 0.14)
    const cy = hy - hr * (0.82 + (i % 2) * 0.08)
    ctx.beginPath()
    ctx.ellipse(cx, cy, bw * 0.045, bw * 0.09, -0.2 + i * 0.1, 0, Math.PI * 2)
    ctx.fill()
    illuStroke(ctx, bw, palette.outline, 0.018)
    ctx.stroke()
  }

  // Cheek patch
  ctx.fillStyle = palette.cheek
  ctx.globalAlpha *= 0.75
  ctx.beginPath()
  ctx.ellipse(hx - hr * 0.15, hy + hr * 0.12, bw * 0.09, bw * 0.065, 0.35, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha /= 0.75
}

function drawIllustratedBeak(ctx, bw, palette) {
  const bx = bw * 1.02
  const by = -bw * 0.24

  ctx.fillStyle = palette.beak
  ctx.beginPath()
  ctx.moveTo(bx, by - bw * 0.1)
  ctx.quadraticCurveTo(bw * 1.38, by - bw * 0.06, bw * 1.42, by)
  ctx.quadraticCurveTo(bw * 1.36, by + bw * 0.04, bx, by - bw * 0.02)
  ctx.closePath()
  ctx.fill()
  illuFillStroke(ctx, bw, palette)

  ctx.fillStyle = palette.beakDark
  ctx.beginPath()
  ctx.moveTo(bx, by - bw * 0.02)
  ctx.quadraticCurveTo(bw * 1.3, by + bw * 0.02, bw * 1.34, by + bw * 0.06)
  ctx.lineTo(bx, by + bw * 0.08)
  ctx.closePath()
  ctx.fill()
  illuStroke(ctx, bw, palette.outline, 0.02)
  ctx.stroke()
}

function drawIllustratedEye(ctx, bw, palette) {
  const ex = bw * 0.84
  const ey = -bw * 0.3
  const er = bw * 0.075

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(ex, ey, er, 0, Math.PI * 2)
  ctx.fill()
  illuStroke(ctx, bw, palette.outline, 0.02)
  ctx.stroke()

  ctx.fillStyle = palette.eye
  ctx.beginPath()
  ctx.arc(ex + bw * 0.012, ey + bw * 0.01, er * 0.62, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(ex + bw * 0.028, ey - bw * 0.018, er * 0.22, 0, Math.PI * 2)
  ctx.fill()
}

function drawIllustratedLegs(ctx, bw, palette, time, bobPhase, isHit) {
  if (isHit) return
  const swing = Math.sin(time * 0.02 + bobPhase) * bw * 0.06

  const drawLeg = (ox, spread) => {
    ctx.strokeStyle = palette.feet
    ctx.lineWidth = bw * 0.042
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(ox, bw * 0.34)
    ctx.quadraticCurveTo(ox - spread * 0.3, bw * 0.48, ox + swing, bw * 0.58)
    ctx.stroke()

    ctx.lineWidth = bw * 0.028
    for (const toe of [-0.05, 0, 0.05]) {
      ctx.beginPath()
      ctx.moveTo(ox + swing, bw * 0.58)
      ctx.lineTo(ox + swing + bw * toe, bw * 0.66)
      ctx.stroke()
    }
  }

  drawLeg(bw * 0.08, 1)
  drawLeg(-bw * 0.04, -1)
}

function drawIllustratedBird(ctx, bw, flap, palette, isHit, time, t) {
  drawIllustratedWing(ctx, bw, flap, palette, 'back')
  drawIllustratedTail(ctx, bw, palette)
  drawIllustratedBody(ctx, bw, palette)
  drawIllustratedNeckRing(ctx, bw, palette)
  drawIllustratedWing(ctx, bw, flap * 1.12, palette, 'front')
  drawIllustratedHead(ctx, bw, palette)
  drawIllustratedBeak(ctx, bw, palette)
  drawIllustratedEye(ctx, bw, palette)
  drawIllustratedLegs(ctx, bw, palette, time, t.bobPhase, isHit)
}

function drawHitFeathers(ctx, bw, palette, t, k) {
  ctx.globalAlpha *= k
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + t.spin
    const dist = bw * (0.35 + (1 - k) * 1.1)
    const fx = Math.cos(a) * dist
    const fy = Math.sin(a) * dist
    drawIllustratedFeather(
      ctx,
      fx,
      fy,
      fx + Math.cos(a + 0.4) * bw * 0.08,
      fy + Math.sin(a + 0.4) * bw * 0.08,
      fx + Math.cos(a - 0.3) * bw * 0.14,
      fy + Math.sin(a - 0.3) * bw * 0.14,
      palette.wing[i % palette.wing.length],
      palette.outline,
      bw * 0.7,
    )
  }
}

function drawTarget(ctx, w, h, t, time) {
  const depth = 0.55 + (t.y / 0.65) * 0.45
  const x = t.x * w
  const y = t.y * h
  const bw = t.size * w * depth
  const facing = t.dir
  const isHit = t.state === 'hit'
  const palette = BIRD_PALETTES[t.species % BIRD_PALETTES.length]

  ctx.save()
  ctx.translate(x, y)
  ctx.globalAlpha *= 0.94 + depth * 0.06

  if (isHit) {
    const k = Math.max(0, (t.deathUntil - performance.now()) / TARGET_DEATH_MS)
    ctx.globalAlpha *= Math.max(0.25, k)
    ctx.rotate(t.spin)
  }

  ctx.scale(facing, 1)

  // Soft ground shadow
  ctx.fillStyle = `rgba(0,0,0,${0.14 * depth})`
  ctx.beginPath()
  ctx.ellipse(0, bw * 0.58, bw * 0.7, bw * 0.14, 0, 0, Math.PI * 2)
  ctx.fill()

  // Speed trail
  if (!isHit) {
    const trail = ctx.createLinearGradient(-facing * bw * 1.6, 0, -facing * bw * 0.35, 0)
    trail.addColorStop(0, 'rgba(255,255,255,0)')
    trail.addColorStop(0.7, `rgba(255,240,200,${0.05 * depth})`)
    trail.addColorStop(1, `rgba(255,220,160,${0.1 * depth})`)
    ctx.strokeStyle = trail
    ctx.lineWidth = bw * 0.28
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(-facing * bw * 1.5, 0)
    ctx.lineTo(-facing * bw * 0.45, 0)
    ctx.stroke()
  }

  const flap = isHit ? -0.9 : Math.sin(time * 0.016 + t.bobPhase) * 0.82

  drawIllustratedBird(ctx, bw, flap, palette, isHit, time, t)

  if (isHit) {
    const k = Math.max(0, (t.deathUntil - performance.now()) / TARGET_DEATH_MS)
    drawHitFeathers(ctx, bw, palette, t, k)
  }

  ctx.restore()
}

function drawParticles(ctx, w, h, particles, now) {
  if (!particles?.length) return
  for (const p of particles) {
    const age = (now - p.born) / (p.life * 1000)
    const alpha = Math.max(0, 1 - age)
    const px = p.x * w
    const py = p.y * h
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(px, py)
    ctx.rotate(age * 4 + p.hue)

    ctx.fillStyle = `hsla(${p.hue}, 80%, 62%, ${alpha})`
    ctx.beginPath()
    ctx.ellipse(0, 0, p.size * (1 - age * 0.4), p.size * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = `hsla(${p.hue + 15}, 70%, 75%, ${alpha * 0.7})`
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(-p.size * 0.3, 0)
    ctx.lineTo(p.size * 0.5, 0)
    ctx.stroke()
    ctx.restore()
  }
}

function drawHitMarker(ctx, w, h, m, now) {
  const age = easeOut((now - m.born) / (m.until - m.born))
  const x = m.x * w
  const y = m.y * h - age * h * 0.1
  ctx.save()
  ctx.globalAlpha = Math.max(0, 1 - age * 0.85)

  const r = lerp(8, w * 0.065, age)
  const ring = ctx.createRadialGradient(x, y, r * 0.2, x, y, r)
  ring.addColorStop(0, 'rgba(255, 240, 160, 0.9)')
  ring.addColorStop(0.5, 'rgba(255, 180, 60, 0.35)')
  ring.addColorStop(1, 'rgba(255, 120, 40, 0)')
  ctx.fillStyle = ring
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255, 255, 220, 0.95)'
  ctx.lineWidth = 2.5
  ctx.shadowColor = 'rgba(255, 200, 80, 0.8)'
  ctx.shadowBlur = 12
  ctx.font = `700 ${Math.round(w * 0.038)}px Bebas Neue, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff8dc'
  ctx.fillText('+1', x, y - r * 0.85)
  ctx.restore()
}

function drawShotFx(ctx, w, h, fx, now) {
  if (!fx || now > fx.until) return
  const total = fx.until - fx.born
  const age = 1 - (fx.until - now) / total
  const x = fx.x * w
  const y = fx.y * h

  // Muzzle cone + shockwave ring
  ctx.save()
  ctx.globalAlpha = Math.max(0, (1 - age) * 0.85)
  const cone = ctx.createRadialGradient(x, y, 0, x, y, w * 0.12 * (1 + age))
  cone.addColorStop(0, 'rgba(255, 250, 220, 1)')
  cone.addColorStop(0.25, fx.hit ? 'rgba(255, 200, 80, 0.7)' : 'rgba(255, 255, 255, 0.5)')
  cone.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = cone
  ctx.beginPath()
  ctx.arc(x, y, w * 0.12 * (1 + age * 0.5), 0, Math.PI * 2)
  ctx.fill()

  if (fx.hit) {
    ctx.strokeStyle = `rgba(255, 220, 120, ${(1 - age) * 0.6})`
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(x, y, w * 0.04 + age * w * 0.1, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawMuzzleFlash(ctx, w, h, until, now) {
  if (!until || now > until) return
  const age = 1 - (until - now) / 100
  ctx.save()
  ctx.globalAlpha = Math.max(0, (1 - age) * 0.35)
  const flash = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7)
  flash.addColorStop(0, 'rgba(255, 248, 230, 0.9)')
  flash.addColorStop(0.4, 'rgba(255, 200, 120, 0.25)')
  flash.addColorStop(1, 'rgba(255, 200, 120, 0)')
  ctx.fillStyle = flash
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

function drawCrosshair(ctx, w, h, crosshair, pinching, time) {
  if (!crosshair) return
  const x = crosshair.x * w
  const y = crosshair.y * h
  const ready = !pinching
  const accent = ready ? [80, 220, 255] : [255, 170, 60]
  const color = `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, 0.95)`
  const r = w * 0.034
  const pulse = ready ? 1 + Math.sin(time * 0.005) * 0.06 : 0.82

  ctx.save()
  ctx.translate(x, y)
  ctx.scale(pulse, pulse)

  const outerGlow = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.2)
  outerGlow.addColorStop(0, `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, 0.15)`)
  outerGlow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = outerGlow
  ctx.beginPath()
  ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.shadowColor = color
  ctx.shadowBlur = 20
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()

  const gap = r * 0.42
  const len = r * 1.1
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(-r - len * 0.35, 0)
  ctx.lineTo(-gap, 0)
  ctx.moveTo(gap, 0)
  ctx.lineTo(r + len * 0.35, 0)
  ctx.moveTo(0, -r - len * 0.35)
  ctx.lineTo(0, -gap)
  ctx.moveTo(0, gap)
  ctx.lineTo(0, r + len * 0.35)
  ctx.stroke()

  ctx.shadowBlur = 0
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Corner brackets (cinematic scope feel)
  ctx.strokeStyle = `rgba(255,255,255,${ready ? 0.35 : 0.55})`
  ctx.lineWidth = 1.5
  const b = r * 1.65
  const bl = r * 0.35
  ;[
    [-b, -b, bl, 0, 0, bl],
    [b, -b, -bl, 0, 0, bl],
    [-b, b, bl, 0, 0, -bl],
    [b, b, -bl, 0, 0, -bl],
  ].forEach(([cx, cy, dx1, dy1, dx2, dy2]) => {
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + dx1, cy + dy1)
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + dx2, cy + dy2)
    ctx.stroke()
  })

  ctx.restore()
}

function drawColorGrade(ctx, w, h) {
  const warm = ctx.createLinearGradient(0, 0, w, h)
  warm.addColorStop(0, 'rgba(255, 120, 40, 0.06)')
  warm.addColorStop(0.5, 'rgba(0,0,0,0)')
  warm.addColorStop(1, 'rgba(40, 100, 200, 0.08)')
  ctx.fillStyle = warm
  ctx.fillRect(0, 0, w, h)

  const crush = ctx.createLinearGradient(0, h * 0.5, 0, h)
  crush.addColorStop(0, 'rgba(0,0,0,0)')
  crush.addColorStop(1, 'rgba(10, 20, 8, 0.35)')
  ctx.fillStyle = crush
  ctx.fillRect(0, 0, w, h)
}

function drawVignette(ctx, w, h) {
  const v = ctx.createRadialGradient(w / 2, h * 0.45, w * 0.15, w / 2, h * 0.48, w * 0.92)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(0.55, 'rgba(0,0,0,0.12)')
  v.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)
}

function drawLetterbox(ctx, w, h) {
  const bar = h * 0.045
  ctx.fillStyle = 'rgba(0,0,0,0.92)'
  ctx.fillRect(0, 0, w, bar)
  ctx.fillRect(0, h - bar, w, bar)
}

function drawFilmGrain(ctx, w, h, time) {
  const tile = getGrainTile()
  ctx.save()
  ctx.globalAlpha = 0.22
  ctx.globalCompositeOperation = 'overlay'
  const ox = (time * 0.07) % GRAIN_TILE
  const oy = (time * 0.11) % GRAIN_TILE
  for (let x = -GRAIN_TILE; x < w + GRAIN_TILE; x += GRAIN_TILE) {
    for (let y = -GRAIN_TILE; y < h + GRAIN_TILE; y += GRAIN_TILE) {
      ctx.drawImage(tile, x + ox, y + oy)
    }
  }
  ctx.restore()
}

function getScreenShake(gameState, now) {
  if (!gameState?.screenShakeUntil || now > gameState.screenShakeUntil) {
    return { x: 0, y: 0 }
  }
  const t = 1 - (gameState.screenShakeUntil - now) / 180
  const power = (gameState.screenShakePower ?? 0.01) * wobbleDecay(t)
  return {
    x: (Math.random() - 0.5) * power * 800,
    y: (Math.random() - 0.5) * power * 600,
  }
}

function wobbleDecay(t) {
  return (1 - t) * (1 - t)
}

export function renderShooterFrame(ctx, w, h, state, time) {
  const { gameState, crosshair, pinching, handVisible } = state
  const now = performance.now()
  const shake = getScreenShake(gameState, now)

  ctx.save()
  ctx.translate(shake.x, shake.y)

  drawScene(ctx, w, h, time)

  if (gameState?.targets) {
    const sorted = [...gameState.targets].sort((a, b) => a.y - b.y)
    for (const t of sorted) {
      if (t.state === 'fly') drawTarget(ctx, w, h, t, time)
    }
    for (const t of sorted) {
      if (t.state === 'hit') drawTarget(ctx, w, h, t, time)
    }
  }

  drawParticles(ctx, w, h, gameState?.particles, now)

  if (gameState?.hitMarkers) {
    for (const m of gameState.hitMarkers) drawHitMarker(ctx, w, h, m, now)
  }

  drawShotFx(ctx, w, h, gameState?.shotFx, now)
  drawMuzzleFlash(ctx, w, h, gameState?.muzzleFlashUntil, now)

  ctx.restore()

  drawColorGrade(ctx, w, h)
  drawVignette(ctx, w, h)
  drawFilmGrain(ctx, w, h, time)
  drawLetterbox(ctx, w, h)

  if (handVisible) {
    drawCrosshair(ctx, w, h, crosshair, pinching, time)
  }
}

export { TARGET_HIT_RADIUS_SCALE }
