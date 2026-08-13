import { INTRO_BG_COLOR } from './introConfig'

/**
 * CSS overlay on all scene backgrounds (intro + gameplay).
 * Edit SCENE_OVERLAY_CSS below — applied in SceneBackground.jsx
 */
export const SCENE_OVERLAY_CSS = `
  linear-gradient(
    to bottom,
    rgb(0 0 0 / 42%) 0%,
    rgb(0 0 0 / 14%) 10%,
    rgb(0 0 0 / 0%) 24%,
    rgb(0 0 0 / 0%) 68%,
    rgb(0 0 0 / 32%) 88%,
    rgb(0 0 0 / 57%) 100%
  ),
  radial-gradient(
    130% 115% at 50% 48%,
    rgb(0 0 0 / 0%) 0%,
    rgb(0 0 0 / 16%) 50%,
    rgb(0 0 0 / 40%) 100%
  )
`

export function drawSceneOverlay(ctx, width, height) {
  const cx = width * 0.5
  const cy = height * 0.48
  const radius = Math.hypot(width * 0.65, height * 0.58)

  const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  radial.addColorStop(0, 'rgba(0, 0, 0, 0)')
  radial.addColorStop(0.5, 'rgba(0, 0, 0, 0.16)')
  radial.addColorStop(1, 'rgba(0, 0, 0, 0.4)')

  ctx.fillStyle = radial
  ctx.fillRect(0, 0, width, height)

  const linear = ctx.createLinearGradient(0, 0, 0, height)
  linear.addColorStop(0, 'rgba(0, 0, 0, 0.42)')
  linear.addColorStop(0.1, 'rgba(0, 0, 0, 0.14)')
  linear.addColorStop(0.24, 'rgba(0, 0, 0, 0)')
  linear.addColorStop(0.68, 'rgba(0, 0, 0, 0)')
  linear.addColorStop(0.88, 'rgba(0, 0, 0, 0.32)')
  linear.addColorStop(1, 'rgba(0, 0, 0, 0.57)')

  ctx.fillStyle = linear
  ctx.fillRect(0, 0, width, height)
}
