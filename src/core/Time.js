import EventEmitter from './EventEmitter.js'

/**
 * The single requestAnimationFrame loop. Emits `tick` once per frame and exposes
 * `elapsed` (seconds since start) and `delta` (seconds, clamped to avoid jumps
 * after a tab is backgrounded).
 */
export default class Time extends EventEmitter {
  constructor() {
    super()
    this.start = performance.now()
    this.current = this.start
    this.elapsed = 0
    this.delta = 1 / 60

    requestAnimationFrame(() => this.tick())
  }

  tick() {
    const now = performance.now()
    this.delta = Math.min((now - this.current) / 1000, 0.05)
    this.current = now
    this.elapsed = (now - this.start) / 1000

    this.emit('tick')
    requestAnimationFrame(() => this.tick())
  }
}
