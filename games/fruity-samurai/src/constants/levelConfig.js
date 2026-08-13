export const LEVEL_COUNT = 10

const SCORE_TARGETS = [100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250]

export const LEVELS = SCORE_TARGETS.map((scoreTarget, index) => {
  const level = index + 1
  return {
    level,
    scoreTarget,
    spawnInterval: Math.max(600, 2200 - level * 155),
    sizeScale: Math.max(0.72, 1 - (level - 1) * 0.028),
    spawnBurst: level >= 6 ? 2 : 1,
    bombChance: level >= 4 ? Math.min(0.28, 0.06 + level * 0.022) : 0,
  }
})

export function getLevelConfig(level) {
  return LEVELS[Math.min(Math.max(level, 1), LEVEL_COUNT) - 1]
}

export function getLevelNoticeText(level) {
  return `Level ${level}`
}

export function getLevelSubtitle(level) {
  const cfg = getLevelConfig(level)
  return `Target: ${cfg.scoreTarget} pts · Fruits ${Math.round(cfg.sizeScale * 100)}%`
}
