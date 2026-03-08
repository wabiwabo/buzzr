# Development Guide

## Prerequisites

- **Node.js** 20+ (lihat `.nvmrc`)
- **pnpm** 9.15+ (`npm install -g pnpm`)
- **Docker** & Docker Compose
- **Git**

## Setup

```bash
git clone https://github.com/wabiwabo/buzzr.git
cd buzzr
pnpm install
cp .env.example .env
```

## Infrastructure

```bash
# Start PostgreSQL, Redis, MinIO
docker compose -f docker/docker-compose.dev.yml up -d

# Verify services running
docker compose -f docker/docker-compose.dev.yml ps
```

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5432 | buzzr / buzzr_secret |
| Redis | 6379 | - |
| MinIO API | 9000 | minioadmin / minioadmin |
| MinIO Console | 9001 | minioadmin / minioadmin |

## Seed Data

```bash
pnpm run db:seed
```

Membuat tenant demo `dlh-demo` dengan:
- 10 area (hierarki Jakarta)
- 8 user (satu per role, password: `demo1234`)
- 5 lokasi TPS dengan koordinat GPS Jakarta
- 2 kendaraan dan 2 jadwal

## Running Apps

```bash
# Semua sekaligus
pnpm run dev

# Individual
pnpm run dev --filter=@buzzr/api     # NestJS → http://localhost:3000
pnpm run dev --filter=@buzzr/web     # Vite → http://localhost:5173
cd apps/mobile && npx expo start     # Expo dev server
```

Web dashboard proxy otomatis `/api` ke `localhost:3000` via Vite config.

## Testing API

Semua request ke API memerlukan header:
```
X-Tenant-Slug: dlh-demo
```

Login untuk mendapatkan token:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: dlh-demo" \
  -d '{"email":"dlh@demo.buzzr.id","password":"demo1234"}'
```

Gunakan token di header:
```
Authorization: Bearer <accessToken>
```

## Project Structure

### Monorepo Layout

```
buzzr/
├── apps/
│   ├── api/          # NestJS backend
│   │   └── src/
│   │       ├── modules/       # Feature modules (15)
│   │       ├── common/        # Redis module, decorators
│   │       ├── config/        # App & database config
│   │       ├── database/      # TypeORM module, tenant middleware, seeds
│   │       └── health/        # Health check endpoint
│   ├── web/          # React admin dashboard
│   │   └── src/
│   │       ├── pages/         # 9 page components
│   │       ├── layouts/       # Dashboard layout
│   │       ├── services/      # API client
│   │       └── stores/        # Zustand stores
│   └── mobile/       # React Native (Expo)
│       └── src/
│           ├── screens/       # Per-role screen directories
│           ├── navigation/    # Tab navigators per role
│           ├── services/      # API client
│           ├── stores/        # Zustand stores
│           └── utils/         # Shared formatters
├── packages/
│   ├── shared-types/ # Enums (UserRole, WasteCategory, etc.)
│   ├── constants/    # Indonesian label maps
│   └── validators/   # Zod schemas
└── docker/           # Docker configs
```

### NestJS Module Pattern

Setiap feature module mengikuti pola:

```
modules/example/
├── example.module.ts      # Module declaration
├── example.controller.ts  # HTTP endpoints
├── example.service.ts     # Business logic (raw SQL)
└── example.service.spec.ts # Unit tests
```

**Controller pattern:**
```typescript
@Controller('examples')
@UseGuards(JwtAuthGuard)
export class ExampleController {
  constructor(private readonly service: ExampleService) {}

  @Post()
  @Roles('dlh_admin')
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateDto, @TenantSchema() schema: string) {
    return this.service.create(schema, dto);
  }
}
```

**Service pattern (raw SQL):**
```typescript
@Injectable()
export class ExampleService {
  constructor(private readonly dataSource: DataSource) {}

  async create(schema: string, dto: CreateDto) {
    const result = await this.dataSource.query(
      `INSERT INTO ${schema}.examples (name, value) VALUES ($1, $2) RETURNING *`,
      [dto.name, dto.value],
    );
    return result[0];
  }
}
```

> **Penting:** Gunakan raw SQL via `DataSource.query()`, bukan TypeORM entities. Schema tenant di-inject via parameter, bukan string interpolation untuk nilai user.

### Multi-Tenancy

1. Client mengirim `X-Tenant-Slug: dlh-demo`
2. `TenantMiddleware` resolve slug ke `schema_name` dari `public.tenants`
3. Middleware validasi schema name dengan regex `/^[a-z_][a-z0-9_]*$/`
4. `SET search_path TO '{schema}', public`
5. `req.tenantSchema` dan `req.tenantId` di-set untuk digunakan controller

Routes yang dikecualikan dari tenant middleware:
- `/health`
- `/api/v1/auth/super-admin/*`
- `/api/v1/tenants`
- `/api/v1/payments/webhook`

### Authentication & Authorization

**Dual auth mode:**
- **OTP** (SMS/WA): Untuk `citizen` dan `collector` — auto-register jika baru
- **Password**: Untuk semua role lainnya

**JWT tokens:**
- Access token: 15 menit
- Refresh token: 7 hari

**RBAC decorators:**
```typescript
@Roles('dlh_admin', 'super_admin')
@UseGuards(RolesGuard)
```

### Shared Packages

Import di NestJS dan React/React Native:
```typescript
import { UserRole, WasteCategory } from '@buzzr/shared-types';
import { ROLE_LABELS, WASTE_CATEGORY_LABELS } from '@buzzr/constants';
```

## Testing

```bash
# Semua test
pnpm run test

# API tests saja
cd apps/api && npx jest

# Satu file
cd apps/api && npx jest src/modules/auth/auth.service.spec.ts

# Watch mode
cd apps/api && npx jest --watch

# Type checking (web & mobile)
cd apps/web && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

**Test pattern** — mock semua dependencies:
```typescript
const module = await Test.createTestingModule({
  providers: [
    ExampleService,
    { provide: DataSource, useValue: { query: jest.fn() } },
  ],
}).compile();
```

18 test suites, 70 tests total.

## Adding a New Module

1. Buat directory `apps/api/src/modules/newmodule/`
2. Buat `newmodule.module.ts`, `controller.ts`, `service.ts`, `service.spec.ts`
3. Tambahkan ke `app.module.ts` imports
4. Jika perlu dikecualikan dari tenant middleware, tambahkan di `AppModule.configure()`

## Environment Variables

Lihat `.env.example` untuk daftar lengkap. Variable penting:

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `DATABASE_HOST` | PostgreSQL host | localhost |
| `DATABASE_PORT` | PostgreSQL port | 5432 |
| `DATABASE_USER` | DB username | buzzr |
| `DATABASE_PASSWORD` | DB password | buzzr_secret |
| `DATABASE_NAME` | DB name | buzzr |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `MINIO_ENDPOINT` | MinIO host | localhost |
| `MINIO_PORT` | MinIO API port | 9000 |
| `MINIO_ACCESS_KEY` | MinIO access key | minioadmin |
| `MINIO_SECRET_KEY` | MinIO secret key | minioadmin |
| `JWT_ACCESS_SECRET` | JWT signing secret | (required) |
| `JWT_REFRESH_SECRET` | Refresh token secret | (required) |
| `APP_PORT` | API server port | 3000 |

## Database

### Schema Initialization

`docker/postgres/init.sql` membuat:
- Extensions: `uuid-ossp`, `postgis`
- Tabel `public.tenants`
- Fungsi `create_tenant_schema(name)` yang membuat 14 tabel di schema baru

### Tabel Per Tenant

| Tabel | Deskripsi |
|-------|-----------|
| users | Data pengguna |
| areas | Hierarki wilayah |
| tps_locations | Lokasi TPS (dengan PostGIS coordinates) |
| vehicles | Armada kendaraan |
| schedules | Jadwal angkut |
| schedule_stops | TPS stops per jadwal |
| transfer_records | Catatan serah terima sampah |
| gps_logs | Log GPS tracking |
| transactions | Transaksi pembayaran |
| wallets | Saldo dompet digital |
| complaints | Pengaduan masyarakat |
| complaint_attachments | Lampiran foto pengaduan |
| notifications | Notifikasi pengguna |
| audit_logs | Log audit |

### Direct SQL

Untuk query manual ke database:
```bash
docker exec -it buzzr-postgres psql -U buzzr -d buzzr

# List schemas
\dn

# Query tenant data
SET search_path TO dlh_demo, public;
SELECT * FROM users;
```
