/** Minimal pub/sub used by Sizes and Time. */
export default class EventEmitter {
  constructor() {
    this.callbacks = {}
  }

  on(name, cb) {
    ;(this.callbacks[name] ||= []).push(cb)
    return this
  }

  off(name, cb) {
    if (this.callbacks[name]) {
      this.callbacks[name] = this.callbacks[name].filter((c) => c !== cb)
    }
    return this
  }

  emit(name, ...args) {
    ;(this.callbacks[name] || []).forEach((cb) => cb(...args))
    return this
  }
}
