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

**Web (React + Vite + Ant Design):** Admin dashboard at `apps/web/`. Zustand auth store, Axios with token/tenant interceptors. Vite proxies `/api` to `:3000`.

**Mobile (React Native + Expo):** Role-based navigation at `apps/mobile/`. Each role has its own tab navigator (CitizenTabs, DriverTabs, etc.). Shared utils in `apps/mobile/src/utils/format.ts`. SafeArea handled via `withSafeArea` HOC in each tab navigator.

### Database

PostgreSQL 16 + PostGIS 3.4. `docker/postgres/init.sql` creates extensions, `public.tenants` table, and `create_tenant_schema()` function (14 tables per tenant). Geometry columns use SRID 4326.

### Infrastructure

- **Redis** — OTP storage, GPS rate limiting, Socket.IO adapter, caching
- **MinIO** — S3-compatible object storage for photos/documents
- **Nginx** — Reverse proxy in production (WebSocket upgrade for `/socket.io`)

## Testing

API tests use Jest + `@nestjs/testing` with `Test.createTestingModule`. All external deps (DataSource, Redis, ConfigService) are mocked. 18 test suites, 70 tests. Run single test file: `cd apps/api && npx jest path/to/file.spec.ts`.

## Environment

Copy `.env.example` to `.env`. Key vars: DATABASE_*, REDIS_*, MINIO_*, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET. Dev credentials in `docker-compose.dev.yml`.
