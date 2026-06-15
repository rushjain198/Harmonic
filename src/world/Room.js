import * as THREE from 'three'
import { PALETTE } from '../config.js'
import { paint, matte } from './materials.js'

// Brand palette: the four instrument accents drive the playful multicolour
// wordmark + the concentric "harmonic rings" emblem, tying the branding to the
// instruments so wall and carpet feel like one identity.
const ACCENTS = ['#d8332f', '#2e90d9', '#e8a23d', '#c050e0'] // red, blue, amber, purple
const INK = '#241a12'
const CREAM = '#f4ead4'

/**
 * The stage: a warm, sunlit gallery-studio. A honey-wood plank floor, cream walls
 * (with a cooler grey right wall), the HARMONIC brand sign on the back wall flanked
 * by two abstract paintings, a matching branded carpet on the floor, and a couple
 * of clean props. Everything receives the soft key-light shadows.
 */
export default class Room {
  constructor(experience) {
    this.scene = experience.scene
    this.group = new THREE.Group()
    this.scene.add(this.group)

    this.buildFloor()
    this.buildWalls()
    this.buildPaintings()
    this.buildCarpet()
    this.buildProps()
  }

  buildFloor() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 24), paint(PALETTE.floor, { rough: 0.72 }))
    floor.material.map = woodTexture()
    floor.material.needsUpdate = true
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0.3, 0, 0.5)
    floor.receiveShadow = true
    this.group.add(floor)
  }

  buildWalls() {
    const cream = matte(PALETTE.wall, { rough: 0.98 })
    const grey = matte(PALETTE.wallSide, { rough: 0.98 })
    const trim = paint('#cdbfa6', { rough: 0.8 })

    const back = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), cream)
    back.position.set(0.3, 4, -6)
    back.receiveShadow = true
    this.group.add(back)

    const left = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), cream)
    left.rotation.y = Math.PI / 2
    left.position.set(-9, 4, 0.5)
    left.receiveShadow = true
    this.group.add(left)

    const right = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), grey)
    right.rotation.y = -Math.PI / 2
    right.position.set(9, 4, 0.5)
    right.receiveShadow = true
    this.group.add(right)

    const bbBack = new THREE.Mesh(new THREE.BoxGeometry(20, 0.18, 0.06), trim)
    bbBack.position.set(0.3, 0.09, -5.97)
    this.group.add(bbBack)
    for (const sx of [-1, 1]) {
      const bb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 14), trim)
      bb.position.set(sx * 8.97, 0.09, 0.5)
      this.group.add(bb)
    }
  }

  buildPaintings() {
    // a gallery wall of three abstract canvases; the branding lives on the carpet
    const z = -5.9
    this.addPainting(-4.7, 3.5, 2.5, 2.9, z, paintingTexture(0))
    this.addPainting(0.3, 3.75, 2.9, 3.3, z, paintingTexture(1)) // larger central focal piece
    this.addPainting(5.3, 3.5, 2.5, 2.9, z, paintingTexture(2))
  }

  addPainting(x, y, w, h, z, tex) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.16, h + 0.16, 0.07),
      paint('#1b1a18', { rough: 0.5 }),
    )
    frame.position.set(x, y, z - 0.01)
    frame.castShadow = true
    this.group.add(frame)

    const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }))
    art.position.set(x, y, z + 0.04)
    this.group.add(art)
  }

  buildCarpet() {
    // a branded rug in the foreground, matching the wall sign
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(6.8, 3.6),
      matte('#ffffff', { rough: 0.95 }),
    )
    rug.material.map = brandTexture(2048, 1080)
    rug.material.needsUpdate = true
    rug.rotation.x = -Math.PI / 2
    rug.rotation.z = -0.08
    rug.position.set(0.6, 0.015, 3.1)
    rug.receiveShadow = true
    this.group.add(rug)
  }

  buildProps() {
    const wood = paint('#caa06a', { rough: 0.6 })
    const bench = new THREE.Group()
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.14, 0.5), wood)
    top.position.y = 0.5
    bench.add(top)
    for (const sx of [-0.68, 0.68]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.46), wood)
      leg.position.set(sx, 0.25, 0)
      bench.add(leg)
    }
    bench.position.set(-5.6, 0, 2.7)
    bench.rotation.y = 0.5
    bench.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true } })
    this.group.add(bench)

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.95, 1.2), paint('#f3eee4', { rough: 0.7 }))
    plinth.position.set(-6.4, 0.475, 0.1)
    plinth.castShadow = true
    plinth.receiveShadow = true
    this.group.add(plinth)
  }
}

/* ----------------------------- textures ----------------------------- */

function woodTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 1024
  const x = c.getContext('2d')
  const planks = 6
  const ph = 1024 / planks
  for (let i = 0; i < planks; i++) {
    const base = 150 + Math.floor(Math.random() * 24)
    x.fillStyle = `rgb(${base + 24}, ${Math.floor(base * 0.74) + 8}, ${Math.floor(base * 0.44)})`
    x.fillRect(0, i * ph, 1024, ph)
    x.fillStyle = 'rgba(60,38,18,0.32)'
    x.fillRect(0, i * ph, 1024, 3)
    for (let g = 0; g < 46; g++) {
      x.strokeStyle = `rgba(78,48,22,${0.04 + Math.random() * 0.06})`
      x.lineWidth = 1
      x.beginPath()
      const y = i * ph + Math.random() * ph
      x.moveTo(0, y)
      x.bezierCurveTo(300, y + (Math.random() - 0.5) * 7, 720, y + (Math.random() - 0.5) * 7, 1024, y + (Math.random() - 0.5) * 5)
      x.stroke()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(5, 4.5)
  t.anisotropy = 8
  return t
}

// The brand mark: a concentric "harmonic rings" play-emblem + the HARMONIC
// wordmark with each letter in a rotating instrument colour. Shared by the wall
// sign (transparent) and the carpet (cream rug with a border + ring motif).
function brandTexture(W, H) {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')

  // soft rug field + inked border, with faint radiating harmonic arcs
  x.fillStyle = CREAM
  roundRect(x, 24, 24, W - 48, H - 48, 60)
  x.fill()
  x.lineWidth = 16
  x.strokeStyle = INK
  roundRect(x, 60, 60, W - 120, H - 120, 40)
  x.stroke()
  x.save()
  x.globalAlpha = 0.12
  for (let i = 1; i <= 5; i++) {
    x.beginPath()
    x.lineWidth = 10
    x.strokeStyle = ACCENTS[i % ACCENTS.length]
    x.arc(W / 2, H * 0.46, 120 + i * 130, 0, Math.PI * 2)
    x.stroke()
  }
  x.restore()

  const cx = W / 2
  drawEmblem(x, cx, H * 0.36, H * 0.2)
  drawWord(x, 'HARMONIC', cx, H * 0.74, H * 0.2)

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function drawEmblem(x, cx, cy, r) {
  for (let i = ACCENTS.length - 1; i >= 0; i--) {
    x.beginPath()
    x.lineWidth = r * 0.1
    x.strokeStyle = ACCENTS[i]
    x.arc(cx, cy, r * (0.52 + i * 0.18), 0, Math.PI * 2)
    x.stroke()
  }
  x.beginPath()
  x.fillStyle = INK
  x.arc(cx, cy, r * 0.44, 0, Math.PI * 2)
  x.fill()
  // play triangle, the "press to play" heart of the mark
  const t = r * 0.22
  x.beginPath()
  x.fillStyle = '#fffaf0'
  x.moveTo(cx - t * 0.55, cy - t)
  x.lineTo(cx - t * 0.55, cy + t)
  x.lineTo(cx + t, cy)
  x.closePath()
  x.fill()
}

function drawWord(x, text, cx, cy, size) {
  x.font = `800 ${size}px "Baloo 2", "Arial Black", sans-serif`
  x.textBaseline = 'middle'
  x.textAlign = 'left'
  const ls = size * 0.04
  const widths = [...text].map((ch) => x.measureText(ch).width)
  const total = widths.reduce((a, b) => a + b, 0) + ls * (text.length - 1)
  let cursor = cx - total / 2
  for (let i = 0; i < text.length; i++) {
    x.fillStyle = ACCENTS[i % ACCENTS.length]
    x.fillText(text[i], cursor, cy)
    cursor += widths[i] + ls
  }
}

function roundRect(x, px, py, w, h, r) {
  x.beginPath()
  x.moveTo(px + r, py)
  x.arcTo(px + w, py, px + w, py + h, r)
  x.arcTo(px + w, py + h, px, py + h, r)
  x.arcTo(px, py + h, px, py, r)
  x.arcTo(px, py, px + w, py, r)
  x.closePath()
}

// Two deterministic Matisse/KidSuper-style canvases (fixed compositions).
function paintingTexture(variant) {
  const W = 512
  const H = 600
  const sets = [
    { // warm cream, playful primaries
      bg: '#f2ead9',
      shapes: [
        { k: 'circle', x: 160, y: 160, r: 92, c: '#e8a23d' },
        { k: 'pac', x: 352, y: 250, r: 84, c: '#2e90d9' },
        { k: 'circle', x: 210, y: 420, r: 70, c: '#d8332f' },
        { k: 'bar', x: 350, y: 440, r: 78, c: '#241a12' },
      ],
    },
    { // deep green centre, the focal canvas
      bg: '#2f7d52',
      shapes: [
        { k: 'circle', x: 200, y: 180, r: 96, c: '#f2ead9' },
        { k: 'blob', x: 348, y: 268, r: 82, c: '#e7a6c4' },
        { k: 'pac', x: 196, y: 430, r: 88, c: '#e8a23d' },
        { k: 'circle', x: 362, y: 458, r: 46, c: '#2e90d9' },
      ],
    },
    { // soft cream, ink + accents
      bg: '#efe7d6',
      shapes: [
        { k: 'blob', x: 330, y: 200, r: 96, c: '#241a12' },
        { k: 'pac', x: 178, y: 250, r: 78, c: '#e8a23d' },
        { k: 'circle', x: 360, y: 420, r: 62, c: '#d8332f' },
        { k: 'half', x: 180, y: 452, r: 68, c: '#2e90d9' },
      ],
    },
  ]
  const s = sets[variant % sets.length]
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')
  x.fillStyle = s.bg
  x.fillRect(0, 0, W, H)
  for (const sh of s.shapes) {
    x.fillStyle = sh.c
    x.beginPath()
    if (sh.k === 'circle') {
      x.arc(sh.x, sh.y, sh.r, 0, Math.PI * 2)
    } else if (sh.k === 'pac') {
      x.arc(sh.x, sh.y, sh.r, Math.PI * 0.18, Math.PI * 1.82)
      x.lineTo(sh.x, sh.y)
    } else if (sh.k === 'bar') {
      roundRect(x, sh.x - sh.r, sh.y - sh.r * 0.5, sh.r * 2, sh.r, 16)
    } else if (sh.k === 'half') {
      x.arc(sh.x, sh.y, sh.r, Math.PI, 0)
    } else {
      x.ellipse(sh.x, sh.y, sh.r, sh.r * 0.78, 0.4, 0, Math.PI * 2)
    }
    x.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
