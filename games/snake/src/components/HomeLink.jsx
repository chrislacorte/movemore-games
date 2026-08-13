import { STRINGS } from '../constants/strings'

export default function HomeLink() {
  return (
    <a
      href="/"
      className="pointer-events-auto absolute left-3 top-3 z-[60] rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 font-film text-[10px] uppercase tracking-widest text-white/75 backdrop-blur-md transition hover:bg-white/10 sm:left-4 sm:top-4"
    >
      ← {STRINGS.backToHome}
    </a>
  )
}
