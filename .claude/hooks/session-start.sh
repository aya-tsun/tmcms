#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "=== TMCMS Session Start ==="

# Backend: install Python dependencies only if requirements changed
echo "[1/4] Installing backend dependencies..."
REQ_FILE="$CLAUDE_PROJECT_DIR/backend/requirements.txt"
REQ_HASH_FILE="/tmp/tmcms_req_hash"
REQ_HASH=$(md5sum "$REQ_FILE" | cut -d' ' -f1)
if [ ! -f "$REQ_HASH_FILE" ] || [ "$(cat $REQ_HASH_FILE)" != "$REQ_HASH" ]; then
  pip install -q -r "$REQ_FILE"
  echo "$REQ_HASH" > "$REQ_HASH_FILE"
  echo "  → installed"
else
  echo "  → skipped (no changes)"
fi

# Frontend: install Node dependencies only if package.json changed
echo "[2/4] Installing frontend dependencies..."
cd "$CLAUDE_PROJECT_DIR/frontend"
PKG_HASH_FILE="/tmp/tmcms_pkg_hash"
PKG_HASH=$(md5sum package.json | cut -d' ' -f1)
if [ ! -d node_modules ] || [ ! -f "$PKG_HASH_FILE" ] || [ "$(cat $PKG_HASH_FILE)" != "$PKG_HASH" ]; then
  npm install --prefer-offline --silent
  echo "$PKG_HASH" > "$PKG_HASH_FILE"
  echo "  → installed"
else
  echo "  → skipped (no changes)"
fi

# Build frontend only if source files changed since last build
echo "[3/4] Building frontend..."
SRC_HASH_FILE="/tmp/tmcms_src_hash"
SRC_HASH=$(find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) | sort | xargs md5sum | md5sum | cut -d' ' -f1)
if [ ! -d dist ] || [ ! -f "$SRC_HASH_FILE" ] || [ "$(cat $SRC_HASH_FILE)" != "$SRC_HASH" ]; then
  npm run build
  echo "$SRC_HASH" > "$SRC_HASH_FILE"
else
  echo "  → skipped (no changes)"
fi

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
