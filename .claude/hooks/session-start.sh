#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "=== TMCMS Session Start ==="

# Backend: install Python dependencies
echo "[1/4] Installing backend dependencies..."
pip install -q -r "$CLAUDE_PROJECT_DIR/backend/requirements.txt"

# Frontend: install Node dependencies
echo "[2/4] Installing frontend dependencies..."
cd "$CLAUDE_PROJECT_DIR/frontend"
npm install --prefer-offline --silent

# Build frontend into backend static dir
echo "[3/4] Building frontend..."
npm run build

# Start unified server (FastAPI serves both API + frontend)
echo "[4/4] Starting server..."
cd "$CLAUDE_PROJECT_DIR/backend"
export PYTHONPATH="$CLAUDE_PROJECT_DIR/backend"
echo "export PYTHONPATH=\"$CLAUDE_PROJECT_DIR/backend\"" >> "$CLAUDE_ENV_FILE"
nohup python run.py > /tmp/tmcms.log 2>&1 &
echo "Server PID: $!"

echo ""
echo "TMCMS is starting at http://localhost:8000"
echo "  Login: admin@example.com / admin1234"
echo "==========================="
