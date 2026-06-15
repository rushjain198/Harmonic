#!/bin/bash
# Start the Harmonic Python backend only (song API + jam server).
# Prefer ./start.sh backend from the project root, or: npm run dev:backend

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm run dev:backend
