import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import { Fruit } from '../classes/Fruit';
import { Particle } from '../classes/Particle';
import GameOverlay from './GameOverlay';
import { useGameAudio } from '../hooks/useGameAudio';
import { detectHandMotion, getHandMotion } from '../utils/handMotion';
import { pushTrailPoint, pruneTrail, drawHandTrail } from '../utils/trailUtils';
import { isWebcamBackground } from '../constants/backgroundConfig';
import { drawImageBackground, preloadAllBackgroundImages } from '../utils/backgroundImages';
import { loadAllFruitImages } from '../utils/loadFruitImage';
import { FRUIT_IMAGE_FILES } from '../constants/fruitAssets';
import {
  HIGHSCORE_KEY,
  FRUIT_TYPES,
  INITIAL_LIVES,
  INITIAL_SPAWN_INTERVAL,
  MIN_SPAWN_INTERVAL,
  SPAWN_INTERVAL_DECREASE,
  COMBO_WINDOW_MS,
  BASE_SLICE_POINTS,
  MAX_BOMB_CHANCE,
  BOMB_CHANCE_SCALE,
  TRAIL_COLORS,
  SLICE_SUBSTEPS,
  CAMERA_WIDTH,
  CAMERA_HEIGHT,
} from '../constants/gameConfig';

const FruitSamurai = ({ backgroundId = 'webcam' }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const canvasSizeRef = useRef({ width: 1, height: 1 });
  const backgroundIdRef = useRef(backgroundId);
  const backgroundImagesRef = useRef({});
  const assetsRef = useRef({
    orange: null,
    apple: null,
    avocado: null,
    banana: null,
  });

  const { playSound, playFruitSliceSound, tryPlaySwipeSound } = useGameAudio();

  useEffect(() => {
    backgroundIdRef.current = backgroundId;
  }, [backgroundId]);

  useEffect(() => {
    preloadAllBackgroundImages().then((images) => {
      backgroundImagesRef.current = images;
    });
  }, []);

  useEffect(() => {
    loadAllFruitImages(FRUIT_IMAGE_FILES).then((images) => {
      assetsRef.current = { ...assetsRef.current, ...images };
    });
  }, []);

  const gameStateRef = useRef({
    fruits: [],
    particles: [],
    trails: {},
    score: 0,
    highscore: parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0', 10),
    lives: INITIAL_LIVES,
    isGameOver: false,
    gameStarted: false,
    lastSpawnTime: 0,
    spawnInterval: INITIAL_SPAWN_INTERVAL,
    lastFingerPositions: {},
    comboCount: 0,
    lastSliceTime: 0,
    comboDisplay: null,
  });

  const [uiState, setUiState] = useState({
    score: 0,
    highscore: parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0', 10),
    lives: INITIAL_LIVES,
    isGameOver: false,
    gameStarted: false,
    combo: 0,
    comboVisible: false,
  });

  const { isReady, handsDataRef, error, refreshHands } = useHandTracking(videoRef);

  const syncUI = useCallback(() => {
    const state = gameStateRef.current;
    if (state.score > state.highscore) {
      state.highscore = state.score;
      localStorage.setItem(HIGHSCORE_KEY, state.highscore.toString());
    }

    setUiState({
      score: state.score,
      highscore: state.highscore,
      lives: state.lives,
      isGameOver: state.isGameOver,
      gameStarted: state.gameStarted,
      combo: state.comboCount,
      comboVisible: state.comboDisplay !== null,
    });
  }, []);

  const resetCombo = useCallback(() => {
    gameStateRef.current.comboCount = 0;
    gameStateRef.current.lastSliceTime = 0;
    gameStateRef.current.comboDisplay = null;
  }, []);

  const registerComboSlice = useCallback(
    (timestamp) => {
      const state = gameStateRef.current;
      if (
        state.lastSliceTime > 0 &&
        timestamp - state.lastSliceTime > COMBO_WINDOW_MS
      ) {
        state.comboCount = 0;
      }

      state.comboCount += 1;
      state.lastSliceTime = timestamp;
      state.comboDisplay = {
        count: state.comboCount,
        expiresAt: timestamp + 1200,
      };

      return BASE_SLICE_POINTS * state.comboCount;
    },
    []
  );

  const spawnFruit = useCallback((width, height) => {
    const score = gameStateRef.current.score;
    const bombChance = Math.min(MAX_BOMB_CHANCE, score * BOMB_CHANCE_SCALE);

    let type;
    if (Math.random() < bombChance) {
      type = 'bomb';
    } else {
      type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    }

    const image = type !== 'bomb' ? assetsRef.current[type] || null : null;
    gameStateRef.current.fruits.push(new Fruit(width, height, type, image));
  }, []);

  const createSplat = (x, y, color) => {
    for (let i = 0; i < 25; i++) {
      gameStateRef.current.particles.push(new Particle(x, y, color));
    }
  };

  const updateGameRef = useRef(() => {});
  const drawGameRef = useRef(() => {});

  const update = (width, height, timestamp) => {
    refreshHands(timestamp);

    const state = gameStateRef.current;
    const hands = handsDataRef.current;
    const currentHandLabels = new Set();

    if (state.comboDisplay && timestamp > state.comboDisplay.expiresAt) {
      state.comboDisplay = null;
    }

    if (hands.length > 0) {
      hands.forEach((hand) => {
        const hLabel = hand.label;
        currentHandLabels.add(hLabel);

        const currentPos = {
          x: hand.x * width,
          y: hand.y * height,
          timestamp: hand.timestamp,
        };

        if (!state.trails[hLabel]) state.trails[hLabel] = [];

        pushTrailPoint(state.trails[hLabel], currentPos.x, currentPos.y, timestamp);

        const lastPos = state.lastFingerPositions[hLabel];
        const motion = getHandMotion(lastPos, currentPos);

        if (motion && detectHandMotion(lastPos, currentPos)) {
          tryPlaySwipeSound(hLabel, motion);
        }

        if (state.gameStarted && !state.isGameOver && lastPos) {
          const steps = SLICE_SUBSTEPS;
          for (let s = 1; s <= steps; s++) {
            const t = s / steps;
            const prevX = lastPos.x + (currentPos.x - lastPos.x) * ((s - 1) / steps);
            const prevY = lastPos.y + (currentPos.y - lastPos.y) * ((s - 1) / steps);
            const nextX = lastPos.x + (currentPos.x - lastPos.x) * t;
            const nextY = lastPos.y + (currentPos.y - lastPos.y) * t;

            state.fruits.forEach((fruit) => {
              if (!fruit.isSliced) {
                const sliced = fruit.checkSlice(prevX, prevY, nextX, nextY);

                if (sliced) {
                  if (fruit.isBomb) {
                    resetCombo();
                    state.lives -= 1;
                    createSplat(fruit.x, fruit.y, '#FFFFFF');
                    playSound('bomb');
                    if (state.lives <= 0) {
                      state.isGameOver = true;
                      playSound('gameOver');
                    }
                    syncUI();
                  } else {
                    const points = registerComboSlice(timestamp);
                    state.score += points;
                    createSplat(fruit.x, fruit.y, fruit.color);
                    playFruitSliceSound(state.comboCount, motion);
                    syncUI();
                  }
                }
              }
            });
          }
        }

        state.lastFingerPositions[hLabel] = currentPos;
      });
    }

    Object.keys(state.trails).forEach((label) => {
      if (!currentHandLabels.has(label)) {
        if (state.trails[label].length > 0) {
          state.trails[label].shift();
        } else {
          delete state.trails[label];
          delete state.lastFingerPositions[label];
        }
      }
    });

    Object.keys(state.trails).forEach((label) => {
      if (state.trails[label]) {
        state.trails[label] = pruneTrail(state.trails[label], timestamp);
      }
    });

    if (!state.gameStarted || state.isGameOver) return;

    if (timestamp - state.lastSpawnTime > state.spawnInterval) {
      spawnFruit(width, height);
      state.lastSpawnTime = timestamp;
      state.spawnInterval = Math.max(
        MIN_SPAWN_INTERVAL,
        INITIAL_SPAWN_INTERVAL - state.score * SPAWN_INTERVAL_DECREASE
      );
    }

    state.fruits = state.fruits.filter((fruit) => {
      const outOfBounds = fruit.update();
      if (outOfBounds && !fruit.isSliced && !fruit.isBomb) {
        resetCombo();
        state.lives -= 1;
        if (state.lives <= 0) {
          state.isGameOver = true;
          playSound('gameOver');
        }
        syncUI();
      }
      return !outOfBounds;
    });

    state.particles = state.particles.filter((p) => !p.update());
  };

  const draw = (ctx, width, height) => {
    const state = gameStateRef.current;

    ctx.clearRect(0, 0, width, height);

    if (isWebcamBackground(backgroundIdRef.current)) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      if (videoRef.current && videoRef.current.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, width, height);
      }
      ctx.restore();
    } else {
      const img = backgroundImagesRef.current[backgroundIdRef.current];
      if (img) {
        drawImageBackground(ctx, img, width, height);
      } else {
        ctx.fillStyle = '#0c0a09';
        ctx.fillRect(0, 0, width, height);
      }
    }

    state.particles.forEach((p) => p.draw(ctx));
    state.fruits.forEach((f) => f.draw(ctx));

    Object.entries(state.trails).forEach(([label, trail]) => {
      drawHandTrail(ctx, trail, TRAIL_COLORS[label] || '#fbbf24');
    });

    if (state.comboDisplay && state.comboDisplay.count > 1) {
      const age = performance.now() - (state.comboDisplay.expiresAt - 1200);
      const alpha = Math.max(0, 1 - age / 1200);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(
        `x${state.comboDisplay.count} COMBO!`,
        width / 2,
        height * 0.18
      );
      ctx.restore();
    }
  };

  updateGameRef.current = update;
  drawGameRef.current = draw;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });

    const syncCanvasSize = () => {
      const width = Math.max(1, Math.floor(container.clientWidth));
      const height = Math.max(1, Math.floor(container.clientHeight));
      canvasSizeRef.current = { width, height };
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    syncCanvasSize();
    const resizeObserver = new ResizeObserver(syncCanvasSize);
    resizeObserver.observe(container);

    let animationId;
    const render = (timestamp) => {
      const { width, height } = canvasSizeRef.current;
      updateGameRef.current(width, height, timestamp);
      drawGameRef.current(ctx, width, height);
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [syncUI, spawnFruit, resetCombo, registerComboSlice]);

  const startGame = () => {
    gameStateRef.current = {
      ...gameStateRef.current,
      fruits: [],
      particles: [],
      trails: {},
      score: 0,
      lives: INITIAL_LIVES,
      isGameOver: false,
      gameStarted: true,
      lastSpawnTime: performance.now(),
      spawnInterval: INITIAL_SPAWN_INTERVAL,
      lastFingerPositions: {},
      comboCount: 0,
      lastSliceTime: 0,
      comboDisplay: null,
    };
    syncUI();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        className="pointer-events-none absolute left-0 top-0 z-0 opacity-0"
        width={CAMERA_WIDTH}
        height={CAMERA_HEIGHT}
        playsInline
        muted
      />

      <canvas
        ref={canvasRef}
        className="relative z-10 block h-full w-full pointer-events-none"
      />

      <GameOverlay
        uiState={uiState}
        isReady={isReady}
        error={error}
        onStart={startGame}
        modeBadge="2D Klassisch"
        description="Benutze deinen Zeigefinger wie ein Schwert, um Früchte zu zerschneiden. Baue Combos auf, meide Bomben und lass keine Früchte fallen!"
      />
    </div>
  );
};

export default FruitSamurai;
