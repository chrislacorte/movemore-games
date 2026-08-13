import { STRINGS } from '../constants/strings'
import { WIN_SCORE, GAME_PHASES } from '../constants/gameConfig'

function ScoreChip({ label, value, accent }) {
  return (
    <div
      className={`flex flex-col items-center rounded-lg border px-4 py-2 backdrop-blur-md ${accent}`}
    >
      <span className="font-ui text-[10px] uppercase tracking-[0.2em] text-white/45">
        {label}
      </span>
      <span className="font-display text-4xl leading-none tracking-wider sm:text-5xl">
        {value}
      </span>
    </div>
  )
}

export default function Hud({ phase, score, rally }) {
  const inPlay =
    phase === GAME_PHASES.PLAY ||
    phase === GAME_PHASES.WIN ||
    phase === GAME_PHASES.LOSE

  if (!inPlay) return null

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md">
          <span className="font-ui text-[10px] uppercase tracking-[0.18em] text-white/45">
            {STRINGS.rally}
          </span>
          <p className="font-display text-2xl leading-none text-amber-300">{rally}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ScoreChip
            label={STRINGS.playerLabel}
            value={score.player}
            accent="border-cyan-500/30 bg-cyan-950/50 text-cyan-300"
          />
          <span className="font-display text-2xl text-white/25">:</span>
          <ScoreChip
            label={STRINGS.enemyLabel}
            value={score.ai}
            accent="border-red-500/30 bg-red-950/40 text-red-300"
          />
        </div>

        <div className="hidden rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-right backdrop-blur-md sm:block">
          <span className="font-ui text-[10px] uppercase tracking-[0.18em] text-white/45">
            Ziel
          </span>
          <p className="font-ui text-sm font-semibold text-white/70">
            {WIN_SCORE} Punkte
          </p>
        </div>
      </div>
    </div>
  )
}
