import * as THREE from 'three'
import Instrument from './Instrument.js'
import { gloss, metal, paint, matte } from '../materials.js'

/**
 * Electric bass guitar standing upright in a black tubular A-frame stand.
 * Faces +Z, rests on the floor (y ~ 0), centred in X/Z.
 *
 * Built mostly along the +Y axis then leaned slightly back (about -X rotation of
 * the bass-only sub-group) so it rests into the stand's yoke. The stand is built
 * in world space so its feet sit on the floor.
 */
export default class Bass extends Instrument {
  build() {
    // ---- shared materials (glossy red body, maple neck, chrome) ----
    const bodyMat = gloss(this.accent) // glossy red hero body
    const maple = paint('#c89b5a', { rough: 0.5 }) // neck / headstock
    const rosewood = paint('#2a1810', { rough: 0.55 }) // fretboard
    const chrome = metal('#d8dce2', { rough: 0.16 }) // tuners / frets / bridge
    const darkMetal = metal('#1a1c20', { rough: 0.4 }) // pickup covers
    const black = paint('#0e0f11', { rough: 0.5 }) // stand tubing
    const rubber = matte('#141414') // stand feet
    const ivory = paint('#e9e4d6', { rough: 0.4 }) // nut + inlay dots
    const stringMat = metal('#cfd3d8', { rough: 0.2 }) // strings

    this.parts = []

    // =======================================================================
    // BASS GUITAR  (built in its own sub-group so we can lean it as one unit)
    // =======================================================================
    const guitar = new THREE.Group()

    // ---- body: offset double-cutaway silhouette via THREE.Shape ----------
    const s = new THREE.Shape()
    // Trace a smooth offset double-cutaway outline (units roughly centred).
    s.moveTo(0.0, 0.34) // top, between horns
    s.bezierCurveTo(0.06, 0.40, 0.20, 0.40, 0.26, 0.30) // upper-bass horn out
    s.bezierCurveTo(0.30, 0.24, 0.24, 0.20, 0.22, 0.14) // cutaway notch
    s.bezierCurveTo(0.34, 0.10, 0.40, -0.04, 0.36, -0.20) // lower bout right
    s.bezierCurveTo(0.32, -0.34, 0.18, -0.42, 0.0, -0.42) // bottom right
    s.bezierCurveTo(-0.18, -0.42, -0.32, -0.34, -0.36, -0.20) // bottom left
    s.bezierCurveTo(-0.40, -0.04, -0.34, 0.10, -0.22, 0.14) // lower bout left
    s.bezierCurveTo(-0.24, 0.20, -0.30, 0.24, -0.26, 0.30) // treble cutaway
    s.bezierCurveTo(-0.20, 0.40, -0.06, 0.40, 0.0, 0.34) // upper-treble horn back

    const bodyGeo = new THREE.ExtrudeGeometry(s, {
      depth: 0.13,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 2,
      steps: 1,
      curveSegments: 14,
    })
    bodyGeo.center() // centre on origin, then we re-place
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    // Shape lies in XY plane, extruded along +Z, perfect: face toward +Z.
    // Body centre will sit at a chosen height; scale up slightly.
    const bodyScale = 1.18
    body.scale.set(bodyScale, bodyScale, 1)
    const bodyCY = 0.62 // body centre height before lean
    body.position.set(0, bodyCY, 0)
    guitar.add(body)

    // approx body extents after scale
    const bodyTopY = bodyCY + 0.34 * bodyScale
    const bodyHalfDepth = 0.065 + 0.025 // half-depth + bevel
    const faceZ = bodyHalfDepth // front face of body (+Z)

    // ---- neck (maple) rising from the body --------------------------------
    const neckLen = 0.92
    const neckBaseY = bodyTopY - 0.06
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.085, neckLen, 0.05), maple)
    const neckCY = neckBaseY + neckLen / 2
    neck.position.set(0, neckCY, faceZ - 0.045)
    guitar.add(neck)

    // ---- fretboard (dark) on the front of the neck ------------------------
    const fbLen = neckLen + 0.02
    const fretboard = new THREE.Mesh(new THREE.BoxGeometry(0.078, fbLen, 0.016), rosewood)
    const fbZ = faceZ - 0.045 + 0.033
    fretboard.position.set(0, neckCY, fbZ)
    guitar.add(fretboard)

    // ---- frets (thin chrome boxes) + dot inlays ---------------------------
    const fbBottom = neckCY - fbLen / 2
    const fretCount = 9
    for (let i = 1; i <= fretCount; i++) {
      const t = i / (fretCount + 1)
      const y = fbBottom + t * fbLen
      const fret = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.006, 0.02), chrome)
      fret.position.set(0, y, fbZ + 0.006)
      guitar.add(fret)
    }
    // dot inlays at a few positions
    const dotGeo = new THREE.CircleGeometry(0.009, 10)
    ;[3, 5, 7].forEach((i) => {
      const t = (i + 0.5) / (fretCount + 1)
      const y = fbBottom + t * fbLen
      const dot = new THREE.Mesh(dotGeo, ivory)
      dot.position.set(0, y, fbZ + 0.0095)
      guitar.add(dot)
    })

    // ---- headstock: short straight section + angled-back head ------------
    const headBaseY = neckCY + neckLen / 2
    // small transition block
    const nut = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.02, 0.03), ivory)
    nut.position.set(0, headBaseY, fbZ - 0.002)
    guitar.add(nut)

    const headstock = new THREE.Group()
    const headLen = 0.3
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.12, headLen, 0.04), maple)
    head.position.set(0, headLen / 2, 0)
    headstock.add(head)

    // 4 tuning pegs (2x2), posts + chrome buttons, on the back/side
    const pegPositions = [
      [-0.045, 0.09],
      [-0.045, 0.2],
      [0.045, 0.09],
      [0.045, 0.2],
    ]
    pegPositions.forEach(([px, py]) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 10), chrome)
      post.rotation.z = Math.PI / 2
      post.position.set(px, py, 0.018)
      headstock.add(post)
      const button = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.018, 12), chrome)
      button.rotation.z = Math.PI / 2
      button.position.set(px + (px < 0 ? -0.04 : 0.04), py, 0.018)
      headstock.add(button)
    })

    // place + angle the headstock back (negative tilt about X so top goes -Z)
    headstock.position.set(0, headBaseY, fbZ - 0.01)
    headstock.rotation.x = 0.32
    guitar.add(headstock)

    // ---- pickups (two dark blocks on the body face) ----------------------
    const pickupGeo = new THREE.BoxGeometry(0.16, 0.05, 0.025)
    const pickupNeck = new THREE.Mesh(pickupGeo, darkMetal)
    pickupNeck.position.set(0, bodyCY + 0.12, faceZ + 0.005)
    guitar.add(pickupNeck)
    const pickupBridge = new THREE.Mesh(pickupGeo, darkMetal)
    pickupBridge.position.set(0, bodyCY - 0.04, faceZ + 0.005)
    guitar.add(pickupBridge)

    // ---- bridge (chrome plate + saddles) ---------------------------------
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.03), chrome)
    const bridgeY = bodyCY - 0.18
    bridge.position.set(0, bridgeY, faceZ + 0.008)
    guitar.add(bridge)

    // ---- two control knobs (chrome) --------------------------------------
    const knobGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.03, 14)
    ;[-0.16, -0.09].forEach((kx, i) => {
      const knob = new THREE.Mesh(knobGeo, chrome)
      knob.rotation.x = Math.PI / 2
      knob.position.set(kx, bodyCY - 0.16 + i * 0.03, faceZ + 0.012)
      guitar.add(knob)
    })

    // ---- 4 strings: thin long cylinders bridge -> nut --------------------
    const stringTopY = headBaseY
    const stringBotY = bridgeY
    const stringLen = stringTopY - stringBotY
    const stringMidY = (stringTopY + stringBotY) / 2
    const stringZ = fbZ + 0.013
    const stringXs = [-0.028, -0.0095, 0.0095, 0.028]
    stringXs.forEach((sx, i) => {
      const r = 0.0022 + i * 0.0009 // E thickest -> G thinnest visual variety
      const str = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, stringLen, 6),
        stringMat.clone(),
      )
      str.position.set(sx, stringMidY, stringZ)
      guitar.add(str)
      this.parts.push(str)
    })

    // ---- lean the whole guitar slightly back into the stand --------------
    // Rotate about a pivot near the bottom of the body so the lower bout stays
    // near origin. We tilt top toward -Z (lean back).
    guitar.rotation.x = -0.12

    this.group.add(guitar)

    // =======================================================================
    // GUITAR STAND  (black tubular A-frame), built in world space
    // =======================================================================
    const tube = (len, r = 0.018) =>
      new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), black)

    // Two front A-frame legs splayed in X, plus rear support legs.
    const standTop = 1.0 // height where the yoke cradles the body
    const legLen = 1.06

    const makeFrontLeg = (sign) => {
      const leg = tube(legLen)
      // tilt outward in X and a little forward in Z
      leg.rotation.z = sign * 0.16
      leg.rotation.x = -0.14
      leg.position.set(sign * 0.16, legLen / 2 - 0.02, 0.16)
      this.group.add(leg)
      // rubber foot
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), rubber)
      foot.scale.set(1, 0.6, 1)
      foot.position.set(sign * 0.3, 0.02, 0.3)
      this.group.add(foot)
    }
    makeFrontLeg(1)
    makeFrontLeg(-1)

    // Rear single support leg (kickstand) tilting back
    const rearLeg = tube(legLen)
    rearLeg.rotation.x = 0.3
    rearLeg.position.set(0, legLen / 2 - 0.02, -0.18)
    this.group.add(rearLeg)
    const rearFoot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), rubber)
    rearFoot.scale.set(1, 0.6, 1)
    rearFoot.position.set(0, 0.02, -0.42)
    this.group.add(rearFoot)

    // Cross brace connecting front legs low down
    const brace = tube(0.5, 0.014)
    brace.rotation.z = Math.PI / 2
    brace.position.set(0, 0.22, 0.22)
    this.group.add(brace)

    // Yoke uprights that rise to cradle the body sides
    const makeYokeArm = (sign) => {
      const arm = tube(0.34, 0.015)
      arm.rotation.x = -0.12
      arm.position.set(sign * 0.13, standTop - 0.1, 0.1)
      this.group.add(arm)
      // cradle cup (rubber) at the top to hold the body edge
      const cup = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.014, 8, 14), rubber)
      cup.rotation.y = Math.PI / 2
      cup.rotation.x = 0.3
      cup.position.set(sign * 0.16, standTop + 0.04, 0.02)
      this.group.add(cup)
    }
    makeYokeArm(1)
    makeYokeArm(-1)

    // Lower neck rest hook on the rear leg (small angled tube near top)
    const neckHook = tube(0.16, 0.013)
    neckHook.rotation.x = 0.35
    neckHook.position.set(0, standTop + 0.05, -0.04)
    this.group.add(neckHook)
  }

  update(elapsed) {
    if (!this.parts) return
    // subtle string shimmer: a tiny x-scale vibration (no glow)
    for (let i = 0; i < this.parts.length; i++) {
      const str = this.parts[i]
      const phase = elapsed * 7 + i * 1.4
      str.scale.x = 1 + Math.sin(phase * 2.3) * 0.06
    }
  }
}
