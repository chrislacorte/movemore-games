import { useEffect, useRef } from 'react'
import { drawPoseOverlay } from '../utils/poseOverlay'
import { OVERLAY_INTERVAL_MS } from '../constants/gameConfig'

export default function WebcamThumb({ videoRef, landmarksRef, actionLabelRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    let raf = 0
    let lastDraw = 0
    let cachedW = 0
    let cachedH = 0

    const draw = (now) => {
      const video = videoRef?.current
      const canvas = canvasRef.current
      if (video && canvas && video.videoWidth > 0) {
        const w = canvas.clientWidth
        const h = canvas.clientHeight
        if (w > 0 && h > 0 && now - lastDraw >= OVERLAY_INTERVAL_MS) {
          if (w !== cachedW || h !== cachedH) {
            canvas.width = w
            canvas.height = h
            cachedW = w
            cachedH = h
          }
          const ctx = canvas.getContext('2d')
          ctx.save()
          ctx.scale(-1, 1)
          ctx.drawImage(video, -w, 0, w, h)
          ctx.restore()
          drawPoseOverlay(
            canvas,
            landmarksRef?.current,
            actionLabelRef?.current,
            false,
          )
          lastDraw = now
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [videoRef, landmarksRef, actionLabelRef])

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-40 h-28 w-40 overflow-hidden rounded-xl border border-white/20 bg-zinc-950 shadow-2xl shadow-black/60 sm:bottom-5 sm:right-5 sm:h-32 sm:w-44">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute bottom-1 left-1.5 rounded bg-black/50 px-1.5 py-0.5 font-ui text-[9px] uppercase tracking-wider text-white/60">
        Kamera
      </div>
    </div>
  )
}
