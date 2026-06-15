import * as THREE from 'three'
import Sizes from './core/Sizes.js'
import Time from './core/Time.js'
import Camera from './core/Camera.js'
import Renderer from './core/Renderer.js'
import World from './world/World.js'
import Overlay from './ui/Overlay.js'
import Picker from './interaction/Picker.js'
import FocusController from './interaction/FocusController.js'

let instance = null

/**
 * App orchestrator (singleton). Owns the scene graph, the render loop, and the
 * shared app `state` machine: intro -> entering -> browsing -> focusing -> releasing.
 */
export default class Experience {
  constructor(canvas) {
    if (instance) return instance
    instance = this
    if (import.meta.env.DEV) window.experience = this // debug handle

    this.canvas = canvas
    this.state = 'intro'
    this.pointer = new THREE.Vector2() // normalised device coords (-1..1)

    this.scene = new THREE.Scene()
    this.sizes = new Sizes()
    this.time = new Time()
    this.camera = new Camera(this)
    this.renderer = new Renderer(this)
    this.world = new World(this)
    this.overlay = new Overlay(this)
    this.picker = new Picker(this)
    this.focus = new FocusController(this)

    window.addEventListener('pointermove', (e) => {
      this.toNdc(e.clientX, e.clientY, this.pointer)
    })

    this.sizes.on('resize', () => this.resize())
    this.time.on('tick', () => this.update())

    // Returning from a player (?studio) drops straight into the room; a fresh
    // visit plays the cinematic "Harmonic" intro and flies into the room on Enter.
    if (new URLSearchParams(location.search).has('studio')) {
      this.focus.enterDirect()
    } else {
      this.focus.standby()
    }
  }

  /** Screen pixel -> normalised device coords (-1..1), into `out` (defaults to a new vec). */
  toNdc(clientX, clientY, out = new THREE.Vector2()) {
    out.x = (clientX / this.sizes.width) * 2 - 1
    out.y = -(clientY / this.sizes.height) * 2 + 1
    return out
  }

  resize() {
    this.camera.resize()
    this.renderer.resize()
    this.focus.reframe()
  }

  update() {
    if (document.hidden) return // pause the loop in a background tab to save resources
    this.camera.update()
    this.world.update()
    this.focus.update()
    this.picker.update()
    this.renderer.update()
  }
}
