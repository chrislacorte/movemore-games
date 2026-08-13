import {
  INITIAL_LIVES,
  INITIAL_SPAWN_INTERVAL,
} from '../constants/gameConfig'
import { isMultiplayerMode } from '../constants/gameModes'

export function createBoard(id, xStart, xEnd) {
  return {
    id,
    xStart,
    xEnd,
    fruits: [],
    particles: [],
    trails: {},
    lastFingerPositions: {},
    score: 0,
    lives: INITIAL_LIVES,
    comboCount: 0,
    lastSliceTime: 0,
    comboDisplay: null,
    lastSpawnTime: 0,
    spawnInterval: INITIAL_SPAWN_INTERVAL,
    fruitSizeScale: 1,
    spawnBurst: 1,
    bombChance: 0,
    coopTarget: null,
    coopRevealing: false,
    coopRevealUntil: 0,
    coopActive: false,
  }
}

export function createBoardsForMode(modeId) {
  if (isMultiplayerMode(modeId)) {
    return [createBoard(0, 0, 0.5), createBoard(1, 0.5, 1)]
  }
  return [createBoard(0, 0, 1)]
}

export function getBoardPixelRegion(board, canvasWidth) {
  const boardLeft = canvasWidth * board.xStart
  const boardWidth = canvasWidth * (board.xEnd - board.xStart)
  return {
    xRegionStart: boardLeft + boardWidth * 0.2,
    xRegionWidth: boardWidth * 0.6,
    boardLeft,
    boardWidth,
    dividerX: canvasWidth * board.xEnd,
  }
}

export function resolveBoardForHand(hand, boards, isMultiplayer) {
  if (!isMultiplayer || boards.length < 2) return boards[0]
  return hand.x < 0.5 ? boards[0] : boards[1]
}

export function playerLabel(boardId) {
  return `player${boardId}`
}

export function playerHandLabel(boardId, handLabel) {
  return `${playerLabel(boardId)}_${handLabel}`
}
