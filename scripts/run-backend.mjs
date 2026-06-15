// Start the Python backend only (song library :8766 + jam :8502).
// Usage: npm run dev:backend
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const backend = join(root, 'backend')
const children = []

const C = { api: '\x1b[33m', jam: '\x1b[35m', err: '\x1b[31m', reset: '\x1b[0m' }
const log = (tag, line) => process.stdout.write(`${C[tag] || ''}[${tag}]${C.reset} ${line}\n`)

function pythonCmd() {
  const venvWin = join(backend, '.venv', 'Scripts', 'python.exe')
  const venvNix = join(backend, '.venv', 'bin', 'python')
  if (existsSync(venvWin)) return `"${venvWin}"`
  if (existsSync(venvNix)) return `"${venvNix}"`
  return process.platform === 'win32' ? 'py -3' : 'python3'
}

function run(tag, cmd, args, opts = {}) {
  const child = spawn(cmd, args, { cwd: opts.cwd || backend, shell: true, env: process.env })
  child.stdout.on('data', (d) => String(d).split(/\r?\n/).filter(Boolean).forEach((l) => log(tag, l)))
  child.stderr.on('data', (d) => String(d).split(/\r?\n/).filter(Boolean).forEach((l) => log(tag, l)))
  child.on('error', (e) => log('err', `could not start (${e.code || e.message})`))
  children.push(child)
  return child
}

const py = pythonCmd()
if (!existsSync(join(backend, '.venv', 'bin', 'python')) && !existsSync(join(backend, '.venv', 'Scripts', 'python.exe'))) {
  log('err', 'No backend/.venv found. Run ./setup.sh (or npm run setup) once first.')
  process.exit(1)
}

log('api', `using python: ${py}`)
log('api', 'Song library → http://localhost:8766')
log('jam', 'Jam server   → ws://localhost:8502')
log('api', 'Press Ctrl+C to stop.')

run('api', py, ['music_api.py'])
run('jam', py, ['-m', 'uvicorn', 'session_server:app', '--host', '0.0.0.0', '--port', '8502'])

function shutdown() {
  for (const c of children) {
    try { c.kill() } catch {}
  }
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
