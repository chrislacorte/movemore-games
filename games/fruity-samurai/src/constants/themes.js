import {
  getBackground,
  getDefaultBackgroundForTheme,
  BACKGROUND_STORAGE_KEY,
  resolveBackgroundId,
} from './backgrounds'

export const THEME_STORAGE_KEY = 'fruitySamuraiTheme'

export const THEMES = {
  ghibli: {
    id: 'ghibli',
    label: 'Artwork',
  },
  authentic: {
    id: 'authentic',
    label: 'Authentic',
  },
  cinematic: {
    id: 'cinematic',
    label: 'Cinematic',
  },
}

export const THEME_LIST = Object.values(THEMES).map((theme) => ({
  ...theme,
  preview: getBackground(getDefaultBackgroundForTheme(theme.id)).preview,
}))

export const DEFAULT_THEME_ID = 'authentic'

export function resolveThemeId(saved) {
  if (saved && THEMES[saved]) return saved
  return DEFAULT_THEME_ID
}

export function getThemePreview(themeId) {
  return getBackground(getDefaultBackgroundForTheme(themeId)).preview
}

export function getThemeDefaultBackgroundId(themeId) {
  return getDefaultBackgroundForTheme(themeId)
}

export { BACKGROUND_STORAGE_KEY, resolveBackgroundId }
