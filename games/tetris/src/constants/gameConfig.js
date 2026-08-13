export const CAMERA_WIDTH = 640
export const CAMERA_HEIGHT = 480

export const HAND_STALE_MS = 160
export const HAND_FILTER_MIN_CUTOFF = 2.0
export const HAND_FILTER_BETA = 0.1
export const HAND_MIN_DETECTION_CONFIDENCE = 0.5
export const HAND_MIN_PRESENCE_CONFIDENCE = 0.5
export const HAND_MIN_TRACKING_CONFIDENCE = 0.5

export const LM = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_TIP: 8,
  INDEX_PIP: 6,
  MIDDLE_TIP: 12,
  MIDDLE_PIP: 10,
  RING_TIP: 16,
  RING_PIP: 14,
  PINKY_TIP: 20,
  PINKY_PIP: 18,
  INDEX_MCP: 5,
  MIDDLE_MCP: 9,
  RING_MCP: 13,
  PINKY_MCP: 17,
}

export const PALM_GAIN = 1.35
export const PALM_SMOOTHING = 0.55
export const PLAY_PADDING = 0.08

export const GESTURE_COOLDOWN_MS = 350

export const NUM_HANDS = 2
export const DROP_VELOCITY_THRESHOLD = 0.65
export const SOFT_DROP_MULTIPLIER = 14

export const COLS = 10
export const ROWS = 20
export const BUFFER_ROWS = 2
export const TOTAL_ROWS = ROWS + BUFFER_ROWS

export const LOCK_DELAY_MS = 400
export const BASE_FALL_MS = 450
export const MIN_FALL_MS = 60
export const MAX_FALL_STEPS_PER_TICK = 6
export const LINES_PER_LEVEL = 10

export const GAME_PHASES = {
  INTRO: 'intro',
  CALIBRATE: 'calibrate',
  PLAY: 'play',
  GAME_OVER: 'gameOver',
}

export const CALIBRATION = { holdMs: 1200 }
export const INTRO_COUNTDOWN = { stepMs: 900 }

export const WASM_PATH = '/tetris/mediapipe/wasm'
export const MODEL_PATH = '/tetris/mediapipe/models/hand_landmarker.task'
