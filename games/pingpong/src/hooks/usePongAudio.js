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

export function usePongAudio() {
  const clipsRef = useRef({})
  const unlockedRef = useRef(false)
  const lastPlayedRef = useRef({ tableHit: 0, paddleHit: 0 })

  useEffect(() => {
    clipsRef.current = {
      tableHit: loadClip(SOUND_PATHS.tableHit),
      paddleHit: loadClip(SOUND_PATHS.paddleHit),
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

  const play = useCallback((name) => {
    const clip = clipsRef.current[name]
    if (!clip) return

    const now = performance.now()
    if (now - (lastPlayedRef.current[name] ?? 0) < SOUND_COOLDOWN_MS) return
    lastPlayedRef.current[name] = now

    const vol = SOUND_VOLUME[name] ?? 0.5
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

  const playTableHit = useCallback(() => play('tableHit'), [play])
  const playPaddleHit = useCallback(() => play('paddleHit'), [play])

  return { playTableHit, playPaddleHit, unlock }
}
