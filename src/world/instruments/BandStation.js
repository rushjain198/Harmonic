import * as THREE from 'three'
import Instrument from './Instrument.js'
import { gloss, metal, glow, paint } from '../materials.js'

/**
 * "BAND MODE" ensemble station: a dark circular stage riser with an accent-emissive
 * rim light, a chrome vocal mic rising from the centre, a glowing holographic halo
 * ring above, and three floating emblems (guitar pick, piano-key tile, crossed
 * drumsticks) that orbit and bob. Centred on origin, mic facing +Z.
 */
export default class BandStation extends Instrument {
  build() {
    // ---- shared materials (dark glossy riser, glowing purple rings) ----
    const stageDark = gloss('#171320') // dark glossy riser body
    const stageTop = gloss('#221a30') // glossier inset deck
    const chrome = metal('#d8dce2', { rough: 0.16 }) // mic pole / boom
    const darkChrome = metal('#3a3742', { rough: 0.3 }) // base / mic body
    const accentGlow = glow(this.accent, 1.3) // purple inlay detail

    // ---- STAGE RISER (low circular, dark) ----
    const riserBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.92, 1.0, 0.22, 48),
      stageDark,
    )
    riserBody.position.y = 0.11
    this.group.add(riserBody)

    // glossy inset top deck
    const riserTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.86, 0.86, 0.04, 48),
      stageTop,
    )
    riserTop.position.y = 0.235
    this.group.add(riserTop)

    // accent-emissive RIM LIGHT around the edge (thin glowing torus)
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.94, 0.025, 8, 48),
      glow(this.accent, 1.5),
    )
    rim.rotation.x = Math.PI / 2
    rim.position.y = 0.2
    this.group.add(rim)

    // subtle inner glow ring inlaid on the deck
    const deckGlow = new THREE.Mesh(
      new THREE.TorusGeometry(0.66, 0.014, 5, 36),
      accentGlow,
    )
    deckGlow.rotation.x = Math.PI / 2
    deckGlow.position.y = 0.257
    this.group.add(deckGlow)

    // small base feet for grounding (three pads)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 6
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.08, 0.04, 12),
        darkChrome,
      )
      foot.position.set(Math.cos(a) * 0.78, 0.02, Math.sin(a) * 0.78)
      this.group.add(foot)
    }

    // ---- VOCAL MICROPHONE on slim chrome stand ----
    // tripod-style base disc
    const micBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.05, 24),
      darkChrome,
    )
    micBase.position.y = 0.27
    this.group.add(micBase)

    // main vertical pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.028, 1.18, 16),
      chrome,
    )
    pole.position.y = 0.27 + 0.59
    this.group.add(pole)

    // pole collar joint
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16),
      chrome,
    )
    collar.position.y = 0.85
    this.group.add(collar)

    // short boom arm angling the mic toward +Z (camera)
    const boom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.34, 14),
      chrome,
    )
    boom.position.set(0, 1.46, 0.12)
    boom.rotation.x = Math.PI / 5
    this.group.add(boom)

    // mic clip body
    const micBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.045, 0.18, 18),
      darkChrome,
    )
    micBody.position.set(0, 1.52, 0.26)
    micBody.rotation.x = Math.PI / 5
    this.group.add(micBody)

    // mic head (mesh grille), slightly glossy, faces +Z/up
    const micHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 16, 12),
      metal('#4a4752', { rough: 0.4 }),
    )
    micHead.scale.set(1, 1.08, 1)
    micHead.position.set(0, 1.6, 0.34)
    this.group.add(micHead)

    // accent ring band on mic body
    const micBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.05, 0.01, 8, 18),
      accentGlow,
    )
    micBand.position.set(0, 1.485, 0.235)
    micBand.rotation.x = Math.PI / 5 + Math.PI / 2
    this.group.add(micBand)

    // ---- HOLOGRAPHIC HALO RING (emissive, hovering above the riser) ----
    this.ringBase = 1.02
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.045, 12, 48),
      glow(this.accent, 1.5),
    )
    this.ring.rotation.x = Math.PI / 2
    this.ring.position.y = this.ringBase
    this.group.add(this.ring)

    // a thinner secondary halo for depth
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.012, 5, 40),
      accentGlow,
    )
    ring2.rotation.x = Math.PI / 2
    ring2.position.y = this.ringBase
    this.group.add(ring2)

    // ---- THREE FLOATING EMBLEMS (orbit above the riser) ----
    this.orbitY = 1.0
    this.orbitR = 0.46
    this.emblems = []

    const pick = this._makePick()
    const keyTile = this._makeKeyTile()
    const sticks = this._makeDrumsticks()

    this.emblems.push(pick, keyTile, sticks)
    for (const e of this.emblems) this.group.add(e)

    // initial placement around the orbit
    this._positionEmblems(0)
  }

  // --- guitar PICK: rounded triangle, red-ish ---
  _makePick() {
    const red = gloss('#e5484d')
    const shape = new THREE.Shape()
    const w = 0.13
    const h = 0.16
    shape.moveTo(0, h * 0.6)
    shape.quadraticCurveTo(w, h * 0.35, w * 0.7, -h * 0.55)
    shape.quadraticCurveTo(0, -h * 0.78, -w * 0.7, -h * 0.55)
    shape.quadraticCurveTo(-w, h * 0.35, 0, h * 0.6)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
      curveSegments: 10,
    })
    geo.center()
    const mesh = new THREE.Mesh(geo, red)
    const g = new THREE.Group()
    g.add(mesh)
    return g
  }

  // --- mini PIANO-KEY tile: white slab + black accidental, amber glow ---
  _makeKeyTile() {
    const white = paint('#f6f1e8', { rough: 0.4 })
    const black = gloss('#15110d')
    const g = new THREE.Group()

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.05, 0.13),
      white,
    )
    g.add(slab)

    // two black keys sitting on top
    for (const dx of [-0.045, 0.045]) {
      const bk = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.07), black)
      bk.position.set(dx, 0.04, -0.025)
      g.add(bk)
    }
    return g
  }

  // --- crossed DRUMSTICKS, blue-ish tips ---
  _makeDrumsticks() {
    const wood = paint('#caa46a', { rough: 0.5 })
    const blueTip = gloss('#2e90d9')
    const g = new THREE.Group()

    const makeStick = (rot) => {
      const s = new THREE.Group()
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.016, 0.3, 10),
        wood,
      )
      shaft.rotation.z = Math.PI / 2
      s.add(shaft)
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), blueTip)
      tip.position.x = 0.155
      s.add(tip)
      s.rotation.z = rot
      return s
    }
    g.add(makeStick(Math.PI / 5))
    g.add(makeStick(-Math.PI / 5))
    return g
  }

  _positionEmblems(elapsed) {
    const n = this.emblems.length
    for (let i = 0; i < n; i++) {
      const e = this.emblems[i]
      const a = (i / n) * Math.PI * 2 + elapsed * 0.5
      e.position.set(
        Math.cos(a) * this.orbitR,
        this.orbitY + Math.sin(elapsed * 1.6 + i * 2.1) * 0.05,
        Math.sin(a) * this.orbitR,
      )
      // gentle self-spin so emblems present their faces
      e.rotation.y = elapsed * 0.6 + i * 1.3
    }
  }

  update(elapsed) {
    // pulse halo ring emissive + slight vertical bob
    if (this.ring) {
      const pulse = 1.5 + Math.sin(elapsed * 2.0) * 0.4
      this.ring.material.emissiveIntensity = pulse
      this.ring.position.y = this.ringBase + Math.sin(elapsed * 1.4) * 0.03
    }
    // orbit + bob the emblems
    if (this.emblems) this._positionEmblems(elapsed)
  }
}
