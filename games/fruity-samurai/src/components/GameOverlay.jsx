import { INITIAL_LIVES } from '../constants/gameConfig';

const GameOverlay = ({
  uiState,
  isReady,
  error,
  onStart,
  modeBadge,
  description,
  loadingLabel = 'Initialisiere Mediapipe...',
}) => (
  <>
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col p-8">
      {!uiState.gameStarted && !uiState.isGameOver && (
        <div className="flex-1 flex flex-col items-center justify-center pointer-events-auto">
          {modeBadge && (
            <span className="mb-4 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
              {modeBadge}
            </span>
          )}
          <h1 className="text-6xl font-black mb-8 tracking-tighter italic">
            <span className="text-amber-400">FRUIT</span>{' '}
            <span className="text-red-600">SAMURAI</span>
          </h1>
          <p className="text-gray-400 mb-8 text-center max-w-md">{description}</p>
          <button
            type="button"
            onClick={onStart}
            disabled={!isReady}
            className="px-12 py-4 rounded-full bg-red-600 font-bold text-xl text-white transition-all hover:bg-red-700 hover:scale-105 active:scale-95 disabled:cursor-wait disabled:opacity-60"
          >
            {isReady ? 'SPIEL STARTEN' : error ? 'KAMERA FEHLER' : 'KAMERA LÄDT...'}
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      )}

      {uiState.gameStarted && !uiState.isGameOver && (
        <div className="flex justify-between items-start w-full">
          <div className="flex gap-12">
            <div className="flex flex-col">
              <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">
                Score
              </span>
              <span className="text-6xl font-black text-white italic">{uiState.score}</span>
              {uiState.comboVisible && uiState.combo > 1 && (
                <span className="text-amber-400 font-bold text-lg mt-1">
                  x{uiState.combo} Combo
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">
                Best
              </span>
              <span className="text-4xl font-black text-amber-400 italic">
                {uiState.highscore}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-400 uppercase tracking-widest text-sm font-bold">
              Leben
            </span>
            <div className="flex gap-2 mt-2">
              {[...Array(INITIAL_LIVES)].map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full border-2 ${
                    i < uiState.lives
                      ? 'bg-red-600 border-red-400'
                      : 'bg-transparent border-gray-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {uiState.isGameOver && (
        <div className="flex-1 flex flex-col items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm">
          <h2 className="text-8xl font-black text-red-600 mb-4 tracking-tighter italic animate-bounce">
            GAME OVER
          </h2>
          <div className="text-center mb-12">
            <span className="text-gray-400 uppercase tracking-widest text-lg font-bold">
              Dein Score
            </span>
            <p className="text-8xl font-black text-white italic">{uiState.score}</p>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="px-12 py-4 bg-amber-400 text-black rounded-full font-bold text-xl hover:bg-amber-300 transition-all hover:scale-105 active:scale-95"
          >
            NOCHMAL SPIELEN
          </button>
        </div>
      )}
    </div>

    {!isReady && !error && (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black pointer-events-none">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white font-bold tracking-widest uppercase">{loadingLabel}</p>
        </div>
      </div>
    )}
  </>
);

export default GameOverlay;
