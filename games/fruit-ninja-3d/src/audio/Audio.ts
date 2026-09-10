import { assetPath } from '../core/assetPath'
import { rand } from '../core/math'

type SoundName = 'swish' | 'splash' | 'explosion' | 'combo'

const FILES: Record<SoundName, string> = {
  swish: 'sounds/sword-swish.mp3',
  splash: 'sounds/fruit-splash.mp3',
  explosion: 'sounds/explosion.wav',
  combo: 'sounds/katana-combo.wav',
}

const MUTE_KEY = 'fruitninja3d.muted'

export class AudioBus {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private musicGain: GainNode | null = null
  private readonly buffers = new Map<SoundName, AudioBuffer>()
  private musicBuffer: AudioBuffer | null = null
  private musicSource: AudioBufferSourceNode | null = null
  private lastSwish = 0
  muted = localStorage.getItem(MUTE_KEY) === '1'

  /** True while the browser still needs a tap/click before sound may play. */
  get suspended(): boolean {
    return !this.ctx || this.ctx.state !== 'running'
  }

  /**
   * Creates the context (allowed without a gesture, but it starts suspended in most browsers)
   * and resumes it. Call again from any user gesture to actually unlock playback.
   */
  async unlock(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        try {
          await this.ctx.resume()
        } catch {
          /* still needs a gesture */
        }
      }
      return
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 1
    this.master.connect(this.ctx.destination)
    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0.28
    this.musicGain.connect(this.master)
    void this.loadAll()
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        /* needs a gesture */
      }
    }
  }

  private async loadAll(): Promise<void> {
    const ctx = this.ctx
    if (!ctx) return
    const load = async (url: string): Promise<AudioBuffer | null> => {
      try {
        const res = await fetch(assetPath(url))
        const data = await res.arrayBuffer()
        return await ctx.decodeAudioData(data)
      } catch (err) {
        console.warn('[audio] failed to load', url, err)
        return null
      }
    }
    await Promise.all(
      (Object.keys(FILES) as SoundName[]).map(async (name) => {
        const buf = await load(FILES[name])
        if (buf) this.buffers.set(name, buf)
      }),
    )
    this.musicBuffer = await load('sounds/music.mp3')
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0')
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05)
    }
    return this.muted
  }

  play(name: SoundName, volume = 1, rate = 1): void {
    const ctx = this.ctx
    const buf = this.buffers.get(name)
    if (!ctx || !buf || !this.master) return
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.playbackRate.value = rate
    const g = ctx.createGain()
    g.gain.value = volume
    src.connect(g).connect(this.master)
    src.start()
  }

  swish(speed: number): void {
    const now = performance.now()
    if (now - this.lastSwish < 140) return
    this.lastSwish = now
    this.play('swish', Math.min(0.9, 0.35 + speed * 0.2), rand(0.9, 1.15))
  }

  slice(): void {
    this.play('splash', 0.8, rand(0.85, 1.2))
  }

  combo(size: number): void {
    this.play('combo', 0.9, 1 + Math.min(0.5, (size - 3) * 0.08))
  }

  explosion(): void {
    this.play('explosion', 1)
  }

  startMusic(): void {
    if (!this.ctx || !this.musicGain || this.musicSource) return
    if (!this.musicBuffer) {
      // buffers may still be loading; retry shortly
      setTimeout(() => this.startMusic(), 600)
      return
    }
    const src = this.ctx.createBufferSource()
    src.buffer = this.musicBuffer
    src.loop = true
    src.connect(this.musicGain)
    src.start()
    this.musicSource = src
  }

  stopMusic(): void {
    try {
      this.musicSource?.stop()
    } catch {
      /* already stopped */
    }
    this.musicSource = null
  }

  setMusicLevel(level: number): void {
    if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.3)
  }
}
