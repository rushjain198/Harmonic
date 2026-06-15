import * as THREE from 'three'
import Instrument from './Instrument.js'
import { gloss, metal, paint } from '../materials.js'

/**
 * Baby grand piano. Classic curved grand silhouette extruded from a THREE.Shape:
 * a straight keyboard side (facing +Z, toward the camera) and a long curved bass
 * side sweeping back toward -Z. Glossy black lacquer case, a raised lid with an
 * cream underside held open by a thin prop stick, three tapered legs, a pedal lyre,
 * a full keyboard with the correct 2-then-3 black-key pattern, a music desk, and a
 * matching red bench in front. Centred on origin, resting on the floor.
 */
export default class Piano extends Instrument {
  build() {
    // ---- shared materials (black lacquer grand, warm amber accent) ----
    const lacquer = gloss('#0d0d10') // black wet-lacquer case + lid
    const lacquerSide = gloss('#16161a') // rim / key bed
    const frame = gloss('#0d0d10') // black legs, lyre, desk slats
    const brass = metal('#c9a24a') // gold pedals / hardware / collars
    const whiteKey = paint('#f4efe2', { rough: 0.38 }) // ivory naturals
    const blackKey = gloss('#0c0a08') // ebony accidentals
    const cream = gloss(this.accent) // amber lid underside + bench seam pop

    // ---- dimensions ----
    const caseW = 1.5          // overall width (X)
    const caseDepth = 1.55     // overall depth (Z), straight keyboard edge -> curved tail
    const caseThick = 0.34     // vertical thickness of the case body
    const legLen = 0.62        // leg length below the case
    const bodyY = legLen       // y of the underside of the case
    const caseMidY = bodyY + caseThick / 2

    // =====================================================================
    // CASE, built as a THREE.Shape in the XZ plane, extruded along Y.
    // We author the outline in (x, z), extrude in local Z, then rotate the
    // mesh so the extrusion runs up the world Y axis.
    // Keyboard edge is the straight front (z = +front), tail curves to z = -back.
    // =====================================================================
    const halfW = caseW / 2
    const front = caseDepth * 0.5     // +Z straight keyboard side
    const back = -caseDepth * 0.5     // -Z curved tail apex

    const shape = new THREE.Shape()
    // Start at front-left corner (straight keyboard edge runs along +Z front).
    shape.moveTo(-halfW, front)
    shape.lineTo(halfW, front)                         // straight keyboard edge
    // Right (bass) side sweeps gently then curves into the tail.
    shape.lineTo(halfW, front - caseDepth * 0.28)
    shape.bezierCurveTo(
      halfW, back + caseDepth * 0.18,
      halfW * 0.34, back,
      -halfW * 0.16, back,                             // rounded tail apex toward -Z
    )
    // Left (treble / spine) side: long straight-ish run back to the keyboard.
    shape.bezierCurveTo(
      -halfW * 0.62, back,
      -halfW, back + caseDepth * 0.34,
      -halfW, front - caseDepth * 0.05,
    )
    shape.lineTo(-halfW, front)

    const caseGeo = new THREE.ExtrudeGeometry(shape, {
      depth: caseThick,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 1,
      steps: 1,
      curveSegments: 18,
    })
    // Extrusion is along +Z (local). Rotate so it stands up along +Y.
    caseGeo.rotateX(-Math.PI / 2)
    // After rotateX(-90deg): local Z(depth) -> world +Y, local Y -> world -Z... fix Z sign.
    caseGeo.scale(1, 1, -1)
    caseGeo.computeVertexNormals()

    const caseMesh = new THREE.Mesh(caseGeo, lacquer)
    caseMesh.position.set(0, bodyY, 0)
    this.group.add(caseMesh)

    // Thin glossy top band (rim highlight) sitting on the case top.
    const rim = new THREE.Mesh(caseGeo.clone(), lacquerSide)
    rim.scale.set(1.004, 0.06, 1.004)
    rim.position.set(0, bodyY + caseThick + 0.004, 0)
    this.group.add(rim)

    const caseTopY = bodyY + caseThick

    // =====================================================================
    // KEYBOARD, at the straight front edge, facing +Z.
    // =====================================================================
    const kbW = caseW * 0.86
    const kbZ = front - 0.02            // just inside the front edge
    const keyBedY = caseTopY - 0.02

    // Key bed / fallboard block under the keys.
    const keyBed = new THREE.Mesh(new THREE.BoxGeometry(kbW + 0.06, 0.1, 0.42), lacquerSide)
    keyBed.position.set(0, keyBedY - 0.05, kbZ - 0.16)
    this.group.add(keyBed)

    // Fallboard (the lid over the keys) tilted up slightly behind the keys.
    const fallboard = new THREE.Mesh(new THREE.BoxGeometry(kbW + 0.04, 0.16, 0.06), lacquer)
    fallboard.position.set(0, keyBedY + 0.05, kbZ - 0.37)
    fallboard.rotation.x = -0.18
    this.group.add(fallboard)

    // White keys, a full set of octaves across the width.
    const whiteCount = 21               // 3 octaves of white keys, reads as "full"
    const keyDepth = 0.3
    const keyTopY = keyBedY + 0.035
    const whiteGap = 0.004
    const whiteW = (kbW - whiteGap * (whiteCount - 1)) / whiteCount
    const keyFrontZ = kbZ + keyDepth / 2
    this.keys = []
    const xStart = -kbW / 2 + whiteW / 2

    for (let i = 0; i < whiteCount; i++) {
      const x = xStart + i * (whiteW + whiteGap)
      const k = new THREE.Mesh(new THREE.BoxGeometry(whiteW, 0.05, keyDepth), whiteKey)
      k.position.set(x, keyTopY, keyFrontZ - keyDepth / 2 + 0.02)
      this.group.add(k)
      this.keys.push({ mesh: k, baseY: k.position.y, phase: (i / whiteCount) * Math.PI * 2 })
    }

    // Black keys, repeating 2-then-3 pattern (C#,D#  /  F#,G#,A#).
    // Pattern index within an octave of 7 whites: gaps after white 0,1 and 3,4,5.
    const blackOffsets = [0, 1, 3, 4, 5] // place a black key after these white indices
    const blackW = whiteW * 0.58
    const blackDepth = keyDepth * 0.62
    const blackY = keyTopY + 0.035
    for (let octave = 0; octave < 3; octave++) {
      for (const off of blackOffsets) {
        const wi = octave * 7 + off
        if (wi + 1 >= whiteCount) continue
        // Sit between white key wi and wi+1.
        const xa = xStart + wi * (whiteW + whiteGap)
        const xb = xStart + (wi + 1) * (whiteW + whiteGap)
        const bx = (xa + xb) / 2
        const bk = new THREE.Mesh(new THREE.BoxGeometry(blackW, 0.06, blackDepth), blackKey)
        bk.position.set(bx, blackY, keyFrontZ - blackDepth / 2 - 0.04)
        this.group.add(bk)
      }
    }

    // Cheek blocks at either end of the keyboard.
    for (const sx of [-1, 1]) {
      const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, keyDepth + 0.04), lacquer)
      cheek.position.set(sx * (kbW / 2 + 0.04), keyTopY + 0.005, keyFrontZ - keyDepth / 2 + 0.01)
      this.group.add(cheek)
    }

    // =====================================================================
    // MUSIC DESK, behind the keys, a slim slatted panel angled toward player.
    // =====================================================================
    const desk = new THREE.Mesh(new THREE.BoxGeometry(kbW * 0.8, 0.26, 0.02), lacquer)
    desk.position.set(0, caseTopY + 0.16, kbZ - 0.42)
    desk.rotation.x = -0.34
    this.group.add(desk)
    // Two slim dark accent slats on the desk face.
    for (const oy of [-0.05, 0.05]) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(kbW * 0.7, 0.012, 0.022), frame)
      slat.position.set(0, caseTopY + 0.16 + oy * Math.cos(0.34), kbZ - 0.42 + oy * Math.sin(0.34) + 0.012)
      slat.rotation.x = -0.34
      this.group.add(slat)
    }

    // =====================================================================
    // LID, raised, hinged at the spine (left), cream underside, held by prop.
    // The lid roughly mirrors the case outline (slightly inset) and is tilted up.
    // =====================================================================
    const lidGeo = caseGeo.clone()
    lidGeo.scale(0.97, 0.06, 0.965)     // thin plate, slightly inset from the case
    // Top of lid = red lacquer; we add a cream underside plate beneath it.
    const lidTilt = -0.62               // open angle (raised toward the bass side)
    const lidPivotX = -halfW * 0.97     // hinge along the left spine
    const lidPivotY = caseTopY + 0.07
    const lid = new THREE.Group()
    const lidTop = new THREE.Mesh(lidGeo, lacquer)
    lidTop.position.y = 0.012
    lid.add(lidTop)
    // Amber underside, a flat shape-cloned plate just below the lid top.
    const lidUnder = new THREE.Mesh(lidGeo.clone(), cream)
    lidUnder.scale.set(0.992, 0.4, 0.992)
    lidUnder.position.y = -0.006
    lid.add(lidUnder)
    // Position group so its left edge sits over the spine, then tilt about that edge.
    lid.position.set(lidPivotX, lidPivotY, 0)
    // Move geometry so pivot is at the left edge: shift children +halfW*0.97 in X.
    lidTop.position.x = halfW * 0.97
    lidUnder.position.x = halfW * 0.97
    lid.rotation.z = lidTilt
    this.group.add(lid)

    // Lid prop stick, thin angled rod from the case top to the raised lid edge.
    const propLen = 0.62
    const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, propLen, 8), brass)
    // Anchor near the right (bass) side of the case top, lean back toward the lid.
    prop.position.set(halfW * 0.42, caseTopY + propLen * 0.5 - 0.02, back + caseDepth * 0.42)
    prop.rotation.z = 0.5
    prop.rotation.x = -0.12
    this.group.add(prop)

    // =====================================================================
    // LEGS, three strong tapered legs (two front, one at the tail/bass).
    // =====================================================================
    const legPositions = [
      [-halfW * 0.78, front - 0.16],          // front-left (spine, near keyboard)
      [halfW * 0.78, front - 0.16],           // front-right (bass, near keyboard)
      [-halfW * 0.04, back + caseDepth * 0.22], // single tail leg
    ]
    for (const [lx, lz] of legPositions) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.075, legLen, 16), frame)
      leg.position.set(lx, legLen / 2, lz)
      this.group.add(leg)
      // Brass caster cap at the foot.
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.04, 12), brass)
      cap.position.set(lx, 0.02, lz)
      this.group.add(cap)
      // Amber collar where leg meets the case.
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.04, 16), brass)
      collar.position.set(lx, legLen - 0.03, lz)
      this.group.add(collar)
    }

    // =====================================================================
    // PEDAL LYRE, hangs below the keyboard front, with three pedals.
    // =====================================================================
    const lyreZ = front + 0.04
    const lyreTopY = bodyY - 0.02
    // Two vertical lyre posts.
    for (const sx of [-0.08, 0.08]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.34, 10), frame)
      post.position.set(sx, lyreTopY - 0.17, lyreZ)
      this.group.add(post)
    }
    // Lyre cross plate.
    const lyrePlate = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.1), frame)
    lyrePlate.position.set(0, lyreTopY - 0.34, lyreZ)
    this.group.add(lyrePlate)
    // Three brass pedals.
    for (let p = -1; p <= 1; p++) {
      const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.018, 0.12), brass)
      pedal.position.set(p * 0.07, lyreTopY - 0.35, lyreZ + 0.07)
      pedal.rotation.x = 0.08
      this.group.add(pedal)
    }

    // =====================================================================
    // BENCH, matching red bench in front (toward +Z).
    // =====================================================================
    const benchZ = front + 0.62
    const benchTopY = 0.42
    const benchW = 0.78
    const benchD = 0.34
    const seat = new THREE.Mesh(new THREE.BoxGeometry(benchW, 0.07, benchD), cream)
    seat.position.set(0, benchTopY, benchZ)
    this.group.add(seat)
    // Red cushion seam stripe.
    const seam = new THREE.Mesh(new THREE.BoxGeometry(benchW * 0.86, 0.012, benchD * 0.78), paint('#9c2b22', { rough: 0.85 }))
    seam.position.set(0, benchTopY + 0.04, benchZ)
    this.group.add(seam)
    // Four tapered bench legs (black lacquer).
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const bl = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.034, benchTopY - 0.035, 12), frame)
        bl.position.set(sx * (benchW / 2 - 0.06), (benchTopY - 0.035) / 2, benchZ + sz * (benchD / 2 - 0.06))
        this.group.add(bl)
      }
    }
  }

  /** Gentle travelling wave down a few white keys, tiny y dip. */
  update(elapsed) {
    if (!this.keys) return
    const speed = 2.2
    const amp = 0.012
    for (const k of this.keys) {
      const dip = Math.max(0, Math.sin(elapsed * speed - k.phase))
      k.mesh.position.y = k.baseY - dip * dip * amp
    }
  }
}
