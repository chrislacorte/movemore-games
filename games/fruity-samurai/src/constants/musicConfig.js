export const MUSIC_STORAGE_KEYS = {
  introMuted: 'fruitySamuraiIntroMusicMuted',
  gameplayMuted: 'fruitySamuraiGameplayMusicMuted',
  gameplayTrackId: 'fruitySamuraiGameplayTrackId',
}

export const INTRO_TRACK = {
  id: 'ronin',
  label: 'Blade of the Ronin',
  shortLabel: 'Ronin',
  url: '/music/blade-of-the-ronin.mp3',
}

export const GAMEPLAY_TRACKS = [
  {
    id: 'serenity',
    label: 'Blade of Serenity',
    shortLabel: 'Serenity',
    url: '/music/blade-of-serenity.mp3',
  },
  {
    id: 'unwavering',
    label: 'Blade of the Unwavering Spirit',
    shortLabel: 'Unwavering',
    url: '/music/blade-of-unwavering-spirit.mp3',
  },
  {
    id: 'fruity-path',
    label: 'Path of the Fruity Samurai',
    shortLabel: 'Fruity Path',
    url: '/music/path-of-the-fruity-samurai.mp3',
  },
]

export const DEFAULT_GAMEPLAY_TRACK_ID = 'serenity'

export const MUSIC_VOLUME = {
  intro: 0.45,
  gameplay: 0.42,
}

export function resolveGameplayTrackId(saved) {
  if (saved && GAMEPLAY_TRACKS.some((track) => track.id === saved)) return saved
  return DEFAULT_GAMEPLAY_TRACK_ID
}

export function getGameplayTrack(trackId) {
  return (
    GAMEPLAY_TRACKS.find((track) => track.id === trackId) ??
    GAMEPLAY_TRACKS.find((track) => track.id === DEFAULT_GAMEPLAY_TRACK_ID)
  )
}

export function getNextGameplayTrackId(currentId) {
  const index = GAMEPLAY_TRACKS.findIndex((track) => track.id === currentId)
  const next = index < 0 ? 0 : (index + 1) % GAMEPLAY_TRACKS.length
  return GAMEPLAY_TRACKS[next].id
}

function loadBool(key, fallback) {
  const value = localStorage.getItem(key)
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

export function loadIntroMuted() {
  return loadBool(MUSIC_STORAGE_KEYS.introMuted, false)
}

export function loadGameplayMuted() {
  return loadBool(MUSIC_STORAGE_KEYS.gameplayMuted, false)
}

export function loadGameplayTrackId() {
  return resolveGameplayTrackId(localStorage.getItem(MUSIC_STORAGE_KEYS.gameplayTrackId))
}
