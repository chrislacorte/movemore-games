import { useState } from 'react'
import { motion } from 'framer-motion'
import { STRINGS } from '../../constants/strings'
import { SHAPES, LETTERS } from '../../constants/templates'
import { BACKGROUNDS } from '../../constants/gameConfig'

function BackgroundPicker({ background, onBackgroundChange }) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className="font-ui text-xs font-bold uppercase tracking-widest text-white/50">
        {STRINGS.toolbarBackground}
      </span>
      <div className="flex gap-2">
        {[
          { id: BACKGROUNDS.NIGHT, icon: '🌙', label: STRINGS.bgNight },
          { id: BACKGROUNDS.CAMERA, icon: '🎥', label: STRINGS.bgCamera },
        ].map((bg) => (
          <button
            key={bg.id}
            type="button"
            onClick={() => onBackgroundChange(bg.id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 font-ui text-sm font-bold transition ${
              background === bg.id
                ? 'border-white/50 bg-white/20 text-white shadow-[0_0_16px_rgba(255,255,255,0.2)]'
                : 'border-white/15 bg-white/5 text-white/65 hover:bg-white/10'
            }`}
          >
            <span aria-hidden>{bg.icon}</span>
            <span>{bg.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function TemplateButton({ template, onPick }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => onPick(template)}
      title={template.label}
      className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/5 transition hover:border-white/40 hover:bg-white/15 sm:h-[4.5rem] sm:w-[4.5rem]"
    >
      <span
        className={
          template.kind === 'letter'
            ? 'font-display text-3xl font-extrabold text-cyan-100 drop-shadow-[0_0_10px_rgba(120,220,255,0.8)]'
            : 'text-3xl'
        }
      >
        {template.emoji}
      </span>
      {template.kind === 'shape' && (
        <span className="mt-0.5 font-ui text-[10px] font-bold text-white/60">{template.label}</span>
      )}
    </motion.button>
  )
}

export default function ModeSelectScreen({ onFreeDraw, onTracePick, background, onBackgroundChange }) {
  const [tab, setTab] = useState('shapes')
  const [showTemplates, setShowTemplates] = useState(false)

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 flex w-full max-w-2xl flex-col items-center gap-6 text-center"
      >
        {!showTemplates ? (
          <>
            <h2 className="font-display text-4xl font-extrabold text-white drop-shadow-[0_0_20px_rgba(140,180,255,0.7)] sm:text-5xl">
              {STRINGS.modeTitle}
            </h2>
            <BackgroundPicker background={background} onBackgroundChange={onBackgroundChange} />
            <div className="grid w-full gap-4 sm:grid-cols-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={onFreeDraw}
                className="flex flex-col items-center gap-3 rounded-[2rem] border border-cyan-300/30 bg-cyan-400/10 px-6 py-8 transition hover:bg-cyan-400/20"
              >
                <span className="text-5xl" aria-hidden>🎨</span>
                <span className="font-display text-2xl font-extrabold text-cyan-100">
                  {STRINGS.modeFreeTitle}
                </span>
                <span className="font-ui text-sm font-semibold text-white/70">
                  {STRINGS.modeFreeDesc}
                </span>
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowTemplates(true)}
                className="flex flex-col items-center gap-3 rounded-[2rem] border border-yellow-200/30 bg-yellow-300/10 px-6 py-8 transition hover:bg-yellow-300/20"
              >
                <span className="text-5xl" aria-hidden>⭐</span>
                <span className="font-display text-2xl font-extrabold text-yellow-100">
                  {STRINGS.modeTraceTitle}
                </span>
                <span className="font-ui text-sm font-semibold text-white/70">
                  {STRINGS.modeTraceDesc}
                </span>
              </motion.button>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-3xl font-extrabold text-white drop-shadow-[0_0_20px_rgba(255,220,120,0.6)] sm:text-4xl">
              {STRINGS.templatePickTitle}
            </h2>
            <BackgroundPicker background={background} onBackgroundChange={onBackgroundChange} />
            <div className="flex gap-2">
              {[
                { id: 'shapes', label: STRINGS.shapesTab },
                { id: 'letters', label: STRINGS.lettersTab },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-full px-5 py-2 font-ui text-sm font-extrabold transition ${
                    tab === t.id
                      ? 'bg-white text-night'
                      : 'border border-white/20 bg-white/5 text-white/70 hover:bg-white/15'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex max-h-[45vh] flex-wrap items-center justify-center gap-2.5 overflow-y-auto px-2 sm:gap-3">
              {(tab === 'shapes' ? SHAPES : LETTERS).map((template) => (
                <TemplateButton key={template.id} template={template} onPick={onTracePick} />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="rounded-full border border-white/20 bg-white/5 px-6 py-2 font-ui text-sm font-bold text-white/70 transition hover:bg-white/15"
            >
              ← {STRINGS.back}
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
