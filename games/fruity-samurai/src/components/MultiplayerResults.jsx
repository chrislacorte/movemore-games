import { STR } from '../constants/strings'

const MultiplayerResults = ({ mpResult, boards, onPlayAgain, onMenu }) => {
  if (!mpResult) return null

  const score0 = boards[0]?.score ?? 0
  const score1 = boards[1]?.score ?? 0

  let title = STR.challengeResults
  let subtitle = ''
  let accent = 'text-lime-300'

  if (mpResult.type === 'coop') {
    title = STR.coopSuccess
    subtitle = STR.glassFilled
    accent = 'text-lime-300'
  } else if (mpResult.type === 'challenge') {
    if (mpResult.winner === 'tie') {
      title = STR.challengeTie
      accent = 'text-yellow-300'
    } else {
      title = STR.challengeWinner
      subtitle = mpResult.winner === 0 ? STR.player1 : STR.player2
      accent = mpResult.winner === 0 ? 'text-amber-300' : 'text-sky-300'
    }
  }

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
      <h2 className={`font-title pointer-events-none text-4xl sm:text-6xl ${accent}`}>
        {title}
      </h2>
      {subtitle && (
        <p className="font-title pointer-events-none mt-2 text-3xl text-white sm:text-5xl">
          {subtitle}
        </p>
      )}

      <div className="mt-8 flex w-full max-w-lg justify-center gap-8 px-4">
        <div className="text-center">
          <p className="font-ui text-xs uppercase tracking-widest text-amber-300/70">
            {STR.player1}
          </p>
          <p className="font-title text-5xl text-amber-200 sm:text-6xl">{score0}</p>
          <p className="font-ui mt-1 text-[10px] uppercase tracking-widest text-white/40">
            {STR.fruitsSliced}
          </p>
        </div>
        <div className="text-center">
          <p className="font-ui text-xs uppercase tracking-widest text-sky-300/70">
            {STR.player2}
          </p>
          <p className="font-title text-5xl text-sky-200 sm:text-6xl">{score1}</p>
          <p className="font-ui mt-1 text-[10px] uppercase tracking-widest text-white/40">
            {STR.fruitsSliced}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          data-game-ui
          onClick={onPlayAgain}
          className="font-ui pointer-events-auto rounded-full bg-lime-400 px-8 py-3 text-lg font-bold uppercase text-black"
        >
          {STR.playAgain}
        </button>
        <button
          type="button"
          data-game-ui
          onClick={onMenu}
          className="font-ui pointer-events-auto rounded-full border border-white/30 px-8 py-3 text-lg font-bold uppercase text-white"
        >
          {STR.menu}
        </button>
      </div>
    </div>
  )
}

export default MultiplayerResults
