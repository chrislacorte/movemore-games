import { useEffect, useRef, useState, useCallback } from 'react';
import { loadMediaPipeHands } from '../utils/loadMediaPipeHands';
import { assetPath } from '../utils/assetPath';
import {
  CAMERA_WIDTH,
  CAMERA_HEIGHT,
  HAND_EXTRAPOLATION_MS,
  HAND_FILTER_MIN_CUTOFF,
  HAND_FILTER_BETA,
} from '../constants/gameConfig';
import { HandPositionFilter } from '../utils/oneEuroFilter';

/**
 * Hand tracking via webcam + MediaPipe Hands.
 * Positions are filtered with One Euro (low lag) and extrapolated
 * once per game frame via refreshHands() — no separate display loop.
 */
export const useHandTracking = (videoRef, { maxNumHands = 2 } = {}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [cameraDenied, setCameraDenied] = useState(false);

  const handsDataRef = useRef([]);
  const handsRef = useRef(null);
  const streamRef = useRef(null);
  const detectRafRef = useRef(0);
  const processingRef = useRef(false);
  const detectionsRef = useRef({});
  const filtersRef = useRef({});

  const refreshHands = useCallback((now = performance.now()) => {
    const hands = [];

    Object.entries(detectionsRef.current).forEach(([label, detection]) => {
      const elapsed = now - detection.timestamp;
      let x = detection.x;
      let y = detection.y;

      if (elapsed > 0 && elapsed < HAND_EXTRAPOLATION_MS) {
        const t = elapsed / 1000;
        x += detection.vx * t;
        y += detection.vy * t;
      }

      hands.push({
        x,
        y,
        z: detection.z,
        label,
        timestamp: now,
      });
    });

    handsDataRef.current = hands;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryRaf = 0;

    const stopAll = () => {
      if (detectRafRef.current) {
        cancelAnimationFrame(detectRafRef.current);
        detectRafRef.current = 0;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
      handsDataRef.current = [];
      detectionsRef.current = {};
      filtersRef.current = {};
      processingRef.current = false;
    };

    const getFilter = (label) => {
      if (!filtersRef.current[label]) {
        filtersRef.current[label] = new HandPositionFilter({
          minCutoff: HAND_FILTER_MIN_CUTOFF,
          beta: HAND_FILTER_BETA,
        });
      }
      return filtersRef.current[label];
    };

    const scheduleDetection = () => {
      if (cancelled) return;

      const video = videoRef.current;
      const hands = handsRef.current;

      if (
        video &&
        hands &&
        !processingRef.current &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        processingRef.current = true;
        hands
          .send({ image: video })
          .catch((e) => console.error('MediaPipe send error:', e))
          .finally(() => {
            processingRef.current = false;
          });
      }

      detectRafRef.current = requestAnimationFrame(scheduleDetection);
    };

    const start = async (videoEl) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: CAMERA_WIDTH },
            height: { ideal: CAMERA_HEIGHT },
            facingMode: 'user',
            frameRate: { ideal: 60, max: 60 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        videoEl.srcObject = stream;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.setAttribute('playsinline', 'true');

        await videoEl.play();

        if (cancelled) return;

        const Hands = await loadMediaPipeHands();
        if (cancelled) return;

        const hands = new Hands({
          locateFile: (file) => assetPath(`mediapipe/hands/${file}`),
        });

        hands.setOptions({
          maxNumHands,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results) => {
          const now = performance.now();
          const nextDetections = {};

          if (results.multiHandLandmarks?.length > 0) {
            results.multiHandLandmarks.forEach((landmarks, index) => {
              const label =
                results.multiHandedness?.[index]?.label ?? `Hand_${index}`;

              const tip = landmarks[8];
              const rawX = 1 - tip.x;
              const rawY = tip.y;

              const filtered = getFilter(label).filter(rawX, rawY, now);
              const x = filtered.x;
              const y = filtered.y;

              const prev = detectionsRef.current[label];
              const dt = prev ? Math.max(1, now - prev.timestamp) : 16;
              const vx = prev ? (x - prev.x) / dt : 0;
              const vy = prev ? (y - prev.y) / dt : 0;

              nextDetections[label] = { x, y, z: tip.z, vx, vy, timestamp: now };
            });
          }

          detectionsRef.current = nextDetections;

          Object.keys(filtersRef.current).forEach((label) => {
            if (!nextDetections[label]) {
              delete filtersRef.current[label];
            }
          });

          if (!cancelled) setIsReady(true);
        });

        handsRef.current = hands;
        detectRafRef.current = requestAnimationFrame(scheduleDetection);

        if (!cancelled) setIsReady(true);
      } catch (err) {
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          if (!cancelled) setCameraDenied(true);
          return;
        }
        console.error('Hand tracking init failed:', err);
        if (!cancelled) {
          setError('Kamera-Zugriff nicht möglich.');
        }
      }
    };

    const waitForVideo = () => {
      if (cancelled) return;
      const videoEl = videoRef.current;
      if (!videoEl) {
        retryRaf = requestAnimationFrame(waitForVideo);
        return;
      }
      retryRaf = 0;
      start(videoEl);
    };

    setError(null);
    setCameraDenied(false);
    setIsReady(false);
    waitForVideo();

    return () => {
      cancelled = true;
      if (retryRaf) cancelAnimationFrame(retryRaf);
      stopAll();
    };
  }, [videoRef, maxNumHands]);

  return { isReady, handsDataRef, error, cameraDenied, refreshHands };
};
