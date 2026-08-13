/**
 * Trace templates. Each template has:
 *  - id, label, emoji (used in the picker)
 *  - kind: 'shape' | 'letter'
 *  - strokes: array of polylines; each polyline is an array of [x, y]
 *    points normalized to a 0..1 square (y grows downwards).
 */

const PI = Math.PI

function arc(cx, cy, rx, ry, a0, a1, steps = 18) {
  const pts = []
  for (let i = 0; i <= steps; i += 1) {
    const a = a0 + ((a1 - a0) * i) / steps
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)])
  }
  return pts
}

function star() {
  const pts = []
  const cx = 0.5
  const cy = 0.54
  const R = 0.46
  const r = 0.19
  for (let i = 0; i <= 10; i += 1) {
    const a = -PI / 2 + (i * PI) / 5
    const rad = i % 2 === 0 ? R : r
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)])
  }
  return pts
}

function heart() {
  const pts = []
  for (let i = 0; i <= 44; i += 1) {
    const t = (i / 44) * 2 * PI
    const x = 16 * Math.sin(t) ** 3
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)
    pts.push([0.5 + (x / 17) * 0.48, 0.45 - (y / 17) * 0.48])
  }
  return pts
}

export const SHAPES = [
  {
    id: 'circle',
    label: 'Kreis',
    emoji: '⭕',
    kind: 'shape',
    strokes: [arc(0.5, 0.5, 0.42, 0.42, -PI / 2, (3 * PI) / 2, 32)],
  },
  {
    id: 'triangle',
    label: 'Dreieck',
    emoji: '🔺',
    kind: 'shape',
    strokes: [[[0.5, 0.08], [0.92, 0.88], [0.08, 0.88], [0.5, 0.08]]],
  },
  {
    id: 'square',
    label: 'Quadrat',
    emoji: '🟦',
    kind: 'shape',
    strokes: [[[0.12, 0.12], [0.88, 0.12], [0.88, 0.88], [0.12, 0.88], [0.12, 0.12]]],
  },
  {
    id: 'star',
    label: 'Stern',
    emoji: '⭐',
    kind: 'shape',
    strokes: [star()],
  },
  {
    id: 'heart',
    label: 'Herz',
    emoji: '❤️',
    kind: 'shape',
    strokes: [heart()],
  },
  {
    id: 'house',
    label: 'Haus',
    emoji: '🏠',
    kind: 'shape',
    strokes: [
      [[0.15, 0.5], [0.5, 0.12], [0.85, 0.5], [0.85, 0.92], [0.15, 0.92], [0.15, 0.5]],
    ],
  },
  {
    id: 'lightning',
    label: 'Blitz',
    emoji: '⚡',
    kind: 'shape',
    strokes: [
      [[0.62, 0.04], [0.3, 0.52], [0.5, 0.52], [0.38, 0.96], [0.72, 0.44], [0.53, 0.44], [0.66, 0.04], [0.62, 0.04]],
    ],
  },
  {
    id: 'moon',
    label: 'Mond',
    emoji: '🌙',
    kind: 'shape',
    strokes: [
      arc(0.55, 0.5, 0.4, 0.46, -PI / 2, (-3 * PI) / 2, 22).concat(
        arc(0.7, 0.5, 0.35, 0.44, 2.01, 4.27, 18),
      ),
    ],
  },
]

const LETTER_STROKES = {
  A: [[[0.15, 1], [0.5, 0], [0.85, 1]], [[0.28, 0.62], [0.72, 0.62]]],
  B: [
    [[0.2, 0], [0.2, 1]],
    [[0.2, 0]].concat([[0.52, 0]], arc(0.52, 0.26, 0.26, 0.26, -PI / 2, PI / 2, 10), [[0.2, 0.52]]),
    [[0.2, 0.52]].concat([[0.55, 0.52]], arc(0.55, 0.76, 0.28, 0.24, -PI / 2, PI / 2, 10), [[0.2, 1]]),
  ],
  C: [arc(0.58, 0.5, 0.4, 0.47, 1.05, 5.23, 22)],
  D: [
    [[0.2, 0], [0.2, 1]],
    [[0.2, 0]].concat([[0.45, 0]], arc(0.45, 0.5, 0.38, 0.5, -PI / 2, PI / 2, 18), [[0.2, 1]]),
  ],
  E: [[[0.8, 0], [0.2, 0], [0.2, 1], [0.8, 1]], [[0.2, 0.5], [0.68, 0.5]]],
  F: [[[0.8, 0], [0.2, 0], [0.2, 1]], [[0.2, 0.5], [0.68, 0.5]]],
  G: [
    arc(0.55, 0.5, 0.4, 0.47, 5.23, 1.05, 22).concat([[0.78, 0.58], [0.55, 0.58]]),
  ],
  H: [[[0.2, 0], [0.2, 1]], [[0.8, 0], [0.8, 1]], [[0.2, 0.5], [0.8, 0.5]]],
  I: [[[0.35, 0], [0.65, 0]], [[0.5, 0], [0.5, 1]], [[0.35, 1], [0.65, 1]]],
  J: [
    [[0.35, 0], [0.75, 0]],
    [[0.6, 0], [0.6, 0.7]].concat(arc(0.42, 0.7, 0.18, 0.26, 0, PI, 10)),
  ],
  K: [[[0.2, 0], [0.2, 1]], [[0.8, 0], [0.2, 0.5], [0.8, 1]]],
  L: [[[0.2, 0], [0.2, 1], [0.8, 1]]],
  M: [[[0.12, 1], [0.12, 0], [0.5, 0.55], [0.88, 0], [0.88, 1]]],
  N: [[[0.2, 1], [0.2, 0], [0.8, 1], [0.8, 0]]],
  O: [arc(0.5, 0.5, 0.36, 0.48, -PI / 2, (3 * PI) / 2, 26)],
  P: [
    [[0.2, 1], [0.2, 0]],
    [[0.2, 0]].concat([[0.5, 0]], arc(0.5, 0.27, 0.3, 0.27, -PI / 2, PI / 2, 12), [[0.2, 0.54]]),
  ],
  Q: [
    arc(0.5, 0.5, 0.36, 0.48, -PI / 2, (3 * PI) / 2, 26),
    [[0.58, 0.72], [0.86, 1]],
  ],
  R: [
    [[0.2, 1], [0.2, 0]],
    [[0.2, 0]].concat([[0.5, 0]], arc(0.5, 0.27, 0.3, 0.27, -PI / 2, PI / 2, 12), [[0.2, 0.54]]),
    [[0.45, 0.54], [0.8, 1]],
  ],
  S: [
    [
      [0.78, 0.15], [0.62, 0.04], [0.4, 0.04], [0.24, 0.15], [0.22, 0.3], [0.32, 0.42],
      [0.5, 0.48], [0.68, 0.56], [0.78, 0.68], [0.75, 0.85], [0.6, 0.96], [0.38, 0.96], [0.22, 0.85],
    ],
  ],
  T: [[[0.15, 0], [0.85, 0]], [[0.5, 0], [0.5, 1]]],
  U: [
    [[0.2, 0], [0.2, 0.7]].concat(arc(0.5, 0.7, 0.3, 0.28, PI, 0, 14), [[0.8, 0]]),
  ],
  V: [[[0.15, 0], [0.5, 1], [0.85, 0]]],
  W: [[[0.1, 0], [0.3, 1], [0.5, 0.45], [0.7, 1], [0.9, 0]]],
  X: [[[0.2, 0], [0.8, 1]], [[0.8, 0], [0.2, 1]]],
  Y: [[[0.15, 0], [0.5, 0.5], [0.85, 0]], [[0.5, 0.5], [0.5, 1]]],
  Z: [[[0.2, 0], [0.8, 0], [0.2, 1], [0.8, 1]]],
}

export const LETTERS = Object.entries(LETTER_STROKES).map(([letter, strokes]) => ({
  id: `letter-${letter}`,
  label: letter,
  emoji: letter,
  kind: 'letter',
  strokes,
}))

export const TEMPLATES = [...SHAPES, ...LETTERS]

export function getTemplateById(id) {
  return TEMPLATES.find((t) => t.id === id) ?? null
}

export function nextTemplate(currentId) {
  const idx = TEMPLATES.findIndex((t) => t.id === currentId)
  return TEMPLATES[(idx + 1) % TEMPLATES.length]
}
