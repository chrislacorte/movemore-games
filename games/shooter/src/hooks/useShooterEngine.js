import { useCallback, useRef, useState } from 'react'
import {
  GAME_PHASES,
  TARGET_SPAWN_INTERVAL_MS,
  TARGET_MAX,
  TARGET_MIN_SPEED,
  TARGET_MAX_SPEED,
  TARGET_MIN_SIZE,
  TARGET_MAX_SIZE,
  TARGET_Y_MIN,
  TARGET_Y_MAX,
  TARGET_BOB_AMP,
  TARGET_BOB_SPEED,
  TARGET_HIT_RADIUS_SCALE,
  TARGET_DEATH_MS,
  MUZZLE_FLASH_MS,
  HIT_MARKER_MS,
  CAMERA_ASPECT,
} from '../constants/gameConfig'

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function emptyGameState() {
  return {
    targets: [],
    hitMarkers: [],
    particles: [],
    shotFx: null,
    muzzleFlashUntil: 0,
    screenShakeUntil: 0,
    screenShakePower: 0,
  }
}

export function useShooterEngine() {
  const [phase, setPhase] = useState(GAME_PHASES.INTRO)
  const [displayState, setDisplayState] = useState({
    score: 0,
    hits: 0,
    shots: 0,
  })

  const gameStateRef = useRef(emptyGameState())
  const statsRef = useRef({ score: 0, hits: 0, shots: 0 })
  const lastSpawnRef = useRef(0)
  const idRef = useRef(1)

  const syncDisplay = useCallback(() => {
    const s = statsRef.current
    setDisplayState({ score: s.score, hits: s.hits, shots: s.shots })
  }, [])

  const resetGame = useCallback(() => {
    gameStateRef.current = emptyGameState()
    statsRef.current = { score: 0, hits: 0, shots: 0 }
    lastSpawnRef.current = 0
    syncDisplay()
  }, [syncDisplay])

  const startCalibration = useCallback(() => {
    setPhase(GAME_PHASES.CALIBRATE)
  }, [])

  const startPlay = useCallback(() => {
    resetGame()
    lastSpawnRef.current = performance.now()
    setPhase(GAME_PHASES.PLAY)
  }, [resetGame])

  const resetToIntro = useCallback(() => {
    resetGame()
    setPhase(GAME_PHASES.INTRO)
  }, [resetGame])

  const spawnTarget = useCallback((now) => {
    const dir = Math.random() < 0.5 ? 1 : -1
    const size = rand(TARGET_MIN_SIZE, TARGET_MAX_SIZE)
    const margin = size + 0.05
    const baseY = rand(TARGET_Y_MIN, TARGET_Y_MAX)
    gameStateRef.current.targets.push({
      id: idRef.current++,
      dir,
      species: Math.floor(Math.random() * 4),
      x: dir === 1 ? -margin : 1 + margin,
      baseY,
      y: baseY,
      vx: rand(TARGET_MIN_SPEED, TARGET_MAX_SPEED) * dir,
      size,
      bobPhase: Math.random() * Math.PI * 2,
      bobSpeed: TARGET_BOB_SPEED * rand(0.8, 1.2),
      state: 'fly',
      vyHit: 0,
      spin: 0,
      deathUntil: 0,
      spawnAt: now,
    })
  }, [])

  const tick = useCallback(
    (crosshair, fired, now, dtSec) => {
      if (phase !== GAME_PHASES.PLAY) return null
      const g = gameStateRef.current
      const dt = Math.min(0.05, dtSec || 1 / 60)
      let spawnedBird = false
      let birdHit = false

      // Spawn
      const aliveCount = g.targets.filter((t) => t.state === 'fly').length
      if (
        aliveCount < TARGET_MAX &&
        now - lastSpawnRef.current >= TARGET_SPAWN_INTERVAL_MS
      ) {
        lastSpawnRef.current = now
        spawnTarget(now)
        spawnedBird = true
      }

      // Move
      for (const t of g.targets) {
        if (t.state === 'fly') {
          t.x += t.vx * dt
          t.y = t.baseY + Math.sin(now * 0.001 * t.bobSpeed + t.bobPhase) * TARGET_BOB_AMP
        } else {
          // Hit: fall and spin away
          t.vyHit += 1.6 * dt
          t.y += t.vyHit * dt
          t.x += t.vx * 0.4 * dt
          t.spin += 9 * dt * t.dir
        }
      }

      // Cull off-screen / finished deaths
      g.targets = g.targets.filter((t) => {
        if (t.state === 'fly') {
          const margin = t.size + 0.08
          return t.x > -margin && t.x < 1 + margin
        }
        return now < t.deathUntil && t.y < 1.2
      })

      // Fire: hit-test the nearest flying target within radius
      if (fired) {
        statsRef.current.shots += 1
        let best = null
        let bestDist = Infinity
        for (const t of g.targets) {
          if (t.state !== 'fly') continue
          const dx = (crosshair.x - t.x) * CAMERA_ASPECT
          const dy = crosshair.y - t.y
          const d = Math.sqrt(dx * dx + dy * dy)
          const r = t.size * TARGET_HIT_RADIUS_SCALE
          if (d < r && d < bestDist) {
            bestDist = d
            best = t
          }
        }

        if (best) {
          best.state = 'hit'
          best.deathUntil = now + TARGET_DEATH_MS
          best.vyHit = 0.05
          birdHit = true
          statsRef.current.score += 1
          statsRef.current.hits += 1
          g.hitMarkers.push({
            id: idRef.current++,
            x: best.x,
            y: best.y,
            until: now + HIT_MARKER_MS,
            born: now,
          })
          for (let i = 0; i < 14; i++) {
            const angle = Math.random() * Math.PI * 2
            const speed = 0.25 + Math.random() * 0.55
            g.particles.push({
              id: idRef.current++,
              x: best.x,
              y: best.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 0.15,
              life: 0.45 + Math.random() * 0.35,
              born: now,
              hue: 35 + Math.random() * 25,
              size: 2 + Math.random() * 4,
            })
          }
        }

        g.shotFx = {
          x: crosshair.x,
          y: crosshair.y,
          until: now + 280,
          hit: Boolean(best),
          born: now,
        }
        g.muzzleFlashUntil = now + MUZZLE_FLASH_MS
        g.screenShakeUntil = now + (best ? 180 : 90)
        g.screenShakePower = best ? 0.018 : 0.008
        syncDisplay()
      }

      // Expire hit markers
      if (g.hitMarkers.length) {
        g.hitMarkers = g.hitMarkers.filter((m) => now < m.until)
      }

      // Particles
      if (g.particles.length) {
        const dt = Math.min(0.05, dtSec || 1 / 60)
        for (const p of g.particles) {
          p.x += p.vx * dt
          p.y += p.vy * dt
          p.vy += 0.9 * dt
        }
        g.particles = g.particles.filter((p) => now - p.born < p.life * 1000)
      }

      if (!spawnedBird && !birdHit) return null
      return { spawnedBird, birdHit }
    },
    [phase, spawnTarget, syncDisplay],
  )

  return {
    phase,
    displayState,
    gameStateRef,
    startCalibration,
    startPlay,
    resetToIntro,
    tick,
  }
}
