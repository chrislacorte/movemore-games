import { motion } from 'framer-motion'
import GameCategorySection from './components/GameCategorySection'
import { CATEGORIES } from './data/games'

export default function App() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, var(--brand-glow), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(251,191,36,0.12), transparent)',
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="font-body text-xs font-semibold uppercase tracking-[0.35em] text-brand-primary">
            Motion-controlled games
          </p>
          <h1 className="mt-3 font-display text-5xl tracking-[0.12em] text-gradient sm:text-7xl">
            MoveMore Games
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-body text-sm text-white/60 sm:text-base">
            Play with your webcam. Hand and pose tracking power every game — no
            controller required.
          </p>
        </motion.header>

        <main className="mt-12 flex flex-1 flex-col justify-center sm:mt-16">
          {CATEGORIES.map((category, index) => (
            <GameCategorySection
              key={category.id}
              category={category}
              sectionIndex={index}
            />
          ))}
        </main>

        <footer className="mt-14 border-t border-white/10 pt-8 text-center">
          <p className="font-body text-xs text-white/45 sm:text-sm">
            Camera required · HTTPS only · Best on desktop or tablet with a webcam
          </p>
        </footer>
      </div>
    </div>
  )
}
