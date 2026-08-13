import { useEffect, useRef, useState, useCallback } from 'react'
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import {
  CAMERA_WIDTH,
  CAMERA_HEIGHT,
  POSE_STALE_MS,
  POSE_FILTER_MIN_CUTOFF,
  POSE_FILTER_BETA,
  POSE_MIN_DETECTION_CONFIDENCE,
  POSE_MIN_TRACKING_CONFIDENCE,
  POSE_DETECT_INTERVAL_MS,
} from '../constants/gameConfig'
import { PositionFilter } from '../utils/oneEuroFilter'
import { STRINGS } from '../constants/strings'

const WASM_CDN =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

/** Nose, shoulders, elbows, wrists — relevant for hand paddle control */
const UPPER_BODY = [0, 11, 12, 13, 14, 15, 16]

async function createPoseLandmarker(vision) {
  const base = {
    baseOptions: {
      modelAssetPath: MODEL_URL,
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: POSE_MIN_DETECTION_CONFIDENCE,
    minPosePresenceConfidence: POSE_MIN_TRACKING_CONFIDENCE,
    minTrackingConfidence: POSE_MIN_TRACKING_CONFIDENCE,
  }

  try {
    return await PoseLandmarker.createFromOptions(vision, {
      ...base,
      baseOptions: { ...base.baseOptions, delegate: 'GPU' },
    })
  } catch (gpuErr) {
    console.warn('PoseLandmarker GPU failed, using CPU:', gpuErr)
    return await PoseLandmarker.createFromOptions(vision, {
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
      else reject(new Error('Camera has no frame size'))
    }
    const onError = () => {
      cleanup()
      reject(new Error('Video failed to load'))
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
      else reject(new Error('Camera timeout — check permissions'))
    }, 8000)
  })
}

export function usePoseTracking(videoElement) {
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
  const lastDetectWallRef = useRef(0)

  const refreshPose = useCallback((now = performance.now()) => {
    const detection = detectionRef.current
    if (!detection?.landmarks) {
      landmarksRef.current = null
      return
    }
    if (now - detection.timestamp > POSE_STALE_MS) {
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
      lastDetectWallRef.current = 0
    }

    const getFilter = (key) => {
      if (!filtersRef.current[key]) {
        filtersRef.current[key] = new PositionFilter({
          minCutoff: POSE_FILTER_MIN_CUTOFF,
          beta: POSE_FILTER_BETA,
        })
      }
      return filtersRef.current[key]
    }

    const filterLandmarks = (landmarks, now) => {
      return landmarks.map((lm, i) => {
        const vis = lm.visibility ?? 1
        if (!UPPER_BODY.includes(i)) {
          return { x: lm.x, y: lm.y, z: lm.z ?? 0, visibility: vis }
        }
        const gameX = 1 - lm.x
        const filtered = getFilter(`lm_${i}`).filter(gameX, lm.y, now)
        return {
          x: filtered.x,
          y: filtered.y,
          z: lm.z ?? 0,
          visibility: vis,
        }
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
      const now = performance.now()
      const due = now - lastDetectWallRef.current >= POSE_DETECT_INTERVAL_MS

      if (
        due &&
        landmarker &&
        !processingRef.current &&
        videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        videoElement.videoWidth > 0
      ) {
        processingRef.current = true
        lastDetectWallRef.current = now
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
          console.error('PoseLandmarker detect error:', e)
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
        setModelStatus(STRINGS.loadingPose)

        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API unavailable — use HTTPS or localhost')
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

        setModelStatus('Pose-Modell laden…')
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN)
        const landmarker = await createPoseLandmarker(vision)

        if (cancelled) {
          landmarker.close()
          return
        }

        landmarkerRef.current = landmarker
        detectRafRef.current = requestAnimationFrame(scheduleDetection)
        setModelStatus('')
        setIsReady(true)
      } catch (err) {
        console.error('Pose tracking init failed:', err)
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

  return { isReady, landmarksRef, error, refreshPose, modelStatus }
}
