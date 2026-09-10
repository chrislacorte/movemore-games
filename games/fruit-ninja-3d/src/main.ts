import '@fontsource/bangers/400.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import './style.css'

import { Stage } from './render/Stage'
import { Hud } from './ui/Hud'
import { HandTracker } from './tracking/HandTracker'
import { PointerInput } from './tracking/PointerInput'
import type { BladePoint } from './tracking/types'
import { loadFruitKit } from './fruit/FruitKit'
import { Game } from './game/Game'
import { AudioBus } from './audio/Audio'
import type { GameMode } from './game/tuning'

async function boot(): Promise<void> {
  const canvas = document.getElementById('gl') as HTMLCanvasElement
  const uiRoot = document.getElementById('ui') as HTMLElement

  const stage = new Stage(canvas)
  const tracker = new HandTracker()
  const pointer = new PointerInput(canvas)
  const audio = new AudioBus()

  let game: Game | null = null

  const hud = new Hud(uiRoot, tracker.video, {
    onToggleMute: () => audio.toggleMute(),
    onSelectMode: (mode: GameMode) => {
      void audio.unlock()
      game?.start(mode)
    },
    onRetry: () => {
      void audio.unlock()
      if (game) game.start(game.mode)
    },
    onMenu: () => game?.enterMenu(),
    onEnableCamera: () => void startCamera(),
  })
  hud.setMuted(audio.muted)
  hud.setCameraState('off')

  // Audio must be unlocked by a gesture.
  const unlock = () => void audio.unlock()
  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock)

  async function startCamera(): Promise<void> {
    hud.setCameraState('starting')
    await tracker.start()
    if (tracker.status === 'running') hud.setCameraState('on')
    else if (tracker.status === 'denied') hud.setCameraState('denied')
    else hud.setCameraState('failed')
  }

  // Load fruit while the camera warms up.
  hud.setLoading(0.05, 'Loading fruit…')
  const cameraPromise = startCamera()
  const kit = await loadFruitKit((done, total) => hud.setLoading(0.05 + (done / total) * 0.9, `Loading fruit ${done}/${total}`))
  hud.setLoading(1, 'Ready')

  game = new Game(stage, kit, hud, audio)
  game.enterMenu()
  hud.hideLoading()
  void cameraPromise

  if (import.meta.env.DEV) {
    ;(window as unknown as { __fn3d: unknown }).__fn3d = { game, stage, tracker }
  }

  const points: BladePoint[] = []
  let last = performance.now()
  let frame = 0

  const loop = (now: number) => {
    const dt = Math.max(0.001, (now - last) / 1000)
    last = now
    frame += 1

    points.length = 0
    if (tracker.running) tracker.sample(now, points)
    pointer.sample(now, points)

    game?.update(dt, now, points)
    stage.render()

    if (frame % 2 === 0 && tracker.running) hud.drawTracking(tracker.landmarkSets(), tracker.stats)
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) last = performance.now()
  })
}

void boot()
