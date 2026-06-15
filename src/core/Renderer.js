import * as THREE from 'three'

/**
 * WebGL renderer, clean, no post-processing passes. The polish comes from real
 * (soft) shadow maps and PBR-neutral tone mapping, which keeps the bright toy
 * colours true while giving highlights a premium roll-off.
 */
export default class Renderer {
  constructor(experience) {
    this.experience = experience
    this.sizes = experience.sizes
    this.scene = experience.scene
    this.camera = experience.camera

    this.instance = new THREE.WebGLRenderer({
      canvas: experience.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.instance.shadowMap.enabled = true
    this.instance.shadowMap.type = THREE.PCFSoftShadowMap // soft, layered contact shadows
    this.instance.toneMapping = THREE.NeutralToneMapping // keeps colours vivid + clean
    this.instance.toneMappingExposure = 1.0
    this.resize()
  }

  resize() {
    this.instance.setPixelRatio(this.sizes.pixelRatio)
    this.instance.setSize(this.sizes.width, this.sizes.height)
  }

  update() {
    this.instance.render(this.scene, this.camera.instance)
  }
}
