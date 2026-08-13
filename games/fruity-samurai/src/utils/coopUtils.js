import {
  COOP_GLASS_CAPACITY,
  COOP_REVEAL_MS,
  COOP_WRONG_PENALTY,
} from '../constants/gameConfig'

export function pickCoopTarget(fruitTypes, excludeTypes = []) {
  const pool = fruitTypes.filter((type) => !excludeTypes.includes(type))
  if (!pool.length) return fruitTypes[0]
  return pool[Math.floor(Math.random() * pool.length)]
}

export function initCoopTargets(boards, fruitTypes, now = performance.now()) {
  const target0 = pickCoopTarget(fruitTypes)
  const target1 = pickCoopTarget(fruitTypes, [target0])
  boards[0].coopTarget = target0
  boards[1].coopTarget = target1
  startCoopRevealForBoard(boards[0], now)
  startCoopRevealForBoard(boards[1], now)
}

export function startCoopRevealForBoard(board, now = performance.now()) {
  board.coopRevealing = true
  board.coopRevealUntil = now + COOP_REVEAL_MS
  board.coopActive = false
}

export function advanceCoopTarget(board, fruitTypes, otherBoard) {
  const exclude = otherBoard?.coopTarget ? [otherBoard.coopTarget] : []
  board.coopTarget = pickCoopTarget(fruitTypes, exclude)
}

export function updateCoopRevealState(board, now) {
  if (!board.coopRevealing) return
  if (now >= board.coopRevealUntil) {
    board.coopRevealing = false
    board.coopActive = true
  }
}

export function handleCoopSlice(board, fruit, state, fruitTypes, otherBoard, now) {
  if (!board.coopActive || board.coopRevealing) return false

  if (fruit.type === board.coopTarget) {
    state.glassFill = Math.min(COOP_GLASS_CAPACITY, state.glassFill + 1)
    board.score += 1
    advanceCoopTarget(board, fruitTypes, otherBoard)
    startCoopRevealForBoard(board, now)
    return 'correct'
  }

  state.glassFill = Math.max(0, state.glassFill - COOP_WRONG_PENALTY)
  return 'wrong'
}

export function isCoopComplete(state) {
  return state.glassFill >= COOP_GLASS_CAPACITY
}
