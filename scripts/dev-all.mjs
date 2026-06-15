// Run the whole Harmonic stack with one command: the Vite site + the optional
// Python backend (song library on :8766, multiplayer jam on :8502).
//
// The webcam instrument play is 100% in-browser and needs NO backend, so if
// Python or its deps are missing, this still serves the site and just logs a
// note. Usage: `npm run dev:all` (dev) or `npm run start:all` (preview build).
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const backend = join(root, 'backend')
const mode = process.argv[2] === 'preview' ? 'preview' : 'dev'
const children = []

const C = { web: '\x1b[36m', api: '\x1b[33m', jam: '\x1b[35m', dim: '\x1b[90m', reset: '\x1b[0m' }
const log = (tag, line) => process.stdout.write(`${C[tag] || ''}[${tag}]${C.reset} ${line}\n`)

function run(tag, cmd, args, opts = {}) {
  const child = spawn(cmd, args, { cwd: opts.cwd || root, shell: true, env: process.env })
  child.stdout.on('data', (d) => String(d).split(/\r?\n/).filter(Boolean).forEach((l) => log(tag, l)))
  child.stderr.on('data', (d) => String(d).split(/\r?\n/).filter(Boolean).forEach((l) => log(tag, l)))
  child.on('error', (e) => log(tag, `could not start (${e.code || e.message})`))
  children.push(child)
  return child
}

// Pick a Python launcher: prefer the backend venv, else `py`/`python3`/`python`.
function pythonCmd() {
  const venvWin = join(backend, '.venv', 'Scripts', 'python.exe')
  const venvNix = join(backend, '.venv', 'bin', 'python')
  if (existsSync(venvWin)) return `"${venvWin}"`
  if (existsSync(venvNix)) return `"${venvNix}"`
  return process.platform === 'win32' ? 'py -3' : 'python3'
}

// 0) Bake built-in songs into public/songs so they work without the Python API.
await import('./build-songs.mjs')

// 1) The site (this is the part that always matters).
run('web', 'npx', ['vite', mode === 'preview' ? 'preview' : '', '--port', mode === 'preview' ? '4173' : '5173'].filter(Boolean))

// 2) Optional Python backend (songs + jam). Best-effort.
const py = pythonCmd()
log('api', `using python: ${py}  (song library on :8766)`)
run('api', py, ['music_api.py'], { cwd: backend })
run('jam', py, ['-m', 'uvicorn', 'session_server:app', '--host', '0.0.0.0', '--port', '8502'], { cwd: backend })
log('dim', 'Tip: webcam instrument play works without the backend; it only adds songs + multiplayer jam.')

function shutdown() {
  for (const c of children) {
    try { c.kill() } catch {}
  }
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
