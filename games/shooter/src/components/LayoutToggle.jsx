import { LAYOUTS } from '../constants/gameConfig'
import { STRINGS } from '../constants/strings'

export default function LayoutToggle({ layout, onChange }) {
  const options = [
    { id: LAYOUTS.FULLSCREEN, label: STRINGS.layoutFullscreen },
    { id: LAYOUTS.SPLIT, label: STRINGS.layoutSplit },
  ]

  return (
    <div className="pointer-events-auto inline-flex overflow-hidden rounded-lg border border-white/15 bg-black/45 backdrop-blur-md">
      {options.map((opt) => {
        const active = layout === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`px-3 py-1.5 font-ui text-xs font-semibold uppercase tracking-wide transition ${
              active
                ? 'bg-cyan-500/90 text-black'
                : 'text-white/70 hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
