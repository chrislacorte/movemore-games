import { useEffect, useRef, useCallback } from 'react';
import { AUDIO_URLS } from '../constants/gameConfig';
import { SOUND_MIN_GAP_MS, SOUND_VOLUMES, SWOOSH_MIN_GAP_MS, FRUIT_SLICE_POOL_SIZE } from '../constants/audioConfig';
import { SwordSwooshSheet } from '../utils/swordSwooshSheet';

function createAudio(url) {
  const audio = new Audio(url);
  audio.preload = 'auto';
  return audio;
}

function motionFromArgs(motion = {}) {
  return {
    distance: motion.distance ?? 40,
    durationMs: motion.durationMs ?? 16,
  };
}

export function useGameAudio({ muted = false } = {}) {
  const singlesRef = useRef({});
  const fruitSlicePoolRef = useRef([]);
  const swooshSheetRef = useRef(null);
  const lastPlayedRef = useRef({});
  const mutedRef = useRef(muted);

  const stopAllSounds = useCallback(() => {
    fruitSlicePoolRef.current.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    Object.values(singlesRef.current).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    swooshSheetRef.current?.stopAll();
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
    if (muted) stopAllSounds();
  }, [muted, stopAllSounds]);

  useEffect(() => {
    swooshSheetRef.current = new SwordSwooshSheet(AUDIO_URLS.swordSwooshSheet);

    singlesRef.current = {
      bomb: createAudio(AUDIO_URLS.bomb),
      gameOver: createAudio(AUDIO_URLS.gameOver),
    };

    fruitSlicePoolRef.current = Array.from({ length: FRUIT_SLICE_POOL_SIZE }, () =>
      createAudio(AUDIO_URLS.fruitSlice)
    );

    lastPlayedRef.current = {};

    return () => {
      swooshSheetRef.current?.dispose();
      swooshSheetRef.current = null;
      fruitSlicePoolRef.current.forEach((a) => {
        a.pause();
        a.src = '';
      });
      fruitSlicePoolRef.current = [];
      Object.values(singlesRef.current).forEach((a) => {
        a.pause();
        a.src = '';
      });
    };
  }, []);

  const canPlaySwoosh = useCallback((kind, now) => {
    const last = lastPlayedRef.current[kind] || 0;
    return now - last >= (SWOOSH_MIN_GAP_MS[kind] ?? 50);
  }, []);

  const playSwoosh = useCallback(
    (kind, motion) => {
      if (mutedRef.current) return;
      const sheet = swooshSheetRef.current;
      if (!sheet) return;

      const now = performance.now();
      if (!canPlaySwoosh(kind, now)) return;

      lastPlayedRef.current[kind] = now;
      sheet.play({ ...motionFromArgs(motion), kind });
    },
    [canPlaySwoosh]
  );

  const playSingle = useCallback((key, { force = false } = {}) => {
    if (mutedRef.current) return;
    const audio = singlesRef.current[key];
    if (!audio) return;

    const now = performance.now();
    const gap = SOUND_MIN_GAP_MS[key] ?? 200;
    const last = lastPlayedRef.current[key] || 0;
    if (!force && now - last < gap) return;
    if (!force && !audio.paused && !audio.ended) return;

    audio.playbackRate = 1;
    audio.volume = SOUND_VOLUMES[key] ?? 0.5;
    audio.currentTime = 0;
    lastPlayedRef.current[key] = now;
    audio.play().catch(() => {});
  }, []);

  const playSound = useCallback(
    (type, options) => {
      playSingle(type, options);
    },
    [playSingle]
  );

  const playFruitSliceSound = useCallback((comboCount) => {
    if (mutedRef.current) return;
    const pool = fruitSlicePoolRef.current;
    if (!pool.length) return;

    const now = performance.now();
    const gap = SOUND_MIN_GAP_MS.fruitSlice ?? 35;
    const last = lastPlayedRef.current.fruitSlice || 0;
    if (now - last < gap) return;

    const audio =
      pool.find((a) => a.paused || a.ended) ?? pool[Math.floor(Math.random() * pool.length)];

    const baseVolume = SOUND_VOLUMES.fruitSlice ?? 0.62;
    audio.volume = baseVolume * (comboCount >= 2 ? 1.08 : 1) * (0.94 + Math.random() * 0.12);
    audio.playbackRate = comboCount >= 2 ? 1.06 : 0.97 + Math.random() * 0.06;
    audio.currentTime = 0;
    lastPlayedRef.current.fruitSlice = now;
    audio.play().catch(() => {});
  }, []);

  const tryPlaySwipeSound = useCallback(
    (_handLabel, motion) => {
      playSwoosh('swipe', motion);
    },
    [playSwoosh]
  );

  return { playSound, playFruitSliceSound, tryPlaySwipeSound };
}
