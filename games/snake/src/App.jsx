import SnakeGame from './components/SnakeGame'

export default function App() {
  return (
    <div className="game-shell flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-black">
      <div className="game-shell-inner flex min-h-0 flex-1 items-center justify-center bg-black">
        <div className="game-stage-wrapper relative h-full w-full max-h-[100dvh]">
          <SnakeGame />
        </div>
      </div>
    </div>
  )
}
