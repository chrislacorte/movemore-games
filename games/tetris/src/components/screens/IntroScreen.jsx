import { motion } from 'framer-motion'
import { STRINGS } from '../../constants/strings'

export default function IntroScreen({ countdownStep, onStart, isReady }) {
  const showCountdown =
    countdownStep >= 0 && countdownStep < STRINGS.introCountdown.length
  const countdownText = showCountdown
    ? STRINGS.introCountdown[countdownStep]
    : null

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {!showCountdown ? (
        <>
          <p className="mb-2 font-film text-xs uppercase tracking-[0.35em] text-amber-film/70">
            Retro Reel
          </p>
          <h1 className="font-display text-5xl tracking-wider text-phosphor md:text-7xl">
            {STRINGS.appTitle}
          </h1>
          <p className="mt-2 font-film text-sm uppercase tracking-[0.3em] text-phosphor/50">
            {STRINGS.appSubtitle}
          </p>
          <p className="mt-4 max-w-md font-film text-sm text-white/60">
            {STRINGS.tagline}
          </p>
          <button
            type="button"
            onClick={onStart}
            disabled={!isReady}
            className="mt-10 border border-phosphor/50 bg-phosphor/10 px-8 py-3 font-film text-sm uppercase tracking-[0.25em] text-phosphor transition hover:bg-phosphor/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isReady ? STRINGS.start : STRINGS.loadingHand}
          </button>
        </>
      ) : (
        <motion.div
          key={countdownText}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="font-display text-8xl text-amber-film md:text-9xl"
        >
          {countdownText}
        </motion.div>
      )}
    </motion.div>
  )
}
