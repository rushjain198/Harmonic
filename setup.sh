#!/bin/bash
# One-time setup: Node deps + Python venv + built-in songs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> Installing Node dependencies..."
npm install

echo "==> Creating Python virtualenv (backend/.venv)..."
cd backend
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -r requirements.txt
cd "$ROOT"

echo "==> Building song library..."
node scripts/build-songs.mjs

echo ""
echo "Setup complete."
echo ""
echo "Run the app:"
echo "  ./start.sh              # frontend + backend together"
echo "  ./start.sh frontend     # frontend only  → http://localhost:5173"
echo "  ./start.sh backend      # backend only   → :8766 + :8502"
echo ""
echo "Or use npm:"
echo "  npm run dev:all         # frontend + backend"
echo "  npm run dev             # frontend only"
echo "  npm run dev:backend     # backend only"
