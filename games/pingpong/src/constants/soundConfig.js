export const SOUND_PATHS = {
  tableHit: `${import.meta.env.BASE_URL}sounds/table_hit.mp3`,
  paddleHit: `${import.meta.env.BASE_URL}sounds/paddle_hit.mp3`,
}

export const SOUND_VOLUME = {
  tableHit: 0.55,
  paddleHit: 0.65,
}

/** Minimum ms between repeated plays of the same sound */
export const SOUND_COOLDOWN_MS = 45
