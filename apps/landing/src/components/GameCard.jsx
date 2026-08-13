import { motion } from 'framer-motion'
import DifficultyBadge from './DifficultyBadge'

const smoothEase = [0.25, 0.46, 0.45, 0.94]

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.12 + index * 0.12,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  hover: {
    y: -10,
    scale: 1.02,
    transition: { duration: 0.65, ease: smoothEase },
  },
}

const imageVariants = {
  visible: {
    scale: 1,
    transition: { duration: 0.75, ease: smoothEase },
  },
  hover: {
    scale: 1.14,
    transition: { duration: 0.75, ease: smoothEase },
  },
}

const overlayVariants = {
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: smoothEase },
  },
  hover: {
    opacity: 0.88,
    transition: { duration: 0.5, ease: smoothEase },
  },
}

export default function GameCard({ game, index }) {
  return (
    <motion.a
      href={game.href}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      aria-label={`Play ${game.title}`}
      className={`group relative flex min-h-[420px] cursor-pointer flex-col overflow-hidden rounded-2xl border no-underline shadow-card ${game.border}`}
      style={{ boxShadow: `0 0 50px -16px ${game.glow}` }}
    >
      {/* Background screenshot — zoom driven by card hover */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.img
          src={game.image}
          alt=""
          variants={imageVariants}
          className="h-full w-full object-cover will-change-transform"
          draggable={false}
        />
        <motion.div
          variants={overlayVariants}
          className={`absolute inset-0 bg-gradient-to-t ${game.accent} via-black/55 to-black/20`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/85 transition-opacity duration-700 ease-out group-hover:opacity-90" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <motion.span
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="rounded-full border border-white/20 bg-black/45 px-3 py-1 font-display text-xs tracking-widest text-white backdrop-blur-sm"
          >
            {game.badge}
          </motion.span>
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + index * 0.1 }}
            className="rounded-lg border border-white/15 bg-black/50 px-2.5 py-1.5 backdrop-blur-sm"
          >
            <DifficultyBadge
              level={game.difficultyLevel}
              label={game.difficulty}
            />
          </motion.div>
        </div>

        <div className="mt-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.45 }}
            className="font-display text-3xl tracking-wide text-white drop-shadow-lg sm:text-4xl"
          >
            {game.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 + index * 0.1, duration: 0.45 }}
            className="mt-2 font-body text-sm leading-relaxed text-white/75 sm:text-base"
          >
            {game.description}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 + index * 0.1 }}
            className="mt-2 font-body text-xs uppercase tracking-wider text-brand-primary"
          >
            {game.control}
          </motion.p>

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-primary to-cyan-400 px-6 py-3 font-display text-lg tracking-wide text-black shadow-lg shadow-cyan-500/20 transition group-hover:from-cyan-300 group-hover:to-brand-primary"
          >
            Play
          </motion.span>
        </div>
      </div>

      {/* Hover shine sweep */}
      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100">
        <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[200%]" />
      </div>
    </motion.a>
  )
}
