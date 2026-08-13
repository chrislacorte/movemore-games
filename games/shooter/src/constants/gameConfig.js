/** Matches chickenshooter camera_helper (1280×720). */
export const CAMERA_WIDTH = 1280
export const CAMERA_HEIGHT = 720
export const CAMERA_ASPECT = CAMERA_WIDTH / CAMERA_HEIGHT

export const HAND_STALE_MS = 160
export const HAND_FILTER_MIN_CUTOFF = 2.0
export const HAND_FILTER_BETA = 0.1
export const HAND_MIN_DETECTION_CONFIDENCE = 0.5
export const HAND_MIN_PRESENCE_CONFIDENCE = 0.5
export const HAND_MIN_TRACKING_CONFIDENCE = 0.5

/** MediaPipe hand landmark indices */
export const LM = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  PINKY_MCP: 17,
  PINKY_TIP: 20,
}

/**
 * Aiming: the index fingertip drives the crosshair. The reachable hand range is
 * smaller than the screen, so we expand it around the center and clamp.
 */
export const CROSSHAIR_GAIN = 1.4
export const CROSSHAIR_X_MIN = 0.03
export const CROSSHAIR_X_MAX = 0.97
export const CROSSHAIR_Y_MIN = 0.04
export const CROSSHAIR_Y_MAX = 0.96
export const CROSSHAIR_SMOOTHING = 0.45

/**
 * Fire gesture (chickenshooter): pinch thumb tip (4) + index tip (8).
 * distance < PINCH_THRESHOLD triggers shoot; PINCH_COOLDOWN_MS between shots.
 */
export {
  PINCH_THRESHOLD,
  PINCH_COOLDOWN_MS,
} from '../utils/chickenShooterTracking'

/** Targets (Moorhuhn-style birds flying across the scene) */
export const TARGET_SPAWN_INTERVAL_MS = 1050
export const TARGET_MAX = 6
export const TARGET_MIN_SPEED = 0.1
export const TARGET_MAX_SPEED = 0.24
export const TARGET_MIN_SIZE = 0.055
export const TARGET_MAX_SIZE = 0.095
export const TARGET_Y_MIN = 0.12
export const TARGET_Y_MAX = 0.6
export const TARGET_BOB_AMP = 0.045
export const TARGET_BOB_SPEED = 2.2
export const TARGET_HIT_RADIUS_SCALE = 1.2
export const TARGET_DEATH_MS = 700

export const MUZZLE_FLASH_MS = 100
export const HIT_MARKER_MS = 750

export const GAME_PHASES = {
  INTRO: 'intro',
  CALIBRATE: 'calibrate',
  PLAY: 'play',
}

export const CALIBRATION = {
  holdMs: 1200,
}

export const LAYOUTS = {
  FULLSCREEN: 'fullscreen',
  SPLIT: 'split',
}
