import { useEffect, useRef } from 'react'
import { renderShooterFrame } from '../canvas/shooterRenderer'
import { STRINGS } from '../constants/strings'

export default function ShooterCanvas({
  gameStateRef,
  crosshairRef,
  statusRef,
  className = '',
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0

    const draw = (time) => {
      const parent = canvas.parentElement
      if (!parent) {
        raf = requestAnimationFrame(draw)
        return
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w < 1 || h < 1) {
        raf = requestAnimationFrame(draw)
        return
      }

      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      const ctx = canvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const status = statusRef?.current || {}
      renderShooterFrame(
        ctx,
        w,
        h,
        {
          gameState: gameStateRef?.current,
          crosshair: crosshairRef?.current,
          pinching: status.pinching ?? false,
          handVisible: status.handVisible ?? false,
        },
        time,
      )

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [gameStateRef, crosshairRef, statusRef])

  return (
    <canvas
      ref={canvasRef}
      className={`arena-canvas block h-full w-full ${className}`}
      aria-label={STRINGS.arenaLabel}
    />
  )
}
