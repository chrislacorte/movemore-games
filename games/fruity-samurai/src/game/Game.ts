import * as THREE from 'three'
import { createSeededRandom } from '../core/rng'
import { FeelClock, ShakeRig, TweenManager } from '../core/feel'
import { loadFruitKit, FRUIT_KINDS, type FruitKind, type FruitTemplate } from '../assets/fruitKit'
import { Fruit, FruitHalf } from '../entities/Fruit'
import { InputSystem } from '../systems/Input'
import { HandTracker } from '../systems/HandTracker'
import { JuiceSystem } from '../systems/JuiceSystem'
import { WallSplat } from '../systems/WallSplat'
import { BladeTrail } from '../systems/BladeTrail'
import { createDojo } from '../systems/Dojo'
import { BASE_POINTS, FEEL, INFINITE, LIVES, PLAY, SLICE, TOSS } from './tuning'
import { mountHud, renderLives, syncMenuMode, type PlayMode } from '../ui/hud'

type Phase = 'menu' | 'playing' | 'over'
type Lane = 'sp' | 'mp'

export class Game {
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly clock = new THREE.Clock()
  private readonly feel = new FeelClock()
  private readonly shake = new ShakeRig()
  private readonly tweens = new TweenManager()
  private rng = createSeededRandom(2026)

  private kit!: Map<FruitKind, FruitTemplate>
  private input!: InputSystem
  private readonly hands = new HandTracker()
  private readonly juice = new JuiceSystem()
  private readonly wallSplat = new WallSplat()
  private readonly blade = new BladeTrail()
  private readonly fruits: Fruit[] = []
  private readonly halves: FruitHalf[] = []
  private readonly world = new THREE.Group()
  private divider: THREE.Object3D | null = null

  private phase: Phase = 'menu'
  private lane: Lane = 'sp'
  private mode: PlayMode = 'challenge'
  private score = 0
  private scores = [0, 0]
  private lives = LIVES
  private combo = 0
  private combos = [0, 0]
  private lastSlice = -10
  private lastSlices = [-10, -10]
  private nextSpawn = 0.6
  private playTime = 0
  private best = Number(localStorage.getItem('fs-feel-best') || 0)
  private hud!: ReturnType<typeof mountHud>
  private readonly camHome = new THREE.Vector3(0, 0.35, 13.6)
  private readonly cutNormal = new THREE.Vector3()
  private readonly ndc = new THREE.Vector3()
  private comboBurstAt = 0
  private spawnGuard = 0

  constructor(private readonly host: HTMLElement) {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80)
    this.camera.position.copy(this.camHome)
    this.camera.lookAt(0, 0, PLAY.wallZ + 1.2)

    const dpr = window.devicePixelRatio || 1
    this.renderer = new THREE.WebGLRenderer({
      antialias: dpr < 1.4,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(dpr, 1.25))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.08
    this.renderer.shadowMap.enabled = false
    this.renderer.localClippingEnabled = true
    this.host.appendChild(this.renderer.domElement)
    this.renderer.domElement.className = 'game-canvas'

    this.scene.background = new THREE.Color('#d9c9a8')
    this.scene.fog = new THREE.Fog('#d9c9a8', 16, 34)
    this.scene.add(this.world)
  }

  async start(): Promise<void> {
    this.kit = await loadFruitKit(TOSS.radius)
    this.buildLights()
    const dojo = createDojo()
    this.divider = dojo.getObjectByName('versus-divider') ?? null
    this.world.add(dojo)
    this.world.add(this.wallSplat.mesh)
    this.world.add(this.juice.mesh)
    this.world.add(this.blade.group)

    const hudRoot = document.createElement('div')
    hudRoot.className = 'hud'
    this.host.appendChild(hudRoot)
    this.hud = mountHud(hudRoot)
    this.bindMenu()
    this.bindIntro()

    this.input = new InputSystem(this.camera, this.renderer.domElement)
    this.host.appendChild(this.hands.video)
    this.onResize()
    window.addEventListener('resize', () => this.onResize())
    this.tick()
  }

  private bindIntro(): void {
    const seen = sessionStorage.getItem('fs-intro-seen') === '1'
    const video = this.hud.introVideo
    this.hud.center.hidden = !seen
    this.hud.titleArt.classList.toggle('off', !seen)
    if (seen) {
      this.finishIntro(false)
      return
    }
    this.hud.introSkip.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.finishIntro(true)
    })
    video.addEventListener('ended', () => this.finishIntro(true))
    video.muted = true
    video.playsInline = true
    void video.play().catch(() => {
      /* autoplay blocked — skip stays available */
    })
  }

  private finishIntro(markSeen: boolean): void {
    if (this.hud.intro.classList.contains('off')) {
      void this.hands.start().then(() => this.syncHud())
      return
    }
    this.hud.intro.classList.add('off')
    this.hud.introVideo.pause()
    this.hud.titleArt.classList.remove('off')
    this.hud.center.hidden = false
    if (markSeen) sessionStorage.setItem('fs-intro-seen', '1')
    void this.hands.start().then(() => this.syncHud())
    const camPoll = window.setInterval(() => {
      this.syncHud()
      if (this.hands.ready || this.hands.denied || this.hands.failed || !this.hands.starting) {
        if (this.hands.ready || this.hands.denied || this.hands.failed) window.clearInterval(camPoll)
      }
    }, 400)
  }

  private bindMenu(): void {
    this.hud.tabSp.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.lane = 'sp'
      if (this.mode === 'versus') this.mode = 'challenge'
      syncMenuMode(this.hud, this.lane, this.mode)
    })
    this.hud.tabMp.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.lane = 'mp'
      this.mode = 'versus'
      syncMenuMode(this.hud, this.lane, this.mode)
    })
    this.hud.chipChallenge.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.mode = 'challenge'
      syncMenuMode(this.hud, this.lane, this.mode)
    })
    this.hud.chipInfinite.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.mode = 'infinite'
      syncMenuMode(this.hud, this.lane, this.mode)
    })
    this.hud.startGame.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      void this.hands.start().then(() => this.syncHud())
      this.begin(this.lane === 'mp' ? 'versus' : this.mode)
    })
    this.hud.retry.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.begin(this.mode)
    })
    syncMenuMode(this.hud, this.lane, this.mode)
  }

  private buildLights(): void {
    this.scene.add(new THREE.AmbientLight('#fff6e0', 0.92))
    const key = new THREE.DirectionalLight('#fffaf0', 1.45)
    key.position.set(3.4, 7.2, 8)
    this.scene.add(key)
    this.scene.add(new THREE.DirectionalLight('#c9a227', 0.22))
  }

  private begin(mode: PlayMode = this.mode): void {
    this.mode = mode
    this.phase = 'playing'
    this.score = 0
    this.scores = [0, 0]
    this.lives = LIVES
    this.combo = 0
    this.combos = [0, 0]
    this.playTime = 0
    this.nextSpawn = 0.5
    this.spawnGuard = 1.25
    this.fruits.splice(0).forEach((f) => this.world.remove(f.group))
    this.halves.splice(0).forEach((h) => {
      this.world.remove(h.group)
      h.dispose()
    })
    this.juice.clear()
    this.wallSplat.clear()
    this.hud.center.hidden = true
    this.hud.over.hidden = true
    this.hud.over.setAttribute('aria-hidden', 'true')
    this.hud.titleArt.classList.add('off')
    if (this.divider) this.divider.visible = mode === 'versus'
    if (mode === 'versus') {
      this.spawn(0)
      this.spawn(1)
    } else {
      this.spawn(0)
    }
    this.syncHud()
  }

  private gameOver(message = 'GAME OVER'): void {
    this.phase = 'over'
    this.best = Math.max(this.best, this.mode === 'versus' ? Math.max(...this.scores) : this.score)
    localStorage.setItem('fs-feel-best', String(this.best))
    this.hud.over.hidden = false
    this.hud.over.setAttribute('aria-hidden', 'false')
    this.hud.overTitle.textContent = message
    this.hud.final.textContent =
      this.mode === 'versus' ? `${this.scores[0]} – ${this.scores[1]}` : String(this.score)
    this.hud.flash.animate([{ opacity: 0.7 }, { opacity: 0 }], { duration: 160, easing: 'ease-out' })
    this.hud.titleArt.classList.remove('off')
  }

  private spawn(board = 0): void {
    const bombChance =
      this.mode === 'infinite'
        ? Math.min(0.16, 0.05 + this.playTime * 0.004)
        : this.score > 40 || this.scores[0] + this.scores[1] > 40
          ? 0.1
          : 0.04
    const kind: FruitKind =
      this.rng() < bombChance && this.kit.has('bomb')
        ? 'bomb'
        : FRUIT_KINDS[Math.floor(this.rng() * FRUIT_KINDS.length)]
    const template = this.kit.get(kind)
    if (!template) return
    const x =
      this.mode === 'versus'
        ? board === 0
          ? this.rng.range(-PLAY.width * 0.42, -PLAY.width * 0.12)
          : this.rng.range(PLAY.width * 0.12, PLAY.width * 0.42)
        : this.rng.range(-PLAY.width * 0.32, PLAY.width * 0.32)
    const fruit = new Fruit(template, x, this.rng, board)
    this.fruits.push(fruit)
    this.world.add(fruit.group)
  }

  private tryMenuStart(): void {
    if (this.phase !== 'menu') return
    const rect = this.hud.startGame.getBoundingClientRect()
    const host = this.host.getBoundingClientRect()
    for (const trail of this.input.trails()) {
      if (trail.points.length < 2) continue
      let speed = 0
      for (let i = 1; i < trail.points.length; i += 1) {
        speed = Math.max(
          speed,
          Math.hypot(trail.points[i].x - trail.points[i - 1].x, trail.points[i].y - trail.points[i - 1].y),
        )
      }
      if (speed < SLICE.minSpeed) continue
      for (const p of trail.points) {
        this.ndc.set(p.x, p.y, 0).project(this.camera)
        const sx = host.left + (this.ndc.x * 0.5 + 0.5) * host.width
        const sy = host.top + (-this.ndc.y * 0.5 + 0.5) * host.height
        const dx = sx - (rect.left + rect.width / 2)
        const dy = sy - (rect.top + rect.height / 2)
        if (dx * dx + dy * dy <= (rect.width * 0.52) ** 2) {
          this.begin(this.lane === 'mp' ? 'versus' : this.mode)
          return
        }
      }
    }
  }

  private trySlice(): void {
    const trails = this.input.trails()
    for (const trail of trails) this.trySliceTrail(trail.points, trail.label)
  }

  private boardFromLabel(label: string, points: { x: number }[]): number {
    if (this.mode !== 'versus') return 0
    if (label === 'P1' || label === 'Left') return 0
    if (label === 'P2' || label === 'Right') return 1
    const last = points[points.length - 1]
    return last.x < 0 ? 0 : 1
  }

  private trySliceTrail(trail: { x: number; y: number; t?: number }[], label: string): void {
    if (trail.length < 2) return

    let bestDx = 0
    let bestDy = 0
    let bestSpeed = 0
    for (let i = 1; i < trail.length; i += 1) {
      const dx = trail[i].x - trail[i - 1].x
      const dy = trail[i].y - trail[i - 1].y
      const speed = Math.hypot(dx, dy)
      if (speed > bestSpeed) {
        bestSpeed = speed
        bestDx = dx
        bestDy = dy
      }
    }
    if (bestSpeed < SLICE.minSpeed) return
    const newest = trail[trail.length - 1] as { t?: number }
    if (typeof newest.t === 'number' && performance.now() / 1000 - newest.t > 0.09) return

    this.cutNormal.set(-bestDy, bestDx, 0).normalize()
    if (this.cutNormal.lengthSq() < 0.01) this.cutNormal.set(1, 0, 0)
    const board = this.boardFromLabel(label, trail)

    for (const fruit of this.fruits) {
      if (fruit.sliced || !fruit.alive) continue
      if (this.mode === 'versus' && fruit.board !== board) continue
      let hit = false
      for (let i = 1; i < trail.length; i += 1) {
        const a = trail[i - 1]
        const b = trail[i]
        const steps = SLICE.substeps
        for (let s = 1; s <= steps; s += 1) {
          const t0 = (s - 1) / steps
          const t1 = s / steps
          const x1 = a.x + (b.x - a.x) * t0
          const y1 = a.y + (b.y - a.y) * t0
          const x2 = a.x + (b.x - a.x) * t1
          const y2 = a.y + (b.y - a.y) * t1
          if (
            segmentHitsSphere(
              x1,
              y1,
              x2,
              y2,
              fruit.group.position.x,
              fruit.group.position.y,
              fruit.radius * SLICE.hitPad,
            )
          ) {
            hit = true
            break
          }
        }
        if (hit) break
      }
      if (hit) this.sliceFruit(fruit, board)
    }
  }

  private sliceFruit(fruit: Fruit, board = 0): void {
    fruit.sliced = true
    fruit.alive = false
    this.world.remove(fruit.group)

    const template = this.kit.get(fruit.kind)
    if (!template) return

    const n = this.cutNormal
    const pos = fruit.group.position

    if (fruit.isBomb) {
      this.combo = 0
      this.combos[board] = 0
      this.juice.burst(pos.x, pos.y, pos.z, fruit.juice, fruit.flesh, n, this.rng)
      this.wallSplat.stamp(pos.x, pos.y, fruit.juice, 0.34, true)
      this.feel.hitstop(48, 0.28)
      if (this.mode === 'infinite') {
        this.score = Math.max(0, this.score - INFINITE.bombPenalty)
      } else if (this.mode === 'versus') {
        this.scores[board] = Math.max(0, this.scores[board] - 12)
      } else {
        this.lives -= 1
      }
      this.syncHud()
      if (this.mode === 'challenge' && this.lives <= 0) this.gameOver()
      return
    }

    const now = this.clock.elapsedTime
    if (this.mode === 'versus') {
      if (now - this.lastSlices[board] > SLICE.comboWindow) this.combos[board] = 0
      this.combos[board] += 1
      this.lastSlices[board] = now
      this.scores[board] += BASE_POINTS * this.combos[board]
      this.combo = this.combos[board]
    } else {
      if (now - this.lastSlice > SLICE.comboWindow) this.combo = 0
      this.combo += 1
      this.lastSlice = now
      this.score += BASE_POINTS * this.combo
    }

    for (const side of [1, -1] as const) {
      const half = new FruitHalf(template, pos, fruit.group.quaternion, n, side)
      half.vx = fruit.vx + n.x * side * SLICE.halfKick * 0.55
      half.vy = Math.max(fruit.vy * 0.2, 0) + 3.6
      half.vz = n.z * side * 1.1
      half.spin.set(side * 2.8, 1.4, -side * 1.2)
      this.halves.push(half)
      this.world.add(half.group)
    }
    while (this.halves.length > 12) {
      const old = this.halves.shift()
      if (!old) break
      this.world.remove(old.group)
      old.dispose()
    }

    this.wallSplat.stamp(pos.x, pos.y, fruit.juice, 0.22, true)

    const heavy = this.combo >= 3
    this.feel.hitstop(heavy ? FEEL.comboHitstopMs : FEEL.sliceHitstopMs)
    if (heavy && now - this.comboBurstAt > 1.1) {
      this.feel.slowMo(FEEL.slowMoMs, FEEL.slowMoScale)
      this.comboBurstAt = now
    }
    this.syncHud()
  }

  private tick = (): void => {
    requestAnimationFrame(this.tick)
    const real = Math.min(this.clock.getDelta(), 0.05)
    const dt = this.feel.step(real)

    const now = performance.now() / 1000
    this.input.prune(now)
    if (!this.input.pointerActive) {
      this.hands.hands.forEach((hand) => {
        const wx = (hand.x - 0.5) * PLAY.width
        const label =
          this.mode === 'versus' || this.lane === 'mp' ? (wx < 0 ? 'P1' : 'P2') : hand.label
        this.input.pushHand(label, hand.x, hand.y, now)
      })
    }
    this.blade.update(this.input.trails())
    if (this.phase === 'menu') this.tryMenuStart()

    if (this.phase === 'playing') {
      this.playTime += dt
      this.spawnGuard = Math.max(0, this.spawnGuard - dt)
      this.nextSpawn -= dt
      if (this.nextSpawn <= 0) {
        if (this.mode === 'versus') {
          this.spawn(0)
          this.spawn(1)
        } else {
          this.spawn(0)
          if (this.mode === 'infinite' && this.score >= INFINITE.doubleSpawnScore && this.rng() < 0.35) {
            this.spawn(0)
          } else if (this.mode === 'challenge' && this.score > 80 && this.rng() < 0.28) {
            this.spawn(0)
          }
        }
        this.nextSpawn = this.nextSpawnDelay()
      }

      if (this.spawnGuard <= 0) this.trySlice()

      for (let i = this.fruits.length - 1; i >= 0; i -= 1) {
        const fruit = this.fruits[i]
        fruit.update(dt)
        if (!fruit.alive) {
          if (fruit.missed && !fruit.sliced && !fruit.isBomb && this.spawnGuard <= 0) {
            this.combo = 0
            this.combos[fruit.board] = 0
            this.wallSplat.stamp(fruit.group.position.x, -PLAY.height * 0.45, fruit.juice, 0.18, true)
            if (this.mode === 'infinite') {
              this.score = Math.max(0, this.score - INFINITE.missPenalty)
            } else if (this.mode === 'versus') {
              this.scores[fruit.board] = Math.max(0, this.scores[fruit.board] - 4)
            } else {
              this.lives -= 1
            }
            this.syncHud()
            if (this.mode === 'challenge' && this.lives <= 0) this.gameOver()
          }
          this.world.remove(fruit.group)
          this.fruits.splice(i, 1)
        }
      }

      for (let i = this.halves.length - 1; i >= 0; i -= 1) {
        const half = this.halves[i]
        half.update(dt)
        if (half.life <= 0 || half.group.position.y < -8) {
          this.world.remove(half.group)
          half.dispose()
          this.halves.splice(i, 1)
        }
      }
    }

    this.juice.update(real, this.wallSplat)
    this.wallSplat.fade(real)
    this.wallSplat.sync()
    this.tweens.update(real)

    this.camera.position.copy(this.camHome)
    this.camera.lookAt(0, 0, PLAY.wallZ + 1.2)
    if (this.camera.fov !== 42) {
      this.camera.fov = 42
      this.camera.updateProjectionMatrix()
    }

    this.renderer.render(this.scene, this.camera)
  }

  private nextSpawnDelay(): number {
    if (this.mode === 'infinite') {
      const hurry = Math.max(INFINITE.spawnFloor, TOSS.spawnMax - this.playTime * 0.045 - this.score * 0.003)
      return this.rng.range(Math.max(INFINITE.spawnFloor, hurry * 0.55), hurry)
    }
    if (this.mode === 'versus') {
      return this.rng.range(0.7, 1.25)
    }
    const hurry = Math.max(0.55, TOSS.spawnMax - this.score * 0.002)
    return this.rng.range(TOSS.spawnMin, hurry)
  }

  private syncHud(): void {
    const playing = this.phase === 'playing'
    this.hud.playingOnly.forEach((el) => {
      el.hidden = !playing
    })
    this.hud.versusScores.hidden = !(playing && this.mode === 'versus')
    this.hud.score.textContent = String(this.mode === 'versus' ? this.scores[0] + this.scores[1] : this.score)
    this.hud.scoreP1.textContent = String(this.scores[0])
    this.hud.scoreP2.textContent = String(this.scores[1])
    this.hud.modeLabel.textContent =
      this.phase === 'menu' ? '' : this.mode === 'infinite' ? 'Infinity' : this.mode === 'versus' ? 'Versus' : 'Challenge'
    renderLives(this.hud.lives, this.lives, LIVES, this.mode !== 'challenge' && this.phase !== 'menu')
    if (this.hud.cam) {
      this.hud.cam.textContent = this.hands.denied
        ? 'Camera denied — use mouse'
        : this.hands.failed
          ? 'Hands failed — use mouse'
          : this.hands.ready
            ? 'Hands ready'
            : this.hands.cameraOn
              ? 'Camera on — show your hands'
              : 'Loading camera…'
    }
    if (this.combo > 1 && this.phase === 'playing') {
      this.hud.combo.hidden = false
      this.hud.combo.textContent = `x${this.combo} COMBO`
    } else {
      this.hud.combo.hidden = true
    }
  }

  private onResize(): void {
    const w = this.host.clientWidth || window.innerWidth
    const h = this.host.clientHeight || window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h, false)
    this.blade.setResolution(w, h)
  }
}

function segmentHitsSphere(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  cx: number,
  cy: number,
  r: number,
): boolean {
  const abx = x2 - x1
  const aby = y2 - y1
  const acx = cx - x1
  const acy = cy - y1
  const len = abx * abx + aby * aby
  if (len <= 1e-8) return acx * acx + acy * acy <= r * r
  let t = (acx * abx + acy * aby) / len
  t = Math.max(0, Math.min(1, t))
  const dx = cx - (x1 + t * abx)
  const dy = cy - (y1 + t * aby)
  return dx * dx + dy * dy <= r * r
}
