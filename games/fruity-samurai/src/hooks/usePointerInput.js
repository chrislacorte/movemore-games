import { useEffect, useRef, useCallback } from 'react'

export const POINTER_LABEL = 'Pointer'

/**
 * Mouse / touch fallback — same shape as hand tracking output (normalized 0–1).
 * @param {React.RefObject<HTMLElement>} containerRef
 */
export function usePointerInput(containerRef, { enabled = true } = {}) {
  const handsDataRef = useRef([])
  const activeRef = useRef(false)
  const lastRawRef = useRef(null)

  const refreshHands = useCallback((now = performance.now()) => {
    if (!activeRef.current || !lastRawRef.current) {
      handsDataRef.current = []
      return
    }

    handsDataRef.current = [
      {
        x: lastRawRef.current.x,
        y: lastRawRef.current.y,
        z: 0,
        label: POINTER_LABEL,
        timestamp: now,
      },
    ]
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    const container = containerRef.current
    if (!container) return undefined

    const inputLayer = container

    const toNormalized = (clientX, clientY) => {
      const rect = inputLayer.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return null
      return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
      }
    }

    const onPointerDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return
      if (e.target.closest('[data-game-ui]')) return
      activeRef.current = true
      const pos = toNormalized(e.clientX, e.clientY)
      if (pos) lastRawRef.current = pos
      inputLayer.setPointerCapture?.(e.pointerId)
    }

    const onPointerMove = (e) => {
      if (!activeRef.current) return
      const pos = toNormalized(e.clientX, e.clientY)
      if (pos) lastRawRef.current = pos
    }

    const endPointer = (e) => {
      activeRef.current = false
      lastRawRef.current = null
      handsDataRef.current = []
      if (e?.pointerId !== undefined) {
        try {
          inputLayer.releasePointerCapture?.(e.pointerId)
        } catch {
          /* already released */
        }
      }
    }

    container.addEventListener('pointerdown', onPointerDown)
    container.addEventListener('pointermove', onPointerMove)
    container.addEventListener('pointerup', endPointer)
    container.addEventListener('pointercancel', endPointer)
    container.addEventListener('pointerleave', endPointer)

    return () => {
      container.removeEventListener('pointerdown', onPointerDown)
      container.removeEventListener('pointermove', onPointerMove)
      container.removeEventListener('pointerup', endPointer)
      container.removeEventListener('pointercancel', endPointer)
      container.removeEventListener('pointerleave', endPointer)
    }
  }, [containerRef, enabled])

  return {
    handsDataRef,
    refreshHands,
    isPointerActive: activeRef,
  }
}
