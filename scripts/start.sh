#!/usr/bin/env bash
# SAEDGE Embodied AI Studio - local development startup
# Starts the FastAPI backend and the React frontend dev server.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo "== SAEDGE Embodied AI Studio =="
echo "Backend:  $BACKEND"
echo "Frontend: $FRONTEND"

# Backend
if [ ! -d "$BACKEND/.venv" ]; then
  echo "[backend] creating venv"
  python3 -m venv "$BACKEND/.venv"
fi
source "$BACKEND/.venv/bin/activate"
pip install -q -r "$BACKEND/requirements.txt"

echo "[backend] starting FastAPI on http://0.0.0.0:8000"
(cd "$BACKEND" && nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > "$ROOT/logs/backend.log" 2>&1 &)
echo $! > "$ROOT/logs/backend.pid"

# Frontend
echo "[frontend] installing dependencies"
(cd "$FRONTEND" && npm install --silent)
echo "[frontend] starting Vite dev server on http://localhost:5173"
(cd "$FRONTEND" && nohup npm run dev > "$ROOT/logs/frontend.log" 2>&1 &)
echo $! > "$ROOT/logs/frontend.pid"

echo ""
echo "SAEDGE is starting."
echo "  Dashboard: http://localhost:5173"
echo "  Backend API: http://localhost:8000"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "Logs: $ROOT/logs/backend.log, $ROOT/logs/frontend.log"
echo "To stop: ./scripts/stop.sh"
