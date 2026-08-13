import { assetPath } from './assetPath'

const MEDIAPIPE_HANDS_SCRIPT = assetPath('mediapipe/hands/hands.js')

let handsCtorPromise = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-mediapipe-hands="true"]`)
    if (existing) {
      if (window.Hands) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('MediaPipe Hands script failed to load')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.mediapipeHands = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

/**
 * MediaPipe Hands must load from /public, not via Vite bundle — the npm import
 * breaks in production minification (Hands is not a constructor).
 */
export function loadMediaPipeHands() {
  if (!handsCtorPromise) {
    handsCtorPromise = loadScript(MEDIAPIPE_HANDS_SCRIPT).then(() => {
      if (typeof window.Hands !== 'function') {
        throw new TypeError('MediaPipe Hands constructor not available on window')
      }
      return window.Hands
    })
  }
  return handsCtorPromise
}
