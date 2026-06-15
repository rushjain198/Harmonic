#!/bin/bash
# Harmonic launcher — run from the project root.
#
# Usage:
#   ./start.sh              frontend + backend (default)
#   ./start.sh frontend     Vite dev server only     → http://localhost:5173
#   ./start.sh backend      Python API + jam only    → :8766 + :8502
#   ./start.sh setup        one-time install (Node + Python venv)
#
# Stop any running server with Ctrl+C in that terminal.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

cmd="${1:-all}"

case "$cmd" in
  setup)
    exec "$ROOT/setup.sh"
    ;;
  frontend|web|fe)
    echo "Frontend → http://localhost:5173  (Ctrl+C to stop)"
    npm run dev
    ;;
  backend|api|be)
    echo "Backend  → http://localhost:8766  + jam ws://localhost:8502  (Ctrl+C to stop)"
    npm run dev:backend
    ;;
  all|both|"")
    echo "Frontend → http://localhost:5173"
    echo "Backend  → http://localhost:8766  + jam ws://localhost:8502"
    echo "(Ctrl+C stops everything)"
    npm run dev:all
    ;;
  help|-h|--help)
    sed -n '2,10p' "$0" | sed 's/^# \?//'
    ;;
  *)
    echo "Unknown command: $cmd"
    echo "Run: ./start.sh help"
    exit 1
    ;;
esac
