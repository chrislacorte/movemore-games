export const CAMERA_WIDTH = 640
export const CAMERA_HEIGHT = 480

export const HAND_STALE_MS = 160
export const HAND_FILTER_MIN_CUTOFF = 1.8
export const HAND_FILTER_BETA = 0.12
export const HAND_MIN_DETECTION_CONFIDENCE = 0.5
export const HAND_MIN_PRESENCE_CONFIDENCE = 0.5
export const HAND_MIN_TRACKING_CONFIDENCE = 0.5
export const NUM_HANDS = 1

export const LM = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_TIP: 12,
  RING_PIP: 14,
  RING_TIP: 16,
  PINKY_PIP: 18,
  PINKY_TIP: 20,
}

export const GAME_PHASES = {
  INTRO: 'intro',
  MODE_SELECT: 'modeSelect',
  PLAY: 'play',
}

export const MODES = {
  FREE: 'free',
  TRACE: 'trace',
}

export const BACKGROUNDS = {
  NIGHT: 'night',
  CAMERA: 'camera',
}

export const COLORS = [
  { id: 'white', hex: '#ffffff', label: 'Weiß' },
  { id: 'pink', hex: '#ff5c8a', label: 'Pink' },
  { id: 'orange', hex: '#ff9f1c', label: 'Orange' },
  { id: 'yellow', hex: '#ffe14d', label: 'Gelb' },
  { id: 'green', hex: '#6cff5c', label: 'Grün' },
  { id: 'cyan', hex: '#39d0ff', label: 'Blau' },
  { id: 'violet', hex: '#8b6cff', label: 'Lila' },
  { id: 'magenta', hex: '#ff5cf4', label: 'Magenta' },
]

export const STROKE_WIDTHS = [
  { id: 'thin', px: 5, label: 'Dünn' },
  { id: 'medium', px: 10, label: 'Mittel' },
  { id: 'thick', px: 18, label: 'Dick' },
]

/** How long a stroke point stays visible in "Magic Fade" mode. */
export const FADE_DURATION_MS = 4500

/** Coverage needed to complete a trace template. */
export const TRACE_SUCCESS_THRESHOLD = 0.75

/** Tolerance radius for template hits, relative to template render size. */
export const TRACE_TOLERANCE = 0.06

/** Number of sample points distributed along a template outline. */
export const TRACE_SAMPLE_COUNT = 110

/** Fraction of screen size the template guide occupies. */
export const TEMPLATE_AREA_SCALE = 0.62

export const WASM_PATH = '/lightpainter/mediapipe/wasm'
export const MODEL_PATH = '/lightpainter/mediapipe/models/hand_landmarker.task'
