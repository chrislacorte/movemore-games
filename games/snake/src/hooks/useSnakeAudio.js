import { useCallback, useEffect, useRef } from 'react'
import { SOUND_COOLDOWN_MS, SOUND_VOLUME } from '../constants/soundConfig'
import { playEatSound } from '../utils/synthSounds'

function createAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  return new Ctx()
}

export function useSnakeAudio() {
  const ctxRef = useRef(null)
  const unlockedRef = useRef(false)
  const lastEatRef = useRef(0)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext()
    }
    return ctxRef.current
  }, [])

  const unlock = useCallback(async () => {
    const ctx = getCtx()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        return
      }
    }
    unlockedRef.current = true
  }, [getCtx])

  const playEat = useCallback(
    (foodCount = 0) => {
      const now = performance.now()
      if (now - lastEatRef.current < SOUND_COOLDOWN_MS.eat) return
      lastEatRef.current = now

      const ctx = getCtx()
      if (!ctx) return

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }

      playEatSound(ctx, foodCount, SOUND_VOLUME.eat)
    },
    [getCtx],
  )

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {})
      ctxRef.current = null
    }
  }, [])

  return { playEat, unlock }
}
