import { assetPath } from '../assets/assetPath'

export type PlayMode = 'challenge' | 'infinite' | 'versus'

export function mountHud(root: HTMLElement) {
  root.innerHTML = `
    <div class="intro" data-intro>
      <video class="intro-video" data-intro-video src="${assetPath('video/intro.mp4')}" muted playsinline preload="auto"></video>
      <button type="button" class="intro-skip" data-intro-skip>Skip intro</button>
    </div>
    <div class="title-art" data-title-art style="background-image:url('${assetPath('img/title-samurai-play.jpg')}')"></div>
    <div class="hud-top playing-only" hidden>
      <div class="hud-score">
        <span class="label" data-score-label>Points</span>
        <span class="value" data-score>0</span>
      </div>
      <div class="hud-title">FRUITY SAMURAI</div>
      <div class="hud-right">
        <div class="hud-mode" data-mode-label></div>
        <div class="hud-lives" data-lives></div>
      </div>
    </div>
    <div class="versus-scores playing-only" data-versus-scores hidden>
      <div class="vs-col"><span>Player 1</span><strong data-score-p1>0</strong></div>
      <div class="vs-col"><span>Player 2</span><strong data-score-p2>0</strong></div>
    </div>
    <div class="hud-combo" data-combo hidden></div>
    <div class="hud-center" data-center>
      <div class="mode-tabs">
        <button type="button" class="tab on" data-tab-sp>Singleplayer</button>
        <button type="button" class="tab" data-tab-mp>Multiplayer</button>
      </div>
      <div class="sp-modes" data-sp-modes>
        <button type="button" class="chip on" data-mode-challenge>Challenge</button>
        <button type="button" class="chip" data-mode-infinite>Infinity</button>
      </div>
      <p class="hint">Slice with your hands or mouse</p>
      <p class="cam" data-cam>Allow camera to slice with your hands</p>
      <button type="button" class="start-sun" data-start-game>Start Game</button>
      <p class="mode-hint" data-mode-hint>Challenge — three lives, bombs, combos</p>
    </div>
    <div class="hud-over" data-over hidden aria-hidden="true">
      <h2 data-over-title>GAME OVER</h2>
      <p data-final>0</p>
      <button type="button" class="start-sun small" data-retry>Again</button>
    </div>
    <div class="flash" data-flash></div>
  `
  return {
    score: root.querySelector('[data-score]') as HTMLElement,
    scoreP1: root.querySelector('[data-score-p1]') as HTMLElement,
    scoreP2: root.querySelector('[data-score-p2]') as HTMLElement,
    scoreLabel: root.querySelector('[data-score-label]') as HTMLElement,
    lives: root.querySelector('[data-lives]') as HTMLElement,
    combo: root.querySelector('[data-combo]') as HTMLElement,
    center: root.querySelector('[data-center]') as HTMLElement,
    over: root.querySelector('[data-over]') as HTMLElement,
    overTitle: root.querySelector('[data-over-title]') as HTMLElement,
    final: root.querySelector('[data-final]') as HTMLElement,
    startGame: root.querySelector('[data-start-game]') as HTMLButtonElement,
    retry: root.querySelector('[data-retry]') as HTMLButtonElement,
    flash: root.querySelector('[data-flash]') as HTMLElement,
    cam: root.querySelector('[data-cam]') as HTMLElement,
    modeLabel: root.querySelector('[data-mode-label]') as HTMLElement,
    titleArt: root.querySelector('[data-title-art]') as HTMLElement,
    tabSp: root.querySelector('[data-tab-sp]') as HTMLButtonElement,
    tabMp: root.querySelector('[data-tab-mp]') as HTMLButtonElement,
    spModes: root.querySelector('[data-sp-modes]') as HTMLElement,
    chipChallenge: root.querySelector('[data-mode-challenge]') as HTMLButtonElement,
    chipInfinite: root.querySelector('[data-mode-infinite]') as HTMLButtonElement,
    modeHint: root.querySelector('[data-mode-hint]') as HTMLElement,
    versusScores: root.querySelector('[data-versus-scores]') as HTMLElement,
    playingOnly: [...root.querySelectorAll('.playing-only')] as HTMLElement[],
    intro: root.querySelector('[data-intro]') as HTMLElement,
    introVideo: root.querySelector('[data-intro-video]') as HTMLVideoElement,
    introSkip: root.querySelector('[data-intro-skip]') as HTMLButtonElement,
  }
}

export function renderLives(el: HTMLElement, lives: number, max: number, infinite = false): void {
  if (infinite) {
    el.innerHTML = '<span class="endless">∞</span>'
    return
  }
  el.innerHTML = Array.from({ length: max }, (_, i) => `<i class="${i < lives ? 'on' : ''}"></i>`).join('')
}

export function syncMenuMode(
  hud: ReturnType<typeof mountHud>,
  lane: 'sp' | 'mp',
  mode: PlayMode,
): void {
  hud.tabSp.classList.toggle('on', lane === 'sp')
  hud.tabMp.classList.toggle('on', lane === 'mp')
  hud.spModes.hidden = lane === 'mp'
  hud.chipChallenge.classList.toggle('on', mode === 'challenge')
  hud.chipInfinite.classList.toggle('on', mode === 'infinite')
  hud.modeHint.textContent =
    lane === 'mp'
      ? 'Splitscreen — two blades, two scores'
      : mode === 'infinite'
        ? 'Infinity — no game over, chase the combo'
        : 'Challenge — three lives, bombs, combos'
}
