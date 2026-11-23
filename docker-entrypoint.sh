#!/bin/sh
set -e

export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export DATABASE_URL="${DATABASE_URL:-file:/app/data/hydroponics.db}"

# If DATABASE_URL is a file path, derive DB_DIR, otherwise default to /app/data
if echo "$DATABASE_URL" | grep -q '^file:'; then
  DB_PATH=$(echo "$DATABASE_URL" | sed 's/^file://')
  DB_DIR=$(dirname "$DB_PATH")
else
  DB_PATH=""
  DB_DIR="/app/data"
fi

# Ensure persistent uploads directory exists in data volume
UPLOADS_DATA_DIR="$DB_DIR/uploads"
mkdir -p "$UPLOADS_DATA_DIR" 2>/dev/null || true

# If /app/public/uploads is not a mounted volume, symlink to persistent storage
if ! grep -qs " /app/public/uploads " /proc/mounts 2>/dev/null; then
  if [ ! -L /app/public/uploads ] || [ "$(readlink /app/public/uploads 2>/dev/null)" != "$UPLOADS_DATA_DIR" ]; then
    if [ -d /app/public/uploads ] && [ ! -L /app/public/uploads ]; then
      cp -rn /app/public/uploads/. "$UPLOADS_DATA_DIR"/ 2>/dev/null || true
      rm -rf /app/public/uploads 2>/dev/null || true
    elif [ -L /app/public/uploads ]; then
      rm -f /app/public/uploads 2>/dev/null || true
    fi
    if [ ! -e /app/public/uploads ]; then
      ln -s "$UPLOADS_DATA_DIR" /app/public/uploads 2>/dev/null || true
    fi
  fi
fi

# If running as root, ensure directories exist and permissions are set for nextjs
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DB_DIR" "$UPLOADS_DATA_DIR" 2>/dev/null || true
  chown -R nextjs:nodejs "$DB_DIR" 2>/dev/null || true
  chown -h nextjs:nodejs /app/public/uploads 2>/dev/null || true
  chmod 775 "$DB_DIR" "$UPLOADS_DATA_DIR" 2>/dev/null || true
else
  if [ ! -d "$DB_DIR" ]; then
    mkdir -p "$DB_DIR" 2>/dev/null || true
  fi
fi

# Copy seed template if target database does not exist
if [ -n "$DB_PATH" ] && [ ! -f "$DB_PATH" ] && [ -f /app/hydroponics.db.template ]; then
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

# If running as root and gosu is available, execute command as nextjs user
if [ "$(id -u)" = "0" ] && command -v gosu >/dev/null 2>&1; then
  exec gosu nextjs "$@"
fi

exec "$@"
