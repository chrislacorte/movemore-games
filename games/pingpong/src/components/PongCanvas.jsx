import { useEffect, useRef } from 'react'
import { renderPongFrame, pushTrail, bustRenderCache } from '../canvas/pongRenderer'
import { createPaddleScene } from '../canvas/pongPaddleScene'
import { createTableScene } from '../canvas/pingTableScene'

export default function PongCanvas({
  engineRef,
  playerPaddleRef,
  className = '',
  webcamBackdrop = false,
}) {
  const wrapRef = useRef(null)
  const canvas2dRef = useRef(null)
  const canvasTableRef = useRef(null)
  const canvas3dRef = useRef(null)
  const trailRef = useRef([])
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const paddleSceneRef = useRef(null)
  const tableSceneRef = useRef(null)

  useEffect(() => {
    bustRenderCache()
    const canvasTable = canvasTableRef.current
    const canvas3d = canvas3dRef.current
    if (canvasTable) tableSceneRef.current = createTableScene(canvasTable)
    if (canvas3d) paddleSceneRef.current = createPaddleScene(canvas3d)
    return () => {
      tableSceneRef.current?.dispose()
      tableSceneRef.current = null
      paddleSceneRef.current?.dispose()
      paddleSceneRef.current = null
    }
  }, [])

  useEffect(() => {
    const canvas2d = canvas2dRef.current
    if (!canvas2d) return

    let raf = 0

    const draw = (time) => {
      const parent = wrapRef.current
      if (!parent) {
        raf = requestAnimationFrame(draw)
        return
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w < 1 || h < 1) {
        raf = requestAnimationFrame(draw)
        return
      }

      const size = sizeRef.current
      if (size.w !== w || size.h !== h || size.dpr !== dpr) {
        canvas2d.width = Math.round(w * dpr)
        canvas2d.height = Math.round(h * dpr)
        canvas2d.style.width = `${w}px`
        canvas2d.style.height = `${h}px`
        sizeRef.current = { w, h, dpr }
        tableSceneRef.current?.resize(w, h, dpr)
        paddleSceneRef.current?.resize(w, h, dpr)
      }

      const ctx = canvas2d.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const engine = engineRef?.current
      const pp = playerPaddleRef?.current
      const ball = engine?.ball
      const serving = engine?.serving && time < (engine?.serveAt ?? 0)
      const hitFlash = time < (engine?.hitFlashUntil ?? 0)

      if (ball && !serving) {
        trailRef.current = pushTrail(trailRef.current, ball)
      } else if (serving) {
        trailRef.current = []
      }

      tableSceneRef.current?.render(time)

      renderPongFrame(
        ctx,
        w,
        h,
        {
          ball,
          aiPaddle: engine?.aiPaddle,
          playerPaddle: pp,
          hitFlash,
          serving,
          trail: trailRef.current,
        },
        time,
        dpr,
        webcamBackdrop,
        true,
      )

      paddleSceneRef.current?.render({
        playerPaddle: pp,
        aiPaddle: engine?.aiPaddle,
        w,
        h,
        time,
      })

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [engineRef, playerPaddleRef, webcamBackdrop])

  return (
    <div ref={wrapRef} className={`relative h-full w-full ${className}`}>
      <canvas
        ref={canvasTableRef}
        className="pointer-events-none absolute inset-0 z-[4] h-full w-full"
        aria-hidden
      />
      <canvas
        ref={canvas2dRef}
        className="arena-canvas pointer-events-none absolute inset-0 z-[6] h-full w-full"
        aria-hidden
      />
      <canvas
        ref={canvas3dRef}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        aria-label="Ping Pong Spielfeld"
      />
    </div>
  )
}
