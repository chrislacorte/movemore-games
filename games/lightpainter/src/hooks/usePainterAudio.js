import { useCallback, useEffect, useMemo, useRef } from 'react'

/**
 * All sounds are synthesized with WebAudio — no asset downloads.
 * Call unlock() from a user gesture (button click) before playing.
 */
export function usePainterAudio() {
  const ctxRef = useRef(null)
  const sparkleTimerRef = useRef(0)

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return null
      ctxRef.current = new Ctx()
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {})
    }
    return ctxRef.current
  }, [])

  const pluck = useCallback(
    (freq, { type = 'sine', gain = 0.08, duration = 0.25, when = 0 } = {}) => {
      const ctx = ctxRef.current
      if (!ctx || ctx.state !== 'running') return
      const t0 = ctx.currentTime + when
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, t0)
      g.gain.setValueAtTime(0, t0)
      g.gain.linearRampToValueAtTime(gain, t0 + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + duration + 0.05)
    },
    [],
  )

  const unlock = useCallback(() => {
    ensureContext()
  }, [ensureContext])

  /** Soft sparkle loop while the player is painting. */
  const setDrawing = useCallback(
    (drawing) => {
      if (drawing) {
        if (sparkleTimerRef.current) return
        ensureContext()
        sparkleTimerRef.current = setInterval(() => {
          const freq = 900 + Math.random() * 1100
          pluck(freq, { type: 'sine', gain: 0.03, duration: 0.22 })
        }, 120)
      } else if (sparkleTimerRef.current) {
        clearInterval(sparkleTimerRef.current)
        sparkleTimerRef.current = 0
      }
    },
    [ensureContext, pluck],
  )

  const playSelect = useCallback(() => {
    ensureContext()
    pluck(660, { type: 'triangle', gain: 0.06, duration: 0.16 })
  }, [ensureContext, pluck])

  const playClear = useCallback(() => {
    const ctx = ensureContext()
    if (!ctx || ctx.state !== 'running') return
    const t0 = ctx.currentTime
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(700, t0)
    osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.35)
    g.gain.setValueAtTime(0.06, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.38)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + 0.45)
  }, [ensureContext])

  const playSuccess = useCallback(() => {
    ensureContext()
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      pluck(freq, { type: 'triangle', gain: 0.09, duration: 0.5, when: i * 0.13 })
      pluck(freq * 2, { type: 'sine', gain: 0.03, duration: 0.4, when: i * 0.13 })
    })
    pluck(1318.5, { type: 'triangle', gain: 0.1, duration: 0.9, when: notes.length * 0.13 })
  }, [ensureContext, pluck])

  useEffect(() => {
    return () => {
      if (sparkleTimerRef.current) clearInterval(sparkleTimerRef.current)
      if (ctxRef.current) ctxRef.current.close().catch(() => {})
    }
  }, [])

  return useMemo(
    () => ({ unlock, setDrawing, playSelect, playClear, playSuccess }),
    [unlock, setDrawing, playSelect, playClear, playSuccess],
  )
}
