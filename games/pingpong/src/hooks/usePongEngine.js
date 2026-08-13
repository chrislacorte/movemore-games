import { useCallback, useRef, useState } from 'react'
import {
  WIN_SCORE,
  BALL_RADIUS,
  BALL_SPEED_Z_BASE,
  BALL_SPEED_Z_MAX,
  BALL_SPEED_BOOST_PER_RALLY,
  BALL_WALL_BOUNCE,
  PADDLE_W,
  PADDLE_H,
  TABLE_X_MIN,
  TABLE_X_MAX,
  TABLE_Y_MIN,
  TABLE_Y_MAX,
  PLAYER_PLANE_Z,
  AI_PLANE_Z,
  AI_PADDLE_SPEED,
  AI_MISS_CHANCE,
  AI_REACTION_JITTER,
  SERVE_DELAY_MS,
  GAME_PHASES,
} from '../constants/gameConfig'

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

function overlapBallPaddle(ball, px, py) {
  const hw = PADDLE_W / 2
  const hh = PADDLE_H / 2
  return (
    ball.x >= px - hw - BALL_RADIUS &&
    ball.x <= px + hw + BALL_RADIUS &&
    ball.y >= py - hh - BALL_RADIUS &&
    ball.y <= py + hh + BALL_RADIUS
  )
}

function createBall(towardPlayer = true) {
  const speed = BALL_SPEED_Z_BASE
  return {
    x: 0.5 + (Math.random() - 0.5) * 0.15,
    y: 0.5 + (Math.random() - 0.5) * 0.1,
    z: towardPlayer ? 0.25 : 0.75,
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.2,
    vz: towardPlayer ? speed : -speed,
  }
}

function createEngineState() {
  return {
    score: { player: 0, ai: 0 },
    rally: 0,
    ball: createBall(true),
    aiPaddle: { x: 0.5, y: 0.5 },
    hitFlashUntil: 0,
    serving: false,
    serveAt: 0,
    lastTick: 0,
    ballSpeedZ: BALL_SPEED_Z_BASE,
  }
}

export function usePongEngine() {
  const [phase, setPhase] = useState(GAME_PHASES.INTRO)
  const [hudState, setHudState] = useState({
    score: { player: 0, ai: 0 },
    rally: 0,
  })

  const phaseRef = useRef(GAME_PHASES.INTRO)
  const engineRef = useRef(createEngineState())

  const syncHud = useCallback(() => {
    const s = engineRef.current
    setHudState({
      score: { ...s.score },
      rally: s.rally,
    })
  }, [])

  const resetMatch = useCallback(() => {
    engineRef.current = {
      ...createEngineState(),
      serving: true,
      serveAt: performance.now() + SERVE_DELAY_MS,
    }
    syncHud()
  }, [syncHud])

  const scheduleServe = useCallback(
    (towardPlayer) => {
      const s = engineRef.current
      s.serving = true
      s.serveAt = performance.now() + SERVE_DELAY_MS
      s.ball = createBall(towardPlayer)
      s.ball.vz = towardPlayer ? s.ballSpeedZ : -s.ballSpeedZ
      if (!towardPlayer) {
        s.ball.z = 0.85
        s.ball.vz = -Math.abs(s.ball.vz)
      }
    },
    [],
  )

  const startCalibration = useCallback(() => {
    phaseRef.current = GAME_PHASES.CALIBRATE
    setPhase(GAME_PHASES.CALIBRATE)
  }, [])

  const startPlay = useCallback(() => {
    resetMatch()
    phaseRef.current = GAME_PHASES.PLAY
    setPhase(GAME_PHASES.PLAY)
  }, [resetMatch])

  const resetToIntro = useCallback(() => {
    phaseRef.current = GAME_PHASES.INTRO
    engineRef.current.serving = false
    setPhase(GAME_PHASES.INTRO)
  }, [])

  const awardPoint = useCallback(
    (toPlayer) => {
      const s = engineRef.current
      if (toPlayer) {
        s.score.player += 1
        if (s.score.player >= WIN_SCORE) {
          phaseRef.current = GAME_PHASES.WIN
          setPhase(GAME_PHASES.WIN)
          syncHud()
          return
        }
        scheduleServe(true)
      } else {
        s.score.ai += 1
        if (s.score.ai >= WIN_SCORE) {
          phaseRef.current = GAME_PHASES.LOSE
          setPhase(GAME_PHASES.LOSE)
          syncHud()
          return
        }
        scheduleServe(true)
      }
      s.rally = 0
      s.ballSpeedZ = BALL_SPEED_Z_BASE
      syncHud()
    },
    [scheduleServe, syncHud],
  )

  const tick = useCallback(
    (paddle, swing, now) => {
      if (phaseRef.current !== GAME_PHASES.PLAY) return null

      const s = engineRef.current
      if (s.serving) {
        if (now >= s.serveAt) {
          s.serving = false
        }
        return null
      }

      const dt = s.lastTick ? Math.min(0.05, (now - s.lastTick) / 1000) : 1 / 60
      s.lastTick = now

      const ball = s.ball
      let tableHit = false
      let paddleHit = false

      ball.z += ball.vz * dt
      ball.x += ball.vx * dt
      ball.y += ball.vy * dt

      if (ball.x <= TABLE_X_MIN + BALL_RADIUS) {
        ball.x = TABLE_X_MIN + BALL_RADIUS
        ball.vx = Math.abs(ball.vx) * BALL_WALL_BOUNCE
        tableHit = true
      }
      if (ball.x >= TABLE_X_MAX - BALL_RADIUS) {
        ball.x = TABLE_X_MAX - BALL_RADIUS
        ball.vx = -Math.abs(ball.vx) * BALL_WALL_BOUNCE
        tableHit = true
      }
      if (ball.y <= TABLE_Y_MIN + BALL_RADIUS) {
        ball.y = TABLE_Y_MIN + BALL_RADIUS
        ball.vy = Math.abs(ball.vy) * BALL_WALL_BOUNCE
        tableHit = true
      }
      if (ball.y >= TABLE_Y_MAX - BALL_RADIUS) {
        ball.y = TABLE_Y_MAX - BALL_RADIUS
        ball.vy = -Math.abs(ball.vy) * BALL_WALL_BOUNCE
        tableHit = true
      }

      const ai = s.aiPaddle
      const aiTargetX = ball.x + (Math.random() - 0.5) * AI_REACTION_JITTER
      const aiTargetY = ball.y + (Math.random() - 0.5) * AI_REACTION_JITTER
      const aiT = clamp(AI_PADDLE_SPEED * dt, 0, 1)
      ai.x += (aiTargetX - ai.x) * aiT
      ai.y += (aiTargetY - ai.y) * aiT
      ai.x = clamp(ai.x, TABLE_X_MIN, TABLE_X_MAX)
      ai.y = clamp(ai.y, TABLE_Y_MIN, TABLE_Y_MAX)

      if (ball.vz > 0 && ball.z >= PLAYER_PLANE_Z) {
        if (overlapBallPaddle(ball, paddle.x, paddle.y)) {
          ball.z = PLAYER_PLANE_Z
          const offsetX = (ball.x - paddle.x) / (PADDLE_W / 2)
          const offsetY = (ball.y - paddle.y) / (PADDLE_H / 2)
          ball.vz = -Math.abs(ball.vz) * 1.02
          ball.vx = offsetX * 0.85 + swing * 0.15
          ball.vy = offsetY * 0.75 + swing * 0.08
          s.rally += 1
          s.ballSpeedZ = Math.min(
            BALL_SPEED_Z_MAX,
            BALL_SPEED_Z_BASE + s.rally * BALL_SPEED_BOOST_PER_RALLY,
          )
          ball.vz = -s.ballSpeedZ
          s.hitFlashUntil = now + 180
          paddleHit = true
          syncHud()
        } else {
          awardPoint(false)
          return null
        }
      }

      if (ball.vz < 0 && ball.z <= AI_PLANE_Z) {
        const aiMiss = Math.random() < AI_MISS_CHANCE
        if (!aiMiss && overlapBallPaddle(ball, ai.x, ai.y)) {
          ball.z = AI_PLANE_Z
          const offsetX = (ball.x - ai.x) / (PADDLE_W / 2)
          const offsetY = (ball.y - ai.y) / (PADDLE_H / 2)
          ball.vz = s.ballSpeedZ
          ball.vx = -offsetX * 0.7 + (Math.random() - 0.5) * 0.2
          ball.vy = -offsetY * 0.65 + (Math.random() - 0.5) * 0.15
          s.hitFlashUntil = now + 120
          paddleHit = true
        } else {
          awardPoint(true)
          return null
        }
      }

      if (ball.z > 1.15) {
        awardPoint(false)
        return null
      }
      if (ball.z < -0.15) {
        awardPoint(true)
        return null
      }

      if (!tableHit && !paddleHit) return null
      return { tableHit, paddleHit }
    },
    [awardPoint, syncHud],
  )

  return {
    phase,
    hudState,
    engineRef,
    startCalibration,
    startPlay,
    resetToIntro,
    tick,
    resetMatch,
  }
}
