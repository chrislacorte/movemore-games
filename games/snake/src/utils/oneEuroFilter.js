const TWO_PI = 2 * Math.PI

function smoothingFactor(cutoff, dt) {
  const tau = 1 / (TWO_PI * cutoff)
  return 1 / (1 + tau / dt)
}

class LowPassFilter {
  constructor() {
    this.value = null
  }

  reset() {
    this.value = null
  }

  filter(value, alpha) {
    if (this.value === null) {
      this.value = value
      return value
    }
    this.value = alpha * value + (1 - alpha) * this.value
    return this.value
  }
}

export class OneEuroFilter {
  constructor({ minCutoff = 2.5, beta = 0.12, dCutoff = 1.0 } = {}) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
    this.xFilter = new LowPassFilter()
    this.dxFilter = new LowPassFilter()
    this.lastTime = null
    this.lastValue = null
  }

  reset() {
    this.xFilter.reset()
    this.dxFilter.reset()
    this.lastTime = null
    this.lastValue = null
  }

  filter(value, timestampMs) {
    if (this.lastTime === null) {
      this.lastTime = timestampMs
      this.lastValue = value
      return value
    }

    const dt = Math.max(1 / 120, (timestampMs - this.lastTime) / 1000)
    this.lastTime = timestampMs

    const dx = (value - this.lastValue) / dt
    this.lastValue = value

    const edx = this.dxFilter.filter(dx, smoothingFactor(this.dCutoff, dt))
    const cutoff = this.minCutoff + this.beta * Math.abs(edx)

    return this.xFilter.filter(value, smoothingFactor(cutoff, dt))
  }
}

export class PositionFilter {
  constructor(options) {
    this.xFilter = new OneEuroFilter(options)
    this.yFilter = new OneEuroFilter(options)
  }

  reset() {
    this.xFilter.reset()
    this.yFilter.reset()
  }

  filter(x, y, timestampMs) {
    return {
      x: this.xFilter.filter(x, timestampMs),
      y: this.yFilter.filter(y, timestampMs),
    }
  }
}
