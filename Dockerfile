# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM docker.io/library/node:20-slim AS deps
WORKDIR /app

# Install Bun for fast, locked dependency installation
COPY --from=docker.io/oven/bun:1-slim /usr/local/bin/bun /usr/local/bin/bun

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM docker.io/library/node:20-slim AS builder
WORKDIR /app

COPY --from=docker.io/oven/bun:1-slim /usr/local/bin/bun /usr/local/bin/bun
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production environment for build optimization
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js standalone bundle and pre-seed template database
RUN node node_modules/.bin/next build && \
    bun run src/db/seed.ts && \
    bun -e "import { client } from './src/db'; await client.execute('PRAGMA wal_checkpoint(TRUNCATE);');"

# -----------------------------------------------------------------------------
# Stage 3: Production Runner
# -----------------------------------------------------------------------------
FROM docker.io/library/node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/hydroponics.db"

# Create unprivileged system group and user, and persistent data directories
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs nextjs && \
    mkdir -p /app/data /app/public/uploads && \
    chown -R nextjs:nodejs /app

# Copy Next.js standalone distribution
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy pre-seeded template database
COPY --from=builder --chown=nextjs:nodejs /app/hydroponics.db /app/hydroponics.db.template

# Copy and setup entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

# Mount volume for persistent database storage
VOLUME ["/app/data"]

EXPOSE 3000

USER nextjs

HEALTHCHECK --interval=5s --timeout=3s --start-period=3s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/api/plants').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
