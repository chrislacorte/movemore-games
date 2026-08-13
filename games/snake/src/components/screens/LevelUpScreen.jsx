import { motion } from 'framer-motion'
import { STRINGS } from '../../constants/strings'

export default function LevelUpScreen({ level }) {
  if (!level) return null

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.p
        className="font-film text-xs uppercase tracking-[0.35em] text-amber-film/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {STRINGS.levelComplete}
      </motion.p>
      <motion.h2
        className="mt-4 font-display text-6xl text-phosphor"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        LEVEL {level.id}
      </motion.h2>
      <motion.p
        className="mt-2 font-film text-lg text-amber-film"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {level.title}
      </motion.p>
      <p className="mt-2 font-film text-sm text-white/40">{level.subtitle}</p>
      <p className="mt-8 font-film text-xs uppercase tracking-[0.3em] text-phosphor/50">
        {STRINGS.nextLevel}
      </p>
    </motion.div>
  )
}
