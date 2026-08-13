export const LEVELS = [
  {
    id: 1,
    title: 'THE OPENING',
    subtitle: 'Tutorial pace',
    gridCols: 12,
    gridRows: 8,
    foodTarget: 5,
    segmentSpacing: 0.045,
    speedMultiplier: 1.0,
  },
  {
    id: 2,
    title: 'TIGHT FRAME',
    subtitle: 'Closer quarters',
    gridCols: 14,
    gridRows: 10,
    foodTarget: 7,
    segmentSpacing: 0.04,
    speedMultiplier: 1.1,
  },
  {
    id: 3,
    title: 'RUNNING REEL',
    subtitle: 'Pick up the pace',
    gridCols: 16,
    gridRows: 12,
    foodTarget: 9,
    segmentSpacing: 0.036,
    speedMultiplier: 1.2,
  },
  {
    id: 4,
    title: 'WIDE SHOT',
    subtitle: 'More room to roam',
    gridCols: 18,
    gridRows: 12,
    foodTarget: 11,
    segmentSpacing: 0.033,
    speedMultiplier: 1.3,
  },
  {
    id: 5,
    title: 'THE ENDING',
    subtitle: 'Final reel',
    gridCols: 20,
    gridRows: 14,
    foodTarget: 15,
    segmentSpacing: 0.03,
    speedMultiplier: 1.45,
  },
]

export function getLevel(index) {
  if (index < LEVELS.length) return LEVELS[index]
  const last = LEVELS[LEVELS.length - 1]
  const extra = index - LEVELS.length + 1
  return {
    ...last,
    id: last.id + extra,
    title: 'ENDLESS REEL',
    subtitle: `Take ${extra}`,
    foodTarget: last.foodTarget + 3,
    segmentSpacing: Math.max(0.022, last.segmentSpacing - 0.002 * extra),
    speedMultiplier: last.speedMultiplier + 0.08 * extra,
  }
}
