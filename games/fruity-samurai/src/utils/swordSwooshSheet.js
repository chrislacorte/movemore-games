import {
  SWOOSH_FADE_OUT_MS,
  SWOOSH_SHEET_POOL_SIZE,
  SWOOSH_SEGMENT,
  SWOOSH_VOLUMES,
} from '../constants/audioConfig'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export class SwordSwooshSheet {
  constructor(url, poolSize = SWOOSH_SHEET_POOL_SIZE) {
    this.url = url
    this.pool = []
    this.clipDuration = 0.6
    this.active = new Map()
    this.playheadByKind = {}

    for (let i = 0; i < poolSize; i += 1) {
      const audio = new Audio(url)
      audio.preload = 'auto'
      audio.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          this.clipDuration = audio.duration
        }
      })
      this.pool.push(audio)
    }
  }

  computeSegment({ distance = 40, durationMs = 16, kind = 'swipe' }) {
    const speed = distance / Math.max(durationMs, 8)
    const profile = SWOOSH_SEGMENT[kind] ?? SWOOSH_SEGMENT.swipe

    const pitch = clamp(
      profile.pitchBase + speed * profile.pitchSpeedScale,
      profile.pitchMin,
      profile.pitchMax
    )

    const segmentLen = clamp(
      profile.min + speed * profile.speedScale,
      profile.min,
      profile.max
    )

    const clipLen = this.clipDuration > 0 ? this.clipDuration : profile.max + 0.2
    const usableLen = Math.min(segmentLen, Math.max(clipLen - 0.04, profile.min))

    const maxStart = Math.max(0, clipLen - usableLen - 0.02)
    const advance = this.playheadByKind[kind] ?? 0
    const jitter = Math.random() * maxStart * 0.35
    const start = maxStart > 0 ? clamp(advance + jitter, 0, maxStart) : 0

    this.playheadByKind[kind] =
      maxStart > 0
        ? (start + usableLen * (profile.playheadAdvance ?? 0.45)) % maxStart
        : 0

    return { start, segmentLen: usableLen, pitch }
  }

  play({ distance, durationMs, kind = 'swipe' }) {
    const audio = this.pool.find((a) => !this.active.has(a))
    if (!audio) return

    const { start, segmentLen, pitch } = this.computeSegment({
      distance,
      durationMs,
      kind,
    })

    const fadeOutS = SWOOSH_FADE_OUT_MS / 1000
    const endTime = start + segmentLen
    const fadeStartTime = Math.max(start, endTime - fadeOutS)
    const baseVolume = (SWOOSH_VOLUMES[kind] ?? SWOOSH_VOLUMES.swipe) * (0.92 + Math.random() * 0.08)

    audio.volume = baseVolume
    audio.playbackRate = pitch
    audio.currentTime = start

    let fallbackId = null
    let fadeRaf = null
    let fading = false

    const cleanup = () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      if (fallbackId) clearTimeout(fallbackId)
      if (fadeRaf) cancelAnimationFrame(fadeRaf)
      fallbackId = null
      fadeRaf = null
      fading = false
      this.active.delete(audio)
    }

    const stop = () => {
      audio.pause()
      cleanup()
    }

    const beginFadeOut = () => {
      if (fading) return
      fading = true
      audio.removeEventListener('timeupdate', onTimeUpdate)

      const fadeStart = performance.now()
      const startVol = audio.volume

      const tick = () => {
        const progress = (performance.now() - fadeStart) / SWOOSH_FADE_OUT_MS
        if (progress >= 1) {
          stop()
          return
        }
        audio.volume = startVol * (1 - progress)
        fadeRaf = requestAnimationFrame(tick)
      }

      fadeRaf = requestAnimationFrame(tick)
    }

    const onTimeUpdate = () => {
      if (audio.currentTime >= fadeStartTime) beginFadeOut()
    }

    fallbackId = setTimeout(
      () => {
        if (!fading) beginFadeOut()
        else stop()
      },
      ((segmentLen + 0.05) / pitch) * 1000 + SWOOSH_FADE_OUT_MS
    )

    audio.addEventListener('timeupdate', onTimeUpdate)
    this.active.set(audio, stop)
    audio.play().catch(() => stop())
  }

  stopAll() {
    for (const stop of this.active.values()) {
      stop()
    }
  }

  dispose() {
    this.pool.forEach((audio) => {
      const stop = this.active.get(audio)
      if (stop) stop()
      audio.pause()
      audio.src = ''
    })
    this.pool = []
    this.active.clear()
    this.playheadByKind = {}
  }
}
