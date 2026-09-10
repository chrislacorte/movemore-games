import type { TrackingStats, Landmark } from '../tracking/types'
import type { GameMode } from '../game/tuning'
import { MODES } from '../game/tuning'

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
]

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, html?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (className) e.className = className
  if (html !== undefined) e.innerHTML = html
  return e
}

export interface HudCallbacks {
  onToggleMute: () => boolean
  onSelectMode: (mode: GameMode) => void
  onRetry: () => void
  onMenu: () => void
  onEnableCamera: () => void
}

export class Hud {
  readonly root: HTMLElement
  private readonly scoreEl: HTMLElement
  private readonly bestEl: HTMLElement
  private readonly livesEl: HTMLElement
  private readonly timerEl: HTMLElement
  private readonly modeEl: HTMLElement
  private readonly popups: HTMLElement
  private readonly loading: HTMLElement
  private readonly loadingBar: HTMLElement
  private readonly loadingText: HTMLElement
  private readonly menu: HTMLElement
  private readonly gameOver: HTMLElement
  private readonly goScore: HTMLElement
  private readonly goBest: HTMLElement
  private readonly goReason: HTMLElement
  private readonly camBox: HTMLElement
  private readonly camCanvas: HTMLCanvasElement
  private readonly camStats: HTMLElement
  private readonly camHint: HTMLElement
  private readonly labels = new Map<string, HTMLElement>()
  private readonly muteBtn: HTMLButtonElement
  private readonly banner: HTMLElement
  private readonly vignette: HTMLElement
  private lastScore = -1
  private lastLives = -1
  private lastTimer = ''

  constructor(
    container: HTMLElement,
    video: HTMLVideoElement,
    cb: HudCallbacks,
  ) {
    this.root = container

    // ---- top bar
    const top = el('div', 'hud-top')
    const left = el('div', 'hud-score')
    this.scoreEl = el('div', 'score-value', '0')
    this.bestEl = el('div', 'score-best', 'Best 0')
    left.append(this.scoreEl, this.bestEl)
    this.modeEl = el('div', 'hud-mode')
    const right = el('div', 'hud-right')
    this.livesEl = el('div', 'hud-lives')
    this.timerEl = el('div', 'hud-timer')
    right.append(this.timerEl, this.livesEl)
    top.append(left, this.modeEl, right)

    this.popups = el('div', 'popups')
    this.banner = el('div', 'banner')
    this.vignette = el('div', 'danger-vignette')

    // ---- loading
    this.loading = el('div', 'overlay loading')
    this.loading.innerHTML = `<div class="title small">FRUIT <span>NINJA</span> 3D</div><div class="loading-track"><div class="loading-bar"></div></div><div class="loading-text">Sharpening blades…</div>`
    this.loadingBar = this.loading.querySelector('.loading-bar') as HTMLElement
    this.loadingText = this.loading.querySelector('.loading-text') as HTMLElement

    // ---- menu
    this.menu = el('div', 'menu hidden')
    this.menu.innerHTML = `
      <div class="menu-head">
        <div class="title">FRUIT <span>NINJA</span> 3D</div>
        <div class="subtitle">Slice a fruit with your finger to start</div>
      </div>
      <div class="menu-foot">
        <div class="howto">
          <div><b>Index finger</b> is your blade — swipe fast through the fruit</div>
          <div><b>3+ fruits</b> in one swipe = combo · <b>bombs</b> are bad news</div>
          <div class="muted">No camera? Click &amp; drag with the mouse.</div>
          <div class="muted sound-hint hidden">🔈 Tap or click once to enable sound</div>
        </div>
        <div class="mode-buttons">
          ${(Object.keys(MODES) as GameMode[])
            .map((m) => `<button class="mode-btn" data-mode="${m}"><span>${MODES[m].title}</span><small>${MODES[m].tagline}</small></button>`)
            .join('')}
        </div>
      </div>`
    this.menu.querySelectorAll<HTMLButtonElement>('.mode-btn').forEach((b) => {
      b.addEventListener('click', () => cb.onSelectMode(b.dataset.mode as GameMode))
    })

    // ---- game over
    this.gameOver = el('div', 'overlay gameover hidden')
    this.gameOver.innerHTML = `
      <div class="go-card">
        <div class="go-title">GAME OVER</div>
        <div class="go-reason"></div>
        <div class="go-score"><span>0</span><small>points</small></div>
        <div class="go-best"></div>
        <div class="go-hint">Slice a fruit — or tap a button</div>
        <div class="go-buttons">
          <button class="btn primary" data-act="retry">Play again</button>
          <button class="btn" data-act="menu">Menu</button>
        </div>
      </div>`
    this.goScore = this.gameOver.querySelector('.go-score span') as HTMLElement
    this.goBest = this.gameOver.querySelector('.go-best') as HTMLElement
    this.goReason = this.gameOver.querySelector('.go-reason') as HTMLElement
    this.gameOver.querySelector('[data-act="retry"]')?.addEventListener('click', () => cb.onRetry())
    this.gameOver.querySelector('[data-act="menu"]')?.addEventListener('click', () => cb.onMenu())

    // ---- camera preview
    this.camBox = el('div', 'cam-box')
    video.className = 'cam-video'
    this.camCanvas = el('canvas', 'cam-overlay')
    this.camCanvas.width = 240
    this.camCanvas.height = 180
    this.camStats = el('div', 'cam-stats', 'camera off')
    this.camHint = el('button', 'cam-hint', 'Enable camera')
    this.camHint.addEventListener('click', () => cb.onEnableCamera())
    this.camBox.append(video, this.camCanvas, this.camStats, this.camHint)

    // ---- corner buttons
    const corner = el('div', 'corner-buttons')
    this.muteBtn = el('button', 'icon-btn', '🔊')
    this.muteBtn.title = 'Sound'
    this.muteBtn.addEventListener('click', () => {
      const muted = cb.onToggleMute()
      this.muteBtn.textContent = muted ? '🔇' : '🔊'
    })
    const fsBtn = el('button', 'icon-btn', '⛶')
    fsBtn.title = 'Fullscreen'
    fsBtn.addEventListener('click', () => {
      if (document.fullscreenElement) void document.exitFullscreen()
      else void document.documentElement.requestFullscreen?.()
    })
    const home = el('a', 'icon-btn', '⌂') as HTMLAnchorElement
    home.href = '/'
    home.title = 'MoveMore Games'
    corner.append(home, this.muteBtn, fsBtn)

    container.append(this.vignette, top, this.popups, this.banner, this.menu, this.gameOver, this.camBox, corner, this.loading)
  }

  setMuted(muted: boolean): void {
    this.muteBtn.textContent = muted ? '🔇' : '🔊'
  }

  setSoundHint(visible: boolean): void {
    this.menu.querySelector('.sound-hint')?.classList.toggle('hidden', !visible)
  }

  // ---------------------------------------------------------------- loading
  setLoading(progress: number, text?: string): void {
    this.loadingBar.style.width = `${Math.round(progress * 100)}%`
    if (text) this.loadingText.textContent = text
  }

  hideLoading(): void {
    this.loading.classList.add('hidden')
  }

  // ---------------------------------------------------------------- menus
  showMenu(visible: boolean): void {
    this.menu.classList.toggle('hidden', !visible)
  }

  showGameOver(visible: boolean, score = 0, best = 0, reason = ''): void {
    this.gameOver.classList.toggle('hidden', !visible)
    if (visible) {
      this.goScore.textContent = String(score)
      this.goBest.textContent = score >= best && score > 0 ? '★ New best score!' : `Best ${best}`
      this.goReason.textContent = reason
    }
  }

  /** Floating label under a 3D menu fruit (pixel coords). */
  label(id: string, text: string, x: number, y: number, visible: boolean): void {
    let l = this.labels.get(id)
    if (!l) {
      l = el('div', 'fruit-label')
      this.root.append(l)
      this.labels.set(id, l)
    }
    if (l.textContent !== text) l.textContent = text
    l.style.transform = `translate(-50%, 0) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
    l.classList.toggle('hidden', !visible)
  }

  clearLabels(): void {
    for (const l of this.labels.values()) l.classList.add('hidden')
  }

  // ---------------------------------------------------------------- in-game
  setHudVisible(visible: boolean): void {
    this.root.classList.toggle('in-game', visible)
  }

  setScore(score: number, best: number): void {
    if (score !== this.lastScore) {
      this.lastScore = score
      this.scoreEl.textContent = String(score)
      this.scoreEl.classList.remove('bump')
      void this.scoreEl.offsetWidth
      this.scoreEl.classList.add('bump')
    }
    this.bestEl.textContent = `Best ${best}`
  }

  setMode(mode: GameMode | null): void {
    this.modeEl.textContent = mode ? MODES[mode].title : ''
  }

  setLives(lives: number, max: number): void {
    if (lives === this.lastLives) return
    const lost = this.lastLives > lives
    this.lastLives = lives
    this.livesEl.innerHTML = ''
    for (let i = 0; i < max; i += 1) {
      const x = el('span', `life ${i < max - lives ? 'lost' : ''}`, '✕')
      if (lost && i === max - lives - 1) x.classList.add('just-lost')
      this.livesEl.append(x)
    }
  }

  setTimer(seconds: number | null): void {
    const text = seconds === null ? '' : `${Math.max(0, Math.ceil(seconds))}`
    if (text === this.lastTimer) return
    this.lastTimer = text
    this.timerEl.textContent = text
    this.timerEl.classList.toggle('urgent', seconds !== null && seconds <= 10)
  }

  popup(text: string, x: number, y: number, kind: 'score' | 'combo' | 'critical' | 'bad' | 'info' = 'score'): void {
    const p = el('div', `popup ${kind}`, text)
    p.style.left = `${x.toFixed(0)}px`
    p.style.top = `${y.toFixed(0)}px`
    this.popups.append(p)
    setTimeout(() => p.remove(), 1100)
  }

  showBanner(text: string, ms = 1400, kind = ''): void {
    this.banner.textContent = text
    this.banner.className = `banner show ${kind}`
    window.clearTimeout((this.banner as unknown as { _t?: number })._t)
    ;(this.banner as unknown as { _t?: number })._t = window.setTimeout(() => this.banner.classList.remove('show'), ms)
  }

  flashDanger(): void {
    this.vignette.classList.remove('flash')
    void this.vignette.offsetWidth
    this.vignette.classList.add('flash')
  }

  // ---------------------------------------------------------------- camera
  setCameraState(state: 'off' | 'starting' | 'on' | 'denied' | 'failed'): void {
    this.camBox.dataset.state = state
    this.camHint.classList.toggle('hidden', state === 'on' || state === 'starting')
    this.camHint.textContent = state === 'denied' ? 'Camera blocked — allow & retry' : state === 'failed' ? 'Retry camera' : 'Enable camera'
    if (state === 'starting') this.camStats.textContent = 'starting…'
    if (state === 'off') this.camStats.textContent = 'camera off · mouse mode'
    if (state === 'denied') this.camStats.textContent = 'camera blocked · mouse mode'
    if (state === 'failed') this.camStats.textContent = 'tracking failed · mouse mode'
  }

  drawTracking(sets: Landmark[][], stats: TrackingStats): void {
    const ctx = this.camCanvas.getContext('2d')
    if (!ctx) return
    const w = this.camCanvas.width
    const h = this.camCanvas.height
    ctx.clearRect(0, 0, w, h)
    for (const marks of sets) {
      ctx.strokeStyle = 'rgba(120, 255, 200, 0.85)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (const [a, b] of HAND_CONNECTIONS) {
        const p = marks[a]
        const q = marks[b]
        if (!p || !q) continue
        ctx.moveTo((1 - p.x) * w, p.y * h)
        ctx.lineTo((1 - q.x) * w, q.y * h)
      }
      ctx.stroke()
      for (let i = 0; i < marks.length; i += 1) {
        const m = marks[i]
        ctx.fillStyle = i === 8 ? '#ffd23f' : 'rgba(255,255,255,0.9)'
        ctx.beginPath()
        ctx.arc((1 - m.x) * w, m.y * h, i === 8 ? 5 : 2.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    const q = stats.fps >= 24 && stats.latencyMs < 90 ? 'good' : stats.fps >= 14 ? 'ok' : 'poor'
    this.camStats.innerHTML = `<i class="dot ${q}"></i>${stats.hands} hand${stats.hands === 1 ? '' : 's'} · ${stats.fps} fps · ${stats.latencyMs.toFixed(0)} ms · ${stats.delegate}`
  }
}
