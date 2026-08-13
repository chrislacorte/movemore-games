export const PLAY_PADDING = 0.06

export const LM = { INDEX_TIP: 8 }

export const HEAD_GAIN = 1.35
export const HEAD_SMOOTHING = 0.55
export const DIRECTION_DEAD_ZONE = 0.04

export const SLOW_MO_SCALE = 0.3
export const SLOW_MO_MS = 800

export const GAME_PHASES = {
  INTRO: 'intro',
  CALIBRATE: 'calibrate',
  PLAY: 'play',
  LEVEL_UP: 'levelUp',
  GAME_OVER: 'gameOver',
}

export const CALIBRATION = { holdMs: 1200 }
export const INTRO_COUNTDOWN = { stepMs: 900 }
export const LEVEL_UP_CARD_MS = 2200

export const HAND_LOST_MS = 2500

export const SCORE = {
  pellet: 10,
  powerPellet: 50,
  ghost: [200, 400, 800, 1600],
}

export const POWER_MODE_MS = 7000
export const MODE_CYCLE_MS = 7000

export const GHOST_RELEASE_MS = [0, 2000, 4000, 6000]

export const DIRECTIONS = {
  up: { dc: 0, dr: -1 },
  down: { dc: 0, dr: 1 },
  left: { dc: -1, dr: 0 },
  right: { dc: 1, dr: 0 },
}

export const OPPOSITE = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

export const LEVELS = [
  {
    id: 1,
    title: 'FIRST TAKE',
    subtitle: 'Learn the maze',
    pacmanSpeed: 4.2,
    ghostSpeed: 3.2,
    frightenedSpeed: 2.4,
    frightenedDurationMs: 7000,
  },
  {
    id: 2,
    title: 'CHASE SCENE',
    subtitle: 'Ghosts pick up pace',
    pacmanSpeed: 4.6,
    ghostSpeed: 3.6,
    frightenedSpeed: 2.6,
    frightenedDurationMs: 6500,
  },
  {
    id: 3,
    title: 'RUNNING REEL',
    subtitle: 'No room for mistakes',
    pacmanSpeed: 5.0,
    ghostSpeed: 4.0,
    frightenedSpeed: 2.8,
    frightenedDurationMs: 6000,
  },
  {
    id: 4,
    title: 'FINAL CUT',
    subtitle: 'Survive the swarm',
    pacmanSpeed: 5.4,
    ghostSpeed: 4.4,
    frightenedSpeed: 3.0,
    frightenedDurationMs: 5500,
  },
]

export function getLevel(index) {
  if (index < LEVELS.length) return LEVELS[index]
  const last = LEVELS[LEVELS.length - 1]
  const extra = index - LEVELS.length + 1
  return {
    ...last,
    id: last.id + extra,
    title: `ENCORE ${extra}`,
    subtitle: 'Endless chase',
    pacmanSpeed: last.pacmanSpeed + extra * 0.2,
    ghostSpeed: last.ghostSpeed + extra * 0.15,
    frightenedSpeed: last.frightenedSpeed + extra * 0.1,
    frightenedDurationMs: Math.max(4000, last.frightenedDurationMs - extra * 200),
  }
}
