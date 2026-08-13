import { useCallback, useEffect, useRef, useState } from 'react'
import {
  INTRO_TRACK,
  MUSIC_STORAGE_KEYS,
  MUSIC_VOLUME,
  getGameplayTrack,
  getNextGameplayTrackId,
  loadGameplayMuted,
  loadGameplayTrackId,
  loadIntroMuted,
} from '../constants/musicConfig'

function createMusicAudio(url) {
  const audio = new Audio(url)
  audio.loop = true
  audio.preload = 'auto'
  return audio
}

function isIntroPhase(phase) {
  return phase === 'intro'
}

function isGameplayPhase(phase) {
  return phase === 'playing'
}

function isResultsPhase(phase) {
  return phase === 'gameover' || phase === 'mp_results'
}

export function useGameMusic(phase) {
  const introAudioRef = useRef(null)
  const gameplayAudioRef = useRef(null)
  const unlockedRef = useRef(false)
  const phaseRef = useRef(phase)

  const introMutedInitial = loadIntroMuted()
  const [introMuted, setIntroMutedState] = useState(introMutedInitial)
  const [gameplayMuted, setGameplayMutedState] = useState(
    () => introMutedInitial || loadGameplayMuted()
  )
  const [gameplayTrackId, setGameplayTrackIdState] = useState(loadGameplayTrackId)

  const gameplayTrack = getGameplayTrack(gameplayTrackId)

  const applyIntroVolume = useCallback(() => {
    const audio = introAudioRef.current
    if (!audio) return
    audio.volume = introMuted ? 0 : MUSIC_VOLUME.intro
  }, [introMuted])

  const applyGameplayVolume = useCallback(() => {
    const audio = gameplayAudioRef.current
    if (!audio) return
    audio.volume = gameplayMuted ? 0 : MUSIC_VOLUME.gameplay
  }, [gameplayMuted])

  const playIntro = useCallback(async () => {
    const audio = introAudioRef.current
    if (!audio || !unlockedRef.current) return
    applyIntroVolume()
    try {
      if (audio.paused) await audio.play()
    } catch {
      /* autoplay blocked until user gesture */
    }
  }, [applyIntroVolume])

  const playGameplay = useCallback(async () => {
    const audio = gameplayAudioRef.current
    if (!audio || !unlockedRef.current) return
    applyGameplayVolume()
    try {
      if (audio.paused) await audio.play()
    } catch {
      /* autoplay blocked until user gesture */
    }
  }, [applyGameplayVolume])

  const stopIntro = useCallback(() => {
    const audio = introAudioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
  }, [])

  const stopGameplay = useCallback(() => {
    const audio = gameplayAudioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
  }, [])

  const syncPlayback = useCallback(() => {
    if (isResultsPhase(phaseRef.current)) {
      stopGameplay()
      stopIntro()
      return
    }
    if (isIntroPhase(phaseRef.current)) {
      stopGameplay()
      playIntro()
      return
    }
    if (isGameplayPhase(phaseRef.current)) {
      stopIntro()
      if (gameplayMuted) {
        stopGameplay()
        return
      }
      playGameplay()
    }
  }, [gameplayMuted, playGameplay, playIntro, stopGameplay, stopIntro])

  const unlockMusic = useCallback(() => {
    if (!unlockedRef.current) {
      unlockedRef.current = true
    }
    syncPlayback()
  }, [syncPlayback])

  useEffect(() => {
    introAudioRef.current = createMusicAudio(INTRO_TRACK.url)
    gameplayAudioRef.current = createMusicAudio(getGameplayTrack(loadGameplayTrackId()).url)

    const unlock = () => unlockMusic()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      introAudioRef.current?.pause()
      introAudioRef.current = null
      gameplayAudioRef.current?.pause()
      gameplayAudioRef.current = null
    }
  }, [unlockMusic])

  useEffect(() => {
    phaseRef.current = phase
    syncPlayback()
  }, [phase, syncPlayback])

  useEffect(() => {
    applyIntroVolume()
    if (!introMuted && unlockedRef.current && isIntroPhase(phaseRef.current)) {
      playIntro()
    }
  }, [applyIntroVolume, introMuted, playIntro])

  useEffect(() => {
    applyGameplayVolume()
    if (
      !gameplayMuted &&
      unlockedRef.current &&
      isGameplayPhase(phaseRef.current)
    ) {
      playGameplay()
    }
  }, [applyGameplayVolume, gameplayMuted, playGameplay])

  useEffect(() => {
    const audio = gameplayAudioRef.current
    if (!audio) return

    const wasPlaying = !audio.paused && isGameplayPhase(phaseRef.current)
    const track = getGameplayTrack(gameplayTrackId)

    audio.pause()
    audio.src = track.url
    audio.load()
    applyGameplayVolume()

    if (wasPlaying && unlockedRef.current) {
      playGameplay()
    }
  }, [applyGameplayVolume, gameplayTrackId, playGameplay])

  const setIntroMuted = useCallback((muted) => {
    setIntroMutedState(muted)
    localStorage.setItem(MUSIC_STORAGE_KEYS.introMuted, String(muted))
    const audio = introAudioRef.current
    if (!audio) return
    if (muted) {
      audio.pause()
      return
    }
    applyIntroVolume()
    if (unlockedRef.current && isIntroPhase(phaseRef.current)) {
      audio.play().catch(() => {})
    }
  }, [applyIntroVolume])

  const setGameplayMuted = useCallback((muted) => {
    setGameplayMutedState(muted)
    localStorage.setItem(MUSIC_STORAGE_KEYS.gameplayMuted, String(muted))
    const audio = gameplayAudioRef.current
    if (!audio) return
    if (muted) {
      audio.pause()
      return
    }
    applyGameplayVolume()
    if (unlockedRef.current && isGameplayPhase(phaseRef.current)) {
      audio.play().catch(() => {})
    }
  }, [applyGameplayVolume])

  const toggleIntroMuted = useCallback(() => {
    unlockMusic()
    const next = !introMuted
    setIntroMuted(next)
    setGameplayMuted(next)
  }, [introMuted, setIntroMuted, setGameplayMuted, unlockMusic])

  const toggleGameplayMuted = useCallback(() => {
    unlockMusic()
    setGameplayMuted(!gameplayMuted)
  }, [gameplayMuted, setGameplayMuted, unlockMusic])

  const cycleGameplayTrack = useCallback(() => {
    unlockMusic()
    const nextId = getNextGameplayTrackId(gameplayTrackId)
    setGameplayTrackIdState(nextId)
    localStorage.setItem(MUSIC_STORAGE_KEYS.gameplayTrackId, nextId)
  }, [gameplayTrackId, unlockMusic])

  return {
    introMuted,
    gameplayMuted,
    gameplayTrack,
    toggleIntroMuted,
    toggleGameplayMuted,
    cycleGameplayTrack,
    unlockMusic,
  }
}
