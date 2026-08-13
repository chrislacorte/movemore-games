/** 19×21 Pac-Man-inspired maze. # wall · . pellet · o power · space tunnel · P start · G ghost pen */
export const MAZE_LAYOUT = [
  '###################',
  '#.................#',
  '#.###.#####.###...#',
  '#.#...#...#...#...#',
  '#.#.###.#.###.#...#',
  '#.#.....#.....#...#',
  '#.#####.#####.#...#',
  '#.....#.....#.....#',
  '###.###.###.#.#####',
  ' ................. ',
  '#.###.#####.###.###',
  '#...#.......#...#.#',
  '#.###.# ### #.###.#',
  '#.....#  P  #.....#',
  '#.###.#####.###.###',
  '#...#.......#...#.#',
  '#.###.#####.###.###',
  '#........G........#',
  '#.###.#####.###.###',
  '#o..#.......#..o..#',
  '###################',
]

export const TILE = {
  WALL: 'wall',
  PELLET: 'pellet',
  POWER: 'power',
  EMPTY: 'empty',
}

export const GHOST_COLORS = {
  blinky: '#ff0000',
  pinky: '#ffb8ff',
  inky: '#00ffff',
  clyde: '#ffb852',
}

export const SCATTER_TARGETS = {
  blinky: { col: 17, row: 1 },
  pinky: { col: 1, row: 1 },
  inky: { col: 17, row: 19 },
  clyde: { col: 1, row: 19 },
}
