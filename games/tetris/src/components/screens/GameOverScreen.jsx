import { motion } from 'framer-motion'
import { STRINGS } from '../../constants/strings'

export default function GameOverScreen({ score, level, lines, onRetry }) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.p
        className="font-film text-xs uppercase tracking-[0.4em] text-amber-film/60"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {STRINGS.gameOver}
      </motion.p>
      <motion.h2
        className="mt-4 font-display text-5xl text-phosphor"
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
      >
        GAME OVER
      </motion.h2>
      <p className="mt-3 max-w-sm font-film text-sm text-white/50">
        {STRINGS.gameOverSub}
      </p>
      <p className="mt-6 font-ui text-sm text-phosphor/70">
        {STRINGS.score}: <span className="text-phosphor">{score}</span>
        {' · '}
        {STRINGS.lines}: {lines}
        {' · '}
        {STRINGS.level} {level}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-10 border border-amber-film/50 bg-amber-film/10 px-8 py-3 font-film text-sm uppercase tracking-[0.25em] text-amber-film transition hover:bg-amber-film/20"
      >
        {STRINGS.retry}
      </button>
    </motion.div>
  )
}
