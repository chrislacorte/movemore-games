export const GAME_MODE_STORAGE_KEY = 'fruitySamuraiGameMode'

export const GAME_MODES = {
  challenge: {
    id: 'challenge',
    label: 'Challenge',
    description: 'Classic arcade — bombs, lives, rising difficulty.',
  },
  recipe: {
    id: 'recipe',
    label: 'Recipe',
    description: 'Slice the fruits in the recipe to fill the bottle.',
  },
  level: {
    id: 'level',
    label: 'Level Mode',
    description: 'Reach the score target across 10 levels.',
  },
  mp_free: {
    id: 'mp_free',
    label: 'Free Play',
    description: '2 players — slice fruits freely, score per player.',
    multiplayer: true,
    players: 2,
  },
  mp_challenge: {
    id: 'mp_challenge',
    label: '2P Challenge',
    description: '2 players — 3 minutes, most fruits sliced wins.',
    multiplayer: true,
    players: 2,
  },
  mp_coop: {
    id: 'mp_coop',
    label: 'Cooperate',
    description: '2 players — remember your fruit, fill the glass together.',
    multiplayer: true,
    players: 2,
  },
}

export const GAME_MODE_LIST = Object.values(GAME_MODES)
export const DEFAULT_GAME_MODE_ID = 'challenge'

export function isMultiplayerMode(modeId) {
  return Boolean(GAME_MODES[modeId]?.multiplayer)
}

export function resolveGameModeId(saved) {
  if (saved && GAME_MODES[saved]) return saved
  return DEFAULT_GAME_MODE_ID
}
