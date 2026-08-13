import { motion } from 'framer-motion'
import { STR } from '../constants/strings'

const spring = { type: 'spring', stiffness: 420, damping: 26 }

const scrollFade =
  'pointer-events-none absolute inset-y-0 z-10 w-10 sm:w-14 from-black/90 to-transparent'

const BackgroundPicker = ({
  backgrounds,
  value,
  onChange,
  compact = false,
  className = '',
}) => {
  if (!backgrounds?.length) return null

  const stopUiPointer = (e) => {
    e.stopPropagation()
  }

  return (
    <div className={className} data-game-ui onPointerDown={stopUiPointer}>
      {!compact && (
        <p className="font-ui mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/50">
          {STR.chooseBackground}
        </p>
      )}
      <div className="relative">
        <div
          className={`flex overflow-x-auto px-2 scrollbar-none ${
            compact
              ? 'gap-3 py-2'
              : 'justify-start gap-3 sm:gap-4 px-4 py-4 sm:px-6 sm:py-5 sm:justify-center'
          }`}
        >
          {backgrounds.map((bg) => {
            const selected = value === bg.id
            return (
              <motion.button
                key={bg.id}
                type="button"
                data-game-ui
                onPointerDown={stopUiPointer}
                onClick={() => onChange(bg.id)}
                title={bg.label}
                whileHover={{ scale: 1.06, y: -4 }}
                whileTap={{ scale: 0.96 }}
                animate={{
                  scale: selected ? 1.04 : 1,
                  opacity: selected ? 1 : 0.78,
                  boxShadow: selected
                    ? '0 0 0 2px rgba(163, 230, 53, 0.95), 0 8px 20px rgba(0,0,0,0.4)'
                    : '0 0 0 1px rgba(255,255,255,0.12)',
                }}
                transition={spring}
                className="pointer-events-auto shrink-0 overflow-hidden rounded-xl border-2 border-transparent bg-black/20"
              >
                <img
                  src={bg.preview}
                  alt={bg.label}
                  className={`block object-cover ${compact ? 'h-12 w-20' : 'h-14 w-24 sm:h-16 sm:w-28'}`}
                  loading="lazy"
                  draggable={false}
                />
                {!compact && (
                  <span className="block max-w-28 truncate bg-black/60 px-2 py-1 text-center font-ui text-[10px] font-bold uppercase text-white">
                    {bg.label}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
        {!compact && (
          <>
            <div className={`${scrollFade} left-0 bg-gradient-to-r`} aria-hidden />
            <div className={`${scrollFade} right-0 bg-gradient-to-l`} aria-hidden />
          </>
        )}
      </div>
    </div>
  )
}

export default BackgroundPicker
