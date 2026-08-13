import { STR } from '../constants/strings'
import { COOP_GLASS_CAPACITY } from '../constants/gameConfig'

const formatTime = (ms) => {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

const MultiplayerHUD = ({
  boards,
  gameModeId,
  mpTimerEnd,
  glassFill,
  now,
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

  const timeLeft =
    gameModeId === 'mp_challenge' && mpTimerEnd ? Math.max(0, mpTimerEnd - now) : 0
  const glassPct = Math.min(100, (glassFill / COOP_GLASS_CAPACITY) * 100)

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col p-3 sm:p-5 md:p-6">
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="font-ui text-[10px] font-bold uppercase tracking-widest text-amber-300/80 sm:text-xs">
            {STR.player1}
          </span>
          <span className="font-title text-3xl text-yellow-300 sm:text-4xl md:text-5xl">
            {boards[0]?.score ?? 0}
          </span>
          {gameModeId === 'mp_challenge' && (
            <span className="font-ui text-[10px] uppercase tracking-widest text-white/50">
              {STR.fruitsSliced}
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="game-logo font-title pointer-events-none text-center text-xl leading-none sm:text-3xl md:text-4xl">
            <span className="logo-fruity">{STR.appTitleAccent}</span>{' '}
            <span className="logo-samurai">{STR.appTitleMain}</span>
          </h1>

          {gameModeId === 'mp_challenge' && (
            <div className="rounded-xl border border-white/15 bg-black/45 px-4 py-2 text-center backdrop-blur-sm">
              <span className="font-ui block text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
                {STR.timeLeft}
              </span>
              <span className="font-title text-2xl tabular-nums text-lime-300 sm:text-3xl">
                {formatTime(timeLeft)}
              </span>
            </div>
          )}

          {gameModeId === 'mp_coop' && (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-white/15 bg-black/45 px-4 py-2 backdrop-blur-sm">
              <span className="font-ui text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">
                {STR.glassTitle}
              </span>
              <div className="relative h-16 w-7 overflow-hidden rounded-b-xl rounded-t-lg border border-white/15 bg-white/[0.06] sm:h-20 sm:w-8">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-500/75 to-yellow-300/55 transition-all duration-300"
                  style={{ height: `${glassPct}%` }}
                />
                <div className="absolute -top-0.5 left-1/2 h-2 w-4 -translate-x-1/2 rounded-sm border border-white/15 bg-white/10" />
              </div>
              <span className="font-ui text-[9px] tabular-nums text-white/45">
                {glassFill}/{COOP_GLASS_CAPACITY}
              </span>
            </div>
          )}
        </div>

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
          <div className="flex flex-col items-end gap-0.5">
            <span className="font-ui text-[10px] font-bold uppercase tracking-widest text-sky-300/80 sm:text-xs">
              {STR.player2}
            </span>
            <span className="font-title text-3xl text-sky-200 sm:text-4xl md:text-5xl">
              {boards[1]?.score ?? 0}
            </span>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 top-0 w-px bg-white/25"
        style={{ left: '50%' }}
        aria-hidden
      />
    </div>
  )
}

export default MultiplayerHUD
