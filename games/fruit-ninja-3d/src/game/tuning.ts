export type GameMode = 'classic' | 'arcade' | 'zen'

export interface ModeDef {
  id: GameMode
  title: string
  tagline: string
  /** seconds, 0 = until lives are gone */
  duration: number
  lives: number
  bombs: boolean
  /** bomb hit ends the game (classic) vs. costs points (arcade) */
  bombIsFatal: boolean
  /** overall pace multiplier */
  pace: number
}

export const MODES: Record<GameMode, ModeDef> = {
  classic: {
    id: 'classic',
    title: 'Classic',
    tagline: '3 lives · bombs end the run',
    duration: 0,
    lives: 3,
    bombs: true,
    bombIsFatal: true,
    pace: 1,
  },
  arcade: {
    id: 'arcade',
    title: 'Arcade',
    tagline: '60 seconds · combos rule · bombs cost points',
    duration: 60,
    lives: 0,
    bombs: true,
    bombIsFatal: false,
    pace: 1.25,
  },
  zen: {
    id: 'zen',
    title: 'Zen',
    tagline: '90 seconds · no bombs · just flow',
    duration: 90,
    lives: 0,
    bombs: false,
    bombIsFatal: false,
    pace: 0.95,
  },
}

export const TUNING = {
  gravity: 15,
  /** base world radius of a size-1 fruit */
  fruitRadius: 0.95,
  /** points */
  fruitPoints: 10,
  criticalBonus: 30,
  criticalChance: 0.06,
  comboBonusPerFruit: 10,
  bombPenalty: 50,
  /** slices within this window count as one combo */
  comboWindow: 0.42,
  /** minimum fruits for a combo */
  comboMin: 3,
  /** seconds between waves at level 0 → level max */
  waveIntervalStart: 2.1,
  waveIntervalEnd: 0.75,
  levelSeconds: 14,
  maxLevel: 9,
  bombChanceStart: 0.05,
  bombChanceEnd: 0.2,
  /** juice droplets per slice */
  juiceCount: 34,
}
