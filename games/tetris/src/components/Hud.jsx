import { STRINGS } from '../constants/strings'

export default function Hud({ displayState, handVisible, pose, softDrop }) {
  const gestureLabel = softDrop
    ? STRINGS.softDrop
    : pose === 'open'
      ? STRINGS.openPalm
      : pose === 'fist'
        ? STRINGS.fist
        : handVisible
          ? STRINGS.rotateHint
          : STRINGS.noHand

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[10%] z-40 flex justify-between px-[12%] font-ui text-xs uppercase tracking-wider sm:text-sm">
      <div className="rounded border border-phosphor/25 bg-black/55 px-3 py-2 backdrop-blur-sm">
        <p className="text-phosphor/60">{STRINGS.score}</p>
        <p className="font-display text-2xl text-phosphor">{displayState.score}</p>
      </div>
      <div className="rounded border border-amber-film/25 bg-black/55 px-3 py-2 text-center backdrop-blur-sm">
        <p className="text-amber-film/60">{gestureLabel}</p>
        <p className="mt-1 text-[10px] text-white/35">{STRINGS.softDropHint}</p>
        <p className="mt-1 font-display text-lg text-white">
          {STRINGS.level} {displayState.level}
        </p>
      </div>
      <div className="rounded border border-phosphor/25 bg-black/55 px-3 py-2 text-right backdrop-blur-sm">
        <p className="text-phosphor/60">{STRINGS.lines}</p>
        <p className="font-display text-2xl text-phosphor">{displayState.lines}</p>
        <p className="mt-1 text-[10px] text-white/40">Next: {displayState.next}</p>
      </div>
    </div>
  )
}
