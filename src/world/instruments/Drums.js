import * as THREE from 'three'
import Instrument from './Instrument.js'
import { gloss, metal, paint } from '../materials.js'

/**
 * A full drum kit. Drummer's side faces +Z (toward the camera).
 * Glossy sky-blue shells, off-white heads, chrome hardware, gold cymbals.
 */
export default class Drums extends Instrument {
  build() {
    // ---- shared materials (glossy blue kit, chrome + gold) ----
    const shell = gloss(this.accent) // glossy blue shells
    const head = paint('#f4f1e8', { rough: 0.5 }) // coated off-white heads
    const accentMat = gloss('#13294d') // deep-navy logo ring on the kick head
    const chrome = metal('#d8dce2', { rough: 0.16 }) // bright chrome hardware
    const darkChrome = metal('#8a929c', { rough: 0.32 }) // gunmetal hubs / feet
    const brass = metal('#c9a24a', { rough: 0.3 }) // gold cymbals
    const wood = paint('#c9a36a', { rough: 0.5 }) // hickory sticks

    this.parts = []
    this.cymbals = []

    // ----------------------------------------------------------------------
    // Helper: a drum shell (lying so its heads face +Z / -Z) with chrome rims
    // and tension lugs. Returns the group, positioned by caller.
    //   radius     - shell radius
    //   depth      - shell depth (axis runs along Z)
    //   lugs       - number of tension lugs around each rim
    //   frontLogo  - if true, draw an accent ring "logo" on the +Z head
    // ----------------------------------------------------------------------
    const makeDrum = (radius, depth, lugs, frontLogo = false) => {
      const g = new THREE.Group()
      const halfD = depth / 2

      // Shell (axis along Y by default; rotate so axis runs Z)
      const shellMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, depth, 24, 1, true),
        shell
      )
      shellMesh.rotation.x = Math.PI / 2
      g.add(shellMesh)

      // Heads (slightly inset, capping the shell)
      const headGeo = new THREE.CircleGeometry(radius * 0.985, 24)
      const headFront = new THREE.Mesh(headGeo, head)
      headFront.position.z = halfD
      g.add(headFront)
      const headBack = new THREE.Mesh(headGeo, head)
      headBack.position.z = -halfD
      headBack.rotation.y = Math.PI
      g.add(headBack)

      // Chrome counter-hoops (rims) at each end
      const rimGeo = new THREE.TorusGeometry(radius * 1.0, radius * 0.045, 6, 18)
      const rimF = new THREE.Mesh(rimGeo, chrome)
      rimF.position.z = halfD
      g.add(rimF)
      const rimB = new THREE.Mesh(rimGeo, chrome)
      rimB.position.z = -halfD
      g.add(rimB)

      // Tension lugs around the shell (small chrome boxes near each rim)
      const lugGeo = new THREE.BoxGeometry(radius * 0.09, radius * 0.22, depth * 0.55)
      for (let i = 0; i < lugs; i++) {
        const a = (i / lugs) * Math.PI * 2
        const lug = new THREE.Mesh(lugGeo, chrome)
        lug.position.set(Math.cos(a) * radius * 1.01, Math.sin(a) * radius * 1.01, 0)
        lug.rotation.z = a + Math.PI / 2
        g.add(lug)
      }

      // Accent ring "logo" on the front head
      if (frontLogo) {
        const logo = new THREE.Mesh(
          new THREE.TorusGeometry(radius * 0.4, radius * 0.022, 6, 22),
          accentMat
        )
        logo.position.z = halfD + 0.004
        g.add(logo)
        const dot = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * 0.06, radius * 0.06, 0.006, 16),
          accentMat
        )
        dot.rotation.x = Math.PI / 2
        dot.position.z = halfD + 0.004
        g.add(dot)
      }

      return g
    }

    // ----------------------------------------------------------------------
    // Helper: a thin chrome stand. Three splayed legs + a vertical post.
    // Origin at floor; post rises to `height`. Returns top Y for mounting.
    // ----------------------------------------------------------------------
    const makeStand = (x, z, height, postR = 0.018) => {
      const g = new THREE.Group()
      g.position.set(x, 0, z)

      // Tripod legs
      const legGeo = new THREE.CylinderGeometry(0.012, 0.012, height * 0.52, 8)
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6
        const leg = new THREE.Mesh(legGeo, chrome)
        const spread = 0.16
        leg.position.set(Math.cos(a) * spread * 0.5, height * 0.18, Math.sin(a) * spread * 0.5)
        leg.rotation.z = Math.cos(a) * 0.5
        leg.rotation.x = -Math.sin(a) * 0.5
        g.add(leg)
      }

      // Hub where legs meet
      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.05, 10),
        darkChrome
      )
      hub.position.y = height * 0.33
      g.add(hub)

      // Vertical post
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(postR, postR, height, 10),
        chrome
      )
      post.position.y = height / 2
      g.add(post)

      this.group.add(g)
      return { group: g, x, z, top: height }
    }

    // ----------------------------------------------------------------------
    // Helper: a tilted cymbal on a stand. Stored for animation.
    // ----------------------------------------------------------------------
    const makeCymbal = (x, z, height, radius, tilt = 0.12, mat = brass) => {
      makeStand(x, z, height, 0.014)

      // Pivot group at the top so we can rock it about its mount
      const pivot = new THREE.Group()
      pivot.position.set(x, height, z)
      pivot.rotation.z = tilt

      // Slightly domed cymbal: thin cone-ish disc + bell
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 0.18, 0.012, 24),
        mat
      )
      disc.position.y = 0.01
      pivot.add(disc)
      const bell = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        mat
      )
      bell.position.y = 0.018
      pivot.add(bell)

      // Wing nut / felt on top
      const nut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.03, 8),
        darkChrome
      )
      nut.position.y = 0.04
      pivot.add(nut)

      this.group.add(pivot)
      this.cymbals.push({ mesh: pivot, baseTilt: tilt, phase: Math.random() * Math.PI * 2 })
      return pivot
    }

    // ======================================================================
    // BASS / KICK DRUM, lying on its side, front head facing +Z.
    // Radius 0.55, depth 0.55. Sits on the floor.
    // ======================================================================
    const kickR = 0.55
    const kickD = 0.55
    const kick = makeDrum(kickR, kickD, 8, true)
    kick.position.set(0, kickR, 0)
    // front head at +Z: shell axis already along Z, so head is at +halfD. Good.
    this.group.add(kick)

    // Spurs / legs at the front to keep it from rolling
    const spurGeo = new THREE.CylinderGeometry(0.015, 0.01, 0.34, 8)
    for (const sx of [-1, 1]) {
      const spur = new THREE.Mesh(spurGeo, chrome)
      spur.position.set(sx * kickR * 0.7, kickR - 0.42, kickD * 0.5 - 0.05)
      spur.rotation.x = -0.5
      spur.rotation.z = sx * 0.4
      this.group.add(spur)
      // rubber foot
      const foot = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 8, 6),
        darkChrome
      )
      foot.position.set(sx * kickR * 0.82, 0.025, kickD * 0.5 + 0.06)
      this.group.add(foot)
    }

    // Kick pedal at the front-bottom of the bass drum
    const pedalBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.02, 0.22),
      darkChrome
    )
    pedalBase.position.set(0, 0.012, kickD * 0.5 + 0.16)
    this.group.add(pedalBase)
    const pedalPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.015, 0.16),
      chrome
    )
    pedalPlate.position.set(0, 0.04, kickD * 0.5 + 0.13)
    pedalPlate.rotation.x = 0.35
    this.group.add(pedalPlate)
    const pedalPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8),
      chrome
    )
    pedalPost.position.set(0, 0.2, kickD * 0.5 + 0.04)
    this.group.add(pedalPost)
    const beater = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 10, 8),
      darkChrome
    )
    beater.position.set(0, 0.4, kickD * 0.5 - 0.02)
    this.group.add(beater)

    // ======================================================================
    // RACK TOMS, two, mounted on top of the kick via a small post.
    // Standard tom: heads face up (axis along Y). Slightly tilted toward +Z.
    // ======================================================================
    // Mounting post rising from the top of the kick
    const mountPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.3, 10),
      chrome
    )
    mountPost.position.set(0, kickR + kickR + 0.05, -0.05)
    this.group.add(mountPost)

    // Build a top-mounted tom (axis along Y, tilted forward toward +Z)
    const makeTom = (radius, depth, x, y, z, tilt) => {
      const g = makeDrum(radius, depth, 6, false)
      // Reorient: makeDrum lays the drum with axis along Z. For a rack tom we
      // want axis along Y, so rotate the whole drum group +90° about X.
      g.rotation.x = -Math.PI / 2
      const wrap = new THREE.Group()
      wrap.add(g)
      wrap.position.set(x, y, z)
      wrap.rotation.x = tilt // forward tilt toward +Z
      this.group.add(wrap)
      return wrap
    }

    const tomTopY = kickR + kickR + 0.18
    makeTom(0.2, 0.22, -0.24, tomTopY, 0.02, 0.32)
    makeTom(0.24, 0.26, 0.16, tomTopY + 0.02, 0.0, 0.26)

    // ======================================================================
    // FLOOR TOM, to the right, standing on three legs.
    // ======================================================================
    const ftR = 0.32
    const ftD = 0.4
    const ftX = 0.95
    const ftZ = 0.35
    const floorTom = makeDrum(ftR, ftD, 6, false)
    floorTom.rotation.x = -Math.PI / 2 // axis along Y
    const ftWrap = new THREE.Group()
    ftWrap.add(floorTom)
    const ftCenterY = 0.62
    ftWrap.position.set(ftX, ftCenterY, ftZ)
    this.group.add(ftWrap)
    // three legs
    const ftLegGeo = new THREE.CylinderGeometry(0.013, 0.013, ftCenterY + 0.05, 8)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 4
      const leg = new THREE.Mesh(ftLegGeo, chrome)
      leg.position.set(
        ftX + Math.cos(a) * ftR * 0.85,
        (ftCenterY) / 2,
        ftZ + Math.sin(a) * ftR * 0.85
      )
      leg.rotation.z = -Math.cos(a) * 0.14
      leg.rotation.x = Math.sin(a) * 0.14
      this.group.add(leg)
    }

    // ======================================================================
    // SNARE DRUM, on a tripod, slightly left and toward +Z.
    // ======================================================================
    const snareR = 0.24
    const snareD = 0.18
    const snareX = -0.52
    const snareZ = 0.42
    const snareY = 0.66
    const snare = makeDrum(snareR, snareD, 8, false)
    snare.rotation.x = -Math.PI / 2 // axis along Y
    const snareWrap = new THREE.Group()
    snareWrap.add(snare)
    snareWrap.position.set(snareX, snareY, snareZ)
    snareWrap.rotation.x = 0.06
    this.group.add(snareWrap)
    // snare wires band on the side
    const snareBand = new THREE.Mesh(
      new THREE.TorusGeometry(snareR * 1.0, snareR * 0.04, 6, 20),
      darkChrome
    )
    snareBand.position.set(snareX, snareY - snareD * 0.35, snareZ)
    this.group.add(snareBand)
    // snare stand
    makeStand(snareX, snareZ, snareY - snareR + 0.02, 0.016)

    // Drumsticks resting across the snare
    const stickGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.42, 8)
    for (let i = 0; i < 2; i++) {
      const stick = new THREE.Mesh(stickGeo, wood)
      stick.position.set(snareX + (i === 0 ? -0.03 : 0.03), snareY + snareR * 0.6 + 0.03, snareZ + 0.04)
      stick.rotation.z = Math.PI / 2
      stick.rotation.y = (i === 0 ? 0.12 : -0.12)
      this.group.add(stick)
      // tip
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), wood)
      tip.position.set(
        snareX + (i === 0 ? -0.03 : 0.03) + (i === 0 ? 0.22 : 0.21),
        snareY + snareR * 0.6 + 0.03,
        snareZ + 0.04 + (i === 0 ? 0.025 : -0.025)
      )
      this.group.add(tip)
    }

    // ======================================================================
    // CYMBALS, hi-hat (two stacked) left, crash high left, ride right.
    // Gold/brass, tilted, on thin chrome stands. Stored for animation.
    // ======================================================================
    // Hi-hat: stand with two stacked cymbals (left, toward +Z)
    const hhX = -0.95
    const hhZ = 0.2
    const hhH = 0.82
    makeStand(hhX, hhZ, hhH, 0.015)
    const hhBottom = new THREE.Group()
    hhBottom.position.set(hhX, hhH, hhZ)
    const hhBotDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.24, 0.012, 24),
      brass
    )
    hhBottom.add(hhBotDisc)
    this.group.add(hhBottom)
    const hhTop = new THREE.Group()
    hhTop.position.set(hhX, hhH + 0.05, hhZ)
    const hhTopDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.18, 0.012, 24),
      brass
    )
    hhTop.add(hhTopDisc)
    const hhBell = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      brass
    )
    hhBell.position.y = 0.012
    hhTop.add(hhBell)
    this.group.add(hhTop)
    this.cymbals.push({ mesh: hhTop, baseTilt: 0, phase: 0.6, vertical: true, baseY: hhH + 0.05 })

    // Crash, high on the left
    makeCymbal(-0.7, -0.3, 1.34, 0.34, 0.16)
    // Ride, to the right, a touch lower and larger
    makeCymbal(0.78, -0.45, 1.18, 0.4, 0.1)
  }

  update(elapsed) {
    if (!this.cymbals) return
    for (const c of this.cymbals) {
      if (c.vertical) {
        // hi-hat top: tiny vertical shimmer
        c.mesh.position.y = c.baseY + Math.sin(elapsed * 2.2 + c.phase) * 0.006
      } else {
        // tilted cymbals: gentle rock about the mount
        const s = Math.sin(elapsed * 1.6 + c.phase) * 0.04
        c.mesh.rotation.z = c.baseTilt + s
        c.mesh.rotation.x = Math.cos(elapsed * 1.3 + c.phase) * 0.025
      }
    }
  }
}
