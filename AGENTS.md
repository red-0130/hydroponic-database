# AGENTS.md - Hydroponic Database System

Welcome to the **Hydroponic Database** repository. This document defines the engineering standards, architecture, data schemas, security rules, and workflows required for all AI agents and developers working on this project.

---

## 1. Project Vision & Purpose

The **Hydroponic Database** is a modern, responsive full-stack web application designed for hydroponic hobbyists and commercial growers. It provides:
1. **Public Plant Directory**: Search and filter vegetables, herbs, and fruiting plants with precise nutrient requirements:
   - **pH Range** (acidity/alkalinity)
   - **EC** (Electrical Conductivity in mS/cm)
   - **cF** (Conductivity Factor: $EC \times 10$)
   - **PPM 500 Scale** (TDS / Hanna factor: $EC \times 500$)
   - **PPM 700 Scale** (Truncheon / Eutech factor: $EC \times 700$)
   - Optimal temperature ranges, growth tips, and botanical details.
2. **Interactive Grower Tools**: Unit converter and scale synchronizer (EC ↔ cF ↔ PPM 500 ↔ PPM 700).
3. **Secret Admin Portal**: Accessible only via a configured secret route with password authentication, enabling complete CRUD management of plant records, bulk CSV/JSON import/export, and database seeding.

---

## 2. Technology Stack & Architectural Decisions

Agents must adhere to the following stack:

| Layer | Technology | Details |
|---|---|---|
| **Runtime & Package Manager** | **Bun** | `bun` runtime and package manager is available and preferred for all JS/TS execution and dependency management |
| **Python Tooling** | **uv** | `uv` is available and preferred for Python scripts, virtual environments, and CLI tools |
| **Framework** | **Next.js (App Router)** | TypeScript, React Server Components (RSC) where applicable |
| **Styling** | **Tailwind CSS** + **Lucide React** | Clean, accessible, mobile-first responsive design with Dark/Light mode |
| **Database** | **SQLite** (`better-sqlite3` or `libsql`) | File-based local SQLite for development and single-container deployments |
| **ORM & Migrations** | **Drizzle ORM** | Type-safe SQL-like queries, drizzle-kit migrations |
| **Data Validation** | **Zod** | Shared schemas between server actions / API routes and client forms |
| **Authentication** | **Custom HTTP-only Cookie Session** | Timing-safe admin password validation against `.env` hash |
| **Unit Testing** | **Vitest** | Comprehensive unit tests for conversion math and data validation |
| **E2E Testing** | **Playwright** | Full user journey and admin authentication/CRUD verification |

---

## 3. Hydroponic Metrics & Conversion Logic

### 3.1 Standard Formulations
All agents must implement the standard mathematical conversions:
- **Conductivity Factor (cF)**:
  $$\text{cF} = \text{EC} \times 10$$
- **PPM 500 Scale (Hanna / US Standard)**:
  $$\text{PPM}_{500} = \text{EC} \times 500$$
- **PPM 700 Scale (Truncheon / UK / AU Standard)**:
  $$\text{PPM}_{700} = \text{EC} \times 700$$
- **pH**:
  Expressed as a decimal range between `0.0` and `14.0` (typically `5.5` to `6.8` for hydroponics).

### 3.2 Calculation vs. Override Rule
- By default, when an admin or seeder inputs `ecMin` and `ecMax`, the system **automatically computes** `cfMin/Max`, `ppm500Min/Max`, and `ppm700Min/Max`.
- The database schema supports an `isCustomCalculations` boolean flag. If `true`, explicitly supplied custom values for `cF`, `PPM500`, or `PPM700` are preserved.
- On the public UI, values must display with consistent precision:
  - EC: 1 or 2 decimal places (e.g., `1.8 - 2.4 mS/cm`)
  - cF: 0 or 1 decimal place (e.g., `18 - 24 cF`)
  - PPM (500 & 700): rounded integer (e.g., `900 - 1200 PPM` and `1260 - 1680 PPM`)
  - pH: 1 decimal place (e.g., `5.8 - 6.3`)

---

## 4. Database Schema (Drizzle ORM)

File location: `src/db/schema.ts`

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const plants = sqliteTable('plants', {
  id: text('id').primaryKey(), // nanoid or uuidv4
  name: text('name').notNull(), // e.g. "Romaine Lettuce"
  scientificName: text('scientific_name'), // e.g. "Lactuca sativa var. longifolia"
  category: text('category').notNull(), // 'Leafy Greens' | 'Herbs' | 'Fruiting' | 'Root Vegetables' | 'Brassicas' | 'Other'
  
  // pH Range
  phMin: real('ph_min').notNull(),
  phMax: real('ph_max').notNull(),
  
  // Electrical Conductivity (mS/cm)
  ecMin: real('ec_min').notNull(),
  ecMax: real('ec_max').notNull(),
  
  // Derived or Overridden Nutrient Metrics
  cfMin: real('cf_min').notNull(),
  cfMax: real('cf_max').notNull(),
  ppm500Min: integer('ppm500_min').notNull(),
  ppm500Max: integer('ppm500_max').notNull(),
  ppm700Min: integer('ppm700_min').notNull(),
  ppm700Max: integer('ppm700_max').notNull(),
  isCustomCalculations: integer('is_custom_calculations', { mode: 'boolean' }).default(false).notNull(),

  // Environment & Growing Profile
  tempMinC: real('temp_min_c'), // °C min (optional)
  tempMaxC: real('temp_max_c'), // °C max (optional)
  growthTips: text('growth_tips'), // Hydroponic tips, nutrient sensitivity notes
  imageUrl: text('image_url'), // Plant thumbnail or photo URL

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
```

---

## 5. Security & Secret Admin Endpoint Specifications

### 5.1 Route Configuration
- The admin entry point **MUST NOT** be hardcoded to `/admin`.
- Instead, read the route dynamically from environment variable:
  ```env
  ADMIN_SECRET_PATH="sys-portal-8f2e9d" # Access path: http://localhost:3000/sys-portal-8f2e9d
  ADMIN_PASSWORD_HASH="$argon2id$..." # Or bcrypt hash
  ADMIN_SESSION_SECRET="super-secure-random-key"
  ```
- Any unauthorized direct access to standard `/admin` or `/dashboard` paths must return a clean `404 Not Found`.

### 5.2 Protection & Privacy
- **Robots.txt & Sitemap**:
  The `robots.txt` file must include:
  ```txt
  User-agent: *
  Disallow: /api/admin/
  Disallow: /*portal*
  ```
  The secret route must **never** be listed in `sitemap.xml`.
- **Timing Attacks**:
  Compare submitted passwords using constant-time string comparison (`crypto.timingSafeEqual`) to prevent timing side-channel analysis.
- **Session Cookies**:
  - `admin_session` must be `HttpOnly`, `SameSite=Lax` (or `Strict`), and `Secure` in production.
  - Session tokens should be signed JWTs or encrypted tokens with a 12-hour expiry.
- **Brute Force Protection**:
  Implement rate limiting (e.g. 5 failed attempts per 15 minutes per IP) before locking out login attempts.

---

## 6. User Interface Specifications

### 6.1 Public Explorer (`/`)
1. **Header & Quick Stats**:
   - App title & branding: "Hydroponic Database"
   - Active plant count and category quick filters.
   - Quick Unit Converter button (opens popup/drawer to convert any EC/PPM value on the fly).
2. **Search & Filters**:
   - Live debounced text search (matches plant common name and scientific name).
   - Category filter pills (All, Leafy Greens, Herbs, Fruiting Crops, Root Vegetables, etc.).
   - PPM Scale Selector preference toggle (Default to show both side-by-side or highlight user's preferred scale).
3. **Dual View Toggle**:
   - **Card Grid View**: Rich visual cards with nutrient badges, ideal pH range meter, and expandable drawer.
   - **Compact Table View**: High-density sortable table for fast multi-plant comparison during nutrient reservoir mixing.
4. **Plant Detail Modal / Drawer**:
   - Detailed metric breakdown: pH, EC, cF, PPM (500), PPM (700).
   - Temperature recommendations in °C and °F.
   - Practical hydroponic tips (e.g., "Prone to tip-burn under high light; keep EC on lower end during hot summers").

### 6.2 Admin Management Dashboard (`/[ADMIN_SECRET_PATH]`)
1. **Login Page**:
   - Clean, minimalist authentication form requiring the master admin password.
   - Clear error notifications on failed authentication without revealing implementation details.
2. **Management Console**:
   - **Data Table**: Searchable, paginated plant list with quick edit and delete actions.
   - **Plant Form Modal (Add / Edit)**:
     - Input fields for Common Name, Scientific Name, Category, Image URL, Temp min/max, Tips.
     - pH inputs (`phMin`, `phMax`).
     - EC inputs (`ecMin`, `ecMax`).
     - **Live Auto-Calculation Preview**: As the admin types EC values, the preview automatically updates `cF`, `PPM 500`, and `PPM 700`.
     - "Override Calculations" toggle switch: Allows manual adjustment of individual scale values if desired.
   - **Bulk Management**:
     - Export all entries as JSON or CSV.
     - Import entries from JSON/CSV with validation preview before saving.
     - "Seed Standard Crops" button (populates common crops like Lettuce, Basil, Spinach, Tomato, Strawberry, Bell Pepper, Cucumber, Mint).

---

## 7. Directory Structure

Agents should organize code following this structure:

```
/workspaces/hydrophonic-database/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout & theme provider
│   │   ├── page.tsx                # Public search & database interface
│   │   ├── [adminSecretPath]/      # Dynamic secret admin route
│   │   │   ├── page.tsx            # Admin dashboard or login
│   │   ├── api/
│   │   │   ├── admin/              # Admin CRUD and seed endpoints
│   │   │   │   ├── auth/           # Login / logout handlers
│   │   │   │   ├── plants/         # Create, update, delete handlers
│   │   │   │   └── seed/           # Database seeding handler
│   │   │   └── plants/             # Public read-only plants API
│   │   └── robots.ts               # Robots disallowing secret paths
│   ├── components/
│   │   ├── public/
│   │   │   ├── PlantCard.tsx       # Grid card display
│   │   │   ├── PlantTable.tsx      # High-density comparison table
│   │   │   ├── SearchBar.tsx       # Live debounced search
│   │   │   ├── UnitConverter.tsx   # Interactive EC/cF/PPM calculator
│   │   │   └── PlantDetailModal.tsx# Deep-dive view
│   │   ├── admin/
│   │   │   ├── AdminLoginForm.tsx  # Secret login
│   │   │   ├── PlantFormModal.tsx  # Add/Edit with live preview
│   │   │   └── BulkDataActions.tsx # Export / Import / Seed
│   │   └── ui/                     # Reusable UI primitives (Button, Modal, Input, Badge)
│   ├── db/
│   │   ├── index.ts                # SQLite connection client
│   │   ├── schema.ts               # Drizzle table schemas
│   │   └── seedData.ts             # Predefined rich hydroponic dataset
│   ├── lib/
│   │   ├── calculations.ts         # EC, cF, PPM 500 & 700 conversion math
│   │   ├── auth.ts                 # Session verify, password hash, timingSafeEqual
│   │   ├── validators.ts           # Zod schemas for plants & queries
│   │   └── utils.ts                # Tailwind merge and general helpers
│   └── middleware.ts               # Route guard for secret admin portal
├── tests/
│   ├── unit/
│   │   ├── calculations.test.ts    # Precision & range math tests
│   │   └── validators.test.ts      # Schema validation tests
│   └── e2e/
│       ├── public-search.spec.ts   # Search, filters, and unit converter
│       └── admin-flow.spec.ts      # Secret route auth, CRUD, seed
├── drizzle.config.ts               # Drizzle ORM configuration
├── vitest.config.ts                # Vitest configuration
├── playwright.config.ts            # Playwright configuration
├── package.json
└── tsconfig.json
```

---

## 8. Agent Engineering Rules & Best Practices

All AI agents writing or modifying code in this repository must comply with:

1. **Preferred Tooling & Runtimes**:
   - **Bun Runtime**: The `bun` runtime is available and preferred for running scripts, dependency management, and executing tests/builds (`bun install`, `bun run dev`, `bun run build`, `bun test`).
   - **uv Tool**: The `uv` tool is available and preferred for Python environment management, package resolution, and running Python utilities/scripts (`uv run`, `uvx`).
2. **Strict Type Safety**:
   - `strict: true` in `tsconfig.json`. No `any` types allowed without explicit comment justification.
   - All API requests and server actions must validate input payloads with Zod schemas.
3. **Accurate Hydroponic Math**:
   - Never approximate PPM conversions using arbitrary factors. Always use exact standard ratios ($500$ and $700$).
   - Never allow inverted ranges where `min > max` for pH, EC, or temperature. Validate with Zod `.refine()`.
4. **Security Standards**:
   - Never commit actual passwords or session secrets to git. Always use `.env.example` as a template.
   - Never render the secret admin path in any public page links or scripts.
   - Always sanitize plant data rendered to the DOM to prevent XSS.
5. **Verification Protocol**:
   - Before completing any task, run:
     ```bash
     bun run lint
     bun run test
     bun run build
     ```
   - All tests must pass with zero errors.

---

## 9. Initial Seed Dataset Reference

The application should come pre-configured with standard verified commercial hydroponic targets:

| Crop | pH Range | EC (mS/cm) | cF Range | PPM 500 (Hanna) | PPM 700 (Eutech) | Notes |
|---|---|---|---|---|---|---|
| **Lettuce (Head/Bibb)** | 5.5 - 6.5 | 0.8 - 1.2 | 8 - 12 | 400 - 600 | 560 - 840 | Cool temp lover; prone to tip-burn if EC is high. |
| **Basil (Sweet Genovese)** | 5.5 - 6.5 | 1.0 - 1.6 | 10 - 16 | 500 - 800 | 700 - 1120 | Warmth required. Lower EC prevents woody stems. |
| **Spinach** | 5.5 - 6.6 | 1.0 - 1.8 | 10 - 18 | 500 - 900 | 700 - 1260 | Highly sensitive to root heat; keep reservoir < 20°C. |
| **Tomato (Fruiting)** | 5.8 - 6.5 | 2.0 - 3.5 | 20 - 35 | 1000 - 1750 | 1400 - 2450 | Heavy feeder. Higher potassium during fruit set. |
| **Bell Pepper** | 5.8 - 6.5 | 1.8 - 2.6 | 18 - 26 | 900 - 1300 | 1260 - 1820 | Sensitive to calcium deficiency (blossom end rot). |
| **Strawberry** | 5.5 - 6.2 | 1.0 - 1.4 | 10 - 14 | 500 - 700 | 700 - 980 | Very low EC tolerance; easily damaged by salt buildup. |
| **Cucumber** | 5.5 - 6.0 | 1.7 - 2.5 | 17 - 25 | 850 - 1250 | 1190 - 1750 | Rapid water consumer; monitor reservoir depletion. |
| **Mint (Spearmint)** | 5.5 - 6.5 | 1.2 - 2.2 | 12 - 22 | 600 - 1100 | 840 - 1540 | Vigorous grower; benefits from frequent trimming. |
