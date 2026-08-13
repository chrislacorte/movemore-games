import { useCallback, useEffect, useRef } from 'react'
import { drawHandsOverlay } from '../utils/handOverlay'
import { STRINGS } from '../constants/strings'

export default function WebcamFeed({
  videoRef,
  isReady,
  error,
  landmarks,
  hands,
  actionLabel,
  className = '',
  statusText,
  filmFilter = true,
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

    const resize = () => {
      const w = video.clientWidth
      const h = video.clientHeight
      if (w < 1 || h < 1) return
      canvas.width = w
      canvas.height = h
      drawHandsOverlay(canvas, hands ?? landmarks, actionLabel)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(video)
    return () => ro.disconnect()
  }, [hands, landmarks, actionLabel])

  useEffect(() => {
    const canvas = overlayRef.current
    if (canvas) drawHandsOverlay(canvas, hands ?? landmarks, actionLabel)
  }, [hands, landmarks, actionLabel])

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden bg-black ${className}`}
    >
      <video
        ref={setVideoRef}
        autoPlay
        className={`h-full w-full scale-x-[-1] object-cover ${filmFilter ? 'webcam-film' : ''}`}
        playsInline
        muted
      />
      <canvas
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1]"
      />
      {!isReady && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70 p-4 text-center font-film text-sm text-white/90">
          <span>{statusText ?? STRINGS.loadingCamera}</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 p-6 text-center font-film text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}
