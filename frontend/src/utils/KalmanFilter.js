// 1D Kalman filter — denoise a noisy signal stream (position, scale, etc.)
//
// R: measurement noise. Lower = trust sensor more (snappier, more jitter).
// Q: process noise.     Higher = trust new readings more (responsive, less smooth).
//
// Defaults tuned for hand-landmark coordinates at 30-60 fps.

export class KalmanFilter {
  constructor(R = 0.008, Q = 2) {
    this.R = R
    this.Q = Q
    this.P = 1
    this.X = 0
    this.initialized = false
  }

  filter(measurement) {
    if (!this.initialized) {
      this.X = measurement
      this.initialized = true
      return this.X
    }
    this.P = this.P + this.Q
    const K = this.P / (this.P + this.R)
    this.X = this.X + K * (measurement - this.X)
    this.P = (1 - K) * this.P
    return this.X
  }

  reset(value = 0) {
    this.X = value
    this.P = 1
    this.initialized = value !== 0
  }
}

export const KF_PRESETS = {
  position: { R: 0.008, Q: 2 },
  angle:    { R: 0.005, Q: 1 },
  scale:    { R: 0.003, Q: 0.5 }
}
