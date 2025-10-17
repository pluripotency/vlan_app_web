#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_DATABASE_URL="postgres://vlan:vlanpass@localhost:5432/vlan_app"

BACK_PID=""

cleanup() {
  local exit_code=$?

  if [[ -n "$BACK_PID" ]]; then
    kill "$BACK_PID" 2>/dev/null || true
    wait "$BACK_PID" 2>/dev/null || true
  fi

  if [[ -f "$ROOT_DIR/docker/postgres/dev/stop.sh" ]]; then
    "$ROOT_DIR/docker/postgres/dev/stop.sh" || true
  fi

  exit "$exit_code"
}
trap cleanup EXIT INT TERM

echo "Building frontend..."
(
  cd "$ROOT_DIR/front"
  npm run build
)

echo "Building backend..."
(
  cd "$ROOT_DIR/back"
  npm run build
)

"$ROOT_DIR/docker/postgres/dev/start.sh"

echo "Starting backend server (production)..."
(
  cd "$ROOT_DIR/back"
  export DATABASE_URL="${DATABASE_URL:-$DEFAULT_DATABASE_URL}"
  export PORT="${PORT:-3001}"
  npm run start
) &
BACK_PID=$!

cat <<INFO
Backend running on http://localhost:${PORT:-3001}
Static frontend served from backend dist/
Press Ctrl+C to stop everything.
INFO

wait "$BACK_PID"
