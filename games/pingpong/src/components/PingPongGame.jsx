import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePoseTracking } from '../hooks/usePoseTracking'
import { usePongInput } from '../hooks/usePongInput'
import { usePongEngine } from '../hooks/usePongEngine'
import { GAME_PHASES, CALIBRATION, VIEW_MODES } from '../constants/gameConfig'
import { STRINGS } from '../constants/strings'
import PongCanvas from './PongCanvas'
import Hud from './Hud'
import WebcamFeed from './WebcamFeed'
import WebcamThumb from './WebcamThumb'
import HomeLink from './HomeLink'
import { usePongAudio } from '../hooks/usePongAudio'

function ViewButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1 font-ui text-xs tracking-wide transition ${
        active
          ? 'bg-white text-black'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

export default function PingPongGame() {
  const videoRef = useRef(null)
  const [videoElement, setVideoElement] = useState(null)
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const [viewMode, setViewMode] = useState(VIEW_MODES.BACKGROUND)
  const calibrationHoldRef = useRef(0)
  const lastFrameRef = useRef(performance.now())
  const phaseRef = useRef(GAME_PHASES.INTRO)
  const overlayLabelRef = useRef('')

  const setVideoRef = useCallback((node) => {
    videoRef.current = node
    setVideoElement(node)
  }, [])

  const { isReady, landmarksRef, error, refreshPose, modelStatus } =
    usePoseTracking(videoElement)
  const { updateInput, resetInput, hasVisibleHand, paddleRef } = usePongInput()
  const {
    phase,
    hudState,
    engineRef,
    startCalibration,
    startPlay,
    resetToIntro,
    tick,
  } = usePongEngine()
  const { playTableHit, playPaddleHit, unlock } = usePongAudio()

  phaseRef.current = phase

  const inPlay =
    phase === GAME_PHASES.PLAY ||
    phase === GAME_PHASES.WIN ||
    phase === GAME_PHASES.LOSE

  const isBackground = viewMode === VIEW_MODES.BACKGROUND

  overlayLabelRef.current =
    phase === GAME_PHASES.CALIBRATE
      ? 'Kalibrierung'
      : engineRef.current.serving
        ? STRINGS.serving
        : STRINGS.paddleReady

  const webcamStatus = modelStatus || (isReady ? '' : STRINGS.loadingPose)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '1') setViewMode(VIEW_MODES.BACKGROUND)
      if (e.key === '2') setViewMode(VIEW_MODES.PIP)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    let raf = 0
    const loop = (now) => {
      refreshPose()
      const landmarks = landmarksRef.current

      const dtSec = Math.min(0.05, (now - lastFrameRef.current) / 1000)
      lastFrameRef.current = now

      const currentPhase = phaseRef.current

      const handActive =
        currentPhase === GAME_PHASES.CALIBRATE ||
        currentPhase === GAME_PHASES.PLAY

      if (handActive) {
        const { paddle, swing } = updateInput(landmarks, dtSec)
        if (currentPhase === GAME_PHASES.PLAY) {
          const hits = tick(paddle, swing, now)
          if (hits?.paddleHit) playPaddleHit()
          else if (hits?.tableHit) playTableHit()
        }
      }

      if (currentPhase === GAME_PHASES.CALIBRATE) {
        const visible = hasVisibleHand(landmarks)
        if (visible) {
          if (!calibrationHoldRef.current) calibrationHoldRef.current = now
          const held = now - calibrationHoldRef.current
          const progress = Math.min(1, held / CALIBRATION.holdMs)
          setCalibrationProgress(progress)
          if (held >= CALIBRATION.holdMs) {
            calibrationHoldRef.current = 0
            unlock()
            resetInput()
            startPlay()
          }
        } else {
          calibrationHoldRef.current = 0
          setCalibrationProgress((p) => Math.max(0, p - 0.02))
        }
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [
    refreshPose,
    landmarksRef,
    updateInput,
    tick,
    hasVisibleHand,
    startPlay,
    resetInput,
    playTableHit,
    playPaddleHit,
  ])

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && phaseRef.current === GAME_PHASES.CALIBRATE) {
        e.preventDefault()
        unlock()
        resetInput()
        startPlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [startPlay, resetInput])

  const handleStart = () => {
    unlock()
    resetInput()
    calibrationHoldRef.current = 0
    setCalibrationProgress(0)
    startCalibration()
  }

  const handlePlayAgain = () => {
    resetInput()
    resetToIntro()
    calibrationHoldRef.current = 0
    setCalibrationProgress(0)
  }

  const webcamWrapClass = isBackground
    ? 'absolute inset-0 z-0'
    : 'absolute right-3 bottom-3 z-30 aspect-[4/3] w-[28%] min-w-[160px] max-w-[300px] overflow-hidden rounded-xl border border-white/15 shadow-2xl shadow-black/50 sm:right-4 sm:bottom-4'

  const arenaFrameClass = isBackground
    ? 'arena-frame relative h-full w-full overflow-hidden'
    : 'arena-frame arena-frame--solid relative h-full w-full overflow-hidden'

  return (
    <div className="game-stage relative h-full w-full overflow-hidden bg-black">
      <HomeLink />
      <div className={webcamWrapClass}>
        <WebcamFeed
          videoRef={setVideoRef}
          landmarksRef={landmarksRef}
          actionLabelRef={overlayLabelRef}
          isReady={isReady}
          error={error}
          statusText={webcamStatus}
          background={isBackground}
          compact={!isBackground}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        <div className={arenaFrameClass}>
          {isBackground && <div className="cinematic-overlay absolute inset-0 z-[5]" />}

          <PongCanvas
            engineRef={engineRef}
            playerPaddleRef={paddleRef}
            className="relative z-10 h-full"
            webcamBackdrop={isBackground}
          />

          <Hud phase={phase} score={hudState.score} rally={hudState.rally} />

          <AnimatePresence>
            {phase === GAME_PHASES.INTRO && (
              <motion.div
                key="intro"
                className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-black/75 via-black/55 to-emerald-950/25 p-6 text-center backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="font-ui text-xs uppercase tracking-[0.35em] text-cyan-400/70">
                  MediaPipe · Hand-Steuerung
                </p>
                <h1 className="mt-2 bg-gradient-to-r from-cyan-200 via-white to-amber-200 bg-clip-text font-display text-5xl tracking-[0.18em] text-transparent sm:text-6xl">
                  {STRINGS.title}
                </h1>
                <p className="mt-1 font-display text-xl tracking-widest text-amber-400/90">
                  {STRINGS.vsLine}
                </p>
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
                className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 p-6 text-center backdrop-blur-sm"
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

          <AnimatePresence>
            {(phase === GAME_PHASES.WIN || phase === GAME_PHASES.LOSE) && (
              <motion.div
                key="result"
                className="pointer-events-auto absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p
                  className={`font-display text-4xl sm:text-5xl ${
                    phase === GAME_PHASES.WIN ? 'text-cyan-400' : 'text-red-400'
                  }`}
                >
                  {phase === GAME_PHASES.WIN
                    ? STRINGS.youWin
                    : STRINGS.youLose}
                </p>
                <p className="mt-2 font-ui text-lg text-white/60">
                  {hudState.score.player} : {hudState.score.ai}
                </p>
                <button
                  type="button"
                  onClick={handlePlayAgain}
                  className="mt-6 rounded border border-white/30 px-6 py-2 font-ui text-sm font-bold uppercase tracking-wide text-white hover:bg-white/10"
                >
                  {STRINGS.playAgain}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {phase !== GAME_PHASES.INTRO && (
        <div className="pointer-events-auto absolute left-1/2 top-3 z-40 flex -translate-x-1/2 gap-1 rounded-xl border border-white/10 bg-black/50 p-1 backdrop-blur-md">
          <ViewButton
            active={isBackground}
            label={STRINGS.viewBackground}
            onClick={() => setViewMode(VIEW_MODES.BACKGROUND)}
          />
          <ViewButton
            active={!isBackground}
            label={STRINGS.viewPip}
            onClick={() => setViewMode(VIEW_MODES.PIP)}
          />
        </div>
      )}

      {error && inPlay && (
        <div className="pointer-events-none absolute bottom-14 left-1/2 z-40 max-w-xs -translate-x-1/2 rounded bg-black/55 px-3 py-1 text-center font-ui text-[10px] text-amber-200/80">
          {STRINGS.fallback ?? 'Ohne Kamera: W/S oder ↑ / ↓'}
        </div>
      )}

      {phase !== GAME_PHASES.INTRO && isBackground && isReady && (
        <WebcamThumb
          videoRef={videoRef}
          landmarksRef={landmarksRef}
          actionLabelRef={overlayLabelRef}
        />
      )}
    </div>
  )
}
