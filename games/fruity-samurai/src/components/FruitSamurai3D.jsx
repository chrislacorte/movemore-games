import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useHandTracking } from '../hooks/useHandTracking';
import { Fruit3D } from '../classes/Fruit3D';
import { Particle } from '../classes/Particle';
import GameOverlay from './GameOverlay';
import GameCanvas3D from './three/GameCanvas3D';
import { useGameAudio } from '../hooks/useGameAudio';
import { detectHandMotion, getHandMotion } from '../utils/handMotion';
import { pushTrailPoint, pruneTrail, drawHandTrail } from '../utils/trailUtils';
import { isWebcamBackground } from '../constants/backgroundConfig';
import FixedBackgroundLayer from './FixedBackgroundLayer';
import {
  HIGHSCORE_KEY_3D,
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

const FruitSamurai3D = ({ backgroundId = 'webcam' }) => {
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const canvasSizeRef = useRef({ width: 1, height: 1 });

  const { playSound, playFruitSliceSound, tryPlaySwipeSound } = useGameAudio();

  const gameStateRef = useRef({
    fruits: [],
    particles: [],
    trails: {},
    score: 0,
    highscore: parseInt(localStorage.getItem(HIGHSCORE_KEY_3D) || '0', 10),
    lives: INITIAL_LIVES,
    isGameOver: false,
    gameStarted: false,
    lastSpawnTime: 0,
    spawnInterval: INITIAL_SPAWN_INTERVAL,
    lastFingerPositions: {},
    comboCount: 0,
    lastSliceTime: 0,
    comboDisplay: null,
    fruitVersion: 0,
  });

  const [uiState, setUiState] = useState({
    score: 0,
    highscore: parseInt(localStorage.getItem(HIGHSCORE_KEY_3D) || '0', 10),
    lives: INITIAL_LIVES,
    isGameOver: false,
    gameStarted: false,
    combo: 0,
    comboVisible: false,
  });

  const [fruitVersion, setFruitVersion] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

  const bumpFruitVersion = useCallback(() => {
    gameStateRef.current.fruitVersion += 1;
    setFruitVersion(gameStateRef.current.fruitVersion);
  }, []);

  const { isReady, handsDataRef, error, refreshHands } = useHandTracking(videoRef);

  const syncUI = useCallback(() => {
    const state = gameStateRef.current;
    if (state.score > state.highscore) {
      state.highscore = state.score;
      localStorage.setItem(HIGHSCORE_KEY_3D, state.highscore.toString());
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

  const registerComboSlice = useCallback((timestamp) => {
    const state = gameStateRef.current;
    if (state.lastSliceTime > 0 && timestamp - state.lastSliceTime > COMBO_WINDOW_MS) {
      state.comboCount = 0;
    }

    state.comboCount += 1;
    state.lastSliceTime = timestamp;
    state.comboDisplay = {
      count: state.comboCount,
      expiresAt: timestamp + 1200,
    };

    return BASE_SLICE_POINTS * state.comboCount;
  }, []);

  const spawnFruit = useCallback(
    (width, height) => {
      const score = gameStateRef.current.score;
      const bombChance = Math.min(MAX_BOMB_CHANCE, score * BOMB_CHANCE_SCALE);

      let type;
      if (Math.random() < bombChance) {
        type = 'bomb';
      } else {
        type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
      }

      gameStateRef.current.fruits.push(new Fruit3D(width, height, type));
      bumpFruitVersion();
    },
    [bumpFruitVersion]
  );

  const createSplat = (x, y, color) => {
    for (let i = 0; i < 20; i++) {
      gameStateRef.current.particles.push(new Particle(x, y, color));
    }
  };

  const updateGameRef = useRef(() => {});
  const drawOverlayRef = useRef(() => {});

  const update = (width, height, timestamp) => {
    refreshHands(timestamp);

    const state = gameStateRef.current;
    const hands = handsDataRef.current;
    const currentHandLabels = new Set();
    let fruitListChanged = false;

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
                  fruitListChanged = true;
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

    if (!state.gameStarted || state.isGameOver) {
      if (fruitListChanged) bumpFruitVersion();
      return;
    }

    if (timestamp - state.lastSpawnTime > state.spawnInterval) {
      spawnFruit(width, height);
      state.lastSpawnTime = timestamp;
      state.spawnInterval = Math.max(
        MIN_SPAWN_INTERVAL,
        INITIAL_SPAWN_INTERVAL - state.score * SPAWN_INTERVAL_DECREASE
      );
    }

    const beforeCount = state.fruits.length;
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
    if (state.fruits.length !== beforeCount) fruitListChanged = true;

    state.particles = state.particles.filter((p) => !p.update());

    if (fruitListChanged) bumpFruitVersion();
  };

  const drawOverlay = (ctx, width, height) => {
    const state = gameStateRef.current;

    ctx.clearRect(0, 0, width, height);

    state.particles.forEach((p) => p.draw(ctx));

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
      ctx.fillText(`x${state.comboDisplay.count} COMBO!`, width / 2, height * 0.18);
      ctx.restore();
    }
  };

  updateGameRef.current = update;
  drawOverlayRef.current = drawOverlay;

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });

    const syncCanvasSize = () => {
      const width = Math.max(1, Math.floor(container.clientWidth));
      const height = Math.max(1, Math.floor(container.clientHeight));
      canvasSizeRef.current = { width, height };
      setCanvasSize({ width, height });
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
      drawOverlayRef.current(ctx, width, height);
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [syncUI, spawnFruit, resetCombo, registerComboSlice, bumpFruitVersion]);

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
      fruitVersion: 0,
    };
    setFruitVersion((v) => v + 1);
    syncUI();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden">
      {!isWebcamBackground(backgroundId) && (
        <FixedBackgroundLayer backgroundId={backgroundId} />
      )}

      <video
        ref={videoRef}
        className={`pointer-events-none absolute inset-0 z-0 h-full w-full object-cover ${
          isWebcamBackground(backgroundId) ? 'opacity-[0.35]' : 'opacity-0'
        }`}
        style={{ transform: 'scaleX(-1)' }}
        width={CAMERA_WIDTH}
        height={CAMERA_HEIGHT}
        playsInline
        muted
      />

      {isReady && (
        <GameCanvas3D
          gameStateRef={gameStateRef}
          fruitVersion={fruitVersion}
        />
      )}

      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 z-[15] block h-full w-full pointer-events-none"
      />

      <GameOverlay
        uiState={uiState}
        isReady={isReady}
        error={error}
        onStart={startGame}
        modeBadge="3D Testmodus"
        description="Teste die 3D-Früchte mit dem gleichen Hand-Tracking. Schnitt-Erkennung bleibt 2D — die Früchte werden in 3D gerendert."
        loadingLabel="Initialisiere Mediapipe & 3D..."
      />
    </div>
  );
};

export default FruitSamurai3D;
