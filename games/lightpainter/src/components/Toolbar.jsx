import { COLORS, STROKE_WIDTHS, BACKGROUNDS } from '../constants/gameConfig'
import { STRINGS } from '../constants/strings'

function ToggleButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={`flex h-12 min-w-[3rem] items-center justify-center gap-1 rounded-2xl border px-2 font-ui text-lg transition ${
        active
          ? 'border-white/60 bg-white/20 shadow-[0_0_14px_rgba(255,255,255,0.35)]'
          : 'border-white/15 bg-white/5 opacity-70 hover:opacity-100'
      }`}
    >
      <span aria-hidden>{icon}</span>
    </button>
  )
}

export default function Toolbar({
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  glowOn,
  onGlowToggle,
  fadeOn,
  onFadeToggle,
  background,
  onBackgroundToggle,
  onClear,
  onSave,
}) {
  return (
    <div className="pointer-events-auto flex max-w-[96vw] flex-wrap items-center justify-center gap-2 rounded-3xl border border-white/10 bg-black/55 px-3 py-2.5 backdrop-blur-lg sm:gap-3 sm:px-5">
      {/* Colors */}
      <div className="flex items-center gap-1.5" role="group" aria-label={STRINGS.toolbarColors}>
        {COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.label}
            onClick={() => onColorChange(c.hex)}
            className={`h-9 w-9 rounded-full transition sm:h-10 sm:w-10 ${
              color === c.hex
                ? 'scale-110 ring-[3px] ring-white'
                : 'opacity-80 ring-1 ring-white/25 hover:scale-105 hover:opacity-100'
            }`}
            style={{
              backgroundColor: c.hex,
              boxShadow: color === c.hex ? `0 0 16px ${c.hex}` : `0 0 6px ${c.hex}55`,
            }}
          />
        ))}
      </div>

      <div className="h-8 w-px bg-white/15" />

      {/* Stroke widths */}
      <div className="flex items-center gap-1.5" role="group" aria-label={STRINGS.toolbarWidth}>
        {STROKE_WIDTHS.map((w) => (
          <button
            key={w.id}
            type="button"
            title={w.label}
            onClick={() => onStrokeWidthChange(w.px)}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
              strokeWidth === w.px
                ? 'border-white/60 bg-white/20'
                : 'border-white/15 bg-white/5 opacity-70 hover:opacity-100'
            }`}
          >
            <span
              className="rounded-full bg-white"
              style={{
                width: Math.max(6, w.px * 0.9),
                height: Math.max(6, w.px * 0.9),
                boxShadow: strokeWidth === w.px ? '0 0 10px rgba(255,255,255,0.8)' : 'none',
              }}
            />
          </button>
        ))}
      </div>

      <div className="h-8 w-px bg-white/15" />

      {/* Toggles */}
      <ToggleButton active={glowOn} onClick={onGlowToggle} icon="✨" label={STRINGS.toolbarGlow} />
      <ToggleButton active={fadeOn} onClick={onFadeToggle} icon="🪄" label={STRINGS.toolbarFade} />
      <ToggleButton
        active={background === BACKGROUNDS.CAMERA}
        onClick={onBackgroundToggle}
        icon={background === BACKGROUNDS.CAMERA ? '🎥' : '🌙'}
        label={
          background === BACKGROUNDS.CAMERA ? STRINGS.bgCamera : STRINGS.bgNight
        }
      />

      <div className="h-8 w-px bg-white/15" />

      {/* Actions */}
      <button
        type="button"
        onClick={onClear}
        title={STRINGS.clear}
        className="flex h-12 min-w-[3rem] items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-2 text-lg opacity-70 transition hover:bg-red-500/20 hover:opacity-100"
      >
        🗑️
      </button>
      <button
        type="button"
        onClick={onSave}
        title={STRINGS.save}
        className="flex h-12 min-w-[3rem] items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-2 text-lg opacity-70 transition hover:bg-emerald-500/20 hover:opacity-100"
      >
        💾
      </button>
    </div>
  )
}
