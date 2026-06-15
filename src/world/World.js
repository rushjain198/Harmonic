import * as THREE from 'three'
import { INSTRUMENTS, LAYOUT } from '../config.js'
import Environment from './Environment.js'
import Room from './Room.js'
import Bass from './instruments/Bass.js'
import Piano from './instruments/Piano.js'
import Drums from './instruments/Drums.js'
import BandStation from './instruments/BandStation.js'

const FACTORY = { bass: Bass, piano: Piano, drums: Drums, band: BandStation }

/** Assembles the room and places the instruments on their fixed stage marks. */
export default class World {
  constructor(experience) {
    this.experience = experience
    this.scene = experience.scene

    this.environment = new Environment(experience)
    this.room = new Room(experience)

    this.instruments = []
    this.pickables = [] // flat list for the raycaster
    this.byId = {} // instrumentId -> Instrument

    this.placeInstruments()
  }

  placeInstruments() {
    for (const cfg of INSTRUMENTS) {
      const instrument = new FACTORY[cfg.id](cfg)
      const mark = LAYOUT[cfg.id]

      instrument.basePosition = new THREE.Vector3(mark.x, 0, mark.z)
      instrument.baseRotationY = mark.ry
      instrument.group.position.copy(instrument.basePosition)
      instrument.group.rotation.y = instrument.baseRotationY

      this.scene.add(instrument.group)
      this.instruments.push(instrument)
      this.byId[cfg.id] = instrument
      this.pickables.push(...instrument.pickables)
    }
  }

  update() {
    const { elapsed, delta } = this.experience.time
    for (const instrument of this.instruments) instrument.update(elapsed, delta)
  }
}
