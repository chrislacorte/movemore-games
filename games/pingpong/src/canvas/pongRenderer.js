import {
  FAR_SCALE,
  NEAR_SCALE,
  BALL_RADIUS,
  PADDLE_W,
  PADDLE_H,
  TABLE_X_MIN,
  TABLE_X_MAX,
  TABLE_Y_MIN,
  TABLE_Y_MAX,
} from '../constants/gameConfig'

const TRAIL_LEN = 6
const RENDER_CACHE_VERSION = 4

const staticCache = {
  canvas: null,
  w: 0,
  h: 0,
  dpr: 0,
  webcamBackdrop: false,
  table3d: false,
  version: 0,
}

export function bustRenderCache() {
  staticCache.canvas = null
  staticCache.w = 0
  staticCache.h = 0
  staticCache.dpr = 0
  staticCache.version = 0
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

export function project(x, y, z, w, h) {
  const scale = lerp(FAR_SCALE, NEAR_SCALE, z)
  const depthPull = 0.32 + z * 0.58
  const screenX = w * (0.5 + (x - 0.5) * scale * depthPull)
  const screenY = h * (0.36 + (y - 0.5) * scale * (0.22 + z * 0.38) + z * 0.42)
  return { screenX, screenY, scale }
}

function tableGeometry(w, h) {
  const vpX = w * 0.5
  const vpY = h * 0.32
  const nearL = w * TABLE_X_MIN
  const nearR = w * TABLE_X_MAX
  const nearT = h * 0.5
  const nearB = h * 0.9
  const midT = lerp(vpY, nearT, 0.55)
  const midL = lerp(vpX, nearL, 0.55)
  const midR = lerp(vpX, nearR, 0.55)
  return { vpX, vpY, nearL, nearR, nearT, nearB, midT, midL, midR }
}

function drawArena(ctx, w, h, webcamBackdrop = false) {
  if (webcamBackdrop) {
    ctx.clearRect(0, 0, w, h)
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55)
    sky.addColorStop(0, '#1a1040')
    sky.addColorStop(0.4, '#0f1a35')
    sky.addColorStop(1, '#060a14')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)

    const floor = ctx.createLinearGradient(0, h * 0.55, 0, h)
    floor.addColorStop(0, '#0a0e18')
    floor.addColorStop(1, '#030508')
    ctx.fillStyle = floor
    ctx.fillRect(0, h * 0.55, w, h * 0.45)
  }

  if (!webcamBackdrop) {
    const lights = [
      [0.25, 0.12],
      [0.5, 0.08],
      [0.75, 0.12],
    ]
    for (const [lx, ly] of lights) {
      const g = ctx.createRadialGradient(
        w * lx,
        h * ly,
        0,
        w * lx,
        h * ly,
        w * 0.35,
      )
      g.addColorStop(0, 'rgba(120, 200, 255, 0.18)')
      g.addColorStop(0.5, 'rgba(60, 120, 200, 0.06)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h * 0.6)
    }

    const { vpX, vpY, nearB } = tableGeometry(w, h)
    ctx.fillStyle = '#141820'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.28)
    ctx.lineTo(vpX, vpY)
    ctx.lineTo(w, h * 0.28)
    ctx.lineTo(w, nearB + 20)
    ctx.lineTo(0, nearB + 20)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = 'rgba(80, 100, 140, 0.15)'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      const t = i / 5
      ctx.beginPath()
      ctx.moveTo(lerp(0, vpX, t * 0.3), lerp(h * 0.28, vpY, t))
      ctx.lineTo(lerp(w, vpX, t * 0.3), lerp(h * 0.28, vpY, t))
      ctx.stroke()
    }
  }

}

function drawPipBackdrop(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#121a2a')
  g.addColorStop(0.45, '#080d16')
  g.addColorStop(1, '#020408')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const spot = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, w * 0.55)
  spot.addColorStop(0, 'rgba(80, 140, 200, 0.08)')
  spot.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = spot
  ctx.fillRect(0, 0, w, h)
}

function drawStaticScene(ctx, w, h, webcamBackdrop = false, table3d = false) {
  if (table3d) {
    if (!webcamBackdrop) drawPipBackdrop(ctx, w, h)
  } else {
    drawArena(ctx, w, h, webcamBackdrop)
    drawTable(ctx, w, h, webcamBackdrop)
  }
  drawVignette(ctx, w, h, webcamBackdrop)
}

function ensureStaticCache(w, h, dpr, webcamBackdrop = false, table3d = false) {
  if (
    staticCache.canvas &&
    staticCache.w === w &&
    staticCache.h === h &&
    staticCache.dpr === dpr &&
    staticCache.webcamBackdrop === webcamBackdrop &&
    staticCache.table3d === table3d &&
    staticCache.version === RENDER_CACHE_VERSION
  ) {
    return staticCache.canvas
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  drawStaticScene(ctx, w, h, webcamBackdrop, table3d)

  staticCache.canvas = canvas
  staticCache.w = w
  staticCache.h = h
  staticCache.dpr = dpr
  staticCache.webcamBackdrop = webcamBackdrop
  staticCache.table3d = table3d
  staticCache.version = RENDER_CACHE_VERSION
  return canvas
}

function traceTableSurface(ctx, geom) {
  const { vpX, vpY, nearL, nearR, nearT, nearB } = geom
  ctx.beginPath()
  ctx.moveTo(vpX, vpY)
  ctx.lineTo(nearL, nearT)
  ctx.lineTo(nearR, nearT)
  ctx.lineTo(nearR, nearB)
  ctx.lineTo(nearL, nearB)
  ctx.closePath()
}

function traceTableApron(ctx, geom, inset = -7) {
  const { vpX, vpY, nearL, nearR, nearT, nearB } = geom
  const e = Math.abs(inset)
  ctx.beginPath()
  ctx.moveTo(vpX, vpY - e * 0.35)
  ctx.lineTo(nearL - e, nearT - e * 0.25)
  ctx.lineTo(nearR + e, nearT - e * 0.25)
  ctx.lineTo(nearR + e, nearB + e * 0.45)
  ctx.lineTo(nearL - e, nearB + e * 0.45)
  ctx.closePath()
}

function drawTableDropShadow(ctx, geom, w) {
  const { nearL, nearR, nearB } = geom
  const cx = (nearL + nearR) / 2
  const shadowW = (nearR - nearL) * 0.92
  const shadowH = w * 0.045
  const g = ctx.createRadialGradient(cx, nearB + 10, 0, cx, nearB + 10, shadowW * 0.55)
  g.addColorStop(0, 'rgba(0,0,0,0.42)')
  g.addColorStop(0.55, 'rgba(0,0,0,0.18)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(cx, nearB + 8, shadowW * 0.5, shadowH, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawTableApron(ctx, geom) {
  traceTableApron(ctx, geom, -9)
  const apron = ctx.createLinearGradient(0, geom.nearT, 0, geom.nearB)
  apron.addColorStop(0, '#4a3520')
  apron.addColorStop(0.35, '#3d2b18')
  apron.addColorStop(1, '#2a1c10')
  ctx.fillStyle = apron
  ctx.fill()

  traceTableApron(ctx, geom, -4)
  const rim = ctx.createLinearGradient(0, geom.nearT, 0, geom.nearB)
  rim.addColorStop(0, '#6b4f2e')
  rim.addColorStop(0.5, '#5a4024')
  rim.addColorStop(1, '#3f2c18')
  ctx.fillStyle = rim
  ctx.fill()
}

function drawTableSurface(ctx, geom) {
  const { vpX, vpY, nearL, nearR, nearT, nearB } = geom
  traceTableSurface(ctx, geom)
  const surface = ctx.createLinearGradient(nearL, nearT, nearR, nearB)
  surface.addColorStop(0, '#0f4a3f')
  surface.addColorStop(0.22, '#157a62')
  surface.addColorStop(0.5, '#1a8f6e')
  surface.addColorStop(0.78, '#15725c')
  surface.addColorStop(1, '#0d3d32')
  ctx.fillStyle = surface
  ctx.fill()

  ctx.save()
  traceTableSurface(ctx, geom)
  ctx.clip()

  const rows = 28
  for (let i = 0; i < rows; i++) {
    const t = i / rows
    const y = lerp(nearT, nearB, t)
    const xL = lerp(vpX, nearL, 0.08 + t * 0.92)
    const xR = lerp(vpX, nearR, 0.08 + t * 0.92)
    ctx.strokeStyle = `rgba(0,0,0,${0.018 + (i % 3) * 0.006})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(xL, y)
    ctx.lineTo(xR, y)
    ctx.stroke()
  }

  for (let i = 0; i < 900; i++) {
    const px = nearL + ((i * 48271) % 1000) / 1000 * (nearR - nearL)
    const py = nearT + ((i * 69621) % 1000) / 1000 * (nearB - nearT)
    ctx.fillStyle = `rgba(255,255,255,${0.012 + (i % 7) * 0.004})`
    ctx.fillRect(px, py, 1, 1)
  }

  const gloss = ctx.createLinearGradient(vpX - 40, vpY, vpX + 80, nearB)
  gloss.addColorStop(0, 'rgba(255,255,255,0.14)')
  gloss.addColorStop(0.18, 'rgba(255,255,255,0.05)')
  gloss.addColorStop(0.45, 'rgba(255,255,255,0)')
  gloss.addColorStop(0.72, 'rgba(0,0,0,0.04)')
  gloss.addColorStop(1, 'rgba(0,0,0,0.14)')
  ctx.fillStyle = gloss
  ctx.fillRect(nearL, nearT, nearR - nearL, nearB - nearT)

  const spot = ctx.createRadialGradient(vpX, lerp(vpY, nearT, 0.35), 0, vpX, lerp(vpY, nearT, 0.35), (nearR - nearL) * 0.42)
  spot.addColorStop(0, 'rgba(255,255,255,0.1)')
  spot.addColorStop(0.45, 'rgba(255,255,255,0.02)')
  spot.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = spot
  ctx.fillRect(nearL, nearT, nearR - nearL, nearB - nearT)

  ctx.restore()
}

function drawTableLines(ctx, geom) {
  const { vpX, vpY, nearL, nearR, nearT, nearB, midT, midL, midR } = geom

  ctx.save()
  traceTableSurface(ctx, geom)
  ctx.clip()

  ctx.strokeStyle = 'rgba(255,255,255,0.92)'
  ctx.lineWidth = 3.2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(nearL, nearT)
  ctx.lineTo(nearR, nearT)
  ctx.lineTo(nearR, nearB)
  ctx.lineTo(nearL, nearB)
  ctx.closePath()
  ctx.stroke()

  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(255,255,255,0.62)'
  ctx.beginPath()
  ctx.moveTo(midL, midT)
  ctx.lineTo(midR, midT)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  const gridLines = 6
  for (let i = 1; i < gridLines; i++) {
    const t = i / gridLines
    const yNear = lerp(nearT, nearB, t)
    const xL = lerp(vpX, nearL, 0.12 + t * 0.88)
    const xR = lerp(vpX, nearR, 0.12 + t * 0.88)
    ctx.beginPath()
    ctx.moveTo(xL, yNear)
    ctx.lineTo(xR, yNear)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.42)'
  ctx.lineWidth = 2.2
  ctx.beginPath()
  ctx.moveTo(vpX, vpY)
  ctx.lineTo(vpX, nearB)
  ctx.stroke()

  ctx.restore()
}

function drawTable(ctx, w, h, webcamBackdrop = false) {
  const geom = tableGeometry(w, h)

  ctx.save()
  drawTableDropShadow(ctx, geom, w)
  drawTableApron(ctx, geom)
  drawTableSurface(ctx, geom)
  drawTableLines(ctx, geom)
  drawNet(ctx, geom)
  ctx.restore()

  if (!webcamBackdrop) {
    const { nearB } = geom
    const floorGrad = ctx.createLinearGradient(0, nearB, 0, h)
    floorGrad.addColorStop(0, 'rgba(0,0,0,0.22)')
    floorGrad.addColorStop(1, 'rgba(0,0,0,0.72)')
    ctx.fillStyle = floorGrad
    ctx.fillRect(0, nearB, w, h - nearB)
  }
}

function drawNet(ctx, geom) {
  const { vpX, vpY, midL, midR, midT, nearB } = geom
  const netH = lerp(midT, nearB, 0.38) - midT
  const netBottom = midT + netH

  const postW = 3.5
  for (const x of [midL, midR]) {
    const post = ctx.createLinearGradient(x - postW, midT, x + postW, netBottom)
    post.addColorStop(0, '#e8e8e8')
    post.addColorStop(0.5, '#c8c8c8')
    post.addColorStop(1, '#9a9a9a')
    ctx.fillStyle = post
    ctx.fillRect(x - postW, midT - 2, postW * 2, netH + 4)
  }

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.beginPath()
  ctx.moveTo(midL, midT)
  ctx.lineTo(midR, midT)
  ctx.lineTo(midR + (vpX - midR) * 0.06, netBottom)
  ctx.lineTo(midL + (vpX - midL) * 0.06, netBottom)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.72)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(midL, midT)
  ctx.lineTo(midR, midT)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 1
  const segments = 18
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const x = lerp(midL, midR, t)
    const sag = Math.sin(t * Math.PI) * 2
    ctx.beginPath()
    ctx.moveTo(x, midT)
    ctx.lineTo(x + (vpX - x) * 0.07, netBottom + sag)
    ctx.stroke()
  }
  for (let row = 1; row <= 5; row++) {
    const ry = midT + (netH * row) / 6
    const sag = Math.sin(row / 6) * 1.5
    ctx.beginPath()
    ctx.moveTo(lerp(midL, vpX, row / 7), ry + sag)
    ctx.lineTo(lerp(midR, vpX, row / 7), ry + sag)
    ctx.stroke()
  }
}

function drawPaddleShadow(ctx, x, y, z, w, h) {
  const { screenX, screenY, scale } = project(x, y, z, w, h)
  const pw = w * PADDLE_W * scale * 0.95
  const ph = h * PADDLE_H * scale * 0.95

  const g = ctx.createRadialGradient(
    screenX,
    screenY + ph * 0.32,
    0,
    screenX,
    screenY + ph * 0.32,
    pw * 0.62,
  )
  g.addColorStop(0, 'rgba(0,0,0,0.38)')
  g.addColorStop(0.55, 'rgba(0,0,0,0.16)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(screenX, screenY + ph * 0.32, pw * 0.58, ph * 0.18, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawAiLabel(ctx, x, y, z, w, h) {
  const { screenX, screenY, scale } = project(x, y, z, w, h)
  const ph = h * PADDLE_H * scale * 0.95
  ctx.font = `600 ${Math.max(9, 10 * scale)}px Rajdhani, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.fillText('KI', screenX, screenY - ph / 2 - 8)
}

function drawBallTrail(ctx, trail, w, h) {
  for (let i = 0; i < trail.length; i++) {
    const b = trail[i]
    if (!b) continue
    const alpha = (i + 1) / (trail.length + 2) * 0.35
    const { screenX, screenY, scale } = project(b.x, b.y, b.z, w, h)
    const r = w * BALL_RADIUS * scale * 1.6 * alpha
    ctx.fillStyle = `rgba(255, 250, 240, ${alpha * 0.5})`
    ctx.beginPath()
    ctx.arc(screenX, screenY, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawBall(ctx, ball, w, h, time) {
  const { screenX, screenY, scale } = project(ball.x, ball.y, ball.z, w, h)
  const r = w * BALL_RADIUS * scale * 2.4
  const speed = Math.sqrt(
    (ball.vx ?? 0) ** 2 + (ball.vy ?? 0) ** 2 + (ball.vz ?? 0) ** 2,
  )

  const shadow = project(ball.x, TABLE_Y_MAX, ball.z, w, h)
  const shadowGrad = ctx.createRadialGradient(
    shadow.screenX,
    shadow.screenY + 6,
    0,
    shadow.screenX,
    shadow.screenY + 6,
    r * 1.4,
  )
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.5)')
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = shadowGrad
  ctx.beginPath()
  ctx.ellipse(shadow.screenX, shadow.screenY + 8, r * 1.2, r * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()

  if (speed > 0.35) {
    const { screenX: px, screenY: py } = project(
      ball.x - (ball.vx ?? 0) * 0.04,
      ball.y - (ball.vy ?? 0) * 0.04,
      ball.z - (ball.vz ?? 0) * 0.04,
      w,
      h,
    )
    const streak = ctx.createLinearGradient(px, py, screenX, screenY)
    streak.addColorStop(0, 'rgba(255,255,255,0)')
    streak.addColorStop(1, 'rgba(255,255,255,0.35)')
    ctx.strokeStyle = streak
    ctx.lineWidth = r * 0.9
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(screenX, screenY)
    ctx.stroke()
  }

  const ballGrad = ctx.createRadialGradient(
    screenX - r * 0.35,
    screenY - r * 0.35,
    r * 0.05,
    screenX,
    screenY,
    r,
  )
  ballGrad.addColorStop(0, '#ffffff')
  ballGrad.addColorStop(0.35, '#fff8e7')
  ballGrad.addColorStop(0.7, '#f0e6d0')
  ballGrad.addColorStop(1, '#c9b896')

  ctx.shadowColor = 'rgba(255, 255, 255, 0.6)'
  ctx.shadowBlur = 12 * scale
  ctx.fillStyle = ballGrad
  ctx.beginPath()
  ctx.arc(screenX, screenY, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(255,255,255,0.95)'
  ctx.beginPath()
  ctx.arc(screenX - r * 0.28, screenY - r * 0.32, r * 0.18, 0, Math.PI * 2)
  ctx.fill()

  const spin = time * 0.02 + ball.z * 10
  ctx.strokeStyle = 'rgba(200,180,150,0.25)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(screenX, screenY, r * 0.65, spin, spin + 1.2)
  ctx.stroke()
}

function drawVignette(ctx, w, h, webcamBackdrop = false) {
  const v = ctx.createRadialGradient(
    w / 2,
    h * 0.48,
    w * 0.12,
    w / 2,
    h * 0.48,
    w * 0.88,
  )
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(0.65, webcamBackdrop ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.18)')
  v.addColorStop(1, webcamBackdrop ? 'rgba(0,0,0,0.42)' : 'rgba(0,0,0,0.58)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)

  if (webcamBackdrop) {
    const top = ctx.createLinearGradient(0, 0, 0, h * 0.22)
    top.addColorStop(0, 'rgba(0,0,0,0.28)')
    top.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = top
    ctx.fillRect(0, 0, w, h * 0.22)
  }
}

function drawHitFlash(ctx, w, h, flash, time) {
  if (!flash) return
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.04)
  const g = ctx.createRadialGradient(w / 2, h * 0.55, 0, w / 2, h * 0.55, w * 0.5)
  g.addColorStop(0, `rgba(34, 211, 238, ${0.25 * pulse})`)
  g.addColorStop(0.5, `rgba(255, 200, 100, ${0.08 * pulse})`)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

function drawTableShine(ctx, w, h, time) {
  const geom = tableGeometry(w, h)
  const { vpX, nearL, nearR, nearT, nearB } = geom
  const sweep = (Math.sin(time * 0.0012) + 1) / 2
  const bandY = lerp(nearT, nearB, 0.12 + sweep * 0.55)
  const bandH = (nearB - nearT) * 0.06

  ctx.save()
  traceTableSurface(ctx, geom)
  ctx.clip()
  const shine = ctx.createLinearGradient(nearL, bandY - bandH, nearR, bandY + bandH)
  shine.addColorStop(0, 'rgba(255,255,255,0)')
  shine.addColorStop(0.45, 'rgba(255,255,255,0.07)')
  shine.addColorStop(0.5, 'rgba(255,255,255,0.14)')
  shine.addColorStop(0.55, 'rgba(255,255,255,0.07)')
  shine.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = shine
  ctx.fillRect(nearL, bandY - bandH, nearR - nearL, bandH * 2)

  const glint = ctx.createRadialGradient(vpX, bandY, 0, vpX, bandY, (nearR - nearL) * 0.18)
  glint.addColorStop(0, 'rgba(255,255,255,0.12)')
  glint.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glint
  ctx.fillRect(nearL, nearT, nearR - nearL, nearB - nearT)
  ctx.restore()
}

function drawServeText(ctx, w, h, time) {
  const pulse = 0.82 + 0.18 * Math.sin(time * 0.005)
  const y = h * 0.44
  const label = 'Aufschlag…'

  ctx.save()
  ctx.textAlign = 'center'
  ctx.font = '700 22px Orbitron, Rajdhani, sans-serif'
  const tw = ctx.measureText(label).width

  const px = w / 2 - tw / 2 - 18
  const py = y - 24
  const pw = tw + 36
  const ph = 34
  const r = 10
  const pill = ctx.createLinearGradient(px, py, px, py + ph)
  pill.addColorStop(0, 'rgba(8, 18, 28, 0.72)')
  pill.addColorStop(1, 'rgba(12, 32, 40, 0.82)')
  ctx.fillStyle = pill
  ctx.beginPath()
  ctx.moveTo(px + r, py)
  ctx.lineTo(px + pw - r, py)
  ctx.quadraticCurveTo(px + pw, py, px + pw, py + r)
  ctx.lineTo(px + pw, py + ph - r)
  ctx.quadraticCurveTo(px + pw, py + ph, px + pw - r, py + ph)
  ctx.lineTo(px + r, py + ph)
  ctx.quadraticCurveTo(px, py + ph, px, py + ph - r)
  ctx.lineTo(px, py + r)
  ctx.quadraticCurveTo(px, py, px + r, py)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = `rgba(34, 211, 238, ${0.35 + pulse * 0.25})`
  ctx.lineWidth = 1.2
  ctx.stroke()

  ctx.shadowColor = 'rgba(34, 211, 238, 0.55)'
  ctx.shadowBlur = 18
  ctx.fillStyle = `rgba(240, 253, 255, ${pulse})`
  ctx.fillText(label, w / 2, y)
  ctx.restore()
}

export function renderPongFrame(
  ctx,
  w,
  h,
  state,
  time,
  dpr = 1,
  webcamBackdrop = false,
  table3d = false,
) {
  const {
    ball,
    aiPaddle,
    playerPaddle,
    hitFlash,
    serving,
    trail,
  } = state

  const cached = ensureStaticCache(w, h, dpr, webcamBackdrop, table3d)
  if (webcamBackdrop || table3d) {
    ctx.clearRect(0, 0, w, h)
  }
  ctx.drawImage(cached, 0, 0, w, h)

  if (aiPaddle) {
    drawPaddleShadow(ctx, aiPaddle.x, aiPaddle.y, 0.08, w, h)
    drawAiLabel(ctx, aiPaddle.x, aiPaddle.y, 0.08, w, h)
  }

  if (ball && !serving) {
    drawBallTrail(ctx, trail, w, h)
    drawBall(ctx, ball, w, h, time)
  }

  if (playerPaddle) {
    drawPaddleShadow(ctx, playerPaddle.x, playerPaddle.y, 0.94, w, h)
  }

  if (!table3d) drawTableShine(ctx, w, h, time)
  drawHitFlash(ctx, w, h, hitFlash, time)

  if (serving) {
    drawServeText(ctx, w, h, time)
  }
}

export function pushTrail(trail, ball) {
  if (!ball) return trail
  const next = [...trail, { x: ball.x, y: ball.y, z: ball.z }]
  if (next.length > TRAIL_LEN) next.shift()
  return next
}
