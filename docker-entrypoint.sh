#!/bin/sh
set -e

export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export DATABASE_URL="${DATABASE_URL:-file:/app/data/hydroponics.db}"

# If DATABASE_URL is a file path, ensure directory exists and initial seed file is copied if absent
if echo "$DATABASE_URL" | grep -q '^file:'; then
  DB_PATH=$(echo "$DATABASE_URL" | sed 's/^file://')
  DB_DIR=$(dirname "$DB_PATH")

  # If running as root, ensure directories exist and permissions are set for nextjs
  if [ "$(id -u)" = "0" ]; then
    mkdir -p "$DB_DIR" /app/public/uploads 2>/dev/null || true
    chown -R nextjs:nodejs "$DB_DIR" /app/public/uploads 2>/dev/null || true
    chmod 775 "$DB_DIR" 2>/dev/null || true
  else
    if [ ! -d "$DB_DIR" ]; then
      mkdir -p "$DB_DIR" 2>/dev/null || true
    fi
  fi

  # Copy seed template if target database does not exist
  if [ ! -f "$DB_PATH" ] && [ -f /app/hydroponics.db.template ]; then
    echo "[entrypoint] Initializing database at $DB_PATH from seed template..."
    if [ "$(id -u)" = "0" ]; then
      cp /app/hydroponics.db.template "$DB_PATH"
      chown nextjs:nodejs "$DB_PATH"
      chmod 664 "$DB_PATH" 2>/dev/null || true
    else
      if [ -w "$DB_DIR" ]; then
        cp /app/hydroponics.db.template "$DB_PATH"
      else
        echo "[entrypoint] ERROR: Destination directory '$DB_DIR' is not writable by current user (UID $(id -u))." >&2
        echo "[entrypoint] Please check volume permissions or run without --user override so entrypoint can configure volume ownership." >&2
        exit 1
      fi
    fi
  fi
fi

# If running as root and gosu is available, execute command as nextjs user
if [ "$(id -u)" = "0" ] && command -v gosu >/dev/null 2>&1; then
  exec gosu nextjs "$@"
fi

exec "$@"
