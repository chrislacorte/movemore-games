import { motion } from 'framer-motion'
import GameCard from './GameCard'
import { gamesByCategory } from '../data/games'

export default function GameCategorySection({ category, sectionIndex }) {
  const games = gamesByCategory(category.id)
  if (games.length === 0) return null

  const cardOffset = sectionIndex * 100

  return (
    <section className={sectionIndex > 0 ? 'mt-16 sm:mt-20' : ''}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + sectionIndex * 0.1, duration: 0.45 }}
        className="mb-8"
      >
        <h2
          className={`font-display text-3xl tracking-wide sm:text-4xl ${
            category.id === 'retrogames'
              ? 'text-phosphor'
              : 'text-white'
          }`}
        >
          {category.title}
        </h2>
        <p className="mt-2 max-w-2xl font-body text-sm text-white/55 sm:text-base">
          {category.description}
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
      >
        {games.map((game, index) => (
          <GameCard
            key={game.id}
            game={game}
            index={cardOffset + index}
          />
        ))}
      </motion.div>
    </section>
  )
}
