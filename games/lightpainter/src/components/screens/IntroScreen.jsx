import { motion } from 'framer-motion'
import { STRINGS } from '../../constants/strings'

export default function IntroScreen({ onStart }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-4 flex max-w-lg flex-col items-center gap-5 text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl"
          aria-hidden
        >
          ☝️✨
        </motion.div>
        <h1 className="font-display text-6xl font-extrabold tracking-wide text-white drop-shadow-[0_0_28px_rgba(140,180,255,0.8)] sm:text-7xl">
          {STRINGS.appTitle}
        </h1>
        <p className="font-display text-2xl font-bold text-cyan-200 drop-shadow-[0_0_14px_rgba(100,220,255,0.7)]">
          {STRINGS.appSubtitle}
        </p>
        <p className="font-ui text-base font-semibold text-white/80">{STRINGS.tagline}</p>
        <p className="rounded-full border border-white/15 bg-white/5 px-5 py-2 font-ui text-sm font-bold text-white/70">
          {STRINGS.introHint}
        </p>
        <motion.button
          type="button"
          onClick={onStart}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          className="mt-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-10 py-4 font-display text-2xl font-extrabold text-night shadow-[0_0_40px_rgba(120,180,255,0.55)]"
        >
          {STRINGS.start}
        </motion.button>
      </motion.div>
    </div>
  )
}
