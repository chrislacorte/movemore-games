import templeSakura from '../img/backgrounds/temple-sakura.png'
import templePond from '../img/backgrounds/temple-pond.png'
import templeGate from '../img/backgrounds/temple-gate.png'
import templeCourtyard from '../img/backgrounds/temple-courtyard.png'

/** @deprecated — migrated to BACKGROUND_ID_KEY */
export const BACKGROUND_MODE_KEY = 'fruitSamuraiBackgroundMode'
export const BACKGROUND_ID_KEY = 'fruitSamuraiBackgroundId'

export const BACKGROUNDS = {
  webcam: {
    id: 'webcam',
    label: 'Webcam',
    type: 'webcam',
  },
  'temple-sakura': {
    id: 'temple-sakura',
    label: 'Sakura',
    type: 'image',
    image: templeSakura,
  },
  'temple-pond': {
    id: 'temple-pond',
    label: 'Zen Teich',
    type: 'image',
    image: templePond,
  },
  'temple-gate': {
    id: 'temple-gate',
    label: 'Tempeltor',
    type: 'image',
    image: templeGate,
  },
  'temple-courtyard': {
    id: 'temple-courtyard',
    label: 'Innenhof',
    type: 'image',
    image: templeCourtyard,
  },
}

export const BACKGROUND_LIST = Object.values(BACKGROUNDS)

export const DEFAULT_BACKGROUND_ID = 'webcam'

export function isWebcamBackground(id) {
  return !id || id === 'webcam'
}

export function resolveBackgroundId(saved) {
  if (saved && BACKGROUNDS[saved]) return saved

  const legacy = localStorage.getItem(BACKGROUND_MODE_KEY)
  if (legacy === 'fixed') return 'temple-sakura'

  return DEFAULT_BACKGROUND_ID
}
