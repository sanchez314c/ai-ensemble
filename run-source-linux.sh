#!/usr/bin/env bash
# ── AI Ensemble — Run from Source (Linux) ──
# Ports: Debug=60416 | Inspect=57514 | Fallback=56897

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="ai-ensemble"
ELECTRON_DEBUG_PORT=60416
ELECTRON_INSPECT_PORT=57514
ELECTRON_PORT=56897

# ── Sandbox fix ──
CURRENT=$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || echo "1")
if [ "$CURRENT" != "1" ]; then
  echo "[*] Enabling unprivileged user namespaces for Electron sandbox..."
  echo 1234 | sudo -S sysctl -w kernel.unprivileged_userns_clone=1 >/dev/null 2>&1 || true
fi

# ── Kill zombie Electron processes ──
ZOMBIE_PIDS=$(pgrep -f "electron.*${APP_NAME}" 2>/dev/null || true)
if [ -n "$ZOMBIE_PIDS" ]; then
  echo "[*] Killing zombie ${APP_NAME} processes: ${ZOMBIE_PIDS}"
  echo "$ZOMBIE_PIDS" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# ── Free assigned ports if occupied ──
for PORT in $ELECTRON_DEBUG_PORT $ELECTRON_INSPECT_PORT $ELECTRON_PORT; do
  PID=$(lsof -ti:$PORT 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "[*] Freeing port $PORT (PID: $PID)"
    kill -9 $PID 2>/dev/null || true
  fi
done

# ── Install deps if missing ──
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "[*] Installing dependencies..."
  cd "$SCRIPT_DIR" && npm install
fi

# ── Launch ──
echo "[*] Starting ${APP_NAME} from source..."
echo "    Debug port: ${ELECTRON_DEBUG_PORT}"
echo "    Inspect port: ${ELECTRON_INSPECT_PORT}"

cd "$SCRIPT_DIR"
NODE_ENV=development npx electron . \
  --no-sandbox \
  --disable-gpu-compositing \
  --remote-debugging-port=$ELECTRON_DEBUG_PORT \
  --inspect=$ELECTRON_INSPECT_PORT \
  "$@"
