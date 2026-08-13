import { useEffect, useRef, useState, useCallback } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import {
  CAMERA_WIDTH,
  CAMERA_HEIGHT,
  HAND_STALE_MS,
  HAND_FILTER_MIN_CUTOFF,
  HAND_FILTER_BETA,
  HAND_MIN_DETECTION_CONFIDENCE,
  HAND_MIN_PRESENCE_CONFIDENCE,
  HAND_MIN_TRACKING_CONFIDENCE,
} from '../constants/gameConfig'
import { PositionFilter } from '../utils/oneEuroFilter'
import { STRINGS } from '../constants/strings'

const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

/**
 * HandLandmarker options aligned with chickenshooter Hands.setOptions():
 * maxNumHands: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
 * (modelComplexity has no tasks-vision equivalent — full hand_landmarker.task is used).
 */
async function createHandLandmarker(vision) {
  const base = {
    baseOptions: {
      modelAssetPath: MODEL_URL,
    },
    runningMode: 'VIDEO',
    numHands: 1,
    minHandDetectionConfidence: HAND_MIN_DETECTION_CONFIDENCE,
    minHandPresenceConfidence: HAND_MIN_PRESENCE_CONFIDENCE,
    minTrackingConfidence: HAND_MIN_TRACKING_CONFIDENCE,
  }

  try {
    return await HandLandmarker.createFromOptions(vision, {
      ...base,
      baseOptions: { ...base.baseOptions, delegate: 'GPU' },
    })
  } catch (gpuErr) {
    console.warn('HandLandmarker GPU failed, using CPU:', gpuErr)
    return await HandLandmarker.createFromOptions(vision, {
      ...base,
      baseOptions: { ...base.baseOptions, delegate: 'CPU' },
    })
  }
}

function waitForVideoReady(videoEl) {
  return new Promise((resolve, reject) => {
    if (
      videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      videoEl.videoWidth > 0
    ) {
      resolve()
      return
    }
    const onReady = () => {
      cleanup()
      if (videoEl.videoWidth > 0) resolve()
      else reject(new Error(STRINGS.cameraNoSize))
    }
    const onError = () => {
      cleanup()
      reject(new Error(STRINGS.cameraVideoError))
    }
    const cleanup = () => {
      videoEl.removeEventListener('loadeddata', onReady)
      videoEl.removeEventListener('loadedmetadata', onReady)
      videoEl.removeEventListener('error', onError)
    }
    videoEl.addEventListener('loadeddata', onReady)
    videoEl.addEventListener('loadedmetadata', onReady)
    videoEl.addEventListener('error', onError)
    setTimeout(() => {
      cleanup()
      if (videoEl.videoWidth > 0) resolve()
      else reject(new Error(STRINGS.cameraTimeout))
    }, 8000)
  })
}

/**
 * Tracks a single hand. Stores smoothed landmarks in RAW image coordinates
 * (no horizontal mirror) so overlays drawn on a flipped video align correctly.
 * Gameplay mirroring (1 - x) happens in the input hook.
 */
export function useHandTracking(videoElement) {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)
  const [modelStatus, setModelStatus] = useState('')

  const landmarksRef = useRef(null)
  const landmarkerRef = useRef(null)
  const streamRef = useRef(null)
  const detectRafRef = useRef(0)
  const processingRef = useRef(false)
  const detectionRef = useRef(null)
  const filtersRef = useRef({})
  const lastVideoTimestampRef = useRef(-1)

  const refreshHand = useCallback((now = performance.now()) => {
    const detection = detectionRef.current
    if (!detection?.landmarks) {
      landmarksRef.current = null
      return
    }
    if (now - detection.timestamp > HAND_STALE_MS) {
      landmarksRef.current = null
      return
    }
    landmarksRef.current = detection.landmarks
  }, [])

  useEffect(() => {
    if (!videoElement) return

    let cancelled = false

    const stopAll = () => {
      if (detectRafRef.current) {
        cancelAnimationFrame(detectRafRef.current)
        detectRafRef.current = 0
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (videoElement) {
        videoElement.srcObject = null
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close()
        landmarkerRef.current = null
      }
      landmarksRef.current = null
      detectionRef.current = null
      filtersRef.current = {}
      processingRef.current = false
      lastVideoTimestampRef.current = -1
    }

    const getFilter = (key) => {
      if (!filtersRef.current[key]) {
        filtersRef.current[key] = new PositionFilter({
          minCutoff: HAND_FILTER_MIN_CUTOFF,
          beta: HAND_FILTER_BETA,
        })
      }
      return filtersRef.current[key]
    }

    const filterLandmarks = (landmarks, now) => {
      return landmarks.map((lm, i) => {
        const filtered = getFilter(`lm_${i}`).filter(lm.x, lm.y, now)
        return { x: filtered.x, y: filtered.y, z: lm.z ?? 0 }
      })
    }

    const nextVideoTimestamp = () => {
      let ts = performance.now()
      if (ts <= lastVideoTimestampRef.current) {
        ts = lastVideoTimestampRef.current + 1
      }
      lastVideoTimestampRef.current = ts
      return ts
    }

    const scheduleDetection = () => {
      if (cancelled) return

      const landmarker = landmarkerRef.current

      if (
        landmarker &&
        !processingRef.current &&
        videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        videoElement.videoWidth > 0
      ) {
        processingRef.current = true
        const detectTs = nextVideoTimestamp()
        try {
          const result = landmarker.detectForVideo(videoElement, detectTs)
          const raw = result.landmarks?.[0]
          if (raw?.length) {
            const filtered = filterLandmarks(raw, detectTs)
            detectionRef.current = {
              landmarks: filtered,
              timestamp: performance.now(),
            }
          } else {
            detectionRef.current = null
          }
        } catch (e) {
          console.error('HandLandmarker detect error:', e)
        } finally {
          processingRef.current = false
        }
      }

      detectRafRef.current = requestAnimationFrame(scheduleDetection)
    }

    const start = async () => {
      try {
        setError(null)
        setIsReady(false)
        setModelStatus(STRINGS.loadingHand)

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(STRINGS.cameraApiError)
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: CAMERA_WIDTH },
            height: { ideal: CAMERA_HEIGHT },
            facingMode: 'user',
            frameRate: { ideal: 30, max: 60 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        videoElement.srcObject = stream
        videoElement.muted = true
        videoElement.playsInline = true
        videoElement.setAttribute('playsinline', 'true')

        await videoElement.play()
        await waitForVideoReady(videoElement)

        if (cancelled) return

        setModelStatus(STRINGS.loadingModel)
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
        const landmarker = await createHandLandmarker(vision)

        if (cancelled) {
          landmarker.close()
          return
        }

        landmarkerRef.current = landmarker
        detectRafRef.current = requestAnimationFrame(scheduleDetection)
        setModelStatus('')
        setIsReady(true)
      } catch (err) {
        console.error('Hand tracking init failed:', err)
        if (!cancelled) {
          setError(
            err?.name === 'NotAllowedError'
              ? STRINGS.cameraDenied
              : err?.message || STRINGS.cameraError,
          )
          setModelStatus('')
        }
      }
    }

    start()

    return () => {
      cancelled = true
      stopAll()
      setIsReady(false)
    }
  }, [videoElement])

  return { isReady, landmarksRef, error, refreshHand, modelStatus }
}
