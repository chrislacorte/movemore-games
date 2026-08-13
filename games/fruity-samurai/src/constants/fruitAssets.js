export const FRUIT_CONFIGS = {
  apple: { color: '#e53935', radius: 58 },
  banana: { color: '#fdd835', radius: 72 },
  blueberry: { color: '#3949ab', radius: 48 },
  cherry: { color: '#c62828', radius: 52 },
  grape: { color: '#8e24aa', radius: 62 },
  kiwi: { color: '#7cb342', radius: 58 },
  lemon: { color: '#ffee58', radius: 56 },
  lime: { color: '#aed581', radius: 54 },
  orange: { color: '#ff9800', radius: 60 },
  peach: { color: '#ff7043', radius: 58 },
  pear: { color: '#9ccc65', radius: 62 },
  raspberry: { color: '#e91e63', radius: 50 },
  strawberry: { color: '#f44336', radius: 54 },
  bomb: { color: '#333333', radius: 55, isBomb: true },
}

export const FRUIT_TYPES = Object.keys(FRUIT_CONFIGS).filter((type) => type !== 'bomb')

/** Per-spawn size jitter multiplied with level/mode scale */
export const FRUIT_RANDOM_SIZE_MIN = 0.68
export const FRUIT_RANDOM_SIZE_MAX = 1.38

export function randomFruitSizeMultiplier() {
  return (
    FRUIT_RANDOM_SIZE_MIN +
    Math.random() * (FRUIT_RANDOM_SIZE_MAX - FRUIT_RANDOM_SIZE_MIN)
  )
}

export const FRUIT_IMAGE_FILES = {
  apple: 'apple.png',
  banana: 'banana.png',
  blueberry: 'blueberry.png',
  cherry: 'cherry.png',
  grape: 'grape.png',
  kiwi: 'kiwi.png',
  lemon: 'lemon.png',
  lime: 'lime.png',
  orange: 'orange.png',
  peach: 'peach.png',
  pear: 'pear.png',
  raspberry: 'raspberry.png',
  strawberry: 'strawberry.png',
}
