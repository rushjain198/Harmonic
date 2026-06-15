import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { PALETTE } from '../config.js'

/**
 * Bright, warm gallery light, clean but with real depth. A subtle procedural
 * IBL gives lacquer and chrome something to reflect; one warm key light from the
 * upper front-left shapes the instruments and casts soft shadows; a hemisphere
 * fill keeps the shaded sides open. No fog, no moody pools, just a sunlit room.
 */
export default class Environment {
  constructor(experience) {
    this.scene = experience.scene
    this.renderer = experience.renderer.instance

    this.scene.background = new THREE.Color(PALETTE.bg)

    // subtle image-based lighting for believable reflections (not flat-lighting)
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.35
    pmrem.dispose()

    // soft warm/ground fill so no surface goes muddy
    this.scene.add(new THREE.HemisphereLight('#fff6e6', '#d8c4a0', 0.95))

    // warm key light, shapes the toys and casts the soft contact shadows
    const key = new THREE.DirectionalLight('#fff3df', 2.1)
    key.position.set(-5.5, 8.5, 6)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 1
    key.shadow.camera.far = 32
    key.shadow.camera.left = -10
    key.shadow.camera.right = 10
    key.shadow.camera.top = 10
    key.shadow.camera.bottom = -10
    key.shadow.bias = -0.0004
    key.shadow.normalBias = 0.02
    key.shadow.radius = 7 // PCFSoft blur, gentle edges
    key.target.position.set(0.3, 0.4, 0)
    this.scene.add(key, key.target)
  }
}
