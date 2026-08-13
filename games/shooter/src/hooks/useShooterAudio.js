import { useCallback, useEffect, useRef } from 'react'
import {
  SOUND_PATHS,
  SOUND_VOLUME,
  SOUND_COOLDOWN_MS,
} from '../constants/soundConfig'

function loadClip(src) {
  const audio = new Audio(src)
  audio.preload = 'auto'
  return audio
}

export function useShooterAudio() {
  const clipsRef = useRef({})
  const unlockedRef = useRef(false)
  const lastPlayedRef = useRef({ shoot: 0, bird: 0, birdHit: 0 })

  useEffect(() => {
    clipsRef.current = {
      shoot: loadClip(SOUND_PATHS.shoot),
      bird: loadClip(SOUND_PATHS.bird),
    }
    return () => {
      clipsRef.current = {}
    }
  }, [])

  const unlock = useCallback(() => {
    if (unlockedRef.current) return
    unlockedRef.current = true
    Object.values(clipsRef.current).forEach((clip) => {
      if (!clip) return
      const prev = clip.volume
      clip.volume = 0
      clip
        .play()
        .catch(() => {})
        .finally(() => {
          clip.pause()
          clip.currentTime = 0
          clip.volume = prev
        })
    })
  }, [])

  const play = useCallback((name, volumeKey = name) => {
    const clipName = name === 'birdHit' ? 'bird' : name
    const clip = clipsRef.current[clipName]
    if (!clip) return

    const now = performance.now()
    const cooldown = SOUND_COOLDOWN_MS[volumeKey] ?? 80
    if (now - (lastPlayedRef.current[volumeKey] ?? 0) < cooldown) return
    lastPlayedRef.current[volumeKey] = now

    const vol = SOUND_VOLUME[volumeKey] ?? 0.5
    try {
      const node = clip.cloneNode()
      node.volume = vol
      node.play().catch(() => {})
    } catch {
      clip.currentTime = 0
      clip.volume = vol
      clip.play().catch(() => {})
    }
  }, [])

  const playShoot = useCallback(() => play('shoot'), [play])
  const playBird = useCallback(() => play('bird'), [play])
  const playBirdHit = useCallback(() => play('birdHit'), [play])

  return { playShoot, playBird, playBirdHit, unlock }
}
