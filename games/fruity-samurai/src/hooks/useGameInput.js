import { useCallback, useRef } from 'react'
import { useHandTracking } from './useHandTracking'
import { usePointerInput } from './usePointerInput'

export { POINTER_LABEL } from './usePointerInput'

/**
 * Camera + mouse/touch. Uses pointer while mouse button is held, otherwise camera hands.
 */
export function useGameInput(videoRef, containerRef, { pointerEnabled = true, maxNumHands = 2 } = {}) {
  const camera = useHandTracking(videoRef, { maxNumHands })
  const pointer = usePointerInput(containerRef, { enabled: pointerEnabled })
  const handsDataRef = useRef([])
  const inputModeRef = useRef('none')

  const refreshHands = useCallback(
    (now = performance.now()) => {
      camera.refreshHands(now)
      pointer.refreshHands(now)

      const pointerActive = pointer.isPointerActive.current
      const cameraHands = camera.handsDataRef.current

      if (pointerActive && pointer.handsDataRef.current.length > 0) {
        handsDataRef.current = pointer.handsDataRef.current
        inputModeRef.current = 'pointer'
      } else if (cameraHands.length > 0) {
        handsDataRef.current = cameraHands
        inputModeRef.current = 'camera'
      } else {
        handsDataRef.current = []
        inputModeRef.current = 'none'
      }
    },
    [camera, pointer]
  )

  return {
    isReady: camera.isReady || camera.cameraDenied || true,
    error: camera.cameraDenied ? null : camera.error,
    cameraDenied: camera.cameraDenied,
    inputModeRef,
    handsDataRef,
    refreshHands,
    cameraReady: camera.isReady,
  }
}
