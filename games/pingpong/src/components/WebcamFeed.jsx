import { useCallback, useEffect, useRef } from 'react'
import { drawPoseOverlay } from '../utils/poseOverlay'
import { OVERLAY_INTERVAL_MS } from '../constants/gameConfig'

export default function WebcamFeed({
  videoRef,
  landmarksRef,
  actionLabelRef,
  isReady,
  error,
  className = '',
  statusText,
  background = false,
  compact = false,
}) {
  const overlayRef = useRef(null)
  const internalVideoRef = useRef(null)

  const setVideoRef = useCallback(
    (node) => {
      internalVideoRef.current = node
      if (typeof videoRef === 'function') {
        videoRef(node)
      } else if (videoRef) {
        videoRef.current = node
      }
    },
    [videoRef],
  )

  useEffect(() => {
    const video = internalVideoRef.current
    const canvas = overlayRef.current
    if (!video || !canvas) return

    let overlayRaf = 0
    let lastOverlay = 0
    let cachedW = 0
    let cachedH = 0

    const drawOverlay = (now) => {
      const w = video.clientWidth
      const h = video.clientHeight
      if (w > 0 && h > 0) {
        if (w !== cachedW || h !== cachedH) {
          canvas.width = w
          canvas.height = h
          cachedW = w
          cachedH = h
        }
        if (now - lastOverlay >= OVERLAY_INTERVAL_MS) {
          drawPoseOverlay(
            canvas,
            landmarksRef?.current,
            actionLabelRef?.current,
          )
          lastOverlay = now
        }
      }
      overlayRaf = requestAnimationFrame(drawOverlay)
    }

    overlayRaf = requestAnimationFrame(drawOverlay)
    return () => cancelAnimationFrame(overlayRaf)
  }, [landmarksRef, actionLabelRef])

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden ${
        background ? 'bg-black' : 'bg-zinc-950'
      } ${className}`}
    >
      <video
        ref={setVideoRef}
        autoPlay
        className="h-full w-full scale-x-[-1] object-cover"
        playsInline
        muted
      />
      <canvas
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]"
      />

      {background && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/60" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)]" />
        </>
      )}

      {!isReady && !error && (
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center font-ui text-sm text-white/90 ${
            background ? 'bg-black/60' : 'bg-black/70'
          }`}
        >
          <span>{statusText ?? 'Kamera wird geladen…'}</span>
        </div>
      )}
      {error && !background && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center font-ui text-sm text-red-300">
          {error}
        </div>
      )}
      {!background && (
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
      )}
    </div>
  )
}
