import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { STR } from '../constants/strings'
import WebcamSceneThumb from './WebcamSceneThumb'

const spring = { type: 'spring', stiffness: 420, damping: 32 }

const SceneSlider = ({
  backgrounds,
  value,
  onChange,
  compact = false,
  className = '',
}) => {
  const activeIndex = Math.max(
    0,
    backgrounds.findIndex((bg) => bg.id === value)
  )
  const [index, setIndex] = useState(activeIndex)
  const [dragDir, setDragDir] = useState(0)

  useEffect(() => {
    setIndex(activeIndex >= 0 ? activeIndex : 0)
  }, [activeIndex, value])

  const goTo = useCallback(
    (nextIndex) => {
      const clamped = (nextIndex + backgrounds.length) % backgrounds.length
      setIndex(clamped)
      onChange(backgrounds[clamped].id)
    },
    [backgrounds, onChange]
  )

  if (!backgrounds?.length) return null

  const current = backgrounds[index] ?? backgrounds[0]

  const stopUiPointer = (e) => e.stopPropagation()

  if (compact) {
    return (
      <div className={className} data-game-ui onPointerDown={stopUiPointer}>
        <div className="flex items-center justify-center gap-2 px-2">
          <button
            type="button"
            data-game-ui
            aria-label={STR.prevScene}
            onClick={() => goTo(index - 1)}
            className="font-ui pointer-events-auto rounded-md border border-white/20 bg-black/50 px-2 py-1 text-sm text-white"
          >
            ‹
          </button>
          {backgrounds.map((bg, i) => (
            <button
              key={bg.id}
              type="button"
              data-game-ui
              onClick={() => goTo(i)}
              title={bg.label}
              className={`pointer-events-auto overflow-hidden rounded-lg border-2 transition ${
                i === index ? 'border-lime-400 scale-105' : 'border-white/15 opacity-70'
              }`}
            >
              {bg.type === 'webcam' ? (
                <WebcamSceneThumb className="h-12 w-20" iconClassName="h-5 w-5" />
              ) : (
                <img src={bg.preview} alt={bg.label} className="block h-12 w-20 object-cover" />
              )}
            </button>
          ))}
          <button
            type="button"
            data-game-ui
            aria-label={STR.nextScene}
            onClick={() => goTo(index + 1)}
            className="font-ui pointer-events-auto rounded-md border border-white/20 bg-black/50 px-2 py-1 text-sm text-white"
          >
            ›
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`} data-game-ui onPointerDown={stopUiPointer}>
      <p className="intro-section-label font-ui mb-1 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/50 sm:mb-2">
        {STR.chooseScene}
      </p>

      <div className="relative mx-auto max-w-xl px-10 sm:px-12 md:px-14">
        <button
          type="button"
          data-game-ui
          aria-label={STR.prevScene}
          onClick={() => goTo(index - 1)}
          className="font-ui absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-black/50 px-3 py-2 text-lg text-white backdrop-blur-sm transition hover:bg-black/70"
        >
          ‹
        </button>

        <button
          type="button"
          data-game-ui
          aria-label={STR.nextScene}
          onClick={() => goTo(index + 1)}
          className="font-ui absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/25 bg-black/50 px-3 py-2 text-lg text-white backdrop-blur-sm transition hover:bg-black/70"
        >
          ›
        </button>

        <AnimatePresence mode="wait" custom={dragDir}>
          <motion.div
            key={current.id}
            custom={dragDir}
            initial={{ opacity: 0, x: dragDir >= 0 ? 48 : -48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dragDir >= 0 ? -48 : 48 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (info.offset.x > 60) {
                setDragDir(-1)
                goTo(index - 1)
              } else if (info.offset.x < -60) {
                setDragDir(1)
                goTo(index + 1)
              }
            }}
            className="pointer-events-auto mx-8 overflow-hidden rounded-2xl border-2 border-lime-400/80 shadow-[0_0_32px_rgba(163,230,53,0.25)] sm:mx-10 md:mx-12"
          >
            {current.type === 'webcam' ? (
              <WebcamSceneThumb
                className="intro-scene-preview h-24 sm:h-32 md:h-40 lg:h-44"
                iconClassName="h-12 w-12"
              />
            ) : (
              <img
                src={current.preview}
                alt={current.label}
                className="intro-scene-preview block h-24 w-full object-cover sm:h-32 md:h-40 lg:h-44"
                draggable={false}
              />
            )}
            <div className="intro-scene-caption bg-black/75 px-3 py-2 text-center sm:px-4 sm:py-3">
              <p className="font-title text-sm text-lime-300 sm:text-base md:text-lg">{current.label}</p>
              <p className="intro-scene-desc font-ui mt-0.5 text-[10px] leading-snug text-white/55 sm:mt-1 sm:text-xs">
                {current.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-2 flex justify-center gap-2 sm:mt-3">
        {backgrounds.map((bg, i) => (
          <button
            key={bg.id}
            type="button"
            data-game-ui
            aria-label={bg.label}
            onClick={() => {
              setDragDir(i > index ? 1 : -1)
              goTo(i)
            }}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-lime-400' : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default SceneSlider
