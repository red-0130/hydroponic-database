# Hydroponic Database

[![Next.js 15](https://img.shields.io/badge/Next.js-15_(App_Router)-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![SQLite / LibSQL](https://img.shields.io/badge/Database-SQLite_%2F_LibSQL-003B57?style=flat&logo=sqlite)](https://github.com/tursodatabase/libsql-client-ts)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle_ORM-C5F74F?style=flat)](https://orm.drizzle.team/)
[![Bun](https://img.shields.io/badge/Runtime-Bun-f472b6?style=flat&logo=bun)](https://bun.sh/)
[![Docker](https://img.shields.io/badge/Deployment-Docker_Multi--Stage-2496ED?style=flat&logo=docker)](https://www.docker.com/)
[![Vitest](https://img.shields.io/badge/Unit_Tests-Vitest_98_Passing-729B1B?style=flat&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/E2E_Tests-Playwright_Tiers_1--4-45ba4b?style=flat&logo=playwright)](https://playwright.dev/)
[![GHCR](https://img.shields.io/badge/Registry-GitHub_Container_Registry_(ghcr.io)-2496ED?style=flat&logo=github)](https://ghcr.io)

A modern, high-performance, and responsive full-stack hydroponics database application built for hobbyist growers and commercial greenhouse operations. It provides an interactive crop directory with verified nutrient profiles, dynamic electrical conductivity (EC) and parts-per-million (PPM) unit conversion, crop diagnostic issue tracking, and an administrative management portal protected by dynamic secret routing and timing-safe authentication.

---

## Key Features

### 1. Public Crop Explorer (`/`)
- **Live Debounced Search**: Real-time filtering across crop common names and botanical/scientific names.
- **Category Filter Pills**: Quickly filter by *Leafy Greens*, *Herbs*, *Fruiting*, *Root Vegetables*, *Brassicas*, and *Other*.
- **Dual Display Modes**:
  - **Card Grid View**: Rich visual cards featuring nutrient badges, ideal pH range meters, temperature ranges, and expandable drawers.
  - **Compact Comparison Table**: High-density, sortable table for side-by-side nutrient reservoir planning.
- **Deep-Dive Plant Detail Modal**: Detailed nutrient breakdown, temperature preferences in Celsius and Fahrenheit, light photoperiod requirements (hours/day and DLI), growth notes, and common physiological issues.
- **Crop Deficiency & Diagnostic Guides**: Built-in visual troubleshooting guides for tip-burn, blossom end rot, chlorosis, and root temperature stress with actionable corrective steps.

### 2. Interactive Hydroponic Unit Converter
- **Bidirectional Scale Synchronizer**: Instantly converts between Electrical Conductivity (**EC**), Conductivity Factor (**cF**), **PPM 500** (Hanna standard), and **PPM 700** (Eutech / Truncheon standard).
- **Temperature Converter**: Bidirectional Celsius (°C) ↔ Fahrenheit (°F) conversion.
- Accessible from both the public explorer navigation bar and the admin creation modal.

### 3. Secret Administrative Management Portal (`/[ADMIN_SECRET_PATH]`)
- **Dynamic Secret Route**: Completely decouples admin access from standard paths. The route path is configurable via `ADMIN_SECRET_PATH` (e.g., `sys-portal-8f2e9d`).
- **Route Shielding**: Direct requests to `/admin` or `/dashboard` immediately return `404 Not Found`. `robots.txt` explicitly disallows crawling admin paths.
- **Timing-Safe Authentication**: Protects password checks against side-channel timing attacks using constant-time evaluation (`crypto.timingSafeEqual`).
- **Brute-Force Rate Limiting**: Enforces a strict lockout window (5 failed attempts per 15 minutes per IP address).
- **Secure Sessions**: Issues signed, tamper-proof, HTTP-only session cookies with 12-hour expiry.
- **Live Calculation Preview & Overrides**: As administrators input EC values, the interface auto-computes `cF`, `PPM 500`, and `PPM 700`. An optional "Override Calculations" toggle allows custom nutrient calibrations.
- **Comprehensive Plant & Issue Management**: Full CRUD capabilities for crops and associated deficiency issues.
- **Bulk Data Operations**:
  - Export the database to JSON or standard CSV.
  - Import records from JSON or CSV with a validation preview before applying changes.
  - One-click database seeding to restore verified commercial baselines.

---

## Hydroponic Metrics & Conversion Reference

Hydroponic nutrient concentration is measured via Electrical Conductivity (EC) or Total Dissolved Solids (TDS / PPM). Because different conductivity meters use different conversion factors, this application strictly implements standardized calculations:

### Standard Conversion Formulas

| Metric | Factor / Formula | Standard Usage |
|---|---|---|
| **Conductivity Factor (cF)** | $\text{cF} = \text{EC} \times 10$ | UK, Australia, New Zealand standard |
| **PPM 500 Scale** | $\text{PPM}_{500} = \text{EC} \times 500$ | Hanna, Milwaukee, US standard (TDS factor 0.5) |
| **PPM 700 Scale** | $\text{PPM}_{700} = \text{EC} \times 700$ | Eutech, Truncheon, UK/AU standard (TDS factor 0.7) |
| **Fahrenheit Conversion** | $^{\circ}\text{F} = (^{\circ}\text{C} \times 1.8) + 32$ | Temperature conversion |
| **Celsius Conversion** | $^{\circ}\text{C} = (^{\circ}\text{F} - 32) / 1.8$ | Temperature conversion |

---

## Quickstart & Local Development

### Prerequisites
- [Bun](https://bun.sh/) (v1.0 or newer)
- Node.js (v20+)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/hydrophonic-database.git
   cd hydrophonic-database
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to define your custom `ADMIN_SECRET_PATH`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.*

4. **Initialize and seed the database:**
   ```bash
   bun run db:seed
   ```

5. **Start the development server:**
   ```bash
   bun run dev
   ```
   Open `<app-url>` (e.g., `http://<your-domain>:3000` or `http://<custom-subdomain>:<port>`) in your browser.

---

## Production Docker Deployment

The application features a multi-stage Docker build utilizing Next.js standalone output and unprivileged user isolation.

### Option 1: Standalone Docker Run

1. **Build the Docker container image:**
   ```bash
   docker build -t hydroponic-database:latest .
   ```

2. **Run the container with persistent storage:**
   ```bash
   docker run -d \
     --name hydroponics-app \
     -p 3000:3000 \
     -v $(pwd)/hydro_data:/app/data \
     -e PORT=3000 \
     -e ADMIN_SECRET_PATH="sys-portal-8f2e9d" \
     -e ADMIN_PASSWORD="your-strong-production-password" \
     -e ADMIN_SESSION_SECRET="generate-a-64-character-hex-secret-here" \
     --restart unless-stopped \
     hydroponic-database:latest
   ```

### Option 2: Docker Compose (Recommended for Production)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  hydroponics:
    image: hydroponic-database:latest
    build:
      context: .
      dockerfile: Dockerfile
    container_name: hydroponic-database
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - DATABASE_URL=file:/app/data/hydroponics.db
      - ADMIN_SECRET_PATH=sys-portal-8f2e9d
      - ADMIN_PASSWORD=admin_hydroponics_secure_pass_2026
      - ADMIN_SESSION_SECRET=e9d8f2a1b7c3e4f50618293a4b5c6d7e8f90123456789abcdef0123456789abc
    volumes:
      - hydroponic_data:/app/data
      - hydroponic_uploads:/app/public/uploads
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('<app-url>/api/plants').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 5s

volumes:
  hydroponic_data:
    driver: local
  hydroponic_uploads:
    driver: local
```

Start the service:
```bash
docker compose up -d
```

> [!NOTE]
> On container startup, `docker-entrypoint.sh` automatically checks if `/app/data/hydroponics.db` exists. If empty, it initializes the database from `/app/hydroponics.db.template` so the container boots pre-seeded and ready to serve immediately.

### GitHub Container Registry (GHCR) Deployment

Pre-built multi-stage production images are automatically published to the GitHub Container Registry via GitHub Actions (`.github/workflows/docker-publish.yml`).

#### 1. Pulling from GHCR
```bash
docker pull ghcr.io/<owner>/hydrophonic-database:latest
```

#### 2. Running Standalone via Docker CLI
```bash
docker run -d \
  --name hydroponic-database \
  -p 3000:3000 \
  -e PORT=3000 \
  -e ADMIN_SECRET_PATH="sys-portal-8f2e9d" \
  -e ADMIN_PASSWORD="your-strong-admin-password" \
  -e ADMIN_SESSION_SECRET="your-secure-session-secret-at-least-32-chars" \
  -v hydroponic_data:/app/data \
  -v hydroponic_uploads:/app/public/uploads \
  --restart unless-stopped \
  ghcr.io/<owner>/hydrophonic-database:latest
```

#### 3. Docker Compose with Pre-Built Image
Replace `build:` with `image: ghcr.io/<owner>/hydrophonic-database:latest` in your `docker-compose.yml`:
```yaml
services:
  hydroponics:
    image: ghcr.io/<owner>/hydrophonic-database:latest
    container_name: hydroponic-database
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - DATABASE_URL=file:/app/data/hydroponics.db
      - ADMIN_SECRET_PATH=sys-portal-8f2e9d
      - ADMIN_PASSWORD=admin_hydroponics_secure_pass_2026
      - ADMIN_SESSION_SECRET=e9d8f2a1b7c3e4f50618293a4b5c6d7e8f90123456789abcdef0123456789abc
    volumes:
      - hydroponic_data:/app/data
      - hydroponic_uploads:/app/public/uploads
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/plants').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 5s
```

#### 4. Automated Image Tagging & Release Pipeline
The GitHub Actions workflow automates quality gates and semantic tagging:
- **Quality Gate**: Every build executes `bun run lint` (TypeScript compilation) and `bun test` (Vitest unit and API test suite) before container build and publication.
- **`latest` Tag**: Automatically updated on pushes to the `main` branch.
- **Semantic Releases**: Pushes of tags matching `v*.*.*` automatically generate `vX.Y.Z`, `vX.Y`, and `vX` container tags.
- **Commit SHA Tags**: Generates short commit SHA tags (e.g., `sha-a1b2c3d`) for immutable production rollback pinpoints.
- **Pull Requests**: Pull requests targeting `main` execute test suites and build the container image locally with Buildx cache to verify build integrity without pushing to GHCR.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `ADMIN_SECRET_PATH` | **Yes** | `sys-portal-8f2e9d` | Dynamic URL slug for the secret administrative portal. Never use standard paths like `admin`. |
| `ADMIN_PASSWORD` | **Yes** | — | Master administrative password verified using constant-time string comparison. |
| `ADMIN_SESSION_SECRET` | **Yes** | — | Cryptographic secret key used to sign session authorization cookies (HMAC-SHA256). |
| `DATABASE_URL` | No | `file:hydroponics.db` | SQLite / LibSQL database path. In Docker, defaults to `file:/app/data/hydroponics.db`. |
| `PORT` | No | `3000` | HTTP port the Next.js server listens on. |
| `HOSTNAME` | No | `0.0.0.0` | Network binding interface. |

---

## Secret Admin Portal & Security Model

The administration system is engineered with defense-in-depth principles:

1. **Accessing the Portal**:
   - Access the portal at `<app-url>/<ADMIN_SECRET_PATH>` (e.g., `https://<your-custom-domain>/sys-portal-8f2e9d` or `http://<your-domain-or-ip>:3000/sys-portal-8f2e9d`).
   - Entering `/admin` or `/dashboard` triggers middleware interception returning an explicit `404 Not Found`.
2. **Timing-Safe Password Evaluation**:
   - Passwords submitted to `/api/admin/auth/login` are validated using `crypto.timingSafeEqual`, preventing microsecond-level timing attacks.
3. **Rate Limiting**:
   - Monitored per client IP address. After 5 failed attempts within 15 minutes, login requests are rejected with `429 Too Many Requests` and a `Retry-After` header.
4. **Session Management**:
   - Authenticated sessions receive a signed `admin_session` cookie marked `HttpOnly`, `SameSite=Lax`, and `Secure` (in production).
5. **Search Engine Shielding**:
   - `robots.ts` automatically disallows `/api/admin/` and any path matching `/*portal*`, ensuring search engine bots do not index administrative access routes.

---

## REST API Reference

### Public Endpoints

| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/plants` | `q` (search string), `category` (filter category), `limit`, `offset` | Retrieves paginated list of plants matching search/filter criteria. |
| `GET` | `/api/plants/:id` | — | Retrieves single plant details including attached deficiency/issue guides. |

### Protected Administrative Endpoints

*All endpoints below require a valid `admin_session` cookie (except `/login`).*

| Method | Endpoint | Payload / Query | Description |
|---|---|---|---|
| `POST` | `/api/admin/auth/login` | `{ "password": "..." }` | Authenticates administrator, sets session cookie, returns status. |
| `POST` | `/api/admin/auth/logout` | — | Clears authentication session cookie. |
| `GET` | `/api/admin/auth/status` | — | Returns `{ "authenticated": true/false }`. |
| `GET` | `/api/admin/plants` | — | Lists all plants for administration. |
| `POST` | `/api/admin/plants` | Plant JSON object | Validates with Zod and creates a new plant entry. |
| `GET` | `/api/admin/plants/:id` | — | Fetches single plant for editing. |
| `PUT` | `/api/admin/plants/:id` | Partial or full Plant JSON | Updates existing plant fields and auto-calculates derived metrics. |
| `DELETE` | `/api/admin/plants/:id` | — | Deletes plant and cascades deletion to attached issues. |
| `POST` | `/api/admin/issues` | Issue JSON (`plantId`, `title`, etc.) | Adds a diagnostic deficiency/issue to a plant. |
| `PUT` | `/api/admin/issues/:id` | Issue JSON | Updates an existing diagnostic issue record. |
| `DELETE` | `/api/admin/issues/:id` | — | Removes a diagnostic issue record. |
| `POST` | `/api/admin/upload` | `multipart/form-data` (`file`) | Validates image MIME type and saves to `/public/uploads`. |
| `GET` | `/api/admin/export` | `format=json` or `format=csv` | Exports complete database with issues. |
| `POST` | `/api/admin/import` | `format=json|csv`, `previewOnly=true|false`, payload | Validates and imports bulk crop records. |
| `POST` | `/api/admin/seed` | — | Resets and re-seeds database with the standard 8 commercial crops. |

---

## Testing & Quality Assurance

This repository maintains rigorous unit, integration, end-to-end, and containerization verification suites:

### 1. Unit & Integration Tests (Vitest)
Executes 98 tests across conversion math, authentication security, schema validators, database relations, and API endpoints:
```bash
bun test
```

### 2. End-to-End Tests (Playwright)
Executes cross-browser user journeys across 4 distinct tiers:
- **Tier 1**: Core features (Public search, category filter, unit converter, modal inspection, admin login, plant CRUD).
- **Tier 2**: Boundary conditions and error handling (input bounds, rate limit enforcement, route shielding).
- **Tier 3**: Cross-feature interactions and data synchronization (live calculation overrides, issue cascading).
- **Tier 4**: Production workloads and bulk import/export (CSV multiline quotes, round-trip serialization).

```bash
bun run test:e2e
```

### 3. Automated Container Verification Suite
Builds the production Docker image, boots a temporary container, polls HTTP readiness, and executes 8 automated integration checks (route shielding, healthcheck, timing-safe login, API counts) with an automatic cleanup trap:
```bash
bun run verify:container
```

### 4. Code Quality & Type Checking
```bash
bun run lint      # Runs tsc --noEmit
bun run build     # Verifies production Next.js compilation
```

---

## License

This project is open-source and available under the [MIT License](LICENSE).
