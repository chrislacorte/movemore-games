import { STR } from '../constants/strings'

const LevelToast = ({ level, subtitle, visible }) => {
  if (!visible) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
      <div className="animate-pulse rounded-2xl border border-lime-400/40 bg-black/70 px-8 py-6 text-center shadow-2xl">
        <p className="font-title text-4xl sm:text-6xl text-lime-400">{STR.levelComplete}</p>
        <p className="font-title mt-2 text-3xl sm:text-5xl text-white">
          {STR.level} {level}
        </p>
        {subtitle && (
          <p className="font-ui mt-3 text-sm sm:text-base text-white/70">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default LevelToast
