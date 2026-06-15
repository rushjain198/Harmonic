import * as THREE from 'three'

/**
 * Shared material language, clean, thoughtfully-finished surfaces that read as
 * real objects (lacquer, painted shells, metal, felt) while staying friendly and
 * cohesive. They rely on the scene's subtle IBL (Environment.js) for reflections,
 * so highlights and chrome look believable without heavy post-processing.
 *
 *   paint(c)  - matte/satin painted plastic or wood
 *   gloss(c)  - wet lacquer (clearcoat), piano case, guitar body, drum shells
 *   metal(c)  - chrome / brass hardware
 *   matte(c)  - fully diffuse felt, rubber, fabric
 *   glow(c)   - self-lit accent (band-mode rings / inlays)
 */

export function paint(color, { rough = 0.5 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, envMapIntensity: 0.6 })
}

export function gloss(color, { rough = 0.26, coat = 1 } = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: rough,
    metalness: 0,
    clearcoat: coat,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.0,
  })
}

export function metal(color, { rough = 0.28 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 1, envMapIntensity: 1.0 })
}

export function matte(color, { rough = 0.92 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, envMapIntensity: 0.3 })
}

export function glow(color, intensity = 1.4) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.4,
    metalness: 0,
  })
}
