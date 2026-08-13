export const CAMERA_WIDTH = 640
export const CAMERA_HEIGHT = 480

export const HAND_STALE_MS = 160
export const HAND_FILTER_MIN_CUTOFF = 2.0
export const HAND_FILTER_BETA = 0.1
export const HAND_MIN_DETECTION_CONFIDENCE = 0.5
export const HAND_MIN_PRESENCE_CONFIDENCE = 0.5
export const HAND_MIN_TRACKING_CONFIDENCE = 0.5

export const LM = {
  INDEX_TIP: 8,
}

/** Play area padding (normalized 0–1) inside the CRT window */
export const PLAY_PADDING = 0.06

/** Expand hand range so edges are reachable */
export const HEAD_GAIN = 1.35
export const HEAD_SMOOTHING = 0.55

/** Base segment count at start */
export const BASE_SEGMENT_COUNT = 4

/** Collision radii (normalized to play area) */
export const HEAD_RADIUS = 0.018
export const SEGMENT_RADIUS = 0.014
export const FOOD_RADIUS = 0.016

/** Slow-mo on dramatic events */
export const SLOW_MO_SCALE = 0.3
export const SLOW_MO_MS = 800

export const GAME_PHASES = {
  INTRO: 'intro',
  CALIBRATE: 'calibrate',
  PLAY: 'play',
  LEVEL_UP: 'levelUp',
  GAME_OVER: 'gameOver',
}

export const CALIBRATION = {
  holdMs: 1200,
}

export const INTRO_COUNTDOWN = {
  stepMs: 900,
}

export const LEVEL_UP_CARD_MS = 2200

export const WASM_PATH = '/snake/mediapipe/wasm'
export const MODEL_PATH = '/snake/mediapipe/models/hand_landmarker.task'
