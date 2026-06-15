import * as THREE from 'three'

/**
 * Pointer interaction. Raycasts against the flat `world.pickables` list (only
 * when the pointer actually moved, for efficiency), resolves which instrument
 * was hit, drives the hover cursor + label, and routes clicks to the focus flow.
 */
export default class Picker {
  constructor(experience) {
    this.experience = experience
    this.raycaster = new THREE.Raycaster()
    this.hovered = null
    this.enabled = false
    this.dirty = true

    window.addEventListener('pointermove', () => (this.dirty = true))
    window.addEventListener('click', (e) => this.onClick(e))
  }

  setEnabled(value) {
    this.enabled = value
    this.dirty = true
    if (!value) this.clearHover()
  }

  update() {
    if (!this.enabled || !this.dirty) return
    this.dirty = false

    const instrument = this.pick(this.experience.pointer)
    if (instrument !== this.hovered) {
      if (this.hovered) this.hovered.setHover(false)
      if (instrument) instrument.setHover(true)
      this.hovered = instrument
      document.body.style.cursor = instrument ? 'pointer' : ''
      this.experience.overlay.setHover(instrument)
    }
  }

  /** Raycast `ndc` ({x,y} in -1..1) against instruments; returns the Instrument or null. */
  pick(ndc) {
    this.raycaster.setFromCamera(ndc, this.experience.camera.instance)
    const hits = this.raycaster.intersectObjects(this.experience.world.pickables, false)
    return hits.length ? this.experience.world.byId[hits[0].object.userData.instrumentId] : null
  }

  // Raycast straight from the click/tap point so it works without a prior hover (touch).
  onClick(e) {
    if (!this.enabled) return
    const instrument = this.pick(this.experience.toNdc(e.clientX, e.clientY))
    if (instrument) this.experience.focus.focus(instrument)
  }

  clearHover() {
    if (!this.hovered) return
    this.hovered.setHover(false)
    this.hovered = null
    document.body.style.cursor = ''
    this.experience.overlay.setHover(null)
  }
}
