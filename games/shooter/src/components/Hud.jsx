import { STRINGS } from '../constants/strings'
import { GAME_PHASES } from '../constants/gameConfig'

function StatChip({ label, value, accent }) {
  return (
    <div
      className={`flex flex-col items-center rounded-lg border px-4 py-2 backdrop-blur-md ${accent}`}
    >
      <span className="font-ui text-[10px] uppercase tracking-[0.2em] text-white/45">
        {label}
      </span>
      <span className="font-display text-3xl leading-none tracking-wider sm:text-4xl">
        {value}
      </span>
    </div>
  )
}

export default function Hud({ phase, score, hits, shots }) {
  if (phase !== GAME_PHASES.PLAY) return null

  const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0

  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <StatChip
          label={STRINGS.scoreLabel}
          value={score}
          accent="border-cyan-500/30 bg-cyan-950/50 text-cyan-200"
        />

        <div className="flex items-center gap-2 sm:gap-3">
          <StatChip
            label={STRINGS.hitsLabel}
            value={hits}
            accent="border-amber-500/30 bg-amber-950/40 text-amber-200"
          />
          <StatChip
            label={STRINGS.shotsLabel}
            value={shots}
            accent="border-white/15 bg-black/40 text-white/80"
          />
          <div className="hidden flex-col items-center rounded-lg border border-white/15 bg-black/40 px-4 py-2 text-white/80 backdrop-blur-md sm:flex">
            <span className="font-ui text-[10px] uppercase tracking-[0.2em] text-white/45">
              {STRINGS.accuracyLabel}
            </span>
            <span className="font-display text-3xl leading-none tracking-wider">
              {accuracy}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
