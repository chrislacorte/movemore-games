import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHandTracking } from '../hooks/useHandTracking'
import { useShooterInput } from '../hooks/useShooterInput'
import { useShooterEngine } from '../hooks/useShooterEngine'
import { GAME_PHASES, CALIBRATION, LAYOUTS } from '../constants/gameConfig'
import { STRINGS } from '../constants/strings'
import ShooterCanvas from './ShooterCanvas'
import Hud from './Hud'
import WebcamFeed from './WebcamFeed'
import WebcamThumb from './WebcamThumb'
import LayoutToggle from './LayoutToggle'
import { useShooterAudio } from '../hooks/useShooterAudio'
import HomeLink from './HomeLink'

export default function ShooterGame() {
  const videoRef = useRef(null)
  const [videoElement, setVideoElement] = useState(null)
  const [overlayLandmarks, setOverlayLandmarks] = useState(null)
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const [layout, setLayout] = useState(LAYOUTS.FULLSCREEN)
  const calibrationHoldRef = useRef(0)
  const lastFrameRef = useRef(performance.now())
  const statusRef = useRef({ pinching: false, handVisible: false })
  const wasPinchingRef = useRef(false)
  const shotDuringPinchRef = useRef(false)

  const setVideoRef = useCallback((node) => {
    videoRef.current = node
    setVideoElement(node)
  }, [])

  const { isReady, landmarksRef, error, refreshHand, modelStatus } =
    useHandTracking(videoElement)
  const { crosshairRef, updateInput, resetInput, hasVisibleHand } =
    useShooterInput()
  const {
    phase,
    displayState,
    gameStateRef,
    startCalibration,
    startPlay,
    resetToIntro,
    tick,
  } = useShooterEngine()
  const { playShoot, playBird, playBirdHit, unlock } = useShooterAudio()

  const isFullscreen = layout === LAYOUTS.FULLSCREEN
  const inPlay = phase === GAME_PHASES.PLAY

  const overlayLabel =
    phase === GAME_PHASES.CALIBRATE
      ? STRINGS.calibrate
      : statusRef.current.pinching
        ? STRINGS.fired
        : STRINGS.ready

  const webcamStatus = modelStatus || (isReady ? '' : STRINGS.loadingHand)

  useEffect(() => {
    let raf = 0
    const loop = (now) => {
      refreshHand()
      const landmarks = landmarksRef.current
      setOverlayLandmarks(landmarks ? [...landmarks] : null)

      const dtSec = Math.min(0.05, (now - lastFrameRef.current) / 1000)
      lastFrameRef.current = now

      if (phase === GAME_PHASES.CALIBRATE) {
        const visible = hasVisibleHand(landmarks)
        statusRef.current = { pinching: false, handVisible: visible }
        if (visible) {
          if (!calibrationHoldRef.current) calibrationHoldRef.current = now
          const held = now - calibrationHoldRef.current
          const progress = Math.min(1, held / CALIBRATION.holdMs)
          setCalibrationProgress(progress)
          if (held >= CALIBRATION.holdMs) {
            calibrationHoldRef.current = 0
            resetInput()
            startPlay()
          }
        } else {
          calibrationHoldRef.current = 0
          setCalibrationProgress((p) => Math.max(0, p - 0.02))
        }
      }

      if (phase === GAME_PHASES.PLAY) {
        const { crosshair, fired, handVisible, pinching } = updateInput(
          landmarks,
          dtSec,
        )
        statusRef.current = { pinching, handVisible }

        if (fired) {
          shotDuringPinchRef.current = true
          playShoot()
        }
        if (wasPinchingRef.current && !pinching) {
          shotDuringPinchRef.current = false
        }
        wasPinchingRef.current = pinching

        const events = tick(crosshair, fired, now, dtSec)
        if (events?.spawnedBird) playBird()
        if (events?.birdHit) playBirdHit()
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [
    phase,
    refreshHand,
    landmarksRef,
    updateInput,
    tick,
    hasVisibleHand,
    startPlay,
    resetInput,
    playShoot,
    playBird,
    playBirdHit,
  ])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && phase === GAME_PHASES.CALIBRATE) {
        e.preventDefault()
        unlock()
        resetInput()
        startPlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, startPlay, resetInput, unlock])

  const handleStart = () => {
    unlock()
    resetInput()
    wasPinchingRef.current = false
    shotDuringPinchRef.current = false
    calibrationHoldRef.current = 0
    setCalibrationProgress(0)
    startCalibration()
  }

  const handleRestart = () => {
    resetInput()
    wasPinchingRef.current = false
    shotDuringPinchRef.current = false
    calibrationHoldRef.current = 0
    setCalibrationProgress(0)
    resetToIntro()
  }

  return (
    <div className="game-stage relative flex h-full w-full flex-col overflow-hidden bg-black">
      <HomeLink />
      <div className="relative flex h-full min-h-0 flex-1 flex-row">
        <div
          className={`arena-frame relative min-h-0 overflow-hidden ${
            isFullscreen ? 'flex-1' : 'flex-[1.45]'
          }`}
        >
          <ShooterCanvas
            gameStateRef={gameStateRef}
            crosshairRef={crosshairRef}
            statusRef={statusRef}
            className="h-full"
          />

          <Hud
            phase={phase}
            score={displayState.score}
            hits={displayState.hits}
            shots={displayState.shots}
          />

          <AnimatePresence>
            {phase === GAME_PHASES.INTRO && (
              <motion.div
                key="intro"
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-black/80 via-black/65 to-emerald-950/30 p-6 text-center backdrop-blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="font-ui text-xs uppercase tracking-[0.35em] text-cyan-400/70">
                  {STRINGS.tagline}
                </p>
                <h1 className="mt-2 bg-gradient-to-r from-cyan-200 via-white to-amber-200 bg-clip-text font-display text-5xl tracking-[0.18em] text-transparent sm:text-6xl">
                  {STRINGS.title}
                </h1>
                <p className="mt-3 max-w-md font-ui text-sm text-white/65 sm:text-base">
                  {STRINGS.subtitle}
                </p>
                <button
                  type="button"
                  onClick={handleStart}
                  className="mt-8 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 px-10 py-3 font-display text-xl tracking-wide text-black shadow-lg shadow-cyan-500/25 transition hover:from-cyan-400 hover:to-cyan-300"
                >
                  {STRINGS.startGame}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === GAME_PHASES.CALIBRATE && (
              <motion.div
                key="calibrate"
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 p-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="font-display text-3xl text-cyan-400">
                  {STRINGS.calibrate}
                </h2>
                <p className="mt-2 max-w-sm font-ui text-sm text-white/70">
                  {STRINGS.calibrateHint}
                </p>
                <div className="mt-6 h-2.5 w-52 overflow-hidden rounded-full border border-white/10 bg-black/50">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-amber-400 transition-all duration-150"
                    style={{ width: `${calibrationProgress * 100}%` }}
                  />
                </div>
                <p className="mt-2 font-ui text-xs text-white/50">
                  {Math.round(calibrationProgress * 100)}% · {STRINGS.skipCalibrate}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pointer-events-none absolute bottom-3 left-3 z-30 flex items-center gap-2">
            <LayoutToggle layout={layout} onChange={setLayout} />
            {inPlay && (
              <button
                type="button"
                onClick={handleRestart}
                className="pointer-events-auto rounded-lg border border-white/15 bg-black/45 px-3 py-1.5 font-ui text-xs font-semibold uppercase tracking-wide text-white/70 backdrop-blur-md transition hover:bg-white/10"
              >
                {STRINGS.restart}
              </button>
            )}
          </div>

          {isFullscreen && inPlay && (
            <WebcamThumb
              videoRef={videoRef}
              landmarks={overlayLandmarks}
              actionLabel={overlayLabel}
            />
          )}
        </div>

        <div
          className={
            isFullscreen
              ? 'pointer-events-none absolute h-px w-px overflow-hidden opacity-0'
              : 'flex min-h-0 min-w-[200px] flex-1 flex-col border-l border-white/10 sm:min-w-[240px]'
          }
        >
          <WebcamFeed
            videoRef={setVideoRef}
            isReady={isReady}
            error={error}
            landmarks={overlayLandmarks}
            actionLabel={overlayLabel}
            statusText={webcamStatus}
          />
        </div>
      </div>

      {error && isFullscreen && (
        <div className="absolute bottom-3 right-3 z-30 max-w-xs rounded-lg border border-red-500/40 bg-black/80 px-4 py-3 font-ui text-sm text-red-300">
          {error}
        </div>
      )}

      {!isReady && !error && isFullscreen && phase !== GAME_PHASES.INTRO && (
        <div className="absolute right-3 top-3 z-30 rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 font-ui text-xs text-white/80 backdrop-blur-md">
          {webcamStatus}
        </div>
      )}
    </div>
  )
}
