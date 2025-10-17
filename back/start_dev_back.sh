#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_DATABASE_URL="postgres://vlan:vlanpass@localhost:5432/vlan_app"

export DATABASE_URL="${DATABASE_URL:-$DEFAULT_DATABASE_URL}"
export PORT="${PORT:-3001}"
cd $ROOT_DIR
npm run start

