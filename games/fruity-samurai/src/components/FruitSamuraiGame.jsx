import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { Fruit } from '../classes/Fruit';
import { Particle } from '../classes/Particle';
import IntroScreen from './IntroScreen';
import SceneBackground from './SceneBackground';
import SceneSlider from './SceneSlider';
import GameplayHUD from './GameplayHUD';
import MultiplayerHUD from './MultiplayerHUD';
import RecipeHUD from './RecipeHUD';
import CoopTargetReveal from './CoopTargetReveal';
import MultiplayerResults from './MultiplayerResults';
import LevelToast from './LevelToast';
import { useGameAudio } from '../hooks/useGameAudio';
import { useGameMusic } from '../hooks/useGameMusic';
import { useGameInput, POINTER_LABEL } from '../hooks/useGameInput';
import { detectHandMotion, getHandMotion } from '../utils/handMotion';
import { pushTrailPoint, pruneTrail, drawHandTrail } from '../utils/trailUtils';
import { lineIntersectsRect, domRectToCanvas } from '../utils/geometry';
import { loadAllFruitImages } from '../utils/loadFruitImage';
import { FRUIT_IMAGE_FILES, FRUIT_TYPES, randomFruitSizeMultiplier } from '../constants/fruitAssets';
import { resolveThemeId, THEME_STORAGE_KEY, THEME_LIST, getThemeDefaultBackgroundId } from '../constants/themes';
import {
  BACKGROUND_STORAGE_KEY,
  GAME_BACKGROUNDS,
  getBackground,
  getBackgroundsForTheme,
  getSceneIdFromBackground,
  isWebcamBackground,
  makeBackgroundId,
  loadBackgroundImage,
  preloadBackgroundImage,
  resolveBackgroundId,
} from '../constants/backgrounds';
import {
  resolveGameModeId,
  GAME_MODE_STORAGE_KEY,
  isMultiplayerMode,
} from '../constants/gameModes';
import {
  getLevelConfig,
  getLevelNoticeText,
  getLevelSubtitle,
  LEVEL_COUNT,
} from '../constants/levelConfig';
import {
  createRecipe,
  getCurrentRecipeFruit,
  advanceRecipe,
  RECIPE_BOTTLE_CAPACITY,
} from '../utils/recipeUtils';
import {
  createBoardsForMode,
  getBoardPixelRegion,
  resolveBoardForHand,
  playerHandLabel,
} from '../utils/boardUtils';
import {
  initCoopTargets,
  updateCoopRevealState,
  handleCoopSlice,
  isCoopComplete,
} from '../utils/coopUtils';
import { STR } from '../constants/strings';
import {
  HIGHSCORE_KEY,
  INITIAL_LIVES,
  INITIAL_SPAWN_INTERVAL,
  MIN_SPAWN_INTERVAL,
  SPAWN_INTERVAL_DECREASE,
  COMBO_WINDOW_MS,
  BASE_SLICE_POINTS,
  MAX_BOMB_CHANCE,
  BOMB_CHANCE_SCALE,
  TRAIL_COLORS,
  MP_TRAIL_COLORS,
  SLICE_SUBSTEPS,
  CAMERA_WIDTH,
  CAMERA_HEIGHT,
  MP_CHALLENGE_DURATION_MS,
  MP_BOMB_PENALTY,
  MP_MAX_HANDS,
  SP_MAX_HANDS,
} from '../constants/gameConfig';

const INTRO_SPAWN_MS = 1400;
const LEVEL_NOTICE_MS = 2600;

const TRAIL_COLOR_MAP = {
  ...TRAIL_COLORS,
  ...MP_TRAIL_COLORS,
  [POINTER_LABEL]: '#fde68a',
};

function highscoreKey(mode) {
  return `${HIGHSCORE_KEY}_${mode}`;
}

function createInitialState(modeId) {
  const boards = createBoardsForMode(modeId);
  return {
    boards,
    phase: 'intro',
    isGameOver: false,
    highscore: 0,
    level: 1,
    levelNoticeUntil: 0,
    recipe: [],
    recipeIndex: 0,
    bottleFill: 0,
    mpTimerEnd: null,
    glassFill: 0,
    mpResult: null,
  };
}

const FruitSamuraiGame = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const inputLayerRef = useRef(null);
  const startButtonRef = useRef(null);
  const canvasSizeRef = useRef({ width: 1, height: 1 });
  const startButtonRectRef = useRef(null);
  const assetsRef = useRef({});
  const backgroundImageRef = useRef(null);
  const backgroundIdRef = useRef(null);

  const [themeId, setThemeId] = useState(() =>
    resolveThemeId(localStorage.getItem(THEME_STORAGE_KEY))
  );
  const [backgroundId, setBackgroundId] = useState(() => {
    const theme = resolveThemeId(localStorage.getItem(THEME_STORAGE_KEY));
    return resolveBackgroundId(localStorage.getItem(BACKGROUND_STORAGE_KEY), theme);
  });
  const [backgroundPickerOpen, setBackgroundPickerOpen] = useState(false);
  const [gameModeId, setGameModeId] = useState(() =>
    resolveGameModeId(localStorage.getItem(GAME_MODE_STORAGE_KEY))
  );

  const themeIdRef = useRef(themeId);
  const gameModeRef = useRef(gameModeId);
  const phaseRef = useRef('intro');

  useEffect(() => {
    themeIdRef.current = themeId;
  }, [themeId]);

  useEffect(() => {
    backgroundIdRef.current = backgroundId;
    if (isWebcamBackground(backgroundId)) {
      backgroundImageRef.current = null;
      return;
    }
    const bg = getBackground(backgroundId);
    loadBackgroundImage(bg.image)
      .then((img) => {
        if (backgroundIdRef.current === backgroundId) {
          backgroundImageRef.current = img;
        }
      })
      .catch(() => {});
    preloadBackgroundImage(backgroundId).catch(() => {});
  }, [backgroundId]);

  useEffect(() => {
    gameModeRef.current = gameModeId;
  }, [gameModeId]);

  useEffect(() => {
    loadAllFruitImages(FRUIT_IMAGE_FILES).then((images) => {
      assetsRef.current = images;
    });
  }, []);

  const hsKey = highscoreKey(gameModeId);
  const isMp = isMultiplayerMode(gameModeId);

  const gameStateRef = useRef({
    ...createInitialState(gameModeId),
    highscore: parseInt(localStorage.getItem(hsKey) || '0', 10),
  });

  const [uiState, setUiState] = useState({
    score: 0,
    highscore: parseInt(localStorage.getItem(hsKey) || '0', 10),
    lives: INITIAL_LIVES,
    isGameOver: false,
    phase: 'intro',
    combo: 0,
    comboVisible: false,
    level: 1,
    levelNotice: false,
    levelNoticeText: '',
    levelNoticeSub: '',
    recipe: [],
    recipeIndex: 0,
    bottleFill: 0,
    gameModeId,
    isMultiplayer: isMp,
    boards: [],
    mpTimerEnd: null,
    glassFill: 0,
    mpResult: null,
    now: performance.now(),
  });

  const {
    introMuted,
    gameplayMuted,
    gameplayTrack,
    toggleIntroMuted,
    toggleGameplayMuted,
    cycleGameplayTrack,
    unlockMusic,
  } = useGameMusic(uiState.phase);

  const { playSound, playFruitSliceSound, tryPlaySwipeSound } = useGameAudio({
    muted: introMuted || gameplayMuted,
  });

  const sliceInputActive =
    (uiState.phase === 'intro' || uiState.phase === 'playing') && !backgroundPickerOpen;

  const maxNumHands = isMp ? MP_MAX_HANDS : SP_MAX_HANDS;

  const { isReady, handsDataRef, error, cameraDenied, refreshHands, cameraReady } = useGameInput(
    videoRef,
    inputLayerRef,
    { pointerEnabled: sliceInputActive, maxNumHands }
  );

  const syncUI = useCallback(() => {
    const state = gameStateRef.current;
    const board0 = state.boards[0];
    const mode = gameModeRef.current;
    const mp = isMultiplayerMode(mode);

    if (!mp && board0.score > state.highscore) {
      state.highscore = board0.score;
      localStorage.setItem(hsKey, state.highscore.toString());
    }

    setUiState({
      score: board0.score,
      highscore: state.highscore,
      lives: board0.lives,
      isGameOver: state.isGameOver,
      phase: state.phase,
      combo: board0.comboCount,
      comboVisible: board0.comboDisplay !== null,
      level: mode === 'level' ? state.level : 0,
      levelNotice: state.levelNoticeUntil > performance.now(),
      levelNoticeText: getLevelNoticeText(state.level),
      levelNoticeSub: getLevelSubtitle(state.level),
      recipe: state.recipe,
      recipeIndex: state.recipeIndex,
      bottleFill: state.bottleFill,
      gameModeId: mode,
      isMultiplayer: mp,
      boards: state.boards.map((b) => ({
        id: b.id,
        score: b.score,
        lives: b.lives,
        coopRevealing: b.coopRevealing,
        coopTarget: b.coopTarget,
        coopRevealUntil: b.coopRevealUntil,
        xStart: b.xStart,
        xEnd: b.xEnd,
      })),
      mpTimerEnd: state.mpTimerEnd,
      glassFill: state.glassFill,
      mpResult: state.mpResult,
      now: performance.now(),
    });
  }, [hsKey]);

  const resetCombo = useCallback((board) => {
    board.comboCount = 0;
    board.lastSliceTime = 0;
    board.comboDisplay = null;
  }, []);

  const registerComboSlice = useCallback((board, timestamp) => {
    if (board.lastSliceTime > 0 && timestamp - board.lastSliceTime > COMBO_WINDOW_MS) {
      board.comboCount = 0;
    }
    board.comboCount += 1;
    board.lastSliceTime = timestamp;
    board.comboDisplay = { count: board.comboCount, expiresAt: timestamp + 1200 };
    return BASE_SLICE_POINTS * board.comboCount;
  }, []);

  const applyLevelConfig = useCallback((state, level) => {
    const cfg = getLevelConfig(level);
    state.level = level;
    const board = state.boards[0];
    board.spawnInterval = cfg.spawnInterval;
    board.fruitSizeScale = cfg.sizeScale;
    board.spawnBurst = cfg.spawnBurst;
    board.bombChance = cfg.bombChance;
  }, []);

  const initRecipe = useCallback((state) => {
    state.recipe = createRecipe(FRUIT_TYPES, RECIPE_BOTTLE_CAPACITY);
    state.recipeIndex = 0;
    state.bottleFill = 0;
  }, []);

  const pickFruitType = useCallback((state, board) => {
    const mode = gameModeRef.current;

    if (mode === 'recipe') {
      const needed = getCurrentRecipeFruit(state);
      if (needed && Math.random() < 0.55) return needed;
      return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    }

    if (mode === 'mp_coop' && board.coopActive && board.coopTarget) {
      if (Math.random() < 0.6) return board.coopTarget;
      return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    }

    if (mode === 'mp_free') {
      return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    }

    if (mode === 'mp_challenge') {
      const bombChance = Math.min(MAX_BOMB_CHANCE, board.score * BOMB_CHANCE_SCALE);
      if (Math.random() < bombChance) return 'bomb';
      return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    }

    if (Math.random() < board.bombChance) return 'bomb';
    return FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
  }, []);

  const spawnFruit = useCallback((board, width, height, options = {}) => {
    const state = gameStateRef.current;
    const mode = gameModeRef.current;
    let type = options.type;
    const region = getBoardPixelRegion(board, width);

    if (!type) {
      if (mode === 'challenge') {
        const score = board.score;
        const bombChance = Math.min(MAX_BOMB_CHANCE, score * BOMB_CHANCE_SCALE);
        type = Math.random() < bombChance ? 'bomb' : pickFruitType(state, board);
      } else {
        type = pickFruitType(state, board);
      }
    }

    const image = type !== 'bomb' ? assetsRef.current[type] || null : null;
    const baseScale = options.sizeScale ?? board.fruitSizeScale ?? 1;
    board.fruits.push(
      new Fruit(width, height, type, image, {
        sizeScale: baseScale * randomFruitSizeMultiplier(),
        xRegionStart: region.xRegionStart,
        xRegionWidth: region.xRegionWidth,
      })
    );
  }, [pickFruitType]);

  const createSplat = (board, x, y, color) => {
    const state = gameStateRef.current;
    const count = state.phase === 'intro' ? 8 : 22;
    for (let i = 0; i < count; i += 1) {
      const p = new Particle(x, y, color);
      if (state.phase === 'intro') p.decay *= 2.2;
      board.particles.push(p);
    }
  };

  const endMultiplayer = useCallback(
    (type, winner = null) => {
      const state = gameStateRef.current;
      state.phase = 'mp_results';
      state.mpResult = { type, winner };
      syncUI();
    },
    [syncUI]
  );

  const handleRecipeSlice = useCallback(
    (board, fruit, timestamp, motion) => {
      const state = gameStateRef.current;
      const needed = getCurrentRecipeFruit(state);
      if (fruit.type === needed) {
        advanceRecipe(state, FRUIT_TYPES);
        const points = registerComboSlice(board, timestamp);
        board.score += points;
        createSplat(board, fruit.x, fruit.y, fruit.color);
        playFruitSliceSound(board.comboCount, motion);
        syncUI();
        return true;
      }
      board.lives -= 1;
      createSplat(board, fruit.x, fruit.y, '#888');
      if (board.lives <= 0) {
        state.isGameOver = true;
        state.phase = 'gameover';
        playSound('gameOver', { force: true });
      }
      syncUI();
      return true;
    },
    [playFruitSliceSound, playSound, registerComboSlice, syncUI]
  );

  const handleChallengeSlice = useCallback(
    (board, fruit, timestamp, motion) => {
      const state = gameStateRef.current;
      if (fruit.isBomb) {
        resetCombo(board);
        board.lives -= 1;
        createSplat(board, fruit.x, fruit.y, '#FFFFFF');
        playSound('bomb');
        if (board.lives <= 0) {
          state.isGameOver = true;
          state.phase = 'gameover';
          playSound('gameOver', { force: true });
        }
        syncUI();
        return;
      }
      const points = registerComboSlice(board, timestamp);
      board.score += points;
      createSplat(board, fruit.x, fruit.y, fruit.color);
      playFruitSliceSound(board.comboCount, motion);
      syncUI();
    },
    [playFruitSliceSound, playSound, registerComboSlice, resetCombo, syncUI]
  );

  const handleMpChallengeSlice = useCallback(
    (board, fruit, timestamp, motion) => {
      if (fruit.isBomb) {
        resetCombo(board);
        board.score = Math.max(0, board.score - MP_BOMB_PENALTY);
        createSplat(board, fruit.x, fruit.y, '#FFFFFF');
        playSound('bomb');
        syncUI();
        return;
      }
      board.score += 1;
      createSplat(board, fruit.x, fruit.y, fruit.color);
      playFruitSliceSound(1, motion);
      syncUI();
    },
    [playFruitSliceSound, playSound, resetCombo, syncUI]
  );

  const handleMpFreeSlice = useCallback(
    (board, fruit, timestamp, motion) => {
      board.score += 1;
      createSplat(board, fruit.x, fruit.y, fruit.color);
      playFruitSliceSound(1, motion);
      syncUI();
    },
    [playFruitSliceSound, syncUI]
  );

  const handleMpCoopSlice = useCallback(
    (board, fruit, timestamp, motion) => {
      const state = gameStateRef.current;
      const otherBoard = state.boards.find((b) => b.id !== board.id);
      const result = handleCoopSlice(board, fruit, state, FRUIT_TYPES, otherBoard, timestamp);

      if (result === 'correct') {
        createSplat(board, fruit.x, fruit.y, fruit.color);
        playFruitSliceSound(1, motion);
        if (isCoopComplete(state)) {
          endMultiplayer('coop');
        }
        syncUI();
        return;
      }

      if (result === 'wrong') {
        createSplat(board, fruit.x, fruit.y, '#888');
        syncUI();
      }
    },
    [endMultiplayer, playFruitSliceSound, syncUI]
  );

  const maybeAdvanceLevel = useCallback(
    (board, timestamp) => {
      const state = gameStateRef.current;
      if (gameModeRef.current !== 'level' || state.isGameOver) return;
      const cfg = getLevelConfig(state.level);
      if (board.score < cfg.scoreTarget) return;
      if (state.level >= LEVEL_COUNT) return;

      const nextLevel = state.level + 1;
      applyLevelConfig(state, nextLevel);
      state.levelNoticeUntil = timestamp + LEVEL_NOTICE_MS;
      syncUI();
    },
    [applyLevelConfig, syncUI]
  );

  const processSliceLine = useCallback(
    (board, x1, y1, x2, y2, timestamp, motion) => {
      const state = gameStateRef.current;
      const mode = gameModeRef.current;

      if (state.phase === 'intro' && startButtonRectRef.current) {
        if (lineIntersectsRect(x1, y1, x2, y2, startButtonRectRef.current)) {
          startGameRef.current();
          return;
        }
      }

      const canSliceFruits =
        state.phase === 'intro' ||
        (state.phase === 'playing' && !state.isGameOver && state.levelNoticeUntil < timestamp);

      if (!canSliceFruits) return;

      board.fruits.forEach((fruit) => {
        if (fruit.isSliced) return;
        if (!fruit.checkSlice(x1, y1, x2, y2)) return;

        if (state.phase === 'intro') {
          createSplat(board, fruit.x, fruit.y, fruit.color);
          playFruitSliceSound(1, motion);
          return;
        }

        if (mode === 'recipe') {
          handleRecipeSlice(board, fruit, timestamp, motion);
        } else if (mode === 'mp_free') {
          handleMpFreeSlice(board, fruit, timestamp, motion);
        } else if (mode === 'mp_challenge') {
          handleMpChallengeSlice(board, fruit, timestamp, motion);
        } else if (mode === 'mp_coop') {
          handleMpCoopSlice(board, fruit, timestamp, motion);
        } else {
          handleChallengeSlice(board, fruit, timestamp, motion);
          if (mode === 'level') maybeAdvanceLevel(board, timestamp);
        }
      });
    },
    [
      handleChallengeSlice,
      handleMpChallengeSlice,
      handleMpCoopSlice,
      handleMpFreeSlice,
      handleRecipeSlice,
      maybeAdvanceLevel,
      playFruitSliceSound,
    ]
  );

  const processHandsForBoard = useCallback(
    (board, hand, width, height, timestamp, currentHandLabels) => {
      const state = gameStateRef.current;
      const hLabel = isMultiplayerMode(gameModeRef.current)
        ? playerHandLabel(board.id, hand.label)
        : hand.label;

      currentHandLabels.add(hLabel);

      const currentPos = {
        x: hand.x * width,
        y: hand.y * height,
        timestamp: hand.timestamp,
      };

      if (!board.trails[hLabel]) board.trails[hLabel] = [];
      pushTrailPoint(board.trails[hLabel], currentPos.x, currentPos.y, timestamp);

      const lastPos = board.lastFingerPositions[hLabel];
      const motion = getHandMotion(lastPos, currentPos);

      if (motion && detectHandMotion(lastPos, currentPos)) {
        tryPlaySwipeSound(hLabel, motion);
      }

      if (lastPos) {
        for (let s = 1; s <= SLICE_SUBSTEPS; s += 1) {
          const t = s / SLICE_SUBSTEPS;
          const prevX = lastPos.x + (currentPos.x - lastPos.x) * ((s - 1) / SLICE_SUBSTEPS);
          const prevY = lastPos.y + (currentPos.y - lastPos.y) * ((s - 1) / SLICE_SUBSTEPS);
          const nextX = lastPos.x + (currentPos.x - lastPos.x) * t;
          const nextY = lastPos.y + (currentPos.y - lastPos.y) * t;
          processSliceLine(board, prevX, prevY, nextX, nextY, timestamp, motion);
        }
      }

      board.lastFingerPositions[hLabel] = currentPos;
    },
    [processSliceLine, tryPlaySwipeSound]
  );

  const updateGameRef = useRef(() => {});
  const drawGameRef = useRef(() => {});

  const updateStartButtonRect = useCallback(() => {
    const btn = startButtonRef.current;
    const container = containerRef.current;
    if (!btn || !container) return;
    startButtonRectRef.current = domRectToCanvas(
      btn.getBoundingClientRect(),
      container.getBoundingClientRect()
    );
  }, []);

  useLayoutEffect(() => {
    updateStartButtonRect();
    window.addEventListener('resize', updateStartButtonRect);
    return () => window.removeEventListener('resize', updateStartButtonRect);
  }, [updateStartButtonRect, uiState.phase]);

  const update = (width, height, timestamp) => {
    refreshHands(timestamp);
    updateStartButtonRect();

    const state = gameStateRef.current;
    const mode = gameModeRef.current;
    const mp = isMultiplayerMode(mode);
    phaseRef.current = state.phase;
    const hands = handsDataRef.current;

    state.boards.forEach((board) => {
      if (board.comboDisplay && timestamp > board.comboDisplay.expiresAt) {
        board.comboDisplay = null;
      }
      if (mode === 'mp_coop') {
        updateCoopRevealState(board, timestamp);
      }
    });

    const currentHandLabelsPerBoard = state.boards.map(() => new Set());

    if (hands.length > 0) {
      hands.forEach((hand) => {
        const board = resolveBoardForHand(hand, state.boards, mp);
        const boardIndex = state.boards.indexOf(board);
        processHandsForBoard(
          board,
          hand,
          width,
          height,
          timestamp,
          currentHandLabelsPerBoard[boardIndex]
        );
      });
    }

    state.boards.forEach((board, boardIndex) => {
      const currentHandLabels = currentHandLabelsPerBoard[boardIndex];
      Object.keys(board.trails).forEach((label) => {
        if (!currentHandLabels.has(label)) {
          if (board.trails[label]?.length) board.trails[label].shift();
          else {
            delete board.trails[label];
            delete board.lastFingerPositions[label];
          }
        }
      });

      Object.keys(board.trails).forEach((label) => {
        if (board.trails[label]) {
          board.trails[label] = pruneTrail(board.trails[label], timestamp);
        }
      });
    });

    if (mode === 'mp_challenge' && state.phase === 'playing' && state.mpTimerEnd) {
      if (timestamp >= state.mpTimerEnd) {
        const s0 = state.boards[0].score;
        const s1 = state.boards[1].score;
        const winner = s0 > s1 ? 0 : s1 > s0 ? 1 : 'tie';
        endMultiplayer('challenge', winner);
        return;
      }
    }

    const spawning =
      state.phase === 'intro' ||
      (state.phase === 'playing' && !state.isGameOver && timestamp > state.levelNoticeUntil);

    if (spawning) {
      state.boards.forEach((board) => {
        const spawnInterval =
          state.phase === 'intro' ? INTRO_SPAWN_MS : board.spawnInterval;

        if (timestamp - board.lastSpawnTime > spawnInterval) {
          const burst = state.phase === 'intro' ? 1 : board.spawnBurst;
          for (let i = 0; i < burst; i += 1) spawnFruit(board, width, height);
          board.lastSpawnTime = timestamp;

          if (state.phase === 'playing' && mode === 'challenge') {
            board.spawnInterval = Math.max(
              MIN_SPAWN_INTERVAL,
              INITIAL_SPAWN_INTERVAL - board.score * SPAWN_INTERVAL_DECREASE
            );
          }
        }
      });
    }

    if (state.phase === 'intro') {
      state.boards.forEach((board) => {
        board.fruits = board.fruits.filter((f) => !f.update());
      });
    } else if (state.phase === 'playing' && !state.isGameOver) {
      state.boards.forEach((board) => {
        board.fruits = board.fruits.filter((fruit) => {
          const outOfBounds = fruit.update();
          if (
            outOfBounds &&
            !fruit.isSliced &&
            !fruit.isBomb &&
            timestamp > state.levelNoticeUntil &&
            !mp &&
            mode !== 'mp_coop'
          ) {
            resetCombo(board);
            board.lives -= 1;
            if (board.lives <= 0) {
              state.isGameOver = true;
              state.phase = 'gameover';
              playSound('gameOver', { force: true });
            }
            syncUI();
          }
          return !outOfBounds;
        });
      });
    }

    state.boards.forEach((board) => {
      board.particles = board.particles.filter((p) => !p.update());
    });

    if (uiState.levelNotice !== (state.levelNoticeUntil > timestamp)) {
      syncUI();
    }
  };

  const draw = (ctx, width, height) => {
    const state = gameStateRef.current;
    const mode = gameModeRef.current;
    const mp = isMultiplayerMode(mode);
    ctx.clearRect(0, 0, width, height);

    state.boards.forEach((board) => {
      board.particles.forEach((p) => p.draw(ctx));
      board.fruits.forEach((f) => f.draw(ctx));

      Object.entries(board.trails).forEach(([label, trail]) => {
        drawHandTrail(ctx, trail, TRAIL_COLOR_MAP[label] || '#fbbf24');
      });

      if (board.comboDisplay && board.comboDisplay.count > 1 && state.phase === 'playing' && !mp) {
        const age = performance.now() - (board.comboDisplay.expiresAt - 1200);
        const alpha = Math.max(0, 1 - age / 1200);
        const centerX = width * (board.xStart + board.xEnd) / 2;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 42px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`x${board.comboDisplay.count} COMBO!`, centerX, height * 0.2);
        ctx.restore();
      }
    });

    if (mp && state.phase === 'playing') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.restore();
    }
  };

  updateGameRef.current = update;
  drawGameRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    const ctx = canvas.getContext('2d', { alpha: true });
    const syncCanvasSize = () => {
      const width = Math.max(1, Math.floor(container.clientWidth));
      const height = Math.max(1, Math.floor(container.clientHeight));
      canvasSizeRef.current = { width, height };
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      updateStartButtonRect();
    };

    syncCanvasSize();
    const ro = new ResizeObserver(syncCanvasSize);
    ro.observe(container);

    let id;
    const loop = (ts) => {
      const { width, height } = canvasSizeRef.current;
      updateGameRef.current(width, height, ts);
      drawGameRef.current(ctx, width, height);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [updateStartButtonRect]);

  const resetToIntro = useCallback(() => {
    setBackgroundPickerOpen(false);
    const mode = gameModeRef.current;
    const fresh = createInitialState(mode);
    const state = gameStateRef.current;
    state.boards = fresh.boards;
    state.phase = 'intro';
    state.isGameOver = false;
    state.level = 1;
    state.levelNoticeUntil = 0;
    state.recipe = [];
    state.recipeIndex = 0;
    state.bottleFill = 0;
    state.mpTimerEnd = null;
    state.glassFill = 0;
    state.mpResult = null;
    state.boards.forEach((board) => {
      board.lastSpawnTime = performance.now();
      board.spawnInterval = INTRO_SPAWN_MS;
    });
    initRecipe(state);
    phaseRef.current = 'intro';
    syncUI();
  }, [initRecipe, syncUI]);

  const startGameRef = useRef(() => {});

  const startGame = useCallback(() => {
    const state = gameStateRef.current;
    const mode = gameModeRef.current;
    const mp = isMultiplayerMode(mode);
    const now = performance.now();

    state.boards = createBoardsForMode(mode);
    state.phase = 'playing';
    state.isGameOver = false;
    state.levelNoticeUntil = 0;
    state.mpResult = null;
    state.glassFill = 0;
    state.mpTimerEnd = null;

    state.boards.forEach((board) => {
      board.fruits = [];
      board.particles = [];
      board.trails = {};
      board.score = 0;
      board.lives = INITIAL_LIVES;
      board.lastFingerPositions = {};
      board.comboCount = 0;
      board.lastSliceTime = 0;
      board.comboDisplay = null;
      board.lastSpawnTime = now;
    });

    if (mode === 'level') {
      applyLevelConfig(state, 1);
    } else if (mode === 'recipe') {
      const board = state.boards[0];
      board.spawnInterval = 1700;
      board.fruitSizeScale = 1;
      board.spawnBurst = 1;
      board.bombChance = 0;
      initRecipe(state);
    } else if (mode === 'mp_free') {
      state.boards.forEach((board) => {
        board.spawnInterval = INITIAL_SPAWN_INTERVAL;
        board.fruitSizeScale = 1;
        board.spawnBurst = 1;
        board.bombChance = 0;
      });
    } else if (mode === 'mp_challenge') {
      state.mpTimerEnd = now + MP_CHALLENGE_DURATION_MS;
      state.boards.forEach((board) => {
        board.spawnInterval = INITIAL_SPAWN_INTERVAL;
        board.fruitSizeScale = 1;
        board.spawnBurst = 1;
      });
    } else if (mode === 'mp_coop') {
      state.glassFill = 0;
      state.boards.forEach((board) => {
        board.spawnInterval = 1700;
        board.fruitSizeScale = 1;
        board.spawnBurst = 1;
        board.bombChance = 0;
      });
      initCoopTargets(state.boards, FRUIT_TYPES, now);
    } else {
      const board = state.boards[0];
      board.spawnInterval = INITIAL_SPAWN_INTERVAL;
      board.fruitSizeScale = 1;
      board.spawnBurst = 1;
      board.bombChance = 0;
    }

    phaseRef.current = 'playing';
    unlockMusic();
    syncUI();
  }, [applyLevelConfig, initRecipe, syncUI, unlockMusic]);

  startGameRef.current = startGame;

  useEffect(() => {
    const state = gameStateRef.current;
    const mode = gameModeRef.current;
    state.boards = createBoardsForMode(mode);
    state.highscore = parseInt(localStorage.getItem(highscoreKey(mode)) || '0', 10);
    state.boards.forEach((board) => {
      board.lastSpawnTime = performance.now();
      board.spawnInterval = INTRO_SPAWN_MS;
    });
    initRecipe(state);
    syncUI();
  }, [gameModeId, initRecipe, syncUI]);

  const selectTheme = (id) => {
    setThemeId(id);
    localStorage.setItem(THEME_STORAGE_KEY, id);
    if (isWebcamBackground(backgroundId)) return;

    const scene = getSceneIdFromBackground(backgroundId);
    const candidate = makeBackgroundId(id, scene);
    const nextBackground = GAME_BACKGROUNDS[candidate]
      ? candidate
      : getThemeDefaultBackgroundId(id);
    setBackgroundId(nextBackground);
    localStorage.setItem(BACKGROUND_STORAGE_KEY, nextBackground);
  };

  const selectBackground = useCallback((id) => {
    gameStateRef.current.boards.forEach((board) => {
      board.particles = [];
    });
    setBackgroundId(id);
    localStorage.setItem(BACKGROUND_STORAGE_KEY, id);
    setBackgroundPickerOpen(false);

    if (isWebcamBackground(id)) return;

    const bg = getBackground(id);
    if (bg.theme !== themeIdRef.current) {
      setThemeId(bg.theme);
      localStorage.setItem(THEME_STORAGE_KEY, bg.theme);
    }
  }, []);

  const selectMode = (id) => {
    setGameModeId(id);
    gameModeRef.current = id;
    localStorage.setItem(GAME_MODE_STORAGE_KEY, id);
  };

  const webcamBackgroundActive = isWebcamBackground(backgroundId);
  const showMpHud = uiState.isMultiplayer && uiState.phase === 'playing' && !uiState.isGameOver;
  const showSpHud =
    uiState.phase === 'playing' && !uiState.isGameOver && !uiState.isMultiplayer;

  return (
    <div
      ref={containerRef}
      className="game-stage relative h-full w-full overflow-hidden bg-black"
    >
      <video
        ref={videoRef}
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${
          webcamBackgroundActive ? 'z-[1] -scale-x-100 opacity-100' : 'z-0 opacity-0'
        }`}
        width={CAMERA_WIDTH}
        height={CAMERA_HEIGHT}
        playsInline
        muted
        autoPlay
      />

      <SceneBackground backgroundId={backgroundId} introActive={uiState.phase === 'intro'} />

      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 block h-full w-full pointer-events-none"
        style={{ background: 'transparent' }}
      />

      <div
        ref={inputLayerRef}
        className={`absolute inset-0 z-[15] touch-none ${
          sliceInputActive ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden
      />

      {uiState.phase === 'intro' && (
        <IntroScreen
          themeId={themeId}
          backgroundId={backgroundId}
          sceneBackgrounds={getBackgroundsForTheme(themeId)}
          gameModeId={gameModeId}
          onThemeChange={selectTheme}
          onBackgroundChange={selectBackground}
          onModeChange={selectMode}
          onStart={startGame}
          startButtonRef={startButtonRef}
          isReady={isReady}
          cameraDenied={cameraDenied}
          introMusicMuted={introMuted}
          onToggleIntroMusic={toggleIntroMuted}
        />
      )}

      {showSpHud && (
        <>
          <GameplayHUD
            uiState={uiState}
            onMenu={resetToIntro}
            onToggleBackground={() => setBackgroundPickerOpen((open) => !open)}
            backgroundPickerOpen={backgroundPickerOpen}
            gameplayMusicMuted={gameplayMuted}
            gameplayTrackLabel={gameplayTrack.shortLabel}
            onToggleGameplayMusic={toggleGameplayMuted}
            onCycleGameplayTrack={cycleGameplayTrack}
          />
          {backgroundPickerOpen && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-50 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-3 pt-10 pb-4"
              data-game-ui
            >
              <p className="font-ui pointer-events-none mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                {STR.chooseTheme}
              </p>
              <div className="pointer-events-auto mb-3 flex justify-center gap-2">
                {THEME_LIST.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    data-game-ui
                    onClick={() => selectTheme(t.id)}
                    className={`font-ui rounded-md border px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-xs ${
                      themeId === t.id
                        ? 'border-lime-400 bg-lime-400/20 text-lime-300'
                        : 'border-white/20 bg-black/40 text-white/80'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <SceneSlider
                compact
                backgrounds={getBackgroundsForTheme(themeId)}
                value={backgroundId}
                onChange={selectBackground}
                className="pointer-events-auto"
              />
            </div>
          )}
          {uiState.gameModeId === 'recipe' && (
            <RecipeHUD
              recipe={uiState.recipe}
              recipeIndex={uiState.recipeIndex}
              bottleFill={uiState.bottleFill}
            />
          )}
        </>
      )}

      {showMpHud && (
        <>
          <MultiplayerHUD
            boards={uiState.boards}
            gameModeId={uiState.gameModeId}
            mpTimerEnd={uiState.mpTimerEnd}
            glassFill={uiState.glassFill}
            now={uiState.now}
            onMenu={resetToIntro}
            onToggleBackground={() => setBackgroundPickerOpen((open) => !open)}
            backgroundPickerOpen={backgroundPickerOpen}
            gameplayMusicMuted={gameplayMuted}
            gameplayTrackLabel={gameplayTrack.shortLabel}
            onToggleGameplayMusic={toggleGameplayMuted}
            onCycleGameplayTrack={cycleGameplayTrack}
          />
          {backgroundPickerOpen && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-50 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-3 pt-10 pb-4"
              data-game-ui
            >
              <p className="font-ui pointer-events-none mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                {STR.chooseTheme}
              </p>
              <div className="pointer-events-auto mb-3 flex justify-center gap-2">
                {THEME_LIST.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    data-game-ui
                    onClick={() => selectTheme(t.id)}
                    className={`font-ui rounded-md border px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-xs ${
                      themeId === t.id
                        ? 'border-lime-400 bg-lime-400/20 text-lime-300'
                        : 'border-white/20 bg-black/40 text-white/80'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <SceneSlider
                compact
                backgrounds={getBackgroundsForTheme(themeId)}
                value={backgroundId}
                onChange={selectBackground}
                className="pointer-events-auto"
              />
            </div>
          )}
          {uiState.gameModeId === 'mp_coop' && (
            <CoopTargetReveal boards={uiState.boards} now={uiState.now} />
          )}
        </>
      )}

      <LevelToast
        level={uiState.level}
        subtitle={uiState.levelNoticeSub}
        visible={uiState.levelNotice}
      />

      {uiState.phase === 'gameover' && (
        <div className="pointer-events-auto absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
          <h2 className="font-title pointer-events-none text-5xl sm:text-7xl text-red-500">{STR.gameOver}</h2>
          <p className="font-ui pointer-events-none mt-4 text-sm uppercase tracking-widest text-white/60">
            {STR.yourScore}
          </p>
          <p className="font-title pointer-events-none text-6xl sm:text-8xl text-white">{uiState.score}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              data-game-ui
              onClick={startGame}
              className="font-ui pointer-events-auto rounded-full bg-lime-400 px-8 py-3 text-lg font-bold uppercase text-black"
            >
              {STR.playAgain}
            </button>
            <button
              type="button"
              data-game-ui
              onClick={resetToIntro}
              className="font-ui pointer-events-auto rounded-full border border-white/30 px-8 py-3 text-lg font-bold uppercase text-white"
            >
              {STR.menu}
            </button>
          </div>
        </div>
      )}

      {uiState.phase === 'mp_results' && (
        <MultiplayerResults
          mpResult={uiState.mpResult}
          boards={uiState.boards}
          onPlayAgain={startGame}
          onMenu={resetToIntro}
        />
      )}

      {!cameraReady && !cameraDenied && uiState.phase === 'intro' && (
        <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-50 text-center font-ui text-[10px] uppercase tracking-widest text-white/40">
          {STR.loadingCamera}
        </div>
      )}
    </div>
  );
};

export default FruitSamuraiGame;
