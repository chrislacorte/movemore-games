import * as THREE from 'three'
import { PLAY_Z, Stage } from '../render/Stage'
import { Fx } from '../render/Fx'
import { BladeTrailRenderer } from '../render/BladeTrail'
import { BladeSystem, MIN_SLICE_SPEED, type Blade, type Segment } from '../tracking/BladeSystem'
import type { BladePoint } from '../tracking/types'
import { Fruit, Piece } from '../fruit/Fruit'
import { pickFruitKind, type FruitKind, type FruitTemplate } from '../fruit/FruitKit'
import { Hud } from '../ui/Hud'
import { AudioBus } from '../audio/Audio'
import { MODES, TUNING, type GameMode } from './tuning'
import { chance, clamp, lerp, pick, pointSegmentDist2, rand } from '../core/math'

type State = 'menu' | 'playing' | 'dying' | 'gameover'

interface PendingSpawn {
  at: number
  kind: FruitKind
  x0: number
  xt: number
  apex: number
}

const BEST_KEY = (mode: GameMode) => `fruitninja3d.best.${mode}`

const vA = new THREE.Vector3()
const vB = new THREE.Vector3()
const vDir = new THREE.Vector3()
const vView = new THREE.Vector3()
const vNormal = new THREE.Vector3()
const vTmp = new THREE.Vector3()
const px = { x: 0, y: 0 }

export class Game {
  state: State = 'menu'
  mode: GameMode = 'classic'
  score = 0
  lives = 0
  private elapsed = 0
  private timeLeft = 0
  private waveTimer = 0.8
  private waveCount = 0
  private pending: PendingSpawn[] = []
  private comboCount = 0
  private comboTimer = 0
  private readonly comboPos = new THREE.Vector3()
  private timeScale = 1
  private slowmo = 0
  private stateTimer = 0
  private gameOverReason = ''
  private gameOverShown = false
  private lastBladeSoundSpeed = 0

  readonly fruits: Fruit[] = []
  readonly pieces: Piece[] = []
  readonly blades = new BladeSystem()
  private readonly trails: BladeTrailRenderer
  private readonly fx: Fx

  constructor(
    private readonly stage: Stage,
    private readonly kit: Map<FruitKind, FruitTemplate>,
    private readonly hud: Hud,
    private readonly audio: AudioBus,
  ) {
    this.trails = new BladeTrailRenderer(stage.overlay)
    this.fx = new Fx(stage.scene)
  }

  // ------------------------------------------------------------------ helpers
  private template(kind: FruitKind): FruitTemplate {
    const t = this.kit.get(kind)
    if (!t) throw new Error(`missing template ${kind}`)
    return t
  }

  private makeFruit(kind: FruitKind): Fruit {
    const t = this.template(kind)
    const scale = (TUNING.fruitRadius * t.def.size) / t.radius
    const fruit = new Fruit(t, scale)
    this.fruits.push(fruit)
    this.stage.scene.add(fruit.mesh)
    return fruit
  }

  private removeFruit(fruit: Fruit): void {
    fruit.alive = false
    this.stage.scene.remove(fruit.mesh)
    const i = this.fruits.indexOf(fruit)
    if (i >= 0) this.fruits.splice(i, 1)
  }

  private clearFruits(): void {
    for (const f of [...this.fruits]) this.removeFruit(f)
    this.pending.length = 0
  }

  best(mode = this.mode): number {
    return Number(localStorage.getItem(BEST_KEY(mode)) ?? 0)
  }

  private get level(): number {
    return clamp((this.elapsed / TUNING.levelSeconds) * MODES[this.mode].pace, 0, TUNING.maxLevel)
  }

  // ------------------------------------------------------------------ menu
  enterMenu(): void {
    this.state = 'menu'
    this.clearFruits()
    this.hud.setHudVisible(false)
    this.hud.showGameOver(false)
    this.hud.showMenu(true)
    this.hud.clearLabels()
    this.hud.setMode(null)
    this.audio.setMusicLevel(0.22)
    this.spawnMenuFruits([
      { kind: 'watermelon', tag: 'mode:classic', label: 'CLASSIC' },
      { kind: 'pineapple', tag: 'mode:arcade', label: 'ARCADE' },
      { kind: 'peach', tag: 'mode:zen', label: 'ZEN' },
    ])
  }

  private spawnMenuFruits(items: { kind: FruitKind; tag: string; label: string }[]): void {
    const b = this.stage.bounds(PLAY_Z)
    const width = b.right - b.left
    const spread = Math.min(width * 0.3, 6.5)
    items.forEach((item, i) => {
      const fruit = this.makeFruit(item.kind)
      fruit.floating = true
      fruit.tag = `${item.tag}|${item.label}`
      const x = items.length === 1 ? 0 : lerp(-spread, spread, i / (items.length - 1))
      fruit.baseY = (b.top + b.bottom) / 2 - 0.4
      fruit.pos.set(x, fruit.baseY, PLAY_Z)
      fruit.spin.set(0.15, 0.7, 0.05)
      fruit.entered = true
      fruit.mesh.scale.setScalar(fruit.scale * 1.25)
      fruit.update(0, 0)
    })
  }

  // ------------------------------------------------------------------ play
  start(mode: GameMode): void {
    this.mode = mode
    const def = MODES[mode]
    this.clearFruits()
    this.fx.clearSplats()
    this.hud.clearLabels()
    this.hud.showMenu(false)
    this.hud.showGameOver(false)
    this.hud.setHudVisible(true)
    this.hud.setMode(mode)
    this.score = 0
    this.lives = def.lives
    this.elapsed = 0
    this.timeLeft = def.duration
    this.waveTimer = 0.9
    this.waveCount = 0
    this.comboCount = 0
    this.comboTimer = 0
    this.timeScale = 1
    this.slowmo = 0
    this.gameOverShown = false
    this.state = 'playing'
    this.hud.setScore(0, this.best())
    this.hud.setLives(this.lives, def.lives)
    this.hud.setTimer(def.duration ? def.duration : null)
    this.hud.showBanner(def.title.toUpperCase(), 1200)
    this.audio.setMusicLevel(0.3)
    this.audio.startMusic()
  }

  private endGame(reason: string): void {
    if (this.state === 'gameover') return
    this.state = 'gameover'
    this.stateTimer = 0
    this.gameOverReason = reason
    this.pending.length = 0
    this.comboCount = 0
    const best = this.best()
    if (this.score > best) localStorage.setItem(BEST_KEY(this.mode), String(this.score))
    this.hud.setTimer(null)
    this.audio.setMusicLevel(0.15)
  }

  private showGameOverUi(): void {
    this.hud.setHudVisible(false)
    this.hud.showGameOver(true, this.score, Math.max(this.score, this.best()), this.gameOverReason)
    this.spawnMenuFruits([
      { kind: 'red-apple', tag: 'retry', label: 'AGAIN' },
      { kind: 'lime', tag: 'menu', label: 'MENU' },
    ])
    // push the menu fruits down so they don't sit under the card
    const b = this.stage.bounds(PLAY_Z)
    for (const f of this.fruits) {
      if (!f.floating) continue
      f.baseY = b.bottom + (b.top - b.bottom) * 0.28
      f.pos.y = f.baseY
    }
  }

  // ------------------------------------------------------------------ spawning
  private waveInterval(): number {
    const t = this.level / TUNING.maxLevel
    return lerp(TUNING.waveIntervalStart, TUNING.waveIntervalEnd, t) / MODES[this.mode].pace
  }

  private bombChance(): number {
    if (!MODES[this.mode].bombs) return 0
    return lerp(TUNING.bombChanceStart, TUNING.bombChanceEnd, this.level / TUNING.maxLevel)
  }

  private spawnWave(): void {
    const b = this.stage.bounds(PLAY_Z)
    const lvl = this.level
    const margin = 1.6
    const left = b.left + margin
    const right = b.right - margin
    const width = right - left
    const apexLo = lerp(b.bottom, b.top, 0.45)
    const apexHi = b.top - 1.6

    type Pattern = 'single' | 'pair' | 'volley' | 'line' | 'fountain'
    const patterns: Pattern[] = ['single', 'pair']
    if (lvl >= 1) patterns.push('volley', 'pair')
    if (lvl >= 2.5) patterns.push('line', 'volley', 'fountain')
    if (lvl >= 5) patterns.push('fountain', 'line', 'volley')
    const pattern = this.waveCount === 0 ? 'single' : pick(patterns)
    this.waveCount += 1

    const now = this.elapsed
    const plan: PendingSpawn[] = []
    const push = (x0: number, xt: number, apex: number, at: number) => {
      const kind: FruitKind = chance(this.bombChance()) ? 'bomb' : pickFruitKind()
      plan.push({ at: now + at, kind, x0: clamp(x0, left, right), xt: clamp(xt, left, right), apex: clamp(apex, apexLo, apexHi) })
    }

    switch (pattern) {
      case 'single': {
        const x0 = rand(left, right)
        push(x0, x0 + rand(-width * 0.25, width * 0.25), rand(apexLo, apexHi), 0)
        break
      }
      case 'pair': {
        const x0 = rand(left, right - width * 0.3)
        push(x0, x0 + rand(-2, 2), rand(apexLo, apexHi), 0)
        push(x0 + width * 0.3, x0 + width * 0.3 + rand(-2, 2), rand(apexLo, apexHi), rand(0.05, 0.25))
        break
      }
      case 'volley': {
        const n = 3 + Math.floor(rand(0, Math.min(3, lvl / 2)))
        for (let i = 0; i < n; i += 1) {
          const x0 = rand(left, right)
          push(x0, x0 + rand(-3, 3), rand(apexLo, apexHi), i * rand(0.08, 0.16))
        }
        break
      }
      case 'line': {
        const n = 4 + Math.floor(rand(0, Math.min(3, lvl / 3)))
        const dir = chance(0.5) ? 1 : -1
        const apex = rand(apexLo + 1, apexHi)
        for (let i = 0; i < n; i += 1) {
          const t = i / (n - 1)
          const x = lerp(left + 0.5, right - 0.5, dir > 0 ? t : 1 - t)
          push(x, x, apex, i * 0.11)
        }
        break
      }
      case 'fountain': {
        const n = 5 + Math.floor(rand(0, Math.min(3, lvl / 3)))
        const cx = rand(-width * 0.15, width * 0.15)
        for (let i = 0; i < n; i += 1) {
          const t = n === 1 ? 0.5 : i / (n - 1)
          push(cx + rand(-1, 1), lerp(left + 1, right - 1, t), rand(apexLo + 1, apexHi), i * 0.06)
        }
        break
      }
    }

    // never spawn a wave that is all bombs
    if (plan.length && plan.every((p) => p.kind === 'bomb')) plan[0].kind = pickFruitKind()
    this.pending.push(...plan)
  }

  private launch(p: PendingSpawn): void {
    const b = this.stage.bounds(PLAY_Z)
    const fruit = this.makeFruit(p.kind)
    const g = TUNING.gravity
    const y0 = b.bottom - fruit.radius - 0.4
    const vy = Math.sqrt(2 * g * Math.max(1, p.apex - y0))
    const flight = (2 * vy) / g
    const vx = (p.xt - p.x0) / (flight * 0.5)
    fruit.pos.set(p.x0, y0, PLAY_Z + rand(-1.3, 1.3))
    fruit.vel.set(vx, vy, 0)
    fruit.spin.set(rand(-3, 3), rand(-3, 3), rand(-2, 2))
    if (fruit.isBomb) fruit.spin.multiplyScalar(0.6)
    fruit.update(0, 0)
  }

  // ------------------------------------------------------------------ slicing
  private projectFruits(): void {
    for (const f of this.fruits) {
      this.stage.project(f.pos, px)
      f.sx = px.x
      f.sy = px.y
      f.sr = this.stage.pixelRadius(f.pos, f.radius)
    }
  }

  private checkSlices(now: number): void {
    for (const blade of this.blades.blades.values()) {
      if (!blade.alive || !blade.segments.length) continue
      if (blade.speed < MIN_SLICE_SPEED) continue
      for (const seg of blade.segments) {
        for (const fruit of [...this.fruits]) {
          if (!fruit.alive) continue
          if (this.state === 'playing' && fruit.sy > this.stage.height + fruit.sr) continue
          const hitR = fruit.sr * 0.92
          const { d2 } = pointSegmentDist2(fruit.sx, fruit.sy, seg.x0, seg.y0, seg.x1, seg.y1)
          if (d2 <= hitR * hitR) this.hit(fruit, blade, seg, now)
        }
      }
    }
  }

  private hit(fruit: Fruit, blade: Blade, seg: Segment, now: number): void {
    // blade direction in world space at the fruit's depth
    this.stage.unproject(seg.x0, seg.y0, fruit.pos.z, vA)
    this.stage.unproject(seg.x1, seg.y1, fruit.pos.z, vB)
    vDir.subVectors(vB, vA)
    if (vDir.lengthSq() < 1e-6) vDir.set(1, 0, 0)
    vDir.normalize()
    vView.subVectors(fruit.pos, this.stage.camera.position).normalize()
    vNormal.crossVectors(vDir, vView).normalize()

    const speed = clamp(blade.speed, MIN_SLICE_SPEED, 4)
    const bladeVel = vTmp.copy(vDir).multiplyScalar(speed * 2.2)
    const pieces = fruit.slice(vNormal, 2.2 + speed * 0.9, bladeVel)
    for (const p of pieces) {
      this.pieces.push(p)
      this.stage.scene.add(p.group)
    }
    const juice = fruit.template.juice
    this.removeFruit(fruit)

    if (fruit.isBomb) {
      this.onBomb(fruit)
      return
    }

    this.fx.juice(fruit.pos, vDir, juice, TUNING.juiceCount + Math.round(speed * 6), 6 + speed * 1.5)
    this.fx.splat(fruit.pos, juice, fruit.radius)
    this.fx.flash(fruit.pos, juice, fruit.radius * 3.2)
    this.audio.slice()

    if (fruit.tag) {
      this.onMenuFruit(fruit.tag)
      return
    }
    if (this.state !== 'playing') return

    let points = TUNING.fruitPoints
    let kind: 'score' | 'critical' = 'score'
    if (chance(TUNING.criticalChance)) {
      points += TUNING.criticalBonus
      kind = 'critical'
      this.stage.shake(0.12)
      this.fx.flash(fruit.pos, new THREE.Color('#ffffff'), fruit.radius * 6)
    }
    this.addScore(points)
    this.hud.popup(kind === 'critical' ? `CRITICAL +${points}` : `+${points}`, fruit.sx, fruit.sy - fruit.sr * 0.6, kind)

    // combo bookkeeping
    this.comboCount += 1
    this.comboTimer = TUNING.comboWindow
    this.comboPos.copy(fruit.pos)
    void now
  }

  private addScore(points: number): void {
    this.score = Math.max(0, this.score + points)
    this.hud.setScore(this.score, Math.max(this.best(), this.score))
  }

  private resolveCombo(): void {
    const n = this.comboCount
    this.comboCount = 0
    if (n < TUNING.comboMin) return
    const bonus = n * TUNING.comboBonusPerFruit
    this.addScore(bonus)
    this.stage.project(this.comboPos, px)
    this.hud.popup(`${n} FRUIT COMBO  +${bonus}`, clamp(px.x, 160, this.stage.width - 160), clamp(px.y - 60, 80, this.stage.height - 80), 'combo')
    this.audio.combo(n)
    if (n >= 4) {
      this.slowmo = 0.28
      this.stage.shake(0.08)
    }
    if (n >= 5) this.hud.showBanner(n >= 7 ? 'LEGENDARY!' : 'AMAZING!', 900, 'good')
  }

  private onBomb(fruit: Fruit): void {
    this.fx.explosion(fruit.pos)
    this.audio.explosion()
    this.stage.shake(0.55)
    this.hud.flashDanger()
    if (fruit.tag || this.state !== 'playing') return
    const def = MODES[this.mode]
    if (def.bombIsFatal) {
      this.state = 'dying'
      this.stateTimer = 0
      this.slowmo = 1.4
      this.hud.showBanner('BOOM!', 1400, 'bad')
      this.gameOverReason = 'You sliced a bomb'
      // blast every fruit off screen
      for (const f of this.fruits) {
        vTmp.subVectors(f.pos, fruit.pos)
        const d = Math.max(0.5, vTmp.length())
        vTmp.normalize()
        f.vel.addScaledVector(vTmp, 18 / d)
        f.vel.y += 4
      }
    } else {
      this.addScore(-TUNING.bombPenalty)
      this.hud.popup(`-${TUNING.bombPenalty}`, fruit.sx, fruit.sy, 'bad')
      for (const f of this.fruits) {
        vTmp.subVectors(f.pos, fruit.pos)
        const d = vTmp.length()
        if (d > 6) continue
        vTmp.normalize()
        f.vel.addScaledVector(vTmp, 10 / Math.max(0.8, d))
      }
      this.comboCount = 0
    }
  }

  private onMenuFruit(tag: string): void {
    const [action] = tag.split('|')
    // remove the other menu fruits with a little pop
    for (const f of [...this.fruits]) {
      if (!f.floating) continue
      f.floating = false
      f.tag = null
      f.vel.set(rand(-2, 2), 7, 0)
    }
    this.hud.clearLabels()
    window.setTimeout(() => {
      if (action.startsWith('mode:')) this.start(action.slice(5) as GameMode)
      else if (action === 'retry') this.start(this.mode)
      else this.enterMenu()
    }, 350)
  }

  // ------------------------------------------------------------------ frame
  update(rawDt: number, now: number, points: BladePoint[]): void {
    const dt = Math.min(rawDt, 0.05)
    // slow motion
    if (this.slowmo > 0) {
      this.slowmo -= dt
      this.timeScale = lerp(this.timeScale, this.state === 'dying' ? 0.12 : 0.3, 0.35)
    } else {
      this.timeScale = lerp(this.timeScale, 1, 0.15)
    }
    const sdt = dt * this.timeScale

    // ---- input → blades → trails
    this.blades.update(points, now, this.stage.width, this.stage.height)
    this.trails.update(this.blades.blades, now, this.stage.height)
    for (const b of this.blades.blades.values()) {
      if (b.alive && b.speed > 1.6 && b.speed > this.lastBladeSoundSpeed) this.audio.swish(b.speed)
      this.lastBladeSoundSpeed = b.alive ? b.speed : 0
    }

    // ---- state
    if (this.state === 'playing') {
      this.elapsed += sdt
      this.waveTimer -= sdt
      if (this.waveTimer <= 0) {
        this.spawnWave()
        this.waveTimer = this.waveInterval()
      }
      if (MODES[this.mode].duration) {
        this.timeLeft -= sdt
        this.hud.setTimer(this.timeLeft)
        if (this.timeLeft <= 0) this.endGame("Time's up")
      }
      if (this.comboTimer > 0) {
        this.comboTimer -= dt
        if (this.comboTimer <= 0) this.resolveCombo()
      }
    } else if (this.state === 'dying') {
      this.stateTimer += dt
      if (this.stateTimer > 1.5) this.endGame(this.gameOverReason)
    } else if (this.state === 'gameover') {
      this.stateTimer += dt
      if (!this.gameOverShown && this.stateTimer > 0.9) {
        this.gameOverShown = true
        this.showGameOverUi()
      }
    }

    // ---- pending launches
    if (this.state === 'playing') {
      for (let i = this.pending.length - 1; i >= 0; i -= 1) {
        if (this.pending[i].at <= this.elapsed) {
          this.launch(this.pending[i])
          this.pending.splice(i, 1)
        }
      }
    }

    // ---- physics
    const b = this.stage.bounds(PLAY_Z)
    for (const f of [...this.fruits]) {
      f.update(sdt, TUNING.gravity)
      if (!f.entered && f.pos.y > b.bottom - f.radius * 0.5) f.entered = true
      if (f.floating) continue
      if (f.vel.y < 0 && f.pos.y < b.bottom - f.radius * 2.2) {
        this.removeFruit(f)
        if (this.state === 'playing' && !f.isBomb && !f.tag) this.onMiss(f)
      }
    }
    for (let i = this.pieces.length - 1; i >= 0; i -= 1) {
      const p = this.pieces[i]
      p.update(sdt, TUNING.gravity)
      if (p.pos.y < b.bottom - 4 || p.life > 4) {
        this.stage.scene.remove(p.group)
        p.dispose()
        this.pieces.splice(i, 1)
      }
    }
    this.fx.update(sdt, TUNING.gravity)
    this.stage.update(dt)

    // ---- slicing (uses real-time blade motion, independent of slow-mo)
    this.projectFruits()
    this.checkSlices(now)

    // ---- menu labels
    for (const f of this.fruits) {
      if (!f.floating || !f.tag) continue
      const label = f.tag.split('|')[1] ?? ''
      vTmp.copy(f.pos)
      vTmp.y = f.baseY - f.radius * 1.25 - 0.5
      this.stage.project(vTmp, px)
      this.hud.label(f.tag, label, px.x, px.y, true)
    }
  }

  private onMiss(f: Fruit): void {
    const def = MODES[this.mode]
    if (def.lives <= 0) return
    this.lives -= 1
    this.hud.setLives(this.lives, def.lives)
    this.hud.flashDanger()
    this.hud.popup('MISS', clamp(f.sx, 80, this.stage.width - 80), this.stage.height - 90, 'bad')
    if (this.lives <= 0) {
      this.gameOverReason = 'You dropped too many fruits'
      this.state = 'dying'
      this.stateTimer = 0.9
      this.slowmo = 0.6
    }
  }
}
