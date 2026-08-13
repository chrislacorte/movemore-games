import { STRINGS } from '../constants/strings'

export default function PacmanHud({ displayState, handVisible }) {
  const { level, score, pelletsRemaining, pelletsTotal } = displayState
  const total = pelletsTotal || pelletsRemaining
  const collected = total - pelletsRemaining

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[9%] z-40 flex justify-between px-6 font-ui text-sm tracking-wide text-phosphor">
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-phosphor/60">
          {STRINGS.level} {level?.id ?? 1}
        </span>
        <span className="font-film text-xs text-amber-film">{level?.title}</span>
      </div>
      <div className="text-center">
        <span className="text-[10px] uppercase tracking-[0.2em] text-phosphor/60">
          {STRINGS.score}
        </span>
        <div className="font-display text-2xl leading-none text-phosphor">
          {score}
        </div>
        {displayState.powerModeMs > 0 && (
          <span className="font-film text-[10px] uppercase tracking-widest text-amber-film">
            {STRINGS.powerMode}
          </span>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-phosphor/60">
          {STRINGS.pellets}
        </span>
        <span className="font-display text-xl text-amber-film">
          {collected}/{total}
        </span>
      </div>
      {!handVisible && (
        <div className="absolute inset-x-0 top-12 text-center font-film text-xs text-amber-film/80">
          {STRINGS.noHand}
        </div>
      )}
    </div>
  )
}
