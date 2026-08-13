import { assetPath } from '../utils/assetPath'

export const BACKGROUND_STORAGE_KEY = 'fruitySamuraiBackgroundId'
export const SCENE_STORAGE_KEY = 'fruitySamuraiSceneId'

export const WEBCAM_BACKGROUND_ID = 'webcam'

export const WEBCAM_BACKGROUND = {
  id: WEBCAM_BACKGROUND_ID,
  type: 'webcam',
  theme: null,
  scene: 'webcam',
  label: 'Webcam',
  description: 'Live camera feed as your background.',
}

export function isWebcamBackground(id) {
  return id === WEBCAM_BACKGROUND_ID
}

/** Three scene types — same layout across all visual styles */
export const SCENES = {
  'sakura-paradise': {
    id: 'sakura-paradise',
    label: 'Cherry Blossom Paradise',
    description:
      'Cherry trees left and right, petals drifting on the wind, layered mountains and sunset.',
  },
  'waterfall-lagoon': {
    id: 'waterfall-lagoon',
    label: 'Waterfall Lagoon',
    description: 'A serene lagoon fed by a river, waterfall receding into the misty depth.',
  },
  'holy-temple': {
    id: 'holy-temple',
    label: 'Holy Temple',
    description: 'A sacred shrine seen head-on, stone path leading into the distance.',
  },
}

export const SCENE_LIST = [
  SCENES['sakura-paradise'],
  SCENES['waterfall-lagoon'],
  SCENES['holy-temple'],
]

export const THEME_IDS = ['authentic', 'ghibli', 'cinematic']

const LEGACY_BACKGROUND_IDS = {
  'ghibli-temple': 'ghibli-holy-temple',
  'ghibli-sakura': 'ghibli-sakura-paradise',
  'ghibli-lagoon': 'ghibli-waterfall-lagoon',
  'ghibli-lagoon-mist': 'authentic-waterfall-lagoon',
  'authentic-shrine': 'authentic-holy-temple',
  'authentic-hanami': 'authentic-sakura-paradise',
  'cinematic-canyon': 'cinematic-sakura-paradise',
  'cinematic-gate': 'cinematic-holy-temple',
  'cinematic-waterfall': 'cinematic-waterfall-lagoon',
}

export const THEME_DEFAULT_SCENE = {
  authentic: 'sakura-paradise',
  ghibli: 'sakura-paradise',
  cinematic: 'sakura-paradise',
}

function bgPath(theme, scene) {
  return {
    image: assetPath(`backgrounds/${theme}/${scene}.webp`),
    preview: assetPath(`backgrounds/previews/${theme}/${scene}.webp`),
  }
}

function buildBackground(theme, sceneId) {
  const scene = SCENES[sceneId]
  const paths = bgPath(theme, sceneId)
  return {
    id: `${theme}-${sceneId}`,
    theme,
    scene: sceneId,
    label: scene.label,
    description: scene.description,
    ...paths,
  }
}

export const GAME_BACKGROUNDS = Object.fromEntries(
  THEME_IDS.flatMap((theme) =>
    SCENE_LIST.map((scene) => {
      const bg = buildBackground(theme, scene.id)
      return [bg.id, bg]
    })
  )
)

export const BACKGROUND_LIST = Object.values(GAME_BACKGROUNDS)

export function makeBackgroundId(themeId, sceneId) {
  return `${themeId}-${sceneId}`
}

export function getBackground(id) {
  if (isWebcamBackground(id)) return WEBCAM_BACKGROUND

  const migrated = LEGACY_BACKGROUND_IDS[id] ?? id
  return (
    GAME_BACKGROUNDS[migrated] ??
    GAME_BACKGROUNDS[makeBackgroundId('authentic', THEME_DEFAULT_SCENE.authentic)]
  )
}

export function getSceneIdFromBackground(id) {
  if (isWebcamBackground(id)) return 'webcam'
  return getBackground(id).scene
}

export function getBackgroundsForTheme(themeId) {
  return [
    WEBCAM_BACKGROUND,
    ...SCENE_LIST.map((scene) => getBackground(makeBackgroundId(themeId, scene.id))),
  ]
}

export function getDefaultBackgroundForTheme(themeId) {
  const scene = THEME_DEFAULT_SCENE[themeId] ?? THEME_DEFAULT_SCENE.authentic
  return makeBackgroundId(themeId, scene)
}

export function resolveBackgroundId(saved, themeId) {
  if (saved === WEBCAM_BACKGROUND_ID) return WEBCAM_BACKGROUND_ID

  const migrated = saved ? LEGACY_BACKGROUND_IDS[saved] ?? saved : null
  if (migrated && GAME_BACKGROUNDS[migrated]) return migrated
  return getDefaultBackgroundForTheme(themeId ?? 'authentic')
}

export function resolveSceneId(saved, themeId) {
  if (saved && SCENES[saved]) return saved
  const bg = resolveBackgroundId(localStorage.getItem(BACKGROUND_STORAGE_KEY), themeId)
  return getBackground(bg).scene
}

export function preloadBackgroundImage(id) {
  const bg = getBackground(id)
  return loadBackgroundImage(bg.image)
}

const imageCache = new Map()

export function loadBackgroundImage(src) {
  if (imageCache.has(src)) return imageCache.get(src)

  const promise = new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

  imageCache.set(src, promise)
  return promise
}

export { drawSceneOverlay } from './sceneOverlay'
