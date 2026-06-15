import * as THREE from 'three'
import gsap from 'gsap'
import { TIMING, HOME, FOCUS } from '../config.js'

/**
 * Orchestrates the camera and the signature "levitate + zoom" on select.
 *
 *  enterDirect() starts browsing immediately (the hero IS the live room).
 *  focus(i)      lifts and frames the instrument, then either offers a mode
 *                choice (piano) or launches its player straight away.
 *  launch(i,m)   fades out and opens the instrument's player in the chosen mode.
 *  release()     reverses back to browsing (Back, or instruments with no player).
 *  update()      applies the live levitation transform each frame.
 */
export default class FocusController {
  constructor(experience) {
    this.experience = experience
    this.camera = experience.camera
    this.overlay = experience.overlay

    this.focused = null
    this.lift = 0 // 0..1 levitation amount (tweened)
    this.spin = 0 // accumulated rotation while lifted

    // honour reduced-motion, and keep honouring it if the user toggles it live
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    this.reduced = mq.matches
    mq.addEventListener('change', (e) => (this.reduced = e.matches))
  }

  dur(seconds) {
    return this.reduced ? 0 : seconds
  }

  /** Hold a wide cinematic pose behind the "Harmonic" landing hero (camera drifts in Camera.update). */
  standby() {
    this.camera.base.set(0.3, 2.2, 10.6)
    this.camera.target.set(0.3, 1.1, 0)
    this.overlay.showLanding()
  }

  /** Landing CTA: fly cinematically from the standby pose into the room, then hand over control. */
  enter() {
    if (this.experience.state !== 'intro') return
    this.experience.state = 'entering'
    this.overlay.hideLanding()
    gsap.to(this.camera.base, { ...HOME.base, duration: this.dur(TIMING.intro), ease: 'power2.inOut' })
    gsap.to(this.camera.target, {
      ...HOME.target,
      duration: this.dur(TIMING.intro),
      ease: 'power2.inOut',
      onComplete: () => {
        this.experience.state = 'browsing'
        this.experience.picker.setEnabled(true)
        this.overlay.showHint()
      },
    })
  }

  /** Drop straight into browsing (used when returning from a player via ?studio). */
  enterDirect() {
    this.camera.base.set(HOME.base.x, HOME.base.y, HOME.base.z)
    this.camera.target.set(HOME.target.x, HOME.target.y, HOME.target.z)
    this.experience.state = 'browsing'
    this.experience.picker.setEnabled(true)
    this.overlay.showHint()
  }

  focus(instrument) {
    if (this.experience.state !== 'browsing') return
    this.experience.state = 'focusing'
    this.focused = instrument

    this.experience.picker.setEnabled(false)
    gsap.killTweensOf(instrument.group.position) // hand vertical control to update()
    this.overlay.hideHint()

    const { camPos, target } = this.framing(instrument)
    const tl = gsap.timeline({
      onComplete: () => {
        if (instrument.learn) {
          // piano: let the player pick Composer or Music Learning
          this.overlay.showModeChoice(instrument)
        } else if (instrument.player) {
          this.launch(instrument, 'composer') // others go straight to free play
        } else {
          this.overlay.toast('Live jam, coming soon')
          this.release()
        }
      },
    })
    const d = this.dur(TIMING.focus)
    tl.to(this.camera.base, { ...camPos, duration: d, ease: 'power3.inOut' }, 0)
    tl.to(this.camera.target, { ...target, duration: d, ease: 'power3.inOut' }, 0)
    tl.to(this, { lift: 1, duration: d * 0.92, ease: 'power2.out' }, 0.08)
  }

  /** Fade out and open the instrument's live camera player in the chosen mode. */
  launch(instrument, mode) {
    if (!instrument || !instrument.player) return
    const composer = mode === 'composer' && instrument.id === 'piano'
    const url = `/${instrument.player}?from=studio${composer ? '&mode=composer' : ''}`
    this.overlay.hideModeChoice()
    this.overlay.fadeOut(() => {
      window.location.href = url
    })
  }

  release() {
    if (!this.focused) return
    this.experience.state = 'releasing'
    this.overlay.hideModeChoice()

    const tl = gsap.timeline({
      onComplete: () => {
        this.focused = null
        this.experience.state = 'browsing'
        this.experience.picker.setEnabled(true)
        this.overlay.showHint()
      },
    })
    const d = this.dur(TIMING.release)
    tl.to(this.camera.base, { ...HOME.base, duration: d, ease: 'power3.inOut' }, 0)
    tl.to(this.camera.target, { ...HOME.target, duration: d, ease: 'power3.inOut' }, 0)
    tl.to(this, { lift: 0, duration: d * 0.8, ease: 'power2.in' }, 0)
    tl.to(this, { spin: 0, duration: d, ease: 'power3.inOut' }, 0) // ease rotation home
  }

  /** Keep the focused instrument framed when the viewport aspect changes. */
  reframe() {
    if (!this.focused) return
    const { camPos, target } = this.framing(this.focused)
    this.camera.base.set(camPos.x, camPos.y, camPos.z)
    this.camera.target.set(target.x, target.y, target.z)
  }

  /** Camera position + look-at that frames the instrument's bounding sphere. */
  framing(instrument) {
    const c = instrument.basePosition
    const centerY = this.liftHeight(instrument) + instrument.size.y * 0.5
    const s = instrument.size
    const radius = 0.5 * Math.hypot(s.x, s.y, s.z)
    const vFov = THREE.MathUtils.degToRad(this.camera.instance.fov)
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.instance.aspect)
    const distance = radius / Math.sin(Math.min(vFov, hFov) / 2) + FOCUS.framePad
    return {
      camPos: { x: c.x, y: centerY + s.y * 0.12, z: c.z + distance },
      target: { x: c.x, y: centerY, z: c.z },
    }
  }

  liftHeight(instrument) {
    // taller things float a touch higher so they clear the floor cleanly
    return FOCUS.liftBase + instrument.size.y * FOCUS.liftPerHeight
  }

  update() {
    const instrument = this.focused
    if (!instrument) return

    const { elapsed, delta } = this.experience.time
    // spin while engaging; release() eases `spin` back to 0 itself.
    if (!this.reduced && this.experience.state === 'focusing') {
      this.spin += delta * FOCUS.spinRate * this.lift
    }
    const bob = this.reduced ? 0 : Math.sin(elapsed * FOCUS.bobFreq) * FOCUS.bobAmp * this.lift

    instrument.group.position.y =
      instrument.basePosition.y + this.lift * this.liftHeight(instrument) + bob
    instrument.group.rotation.y = instrument.baseRotationY + this.spin
  }
}
