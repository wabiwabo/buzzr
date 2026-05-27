# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Buzzr is a multi-tenant waste management platform for Indonesian government DLH (Dinas Lingkungan Hidup). Turborepo monorepo with NestJS API, React admin dashboard, and React Native (Expo) mobile app.

## Commands

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL/PostGIS, Redis, MinIO)
docker compose -f docker/docker-compose.dev.yml up -d

# Run all apps in dev mode
pnpm run dev

# Run individual apps
pnpm run dev --filter=@buzzr/api     # NestJS on :3000
pnpm run dev --filter=@buzzr/web     # Vite on :5173
cd apps/mobile && npx expo start     # Expo dev server

# Build
pnpm run build

# Test
pnpm run test                        # All tests via turbo
cd apps/api && npx jest              # API tests only
cd apps/api && npx jest --testPathPattern=auth  # Single module tests

# Type checking (no jest tests for web/mobile)
cd apps/web && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit

# Seed demo data (requires running PostgreSQL)
pnpm run db:seed

# Production
docker compose -f docker/docker-compose.yml up --build
```

## Architecture

### Multi-Tenancy (Schema-per-Tenant)

Every request needs `X-Tenant-Slug` header. `TenantMiddleware` resolves slug → schema, validates the schema name with regex, then sets `SET search_path TO '{schema}', public`. Routes excluded from middleware: `/health`, auth/super-admin, tenants CRUD, payment webhooks.

**All services use raw SQL via `DataSource.query()`** — not TypeORM entities — because TypeORM doesn't natively support dynamic schema switching. Use parameterized queries (`$1, $2`) for all user-facing values.

### NestJS Module Pattern

Each feature module follows: `module.ts` → `controller.ts` → `service.ts` → `service.spec.ts`. Controllers use `@UseGuards(JwtAuthGuard)` + `@Roles(...)` + `@UseGuards(RolesGuard)`. Get tenant info via `@TenantSchema()` and `@TenantId()` param decorators.

8 roles: `citizen`, `sweeper`, `tps_operator`, `collector`, `driver`, `tpst_operator`, `dlh_admin`, `super_admin`. Citizens authenticate via OTP, all others via email/password.

### Key Modules

- **auth** — JWT (access 15min / refresh 7d) + OTP via Redis TTL
- **tracking** — WebSocket gateway (Socket.IO) + Redis pub/sub for real-time GPS
- **payment** — Xendit integration (stubbed), wallet service, reward points
- **upload** — MinIO file uploads with per-tenant buckets, presigned URLs (7-day expiry)
- **health** — `/health` endpoint checking DB, Redis, MinIO (excluded from `api/v1` prefix)

### Shared Packages

- `@buzzr/shared-types` — TypeScript enums (UserRole, WasteCategory, ComplaintCategory, PaymentStatus, etc.)
- `@buzzr/constants` — Indonesian label maps (ROLE_LABELS, WASTE_CATEGORY_LABELS, etc.)
- `@buzzr/validators` — Zod schemas for auth/TPS validation

### Frontend Apps

**Web (React + Vite + shadcn/ui + Tailwind v4):** Admin dashboard at `apps/web/`. Zustand auth store, Axios with token/tenant interceptors. Vite proxies `/api` to `:3000` (override with `API_PROXY_TARGET` + `WEB_PORT` env vars).

**Mobile (React Native + Expo):** Role-based navigation at `apps/mobile/`. Each role has its own tab navigator (CitizenTabs, DriverTabs, etc.). Shared utils in `apps/mobile/src/utils/format.ts`. SafeArea handled via `withSafeArea` HOC in each tab navigator.

### Database

PostgreSQL 16 + PostGIS 3.4. `docker/postgres/init.sql` creates extensions, `public.tenants` table, and `create_tenant_schema()` function (14 tables per tenant). Geometry columns use SRID 4326.

### Infrastructure

- **Redis** — OTP storage, GPS rate limiting, Socket.IO adapter, caching
- **MinIO** — S3-compatible object storage for photos/documents
- **Nginx** — Reverse proxy in production (WebSocket upgrade for `/socket.io`)
- **Socket.IO namespaces** — `/tracking` (GPS streams from drivers) and `/notifications` (real-time alerts). Both join tenant-scoped rooms.
- **Expo Push** — `notification.service` fires push via `expo-server-sdk` after the WS broadcast. Mobile clients register tokens via `POST /users/me/push-token`; logout clears with `{token: null}`.
- **CI** — `.github/workflows/ci.yml` runs typecheck × 3 apps + jest + vite build on every PR. `ci-passed` is the single status check for branch protection.

### Page Redesign Pattern (folder-based)

TPS, Complaint, Fleet, Schedule, Payment, Report all follow this layout:
`pages/<Name>Page/{index.tsx, types.ts, api.ts, store.ts, components/, tabs/}`.
`index.tsx` is a tab router with `?tab=...` URL sync. `store.ts` is a Zustand store + a pure `computeAnalytics()` helper. Data fetched at the layout level and shared across tabs via the store. Numeric coercion (`Number()`) on API responses happens in `api.ts`.

### TypeORM gotchas

Postgres `NUMERIC` / `numeric(12,2)` columns deserialize as **strings** via `dataSource.query()`. Coerce with `Number()` at the API boundary (services or web `api.ts` layer) or frontend math silently breaks.

### Workspace packages

`@buzzr/shared-types`, `@buzzr/constants`, `@buzzr/validators` all point `main`/`types` at `dist/`. Build once before downstream apps can resolve them in a fresh checkout:

```bash
pnpm -r --filter "./packages/*" run build
```

CI does this automatically per job; local devs only need it after `pnpm install` or when modifying packages. The emitted `.js`/`.d.ts` files are gitignored.

## Testing

API tests use Jest + `@nestjs/testing` with `Test.createTestingModule`. All external deps (DataSource, Redis, ConfigService, Gateways) are mocked. ~20 test suites, 110+ tests. Run single test file: `cd apps/api && npx jest path/to/file.spec.ts`.

## Local dev gotchas

- Host's shared `buzzr-postgres` container may be reused by other projects with the wrong schema. For isolated verification: `docker run -d --name buzzr-postgres-dev -p 127.0.0.1:5441:5432 -v $PWD/docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro postgis/postgis:16-3.4`.
- `init.sql` calls `create_tenant_schema('dlh_demo')` on first boot. Seed script also calls it. Re-running seed on a freshly-initialized DB fails with "relation already exists" — drop the dlh_demo schema first or wipe the volume.
- All demo accounts share password `demo1234` (from `DEMO_PASSWORD` in `apps/api/src/database/seeds/demo.seed.ts`). Default admin: `dlh@demo.buzzr.id`.

## Mobile development

- Dev API URL auto-resolves from Expo `hostUri` so phones on Wi-Fi automatically reach the dev machine; override via env `EXPO_PUBLIC_API_URL=http://host:port/api/v1`.
- `POST /auth/refresh` is wired; the axios response interceptor in `apps/mobile/src/services/api.ts` auto-refreshes on 401 with concurrent-request coalescing.
- When adding mobile deps, run `pnpm add` then **also** run `pnpm install` from the monorepo root or the workspace lockfile drifts and CI's `--frozen-lockfile` rejects it.
- Driver GPS streams via Socket.IO (`useTrackingSocket`) with REST fallback when offline. Admin/all roles get real-time notifications via `useNotificationsSocket`.

## Environment

Copy `.env.example` to `.env`. Key vars: DATABASE_*, REDIS_*, REDIS_PASSWORD, MINIO_*, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET. Optional: EXPO_ACCESS_TOKEN (push notifications), EXPO_PUBLIC_API_URL (mobile dev override). Dev credentials in `docker-compose.dev.yml`.
