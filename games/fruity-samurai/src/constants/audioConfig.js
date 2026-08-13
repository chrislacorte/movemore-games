export const SWOOSH_SHEET_POOL_SIZE = 5

/** Fade-out before stopping a segment (ms) */
export const SWOOSH_FADE_OUT_MS = 55

/** Segment length (seconds) per swipe/slice — mapped from hand speed */
export const SWOOSH_SEGMENT = {
  swipe: {
    min: 0.18,
    max: 0.52,
    speedScale: 0.004,
    playheadAdvance: 0.38,
    pitchBase: 0.96,
    pitchSpeedScale: 0.0008,
    pitchMin: 0.9,
    pitchMax: 1.12,
  },
  slice: {
    min: 0.24,
    max: 0.62,
    speedScale: 0.0045,
    playheadAdvance: 0.42,
    pitchBase: 0.98,
    pitchSpeedScale: 0.001,
    pitchMin: 0.92,
    pitchMax: 1.14,
  },
  combo: {
    min: 0.3,
    max: 0.72,
    speedScale: 0.005,
    playheadAdvance: 0.48,
    pitchBase: 1,
    pitchSpeedScale: 0.0006,
    pitchMin: 0.94,
    pitchMax: 1.08,
  },
}

export const SWOOSH_VOLUMES = {
  swipe: 0.3,
  slice: 0.52,
  combo: 0.6,
}

export const SWOOSH_MIN_GAP_MS = {
  swipe: 55,
  slice: 75,
  combo: 100,
}

export const FRUIT_SLICE_POOL_SIZE = 4

export const SOUND_MIN_GAP_MS = {
  fruitSlice: 35,
  bomb: 200,
  gameOver: 500,
}

export const SOUND_VOLUMES = {
  fruitSlice: 0.62,
  bomb: 0.5,
  gameOver: 0.48,
}
