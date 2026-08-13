import { useCallback, useRef } from 'react'
import { STRINGS } from '../constants/strings'

export default function WebcamFeed({
  videoRef,
  isReady,
  error,
  statusText,
  asBackground = false,
  className = '',
}) {
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

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <video
        ref={setVideoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full scale-x-[-1] object-cover ${asBackground ? 'webcam-bg-video' : ''}`}
      />
      {!isReady && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70 p-4 text-center font-ui text-sm font-semibold text-white/90">
          <span>{statusText || STRINGS.loadingCamera}</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 p-6 text-center font-ui text-sm font-semibold text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}
