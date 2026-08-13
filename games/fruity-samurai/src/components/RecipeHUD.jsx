import { STR } from '../constants/strings'
import { RECIPE_BOTTLE_CAPACITY } from '../utils/recipeUtils'
import { FRUIT_IMAGE_FILES } from '../constants/fruitAssets'

const fruitSrc = (type) =>
  new URL(`../img/fruits/${FRUIT_IMAGE_FILES[type]}`, import.meta.url).href

const RecipeHUD = ({ recipe, recipeIndex, bottleFill }) => {
  const fillPct = Math.min(100, (bottleFill / RECIPE_BOTTLE_CAPACITY) * 100)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[18] flex items-end justify-between px-3 pb-2 sm:px-5 sm:pb-3 md:px-6">
      <div className="recipe-hud recipe-hud--recipe rounded-xl border border-white/10 px-3 py-2 backdrop-blur-[2px] sm:px-4 sm:py-2.5">
        <span className="recipe-hud__label font-ui block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50 sm:text-xs">
          {STR.recipeTitle}
        </span>
        <div className="mt-1.5 flex items-center gap-2 sm:gap-2.5">
          {recipe.map((type, i) => {
            const done = i < recipeIndex
            const active = i === recipeIndex

            return (
              <div
                key={`${type}-${i}`}
                className={`recipe-hud__slot relative flex shrink-0 items-center justify-center rounded-lg border-2 ${
                  active
                    ? 'border-lime-400/85 bg-lime-400/15'
                    : done
                      ? 'border-white/20 bg-white/[0.05]'
                      : 'border-white/15 bg-white/[0.04]'
                }`}
              >
                <img
                  src={fruitSrc(type)}
                  alt={type}
                  className={`recipe-hud__fruit object-contain ${done ? 'opacity-55 saturate-50' : ''}`}
                  draggable={false}
                />
                {done && (
                  <span className="recipe-hud__strike pointer-events-none absolute left-1/2 top-1/2" aria-hidden />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="recipe-hud flex flex-col items-center gap-0.5 rounded-lg border border-white/8 px-2.5 py-1.5 backdrop-blur-[2px] sm:px-3 sm:py-2">
        <span className="font-ui text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40 sm:text-[10px]">
          {STR.bottleTitle}
        </span>
        <div className="flex items-end gap-1.5">
          <div className="relative h-[4.5rem] w-6 overflow-hidden rounded-b-xl rounded-t-lg border border-white/15 bg-white/[0.06] sm:h-20 sm:w-7 md:h-[5.5rem] md:w-8">
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-500/75 to-yellow-300/55 transition-all duration-300"
              style={{ height: `${fillPct}%` }}
            />
            <div className="absolute -top-0.5 left-1/2 h-2 w-4 -translate-x-1/2 rounded-sm border border-white/15 bg-white/10 sm:h-2.5 sm:w-5" />
          </div>
          <span className="font-ui pb-0.5 text-[9px] font-medium tabular-nums text-white/45 sm:text-[10px]">
            {bottleFill}/{RECIPE_BOTTLE_CAPACITY}
          </span>
        </div>
      </div>
    </div>
  )
}

export default RecipeHUD
