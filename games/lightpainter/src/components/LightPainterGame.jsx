import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useHandTracking } from '../hooks/useHandTracking'
import { usePainterAudio } from '../hooks/usePainterAudio'
import WebcamFeed from './WebcamFeed'
import PaintCanvas from './PaintCanvas'
import Toolbar from './Toolbar'
import HomeLink from './HomeLink'
import IntroScreen from './screens/IntroScreen'
import ModeSelectScreen from './screens/ModeSelectScreen'
import SuccessOverlay from './screens/SuccessOverlay'
import { STRINGS } from '../constants/strings'
import { nextTemplate } from '../constants/templates'
import {
  GAME_PHASES,
  MODES,
  BACKGROUNDS,
  COLORS,
  STROKE_WIDTHS,
} from '../constants/gameConfig'

const STATUS_LABELS = {
  noHand: STRINGS.noHand,
  penUp: STRINGS.penUp,
  drawing: STRINGS.drawing,
}

export default function LightPainterGame() {
  const [phase, setPhase] = useState(GAME_PHASES.INTRO)
  const [mode, setMode] = useState(MODES.FREE)
  const [template, setTemplate] = useState(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [videoElement, setVideoElement] = useState(null)

  const [color, setColor] = useState(COLORS[5].hex)
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[1].px)
  const [glowOn, setGlowOn] = useState(true)
  const [fadeOn, setFadeOn] = useState(false)
  const [background, setBackground] = useState(BACKGROUNDS.NIGHT)

  const [handStatus, setHandStatus] = useState('noHand')
  const [progress, setProgress] = useState(0)
  const [success, setSuccess] = useState(false)

  const canvasApiRef = useRef(null)
  const audio = usePainterAudio()

  const { isReady, handsRef, error, refreshHand, modelStatus } =
    useHandTracking(cameraOn ? videoElement : null)

  const isPlaying = phase === GAME_PHASES.PLAY
  const cameraAsBackground = cameraOn && background === BACKGROUNDS.CAMERA

  useEffect(() => {
    audio.setDrawing(isPlaying && !success && handStatus === 'drawing')
  }, [audio, isPlaying, success, handStatus])

  const handleStart = useCallback(() => {
    audio.unlock()
    audio.playSelect()
    setCameraOn(true)
    setPhase(GAME_PHASES.MODE_SELECT)
  }, [audio])

  const handleFreeDraw = useCallback(() => {
    audio.playSelect()
    setMode(MODES.FREE)
    setTemplate(null)
    setSuccess(false)
    setProgress(0)
    setPhase(GAME_PHASES.PLAY)
  }, [audio])

  const handleTracePick = useCallback(
    (picked) => {
      audio.playSelect()
      setMode(MODES.TRACE)
      setTemplate(picked)
      setSuccess(false)
      setProgress(0)
      setPhase(GAME_PHASES.PLAY)
    },
    [audio],
  )

  const handleSuccess = useCallback(() => {
    setSuccess(true)
    audio.playSuccess()
  }, [audio])

  const handleAgain = useCallback(() => {
    audio.playSelect()
    canvasApiRef.current?.clear()
    setProgress(0)
    setSuccess(false)
  }, [audio])

  const handleNext = useCallback(() => {
    audio.playSelect()
    setTemplate((current) => nextTemplate(current?.id))
    setProgress(0)
    setSuccess(false)
  }, [audio])

  const handleContinueFree = useCallback(() => {
    audio.playSelect()
    setMode(MODES.FREE)
    setTemplate(null)
    setSuccess(false)
  }, [audio])

  const handleBackToModes = useCallback(() => {
    audio.playSelect()
    setSuccess(false)
    setProgress(0)
    setPhase(GAME_PHASES.MODE_SELECT)
  }, [audio])

  const handleClear = useCallback(() => {
    audio.playClear()
    canvasApiRef.current?.clear()
    setProgress(0)
  }, [audio])

  const handleSave = useCallback(() => {
    audio.playSelect()
    canvasApiRef.current?.save()
  }, [audio])

  const handleBackgroundChange = useCallback(
    (nextBg) => {
      setBackground(nextBg)
      audio.playSelect()
    },
    [audio],
  )

  const progressPercent = Math.round(progress * 100)

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        cameraAsBackground ? 'bg-black' : 'night-sky'
      }`}
    >
      {!cameraAsBackground && <div className="night-stars" aria-hidden />}

      {cameraOn && (
        <WebcamFeed
          videoRef={setVideoElement}
          isReady={isReady}
          error={error}
          statusText={modelStatus}
          asBackground={cameraAsBackground}
          className={
            cameraAsBackground
              ? 'absolute inset-0 z-0'
              : 'absolute bottom-4 right-4 z-30 aspect-[4/3] w-36 rounded-2xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.6)] sm:w-44'
          }
        />
      )}

      {cameraAsBackground ? (
        <div className="webcam-bg-scrim z-[5]" aria-hidden />
      ) : (
        <div className="vignette z-[5]" aria-hidden />
      )}

      {isPlaying && (
        <div className="absolute inset-0 z-10">
          <PaintCanvas
            ref={canvasApiRef}
            videoElement={videoElement}
            handsRef={handsRef}
            refreshHand={refreshHand}
            color={color}
            strokeWidth={strokeWidth}
            glowOn={glowOn}
            fadeOn={fadeOn}
            mode={mode}
            template={template}
            paused={success || !isReady}
            onStatusChange={setHandStatus}
            onProgress={setProgress}
            onSuccess={handleSuccess}
          />
        </div>
      )}

      {isPlaying && (
        <>
          {/* Top HUD */}
          <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex flex-col items-center gap-2 px-16 sm:top-4">
            {mode === MODES.TRACE && template && (
              <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-black/55 px-4 py-2 backdrop-blur-md">
                <span
                  className={
                    template.kind === 'letter'
                      ? 'font-display text-xl font-extrabold text-cyan-100'
                      : 'text-xl'
                  }
                  aria-hidden
                >
                  {template.emoji}
                </span>
                <div className="h-2.5 w-36 overflow-hidden rounded-full bg-white/15 sm:w-48">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-yellow-200 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-ui text-sm font-extrabold text-white/85">
                  {progressPercent} %
                </span>
              </div>
            )}
            <span className="rounded-full bg-black/40 px-4 py-1 font-ui text-xs font-bold text-white/60 backdrop-blur-sm">
              {STATUS_LABELS[handStatus] ?? ''}
            </span>
          </div>

          {/* Back to mode selection */}
          <button
            type="button"
            onClick={handleBackToModes}
            className="absolute right-3 top-3 z-30 rounded-full border border-white/15 bg-black/50 px-4 py-1.5 font-ui text-xs font-bold uppercase tracking-widest text-white/75 backdrop-blur-md transition hover:bg-white/10 sm:right-4 sm:top-4"
          >
            {STRINGS.changeTemplate}
          </button>

          {/* Bottom toolbar */}
          <div className="absolute inset-x-0 bottom-3 z-30 flex justify-center px-2 sm:bottom-5">
            <Toolbar
              color={color}
              onColorChange={(hex) => {
                setColor(hex)
                audio.playSelect()
              }}
              strokeWidth={strokeWidth}
              onStrokeWidthChange={(px) => {
                setStrokeWidth(px)
                audio.playSelect()
              }}
              glowOn={glowOn}
              onGlowToggle={() => {
                setGlowOn((v) => !v)
                audio.playSelect()
              }}
              fadeOn={fadeOn}
              onFadeToggle={() => {
                setFadeOn((v) => !v)
                audio.playSelect()
              }}
              background={background}
              onBackgroundToggle={() => {
                handleBackgroundChange(
                  background === BACKGROUNDS.NIGHT ? BACKGROUNDS.CAMERA : BACKGROUNDS.NIGHT,
                )
              }}
              onClear={handleClear}
              onSave={handleSave}
            />
          </div>
        </>
      )}

      {phase === GAME_PHASES.INTRO && <IntroScreen onStart={handleStart} />}

      {phase === GAME_PHASES.MODE_SELECT && (
        <ModeSelectScreen
          onFreeDraw={handleFreeDraw}
          onTracePick={handleTracePick}
          background={background}
          onBackgroundChange={handleBackgroundChange}
        />
      )}

      <AnimatePresence>
        {success && (
          <SuccessOverlay
            key="success"
            templateLabel={template?.label}
            onAgain={handleAgain}
            onNext={handleNext}
            onFree={handleContinueFree}
          />
        )}
      </AnimatePresence>

      <HomeLink />
    </div>
  )
}
