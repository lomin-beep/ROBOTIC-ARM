#!/usr/bin/env bash
# SAEDGE Embodied AI Studio - stop local services
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "$ROOT/logs/backend.pid" ]; then kill "$(cat "$ROOT/logs/backend.pid")" 2>/dev/null || true; fi
if [ -f "$ROOT/logs/frontend.pid" ]; then kill "$(cat "$ROOT/logs/frontend.pid")" 2>/dev/null || true; fi
echo "SAEDGE services stopped."
