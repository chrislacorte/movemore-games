import { motion } from 'framer-motion'
import WebcamSceneThumb from './WebcamSceneThumb'
import HomeLink from './HomeLink'
import { STR } from '../constants/strings'
import { THEME_LIST } from '../constants/themes'
import { GAME_MODE_LIST } from '../constants/gameModes'

const spring = { type: 'spring', stiffness: 420, damping: 26 }

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: spring },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const SCENE_SHORT_LABELS = {
  'sakura-paradise': 'Sakura',
  'waterfall-lagoon': 'Lagoon',
  'holy-temple': 'Temple',
}

const sceneShortLabel = (bg) => {
  if (bg.type === 'webcam') return bg.label
  return SCENE_SHORT_LABELS[bg.scene] ?? bg.label
}

const SINGLE_PLAYER_MODES = GAME_MODE_LIST.filter((mode) => !mode.multiplayer)
const MULTIPLAYER_MODES = GAME_MODE_LIST.filter((mode) => mode.multiplayer)

const modeButtonClass = (selected) =>
  `intro-mode-btn font-title relative shrink-0 rounded-xl border px-3 py-1.5 text-[10px] font-normal uppercase tracking-wide sm:px-5 sm:py-2 sm:text-xs md:px-6 md:py-2.5 md:text-sm ${
    selected
      ? 'border-lime-400 bg-lime-400/20 text-lime-300'
      : 'border-white/25 bg-white/10 text-white/80'
  }`

const IntroScreen = ({
  themeId,
  backgroundId,
  sceneBackgrounds,
  gameModeId,
  onThemeChange,
  onBackgroundChange,
  onModeChange,
  onStart,
  startButtonRef,
  isReady,
  cameraDenied,
  introMusicMuted,
  onToggleIntroMusic,
}) => (
  <div className="intro-screen pointer-events-none absolute inset-0 z-30 flex flex-col overflow-hidden px-3 py-2 sm:px-6 sm:py-3">
    <HomeLink />
    <button
      type="button"
      data-game-ui
      onClick={onToggleIntroMusic}
      title={introMusicMuted ? STR.musicOff : STR.musicOn}
      className="font-ui pointer-events-auto absolute right-3 top-2 z-40 rounded-md border border-white bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-black/65 sm:right-6 sm:top-3 sm:px-3 sm:text-xs"
    >
      {introMusicMuted ? STR.musicOff : STR.musicOn}
    </button>
    <motion.div
      className="intro-screen__header flex shrink-0 flex-col items-center pt-0 sm:pt-1"
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: 0.1 }}
    >
      <h1 className="intro-screen__title game-logo font-title text-center text-3xl leading-none sm:text-5xl md:text-6xl">
        <span className="logo-fruity block">{STR.appTitleAccent}</span>
        <span className="logo-samurai block">{STR.appTitleMain}</span>
      </h1>
      <p className="intro-screen__hint font-ui mt-1.5 max-w-md text-center text-[10px] text-white/60 sm:mt-2 sm:text-sm">
        {STR.inputHint}
      </p>
    </motion.div>

    <div className="intro-screen__body flex min-h-0 flex-1 flex-col">
      <div
        className="intro-screen__scroll pointer-events-auto overflow-y-auto scrollbar-none"
        data-game-ui
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 pt-2 sm:gap-4 sm:pt-3">
          <div className="w-full text-center">
            <div className="mb-1.5 flex justify-center sm:mb-2">
              <p className="intro-section-label intro-section-label--brush intro-section-label--brush-theme intro-section-label--brush-theme-md font-title font-normal uppercase tracking-[0.18em]">
                {STR.chooseTheme}
              </p>
            </div>
            <motion.div
              className="intro-theme-row flex justify-center overflow-visible px-4 py-5 sm:px-6 sm:py-[22px]"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {THEME_LIST.map((theme) => {
                const selected = themeId === theme.id
                return (
                  <motion.button
                    key={theme.id}
                    type="button"
                    variants={fadeUp}
                    onClick={() => onThemeChange(theme.id)}
                    whileHover={{ scale: selected ? 1.05 : 1.07, y: -4 }}
                    whileTap={{ scale: 0.96 }}
                    animate={{
                      scale: selected ? 1.04 : 1,
                      opacity: selected ? 1 : 0.78,
                      boxShadow: selected
                        ? '0 0 0 2px rgba(163, 230, 53, 0.95)'
                        : '0 0 0 1px rgba(255, 255, 255, 0.12)',
                    }}
                    transition={spring}
                    className="intro-picker-card intro-theme-thumb group relative shrink-0 overflow-hidden rounded-xl border-2 border-transparent bg-black/20"
                  >
                    <img
                      src={theme.preview}
                      alt={theme.label}
                      className="intro-picker-card__media block h-full w-full object-cover"
                      draggable={false}
                    />
                    <span className="intro-card-label font-ui text-[10px] font-bold uppercase tracking-wide text-white sm:text-[11px]">
                      {theme.label}
                    </span>
                  </motion.button>
                )
              })}
            </motion.div>
          </div>

          <div className="w-full">
            <div className="mb-1.5 flex justify-center sm:mb-2">
              <p className="intro-section-label intro-section-label--brush intro-section-label--brush-theme intro-section-label--brush-theme-md font-title font-normal uppercase tracking-[0.18em]">
                {STR.chooseScene}
              </p>
            </div>
            <motion.div
              className="intro-scene-row flex justify-center gap-3 overflow-x-auto px-4 pt-3.5 pb-[19px] sm:gap-4 sm:px-6 sm:pt-4 sm:pb-[21px]"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {sceneBackgrounds.map((bg) => {
                const selected = backgroundId === bg.id
                return (
                  <motion.button
                    key={bg.id}
                    type="button"
                    variants={fadeUp}
                    onClick={() => onBackgroundChange(bg.id)}
                    title={bg.label}
                    whileHover={{ scale: selected ? 1.05 : 1.07, y: -4 }}
                    whileTap={{ scale: 0.96 }}
                    animate={{
                      scale: selected ? 1.04 : 1,
                      opacity: selected ? 1 : 0.78,
                      boxShadow: selected
                        ? '0 0 0 2px rgba(163, 230, 53, 0.95)'
                        : '0 0 0 1px rgba(255, 255, 255, 0.12)',
                    }}
                    transition={spring}
                    className="intro-picker-card intro-scene-thumb group relative shrink-0 overflow-hidden rounded-xl border-2 border-transparent bg-black/20"
                  >
                    {bg.type === 'webcam' ? (
                      <WebcamSceneThumb
                        className="intro-picker-card__media h-full w-full"
                        iconClassName="h-8 w-8"
                      />
                    ) : (
                      <img
                        src={bg.preview}
                        alt={bg.label}
                        className="intro-picker-card__media block h-full w-full object-cover"
                        draggable={false}
                      />
                    )}
                    <span className="intro-card-label font-ui text-[10px] font-bold uppercase tracking-wide text-white sm:text-[11px]">
                      {sceneShortLabel(bg)}
                    </span>
                  </motion.button>
                )
              })}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="intro-screen__footer pointer-events-auto mt-auto flex shrink-0 flex-col items-center gap-1.5 px-2 pb-1 pt-0 sm:gap-2 sm:pb-2">
        <div className="w-full max-w-3xl">
          <p className="intro-section-label font-ui mb-1 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            {STR.chooseMode}
          </p>
          <motion.div
            className="intro-mode-row flex flex-wrap justify-center gap-2 px-7 py-2 sm:gap-3 sm:px-8 sm:py-3"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {SINGLE_PLAYER_MODES.map((mode) => {
              const selected = gameModeId === mode.id
              return (
                <motion.button
                  key={mode.id}
                  type="button"
                  variants={fadeUp}
                  onClick={() => onModeChange(mode.id)}
                  title={mode.description}
                  whileHover={{ scale: 1.06, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{
                    scale: selected ? 1.04 : 1,
                    boxShadow: selected
                      ? '0 0 24px rgba(163, 230, 53, 0.25)'
                      : '0 0 0 rgba(0,0,0,0)',
                  }}
                  transition={spring}
                  className={modeButtonClass(selected)}
                >
                  {mode.label}
                </motion.button>
              )
            })}
          </motion.div>

          <p className="intro-section-label font-ui mb-1 mt-1.5 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/50 sm:mt-2">
            {STR.chooseMultiplayer}
          </p>
          <motion.div
            className="intro-mode-row flex flex-wrap justify-center gap-2 px-7 py-2 pb-4 sm:gap-3 sm:px-8 sm:py-3 sm:pb-5"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {MULTIPLAYER_MODES.map((mode) => {
              const selected = gameModeId === mode.id
              return (
                <motion.button
                  key={mode.id}
                  type="button"
                  variants={fadeUp}
                  onClick={() => onModeChange(mode.id)}
                  title={mode.description}
                  whileHover={{ scale: 1.06, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{
                    scale: selected ? 1.04 : 1,
                    boxShadow: selected
                      ? '0 0 24px rgba(163, 230, 53, 0.25)'
                      : '0 0 0 rgba(0,0,0,0)',
                  }}
                  transition={spring}
                  className={modeButtonClass(selected)}
                >
                  {mode.label}
                </motion.button>
              )
            })}
          </motion.div>
        </div>

        <motion.button
          ref={startButtonRef}
          type="button"
          data-game-ui
          onClick={onStart}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.35 }}
          whileHover={{
            scale: 1.06,
            boxShadow: '0 0 40px rgba(163, 230, 53, 0.55)',
          }}
          whileTap={{ scale: 0.96 }}
          className="intro-start-btn font-title pointer-events-auto select-none rounded-2xl border-2 border-lime-300 bg-lime-400 px-8 py-2.5 text-base font-normal uppercase tracking-wide text-black shadow-[0_0_30px_rgba(163,230,53,0.35)] disabled:opacity-50 sm:px-12 sm:py-3 sm:text-xl md:px-14 md:py-4 md:text-2xl"
          disabled={!isReady && !cameraDenied}
        >
          {cameraDenied ? STR.playWithMouse : STR.startGame}
        </motion.button>
      </div>
    </div>
  </div>
)

export default IntroScreen
