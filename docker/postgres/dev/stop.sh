#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"

if ! command -v docker &>/dev/null; then
  echo "[error] docker command not found. Install Docker to continue." >&2
  exit 1
fi

if command -v docker compose &>/dev/null; then
  docker compose -f "${COMPOSE_FILE}" down
else
  docker-compose -f "${COMPOSE_FILE}" down
fi

echo "PostgreSQL container stopped."
