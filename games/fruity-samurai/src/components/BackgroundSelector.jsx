import { BACKGROUND_LIST } from '../constants/backgroundConfig'

const WebcamPreview = ({ selected }) => (
  <div
    className={`flex h-14 w-24 items-center justify-center rounded-md bg-zinc-800 ${
      selected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950' : ''
    }`}
  >
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 text-zinc-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  </div>
)

const BackgroundSelector = ({ value, onChange }) => (
  <div
    className="flex w-full max-w-3xl flex-col items-center gap-2 px-4"
    role="group"
    aria-label="Hintergrund wählen"
  >
    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
      Hintergrund
    </span>
    <div className="flex w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {BACKGROUND_LIST.map((bg) => {
        const selected = value === bg.id
        return (
          <button
            key={bg.id}
            type="button"
            onClick={() => onChange(bg.id)}
            title={bg.label}
            aria-pressed={selected}
            className={`group flex shrink-0 flex-col items-center gap-1 rounded-lg p-1 transition-all ${
              selected
                ? 'scale-105 opacity-100'
                : 'opacity-65 hover:opacity-100'
            }`}
          >
            {bg.type === 'webcam' ? (
              <WebcamPreview selected={selected} />
            ) : (
              <img
                src={bg.image}
                alt={bg.label}
                className={`h-14 w-24 rounded-md object-cover ${
                  selected
                    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950'
                    : 'ring-1 ring-zinc-700 group-hover:ring-zinc-500'
                }`}
              />
            )}
            <span
              className={`max-w-24 truncate text-[10px] font-bold uppercase tracking-wide ${
                selected ? 'text-amber-400' : 'text-zinc-500'
              }`}
            >
              {bg.label}
            </span>
          </button>
        )
      })}
    </div>
  </div>
)

export default BackgroundSelector
