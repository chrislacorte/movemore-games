import { INITIAL_LIVES } from '../constants/gameConfig'
import { STR } from '../constants/strings'

const HeartIcon = ({ filled }) => (
  <svg
    viewBox="0 0 24 24"
    className={`h-6 w-6 sm:h-8 sm:w-8 drop-shadow-md ${filled ? 'text-red-500' : 'text-red-950/50'}`}
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
)

const GameplayHUD = ({
  uiState,
  onMenu,
  onToggleBackground,
  backgroundPickerOpen,
  gameplayMusicMuted,
  gameplayTrackLabel,
  onToggleGameplayMusic,
  onCycleGameplayTrack,
}) => {
  const stopUiPointer = (e) => e.stopPropagation()

  const hudBtn =
    'font-ui pointer-events-auto rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm transition sm:px-3 sm:text-xs'

  return (
  <div className="pointer-events-none absolute inset-0 z-20 flex flex-col p-3 sm:p-5 md:p-6">
    <div className="flex w-full items-start justify-between gap-2">
      <div className="flex flex-col gap-0.5 sm:gap-1">
        <div className="font-ui text-xs sm:text-sm font-bold uppercase tracking-widest text-white/80">
          {STR.points}{' '}
          <span className="font-ui text-2xl sm:text-4xl md:text-5xl text-yellow-300">
            {uiState.score}
          </span>
        </div>
        <div className="font-ui text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/60">
          {STR.best}{' '}
          <span className="text-lg sm:text-2xl text-yellow-200">{uiState.highscore}</span>
        </div>
        {uiState.level > 0 && (
          <div className="font-ui text-[10px] sm:text-xs font-bold uppercase text-lime-300/90">
            {STR.level} {uiState.level}
          </div>
        )}
      </div>

      <h1 className="game-logo font-title pointer-events-none text-center text-xl leading-none sm:text-3xl md:text-4xl">
        <span className="logo-fruity">{STR.appTitleAccent}</span>{' '}
        <span className="logo-samurai">{STR.appTitleMain}</span>
      </h1>

      <div className="flex flex-col items-end gap-2">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            data-game-ui
            onPointerDown={stopUiPointer}
            onClick={onToggleGameplayMusic}
            className={`${hudBtn} ${
              gameplayMusicMuted
                ? 'border-white/15 bg-black/30 text-white/50'
                : 'border-lime-400/60 bg-lime-400/15 text-lime-200'
            }`}
          >
            {gameplayMusicMuted ? STR.musicOff : STR.musicOn}
          </button>
          <button
            type="button"
            data-game-ui
            onPointerDown={stopUiPointer}
            onClick={onCycleGameplayTrack}
            title={gameplayTrackLabel}
            className={`${hudBtn} max-w-[7.5rem] truncate border-white/20 bg-black/40 text-white hover:bg-black/60`}
          >
            {STR.nextTrack}: {gameplayTrackLabel}
          </button>
          <button
            type="button"
            data-game-ui
            onPointerDown={stopUiPointer}
            onClick={onToggleBackground}
            className={`${hudBtn} ${
              backgroundPickerOpen
                ? 'border-lime-400 bg-lime-400/20 text-lime-300'
                : 'border-white/20 bg-black/40 text-white hover:bg-black/60'
            }`}
          >
            {STR.background}
          </button>
          <button
            type="button"
            data-game-ui
            onPointerDown={stopUiPointer}
            onClick={onMenu}
            className={`${hudBtn} border-white/20 bg-black/40 text-white hover:bg-black/60`}
          >
            {STR.menu}
          </button>
        </div>
        <div className="flex gap-1 sm:gap-1.5">
          {[...Array(INITIAL_LIVES)].map((_, i) => (
            <HeartIcon key={i} filled={i < uiState.lives} />
          ))}
        </div>
      </div>
    </div>

    {uiState.comboVisible && uiState.combo > 1 && (
      <div className="mt-2 text-center font-ui text-lg sm:text-2xl font-bold text-amber-300">
        x{uiState.combo} {STR.combo}
      </div>
    )}
  </div>
  )
}

export default GameplayHUD
