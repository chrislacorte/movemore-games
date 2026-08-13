import { useRef, useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useHandTracking } from '../hooks/useHandTracking'
import { useTetrisInput } from '../hooks/useTetrisInput'
import { useTetrisEngine } from '../hooks/useTetrisEngine'
import {
  GAME_PHASES,
  CALIBRATION,
  INTRO_COUNTDOWN,
} from '../constants/gameConfig'
import { STRINGS } from '../constants/strings'
import WebcamFeed from './WebcamFeed'
import HomeLink from './HomeLink'
import TetrisCanvas from './TetrisCanvas'
import Hud from './Hud'
import IntroScreen from './screens/IntroScreen'
import CalibrateScreen from './screens/CalibrateScreen'
import GameOverScreen from './screens/GameOverScreen'

export default function TetrisGame() {
  const [videoElement, setVideoElement] = useState(null)
  const [overlayHands, setOverlayHands] = useState(null)
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const [countdownStep, setCountdownStep] = useState(-1)
  const [handVisible, setHandVisible] = useState(false)
  const [pose, setPose] = useState('none')
  const [softDrop, setSoftDrop] = useState(false)

  const calibrationHoldRef = useRef(0)
  const lastFrameRef = useRef(performance.now())
  const countdownTimerRef = useRef(null)

  const setVideoRef = useCallback((node) => {
    setVideoElement(node)
  }, [])

  const { isReady, handsRef, error, refreshHand, modelStatus } =
    useHandTracking(videoElement)
  const { updateInput, resetInput, hasVisibleHand } = useTetrisInput()
  const {
    phase,
    displayState,
    startCalibration,
    startPlay,
    resetToIntro,
    tick,
  } = useTetrisEngine()

  const inPlay = phase === GAME_PHASES.PLAY

  const overlayLabel = softDrop
    ? STRINGS.softDrop
    : phase === GAME_PHASES.CALIBRATE
      ? STRINGS.calibrate
      : pose === 'open'
        ? STRINGS.openPalm
        : pose === 'fist'
          ? STRINGS.fist
          : inPlay
            ? STRINGS.rotateHint
            : ''

  const webcamStatus = modelStatus || (isReady ? '' : STRINGS.loadingHand)

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
      const hands = handsRef.current
      setOverlayHands(hands ? hands.map((hand) => [...hand]) : null)

      const dtSec = Math.min(0.05, (now - lastFrameRef.current) / 1000)
      lastFrameRef.current = now

      if (phase === GAME_PHASES.CALIBRATE) {
        const visible = hasVisibleHand(hands)
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
        const input = updateInput(hands, now)
        setHandVisible(Boolean(input.palm?.visible))
        setPose(input.pose ?? 'none')
        setSoftDrop(Boolean(input.softDrop))
        tick(dtSec, input)
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [
    phase,
    refreshHand,
    handsRef,
    hasVisibleHand,
    updateInput,
    resetInput,
    startPlay,
    tick,
  ])

  const handleStart = () => {
    setCountdownStep(0)
  }

  const handleRetry = () => {
    resetInput()
    resetToIntro()
    setCountdownStep(-1)
    setSoftDrop(false)
  }

  return (
    <div className="film-letterbox relative h-[100dvh] w-full overflow-hidden bg-black">
      <HomeLink />

      <WebcamFeed
        videoRef={setVideoRef}
        isReady={isReady}
        error={error}
        hands={overlayHands}
        actionLabel={overlayLabel}
        statusText={webcamStatus}
        className="absolute inset-0"
      />

      <div className="film-grain pointer-events-none absolute inset-0 z-[2]" />
      <div className="film-scanlines pointer-events-none absolute inset-0 z-[2]" />

      <div className="absolute inset-0 flex items-center justify-center p-[8%] pt-[14%]">
        <div className="relative aspect-[3/4] h-full max-h-[70dvh] w-full max-w-md overflow-hidden rounded-sm border border-phosphor/25 bg-black/40 shadow-[0_0_30px_rgba(57,255,20,0.08)]">
          <TetrisCanvas displayState={displayState} />
        </div>
      </div>

      {inPlay && (
        <Hud
          displayState={displayState}
          handVisible={handVisible}
          pose={pose}
          softDrop={softDrop}
        />
      )}

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
        {phase === GAME_PHASES.GAME_OVER && (
          <GameOverScreen
            key="gameover"
            score={displayState.score}
            level={displayState.level}
            lines={displayState.lines}
            onRetry={handleRetry}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
