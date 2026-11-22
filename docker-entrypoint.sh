#!/bin/sh
set -e

export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export DATABASE_URL="${DATABASE_URL:-file:/app/data/hydroponics.db}"

# If DATABASE_URL is a file path, ensure directory exists and initial seed file is copied if absent
if echo "$DATABASE_URL" | grep -q '^file:'; then
  DB_PATH=$(echo "$DATABASE_URL" | sed 's/^file://')
  DB_DIR=$(dirname "$DB_PATH")

  if [ ! -d "$DB_DIR" ]; then
    mkdir -p "$DB_DIR" 2>/dev/null || true
  fi

  # Copy seed template if target database does not exist
  if [ ! -f "$DB_PATH" ] && [ -f /app/hydroponics.db.template ]; then
    echo "[entrypoint] Initializing database at $DB_PATH from seed template..."
    cp /app/hydroponics.db.template "$DB_PATH"
  fi
fi

exec "$@"
