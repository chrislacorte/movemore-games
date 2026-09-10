export interface BladePoint {
  /** Stable id across frames ("hand-0", "hand-1", "pointer"). */
  id: string
  /** Screen-normalised position, 0..1, x already mirrored so it matches the player's view. */
  x: number
  y: number
  /** Velocity in screen-normalised units per second. */
  vx: number
  vy: number
  /** Milliseconds since the last real detection (0 for fresh samples). */
  age: number
  /** 'Left' | 'Right' | 'Pointer' */
  label: string
}

export interface TrackingStats {
  /** Detections per second. */
  fps: number
  /** Inference time of the last frame in ms. */
  inferenceMs: number
  /** Estimated capture→result latency in ms (compensated by extrapolation). */
  latencyMs: number
  hands: number
  delegate: 'GPU' | 'CPU' | 'none'
}

export type Landmark = { x: number; y: number; z: number }
