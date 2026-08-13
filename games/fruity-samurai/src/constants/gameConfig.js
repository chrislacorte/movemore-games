export const HIGHSCORE_KEY = 'fruitSamuraiHighscore'
export const HIGHSCORE_KEY_3D = 'fruitSamuraiHighscore3d'
export const RENDER_MODE_KEY = 'fruitSamuraiRenderMode'

export { FRUIT_TYPES } from './fruitAssets'

export const INITIAL_LIVES = 3
export const INITIAL_SPAWN_INTERVAL = 2000
export const MIN_SPAWN_INTERVAL = 800
export const SPAWN_INTERVAL_DECREASE = 10

export const COMBO_WINDOW_MS = 800
export const BASE_SLICE_POINTS = 10
export const MAX_BOMB_CHANCE = 0.3
export const BOMB_CHANCE_SCALE = 0.005

export const TRAIL_COLORS = {
  Right: '#fbbf24',
  Left: '#fde68a',
}

export const AUDIO_URLS = {
  swordSwooshSheet: '/sounds/sword-swish.mp3',
  fruitSlice: '/sounds/fruit-splash.mp3',
  bomb: '/sounds/explosion.wav',
  gameOver: '/music/shinobis-resolve.mp3',
}

export const SWIPE_SOUND_MIN_DISTANCE = 22

// Hand tracking / render performance
export const CAMERA_WIDTH = 640
export const CAMERA_HEIGHT = 480
export const HAND_FILTER_MIN_CUTOFF = 3.2
export const HAND_FILTER_BETA = 0.14
export const HAND_EXTRAPOLATION_MS = 110
export const TRAIL_MAX_POINTS = 28
export const TRAIL_LIFETIME_MS = 320
export const TRAIL_MIN_DISTANCE = 6
export const SLICE_SUBSTEPS = 5

// Multiplayer
export const MP_MAX_HANDS = 4
export const SP_MAX_HANDS = 2
export const MP_CHALLENGE_DURATION_MS = 180000
export const COOP_GLASS_CAPACITY = 10
export const COOP_REVEAL_MS = 1800
export const MP_BOMB_PENALTY = 3
export const COOP_WRONG_PENALTY = 1

export const MP_TRAIL_COLORS = {
  player0_Left: '#fde68a',
  player0_Right: '#fbbf24',
  player1_Left: '#93c5fd',
  player1_Right: '#60a5fa',
}
