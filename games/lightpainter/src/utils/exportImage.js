import { renderStrokes } from './strokeRenderer'
import { STRINGS } from '../constants/strings'

/**
 * Composes the artwork on a dark night background and triggers a PNG
 * download.
 */
export function exportImage(strokes, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height) * 0.75,
  )
  gradient.addColorStop(0, '#0a0a24')
  gradient.addColorStop(1, '#03030c')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  renderStrokes(ctx, strokes, canvas.width, canvas.height, { fadeOn: false })

  const link = document.createElement('a')
  link.download = STRINGS.saveFileName
  link.href = canvas.toDataURL('image/png')
  link.click()
}
