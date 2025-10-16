#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
COMPOSE_FILE="${PROJECT_ROOT}/docker/postgres/docker-compose.yml"

if ! command -v docker &>/dev/null; then
  echo "[error] docker command not found. Install Docker to continue." >&2
  exit 1
fi

mkdir -p "${PROJECT_ROOT}/docker/postgres/data"

if command -v docker compose &>/dev/null; then
  docker compose -f "${COMPOSE_FILE}" up -d
else
  docker-compose -f "${COMPOSE_FILE}" up -d
fi

echo "PostgreSQL is starting. Use scripts/stop_postgres.sh to stop the service."
