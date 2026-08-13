import { STR } from '../constants/strings'

export default function HomeLink() {
  return (
    <a
      href="/"
      data-game-ui
      className="font-ui pointer-events-auto absolute left-3 top-2 z-40 rounded-md border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-black/65 sm:left-6 sm:top-3 sm:px-3 sm:text-xs"
    >
      ← {STR.backToHome}
    </a>
  )
}
