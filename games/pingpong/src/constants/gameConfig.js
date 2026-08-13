export const CAMERA_WIDTH = 640
export const CAMERA_HEIGHT = 480

export const POSE_STALE_MS = 120
/** MediaPipe inference throttle — avoids running pose on every rAF */
export const POSE_DETECT_INTERVAL_MS = 33
/** Webcam skeleton overlay refresh cap */
export const OVERLAY_INTERVAL_MS = 33
export const POSE_FILTER_MIN_CUTOFF = 2.5
export const POSE_FILTER_BETA = 0.12
export const POSE_MIN_VISIBILITY = 0.5
export const POSE_MIN_DETECTION_CONFIDENCE = 0.5
export const POSE_MIN_TRACKING_CONFIDENCE = 0.5

export const WIN_SCORE = 11

/** Normalized playfield bounds (x, y) */
export const TABLE_X_MIN = 0.08
export const TABLE_X_MAX = 0.92
export const TABLE_Y_MIN = 0.22
export const TABLE_Y_MAX = 0.78

export const BALL_RADIUS = 0.028
export const BALL_SPEED_Z_BASE = 0.55
export const BALL_SPEED_Z_MAX = 1.15
export const BALL_SPEED_BOOST_PER_RALLY = 0.04
export const BALL_WALL_BOUNCE = 0.92

export const PADDLE_W = 0.22
export const PADDLE_H = 0.14
export const PADDLE_MODEL_URL = `${import.meta.env.BASE_URL}models/ping_pong_paddle.glb`
/** Target max dimension after normalizing the GLB bounding box */
export const PADDLE_MODEL_BASE_SIZE = 1
/** Visual scale multiplier for the 3D paddle on screen */
export const PADDLE_MODEL_SCALE = 1.35
export const PADDLE_SMOOTHING = 0.28
export const PADDLE_EDGE_MARGIN = 0.06

export const PLAYER_PLANE_Z = 0.96
export const AI_PLANE_Z = 0.04

export const AI_PADDLE_SPEED = 2.8
export const AI_MISS_CHANCE = 0.12
export const AI_REACTION_JITTER = 0.035

export const FAR_SCALE = 0.35
export const NEAR_SCALE = 1.0

export const HIT_FLASH_MS = 180
export const SERVE_DELAY_MS = 900

export const VIEW_MODES = {
  BACKGROUND: 'background',
  PIP: 'pip',
}

export const GAME_PHASES = {
  INTRO: 'intro',
  CALIBRATE: 'calibrate',
  PLAY: 'play',
  WIN: 'win',
  LOSE: 'lose',
}

export const CALIBRATION = {
  holdMs: 1500,
  minVisibility: POSE_MIN_VISIBILITY,
}
