function playBlip(ctx, time, freq, duration, volume, type = 'square') {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, time)
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.linearRampToValueAtTime(volume, time + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(time)
  osc.stop(time + duration + 0.02)
}

/**
 * Classic arcade snake eat: short two-tone blip (bloop-blip).
 */
export function playEatSound(ctx, foodCount = 0, volume = 0.22) {
  const t = ctx.currentTime
  const base = Math.min(720, 440 + Math.min(foodCount, 28) * 10)

  playBlip(ctx, t, base, 0.07, volume, 'square')
  playBlip(ctx, t + 0.055, base * 1.32, 0.06, volume * 0.85, 'square')
}
