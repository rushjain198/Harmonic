/**
 * Bake backend/music_files/*.{txt,json} into static song JSON under public/songs/
 * so the piano player can load built-in songs with NO Python backend, it just
 * fetches /songs/<id>.json. Mirrors backend/music_api.py's conversion exactly:
 *   .json  -> passed through (already the unified {notes,bpm} format)
 *   .txt   -> whitespace-separated note letters at 0.5s spacing
 * Also writes index.json (the melodic catalogue, drum patterns excluded).
 *
 * Runs automatically via npm "predev"/"prebuild"; re-run by hand with `npm run songs`.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join, resolve, extname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(root, 'backend', 'music_files')
const OUT = join(root, 'public', 'songs')

function txtToSong(text) {
  const tokens = text.split(/\s+/).filter(Boolean)
  const notes = tokens.map((n, i) => ({ t: i * 0.5, note: n.toUpperCase(), dur: 0.5, velocity: 80 }))
  return { notes, bpm: 120 }
}

mkdirSync(OUT, { recursive: true })

const done = new Set()
const ids = []
// .json before .txt so a JSON song wins over a same-named .txt (as the API does).
const files = readdirSync(SRC).sort((a, b) => extname(a).localeCompare(extname(b)))

for (const file of files) {
  const ext = extname(file).toLowerCase()
  if (ext !== '.txt' && ext !== '.json') continue
  const id = basename(file, ext)
  if (done.has(id)) continue

  let song
  const raw = readFileSync(join(SRC, file), 'utf8')
  if (ext === '.json') {
    try { song = JSON.parse(raw) } catch (e) { console.warn(`build-songs: skip ${file} (${e.message})`); continue }
  } else {
    song = txtToSong(raw)
  }
  if (!song?.notes?.length) { console.warn(`build-songs: skip ${file} (no notes)`); continue }

  writeFileSync(join(OUT, `${id}.json`), JSON.stringify(song))
  done.add(id)
  if (!id.startsWith('drums_')) ids.push(id) // drum patterns aren't melodic songs
}

ids.sort()
writeFileSync(join(OUT, 'index.json'), JSON.stringify({ songs: ids }))
console.log(`build-songs: wrote ${done.size} songs (+ index of ${ids.length}) to public/songs/`)
