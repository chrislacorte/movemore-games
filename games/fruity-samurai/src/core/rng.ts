export function createSeededRandom(seed = 12345) {
  let s = seed >>> 0
  const next = () => {
    s = (1664525 * s + 1013904223) >>> 0
    return s / 4294967296
  }
  next.range = (min: number, max: number) => min + (max - min) * next()
  return next as (() => number) & { range: (min: number, max: number) => number }
}
