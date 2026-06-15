import EventEmitter from './EventEmitter.js'

/** Tracks the viewport and emits `resize`. Pixel ratio is capped at 2 for perf. */
export default class Sizes extends EventEmitter {
  constructor() {
    super()
    this.measure()
    window.addEventListener('resize', () => {
      this.measure()
      this.emit('resize')
    })
  }

  measure() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.pixelRatio = Math.min(window.devicePixelRatio, 2)
  }
}
