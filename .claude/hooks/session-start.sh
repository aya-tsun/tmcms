#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "=== TMCMS Session Start ==="

# Backend: install Python dependencies
echo "[1/3] Installing backend dependencies..."
pip install -q -r "$CLAUDE_PROJECT_DIR/backend/requirements.txt"

# Frontend: install Node dependencies
echo "[2/3] Installing frontend dependencies..."
cd "$CLAUDE_PROJECT_DIR/frontend"
npm install --prefer-offline

# Start backend server in background
echo "[3/3] Starting servers..."
cd "$CLAUDE_PROJECT_DIR/backend"
echo 'export PYTHONPATH="'"$CLAUDE_PROJECT_DIR/backend"'"' >> "$CLAUDE_ENV_FILE"
nohup python run.py > /tmp/tmcms-backend.log 2>&1 &
echo "Backend PID: $!"

# Start frontend dev server in background
cd "$CLAUDE_PROJECT_DIR/frontend"
nohup npm run dev > /tmp/tmcms-frontend.log 2>&1 &
echo "Frontend PID: $!"

echo ""
echo "TMCMS is starting up:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API docs: http://localhost:8000/docs"
echo "  Login:    admin@example.com / admin1234"
echo "==========================="
