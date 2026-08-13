import { motion } from 'framer-motion'
import { STRINGS } from '../../constants/strings'

export default function CalibrateScreen({ progress }) {
  const pct = Math.round(progress * 100)

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <p className="font-film text-xs uppercase tracking-[0.3em] text-amber-film/80">
        Scene Setup
      </p>
      <h2 className="mt-3 font-display text-4xl text-phosphor">{STRINGS.calibrate}</h2>
      <p className="mt-2 font-film text-sm text-white/50">{STRINGS.calibrateHint}</p>
      <div className="mt-8 h-1 w-48 overflow-hidden bg-white/10">
        <motion.div
          className="h-full bg-phosphor"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      <span className="mt-2 font-ui text-xs text-phosphor/60">{pct}%</span>
    </motion.div>
  )
}
