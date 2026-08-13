export const SOUND_PATHS = {
  shoot: `${import.meta.env.BASE_URL}sounds/shoot.mp3`,
  bird: `${import.meta.env.BASE_URL}sounds/bird.mp3`,
}

export const SOUND_VOLUME = {
  shoot: 0.7,
  bird: 0.5,
  birdHit: 0.45,
}

export const SOUND_COOLDOWN_MS = {
  shoot: 120,
  bird: 600,
  birdHit: 200,
}
