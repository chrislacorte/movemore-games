import { STR } from '../constants/strings'
import { FRUIT_IMAGE_FILES } from '../constants/fruitAssets'
import { COOP_REVEAL_MS } from '../constants/gameConfig'

const fruitSrc = (type) =>
  new URL(`../img/fruits/${FRUIT_IMAGE_FILES[type]}`, import.meta.url).href

const CoopTargetReveal = ({ boards, now }) => {
  const revealing = boards.filter((board) => board.coopRevealing && board.coopTarget)
  if (!revealing.length) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-[19] flex">
      {boards.map((board) => {
        const isRevealing = board.coopRevealing && board.coopTarget
        const remainingMs = isRevealing ? Math.max(0, board.coopRevealUntil - now) : 0
        const progress = 1 - remainingMs / COOP_REVEAL_MS

        return (
          <div key={board.id} className="relative flex flex-1 items-center justify-center">
            {isRevealing && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/20 bg-black/55 px-6 py-5 backdrop-blur-sm sm:gap-3 sm:px-10 sm:py-7">
                <span className="font-ui text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 sm:text-xs">
                  {STR.rememberFruit}
                </span>
                <img
                  src={fruitSrc(board.coopTarget)}
                  alt={board.coopTarget}
                  className="coop-reveal-fruit h-24 w-24 object-contain sm:h-32 sm:w-32 md:h-40 md:w-40"
                  draggable={false}
                />
                <div className="h-1 w-28 overflow-hidden rounded-full bg-white/15 sm:w-36">
                  <div
                    className="h-full rounded-full bg-lime-400 transition-all duration-100"
                    style={{ width: `${Math.min(100, progress * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default CoopTargetReveal
