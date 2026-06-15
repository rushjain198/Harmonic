/**
 * Central tunables. Keeping palette, timings, the instrument registry, and the
 * floor layout in one place means the rest of the code reads like a story and
 * judges can re-skin the whole experience from here.
 */

/**
 * Warm gallery-studio palette: a sunlit room of cream walls, a cooler grey side
 * wall, and a honey-wood floor. "ink" is the warm near-black for type/dark parts;
 * "surface" the off-white for keys/heads. The HUD brand accent is a warm red;
 * each instrument carries its own bold colour (see INSTRUMENTS).
 */
export const PALETTE = {
  bg: '#e7dccb', // warm backdrop behind the room
  wall: '#ece4d4', // warm cream, back + left walls
  wallSide: '#bdb8b0', // cooler grey, right wall (as in the reference room)
  floor: '#b07d44', // honey-wood floor base (grain added in Room.js)
  ink: '#241a12', // warm near-black, dark parts + type
  surface: '#fffaf0', // off-white, keys, drum heads
  accent: '#d8332f', // HUD brand accent, warm red
}

// All durations in seconds.
export const TIMING = {
  intro: 2.4, // cinematic fly-in from the landing pose into the room
  focus: 1.2,
  release: 1.1,
}

// The browsing "home" camera pose; release() returns to it after a focus.
// Pulled back enough that all four instruments sit in frame with clean margins.
export const HOME = {
  base: { x: 0.3, y: 1.8, z: 8.4 },
  target: { x: 0.3, y: 1.0, z: 0 },
}

// The levitate/zoom feel, tune the whole interaction from here.
export const FOCUS = {
  liftBase: 0.7, // metres an instrument floats, plus...
  liftPerHeight: 0.25, // ...this much of its own height
  bobAmp: 0.07, // gentle vertical bob amplitude
  bobFreq: 1.6, // bob speed
  spinRate: 0.55, // idle rotation speed while lifted (rad/s)
  framePad: 0.6, // extra metres so the framed instrument isn't edge-to-edge
}

// The four playable experiences. `accent` drives per-instrument theming across
// the body colour, the hover label, and the play screen, matched to the
// reference room: a red guitar, a black piano with warm amber trim, sky-blue
// drums, and a purple band-mode stage.
export const INSTRUMENTS = [
  { id: 'bass', name: 'Bass', tagline: 'Feel the low end', accent: '#d8332f', player: 'play/bass.html' },
  { id: 'piano', name: 'Piano', tagline: 'Eighty-eight keys', accent: '#e8a23d', player: 'play/piano-player.html', learn: true },
  { id: 'drums', name: 'Drums', tagline: 'Keep the beat', accent: '#2e90d9', player: 'play/drums-player.html' },
  { id: 'band', name: 'Band Mode', tagline: 'Play it all together', accent: '#c050e0', player: null },
]

/**
 * FIXED stage layout (metres, +Z is toward the camera, ry = facing in radians).
 * This composition is pinned to the approved reference: drums on the left, the
 * grand piano centre, the red guitar right, and the Band-Mode stage far right.
 * It is deliberately the same on every load, no randomisation.
 */
export const LAYOUT = {
  drums: { x: -3.25, z: -0.2, ry: 0.2 },
  piano: { x: -0.1, z: 0.7, ry: 0.0 },
  bass: { x: 2.7, z: -0.55, ry: -0.24 },
  band: { x: 4.05, z: 1.05, ry: -0.42 },
}
