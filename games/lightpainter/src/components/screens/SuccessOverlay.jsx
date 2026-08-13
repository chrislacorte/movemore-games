import { motion } from 'framer-motion'
import { STRINGS } from '../../constants/strings'

export default function SuccessOverlay({ templateLabel, onAgain, onNext, onFree }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="mx-4 flex max-w-md flex-col items-center gap-4 rounded-[2rem] border border-yellow-200/30 bg-night/90 px-8 py-8 text-center shadow-[0_0_60px_rgba(255,220,120,0.25)]"
      >
        <motion.div
          initial={{ rotate: -12, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.1 }}
          className="text-6xl"
          aria-hidden
        >
          🌟
        </motion.div>
        <h2 className="font-display text-4xl font-extrabold text-yellow-200 drop-shadow-[0_0_18px_rgba(255,220,120,0.7)]">
          {STRINGS.successTitle}
        </h2>
        <p className="font-ui text-base font-semibold text-white/85">
          {STRINGS.successSub}
          {templateLabel ? ` (${templateLabel})` : ''}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-yellow-300 px-6 py-3 font-ui text-base font-extrabold text-night shadow-[0_0_24px_rgba(255,220,120,0.6)] transition hover:scale-105"
          >
            {STRINGS.successNext}
          </button>
          <button
            type="button"
            onClick={onAgain}
            className="rounded-full border border-white/25 bg-white/10 px-6 py-3 font-ui text-base font-bold text-white transition hover:bg-white/20"
          >
            {STRINGS.successAgain}
          </button>
          <button
            type="button"
            onClick={onFree}
            className="rounded-full border border-white/25 bg-white/10 px-6 py-3 font-ui text-base font-bold text-white transition hover:bg-white/20"
          >
            {STRINGS.successFree}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
