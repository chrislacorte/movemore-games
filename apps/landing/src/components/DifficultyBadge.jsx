const LEVELS = ['Easy', 'Medium', 'Hard']

export default function DifficultyBadge({ level, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-body text-[10px] font-semibold uppercase tracking-wider text-white/70 sm:text-xs">
        {label}
      </span>
      <div className="flex gap-1" aria-hidden>
        {LEVELS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-3 rounded-full transition-colors ${
              i < level ? 'bg-brand-primary' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
