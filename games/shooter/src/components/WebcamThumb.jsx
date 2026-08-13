import { useEffect, useRef } from 'react'
import { drawHandOverlay } from '../utils/handOverlay'

export default function WebcamThumb({ videoRef, landmarks, actionLabel }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    let raf = 0
    const draw = () => {
      const video = videoRef?.current
      const canvas = canvasRef.current
      if (video && canvas && video.videoWidth > 0) {
        const w = canvas.clientWidth
        const h = canvas.clientHeight
        if (w > 0 && h > 0) {
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          ctx.save()
          ctx.scale(-1, 1)
          ctx.drawImage(video, -w, 0, w, h)
          ctx.restore()
          drawHandOverlay(canvas, landmarks, actionLabel, false)
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [videoRef, landmarks, actionLabel])

  return (
    <div className="absolute bottom-3 right-3 z-20 h-28 w-40 overflow-hidden rounded-lg border border-cyan-500/25 bg-zinc-950 shadow-lg shadow-cyan-500/10 sm:h-32 sm:w-44">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}
