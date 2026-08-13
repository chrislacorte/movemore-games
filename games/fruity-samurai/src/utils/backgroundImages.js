import { BACKGROUNDS } from '../constants/backgroundConfig'

const cache = new Map()

export function loadBackgroundImage(src) {
  if (cache.has(src)) return cache.get(src)

  const promise = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

  cache.set(src, promise)
  return promise
}

export async function preloadAllBackgroundImages() {
  const entries = Object.values(BACKGROUNDS).filter((bg) => bg.image)
  const loaded = await Promise.all(
    entries.map(async (bg) => [bg.id, await loadBackgroundImage(bg.image)])
  )
  return Object.fromEntries(loaded)
}

export function drawCoverImage(ctx, img, width, height) {
  const imgRatio = img.width / img.height
  const canvasRatio = width / height
  let drawW
  let drawH
  let offsetX
  let offsetY

  if (canvasRatio > imgRatio) {
    drawW = width
    drawH = width / imgRatio
    offsetX = 0
    offsetY = (height - drawH) / 2
  } else {
    drawH = height
    drawW = height * imgRatio
    offsetX = (width - drawW) / 2
    offsetY = 0
  }

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH)
}

export function drawImageBackground(ctx, img, width, height, overlayAlpha = 0.18) {
  drawCoverImage(ctx, img, width, height)
  ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`
  ctx.fillRect(0, 0, width, height)
}
