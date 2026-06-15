import * as THREE from 'three'

/**
 * A driven camera (no OrbitControls). The FocusController tweens `base` and
 * `target`; this class only applies them, plus a gentle pointer parallax while
 * the user is browsing so the room feels alive.
 */
export default class Camera {
  constructor(experience) {
    this.experience = experience
    this.sizes = experience.sizes
    this.scene = experience.scene

    this.base = new THREE.Vector3(0, 3.6, 11) // framing position, owned by FocusController
    this.target = new THREE.Vector3(0, 1.1, 0) // look-at point

    this.instance = new THREE.PerspectiveCamera(
      48,
      this.sizes.width / this.sizes.height,
      0.1,
      100,
    )
    this.instance.position.copy(this.base)
    this.scene.add(this.instance)
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height
    this.instance.updateProjectionMatrix()
  }

  update() {
    let px = 0
    let py = 0
    const browsing = this.experience.state === 'browsing'
    const intro = this.experience.state === 'intro'
    if (browsing) {
      // gentle pointer parallax while exploring
      px = this.experience.pointer.x * 0.35
      py = this.experience.pointer.y * 0.2
    } else if (intro) {
      // slow cinematic drift behind the landing hero
      const t = this.experience.time.elapsed
      px = Math.sin(t * 0.16) * 0.35
      py = Math.cos(t * 0.12) * 0.1
    }
    // On narrow / portrait screens, dolly back so the whole ensemble stays in
    // frame. Only while browsing/intro, focus() does its own aspect framing.
    let z = this.base.z
    if (browsing || intro) {
      const hHalf = Math.tan(THREE.MathUtils.degToRad(this.instance.fov) / 2) * this.instance.aspect
      z = Math.max(z, 5.2 / hHalf) // distance that keeps ±5.2 units of width visible
    }
    this.instance.position.set(this.base.x + px, this.base.y + py, z)
    this.instance.lookAt(this.target)
  }
}
