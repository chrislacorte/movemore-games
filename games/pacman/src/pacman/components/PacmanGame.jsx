import { useRef, useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useHandTracking } from '../../hooks/useHandTracking'
import { usePacmanInput } from '../hooks/usePacmanInput'
import { usePacmanEngine } from '../hooks/usePacmanEngine'
import {
  GAME_PHASES,
  CALIBRATION,
  INTRO_COUNTDOWN,
  SLOW_MO_SCALE,
  SLOW_MO_MS,
} from '../constants/gameConfig'
import { STRINGS } from '../constants/strings'
import WebcamFeed from '../../components/WebcamFeed'
import HomeLink from '../../components/HomeLink'
import FilmOverlay from '../../components/FilmOverlay'
import PacmanCanvas from './PacmanCanvas'
import PacmanHud from './PacmanHud'
import IntroScreen from './screens/IntroScreen'
import CalibrateScreen from './screens/CalibrateScreen'
import GameOverScreen from './screens/GameOverScreen'
import LevelUpScreen from './screens/LevelUpScreen'

export default function PacmanGame() {
  const videoRef = useRef(null)
  const [videoElement, setVideoElement] = useState(null)
  const [overlayLandmarks, setOverlayLandmarks] = useState(null)
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const [countdownStep, setCountdownStep] = useState(-1)
  const [timeScale, setTimeScale] = useState(1)
  const [handVisible, setHandVisible] = useState(false)

  const calibrationHoldRef = useRef(0)
  const lastFrameRef = useRef(performance.now())
  const slowMoUntilRef = useRef(0)
  const countdownTimerRef = useRef(null)

  const setVideoRef = useCallback((node) => {
    videoRef.current = node
    setVideoElement(node)
  }, [])

  const { isReady, landmarksRef, error, refreshHand, modelStatus } =
    useHandTracking(videoElement)
  const {
    updateInput,
    updateQueuedDirection,
    resetInput,
    hasVisibleHand,
  } = usePacmanInput()
  const {
    phase,
    displayState,
    gameStateRef,
    startCalibration,
    startPlay,
    resetToIntro,
    tick,
  } = usePacmanEngine()

  const inPlay = phase === GAME_PHASES.PLAY
  const overlayLabel =
    phase === GAME_PHASES.CALIBRATE
      ? STRINGS.calibrate
      : inPlay
        ? STRINGS.ready
        : ''

  const webcamStatus = modelStatus || (isReady ? '' : STRINGS.loadingHand)

  const triggerSlowMo = useCallback(() => {
    slowMoUntilRef.current = performance.now() + SLOW_MO_MS
    setTimeScale(SLOW_MO_SCALE)
  }, [])

  useEffect(() => {
    if (countdownStep < 0) return

    if (countdownStep >= STRINGS.introCountdown.length) {
      startCalibration()
      return
    }

    countdownTimerRef.current = setTimeout(() => {
      setCountdownStep((s) => s + 1)
    }, INTRO_COUNTDOWN.stepMs)
    return () => clearTimeout(countdownTimerRef.current)
  }, [countdownStep, startCalibration])

  useEffect(() => {
    let raf = 0
    const loop = (now) => {
      refreshHand()
      const landmarks = landmarksRef.current
      setOverlayLandmarks(landmarks ? [...landmarks] : null)

      const dtSec = Math.min(0.05, (now - lastFrameRef.current) / 1000)
      lastFrameRef.current = now

      if (slowMoUntilRef.current && now >= slowMoUntilRef.current) {
        slowMoUntilRef.current = 0
        setTimeScale(1)
      }
      const currentTimeScale =
        slowMoUntilRef.current > now ? SLOW_MO_SCALE : 1

      if (phase === GAME_PHASES.CALIBRATE) {
        const visible = hasVisibleHand(landmarks)
        if (visible) {
          if (!calibrationHoldRef.current) calibrationHoldRef.current = now
          const held = now - calibrationHoldRef.current
          const progress = Math.min(1, held / CALIBRATION.holdMs)
          setCalibrationProgress(progress)
          if (held >= CALIBRATION.holdMs) {
            calibrationHoldRef.current = 0
            resetInput()
            startPlay()
            setCalibrationProgress(0)
          }
        } else {
          calibrationHoldRef.current = 0
          setCalibrationProgress(0)
        }
      }

      if (phase === GAME_PHASES.PLAY) {
        const { finger } = updateInput(landmarks)
        setHandVisible(Boolean(finger.visible))

        const pacman = gameStateRef.current.pacman
        const queuedDir = pacman
          ? updateQueuedDirection(finger, pacman.normX, pacman.normY)
          : 'left'

        const result = tick(dtSec, { finger, queuedDir }, currentTimeScale)
        if (
          result?.event === 'game_over' ||
          result?.event === 'level_up' ||
          result?.event === 'power'
        ) {
          triggerSlowMo()
        }
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [
    phase,
    refreshHand,
    landmarksRef,
    hasVisibleHand,
    updateInput,
    updateQueuedDirection,
    resetInput,
    startPlay,
    tick,
    triggerSlowMo,
    gameStateRef,
  ])

  const handleStart = () => {
    setCountdownStep(0)
  }

  const handleRetry = () => {
    resetInput()
    resetToIntro()
    setCountdownStep(-1)
    setTimeScale(1)
    slowMoUntilRef.current = 0
  }

  return (
    <div className="film-flicker relative h-[100dvh] w-full overflow-hidden bg-black">
      <HomeLink />

      <WebcamFeed
        videoRef={setVideoRef}
        isReady={isReady}
        error={error}
        landmarks={overlayLandmarks}
        actionLabel={overlayLabel}
        statusText={webcamStatus}
        className="absolute inset-0"
      />

      <div className="absolute inset-0 flex items-center justify-center p-[10%]">
        <div className="relative aspect-[4/3] w-full max-w-4xl overflow-hidden rounded-sm border border-phosphor/20 bg-transparent">
          <PacmanCanvas displayState={displayState} timeScale={timeScale} />
        </div>
      </div>

      {inPlay && (
        <PacmanHud displayState={displayState} handVisible={handVisible} />
      )}

      <FilmOverlay active letterbox />

      <AnimatePresence>
        {phase === GAME_PHASES.INTRO && (
          <IntroScreen
            key="intro"
            countdownStep={countdownStep}
            onStart={handleStart}
            isReady={isReady}
          />
        )}
        {phase === GAME_PHASES.CALIBRATE && (
          <CalibrateScreen key="calibrate" progress={calibrationProgress} />
        )}
        {phase === GAME_PHASES.LEVEL_UP && (
          <LevelUpScreen key="levelup" level={displayState.level} />
        )}
        {phase === GAME_PHASES.GAME_OVER && (
          <GameOverScreen
            key="gameover"
            score={displayState.score}
            level={displayState.level}
            reason={displayState.deathReason}
            onRetry={handleRetry}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
