import * as THREE from 'three'
import gsap from 'gsap'

/**
 * Base class / contract for every playable object in the room.
 *
 * Subclasses implement ONLY `build()` and (optionally) `update()`:
 *
 *   build()  - add meshes to `this.group`. Build the instrument so that it
 *              RESTS ON THE FLOOR (lowest point at y ≈ 0), is CENTRED on the
 *              group origin in X/Z, and FACES +Z (toward the camera). Aim for
 *              roughly 1.0-1.6 units tall. Use `this.accent` (a THREE.Color)
 *              for the hero colour. Build materials with the helpers in
 *              ../materials.js (paint/gloss/metal/matte/glow) for a cohesive finish.
 *
 *   update(elapsed, delta) - optional per-frame flair (e.g. a swaying cymbal).
 *              Generic levitation (lift, bob, slow spin) is handled by the
 *              FocusController, so subclasses should NOT move `this.group`.
 *              Subclasses may stash their own animated-mesh arrays on `this`
 *              (e.g. this.cymbals, this.keys) to drive that flair.
 *
 * The base class then auto-collects every mesh into `this.pickables`, tags it
 * for raycasting, enables shadow casting, and measures the bounding box used to
 * frame the camera on focus. Subclasses never touch any of that.
 */
export default class Instrument {
  constructor({ id, name, tagline, accent, player = null, learn = false }) {
    this.id = id
    this.name = name
    this.tagline = tagline
    this.accent = new THREE.Color(accent)
    this.accentHex = accent // original string, for theming the HUD
    this.player = player // URL of this instrument's CV player page, or null
    this.learn = learn // true if it offers a Music-Learning (guided songs) mode

    this.group = new THREE.Group()
    this.group.name = id
    this.pickables = []

    this.build()
    this._finalize()
  }

  // ---- override in subclasses ----
  build() {}
  update(/* elapsed, delta */) {}

  // ---- handled by the base class ----
  _finalize() {
    this.group.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = false
      o.userData.instrumentId = this.id
      this.pickables.push(o)
    })

    const box = new THREE.Box3().setFromObject(this.group)
    this.size = box.getSize(new THREE.Vector3())
    this.center = box.getCenter(new THREE.Vector3())
  }

  /** Smooth, classy hover, a gentle lift + scale, driven by the Picker. */
  setHover(on) {
    const s = on ? 1.06 : 1
    gsap.to(this.group.scale, { x: s, y: s, z: s, duration: on ? 0.45 : 0.55, ease: 'power3.out', overwrite: true })
    gsap.to(this.group.position, {
      y: (this.basePosition?.y ?? 0) + (on ? 0.18 : 0),
      duration: on ? 0.5 : 0.6,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }
}
