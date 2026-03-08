# Buzzr

Platform pengelolaan sampah terintegrasi untuk Dinas Lingkungan Hidup (DLH) pemerintah Indonesia. Menghubungkan seluruh rantai pengelolaan sampah — dari masyarakat penghasil sampah hingga TPST — dalam satu platform multi-tenant.

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Cache/Realtime | Redis 7 |
| Object Storage | MinIO (S3-compatible) |
| Admin Dashboard | React + Vite + Ant Design |
| Mobile App | React Native (Expo) |
| Monorepo | Turborepo + pnpm |

## Project Structure

```
buzzr/
├── apps/
│   ├── api/          # NestJS backend (15 modules, 56+ endpoints)
│   ├── web/          # React admin dashboard (9 pages)
│   └── mobile/       # React Native mobile (6 role-based navigators)
├── packages/
│   ├── shared-types/ # TypeScript enums & interfaces
│   ├── constants/    # Indonesian label maps
│   └── validators/   # Zod validation schemas
├── docker/
│   ├── docker-compose.dev.yml   # Development infrastructure
│   ├── docker-compose.yml       # Production stack
│   ├── postgres/init.sql        # Database initialization
│   ├── api/Dockerfile
│   ├── web/Dockerfile
│   └── nginx/nginx.conf
└── docs/
    ├── plans/                   # Design & implementation docs
    ├── API.md                   # API reference
    ├── DEPLOYMENT.md            # Deployment guide
    └── DEVELOPMENT.md           # Development guide
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9.15+
- Docker & Docker Compose

### Development Setup

```bash
# Clone repository
git clone https://github.com/wabiwabo/buzzr.git
cd buzzr

# Start infrastructure
docker compose -f docker/docker-compose.dev.yml up -d

# Install dependencies
pnpm install

# Copy environment config
cp .env.example .env

# Seed demo data
pnpm run db:seed

# Start all apps
pnpm run dev
```

Services akan berjalan di:
- **API**: http://localhost:3000
- **Web Dashboard**: http://localhost:5173
- **MinIO Console**: http://localhost:9001

### Demo Accounts

Setelah menjalankan `pnpm run db:seed`, gunakan tenant slug `dlh-demo`:

| Role | Email/Phone | Password |
|------|-------------|----------|
| Super Admin | admin@buzzr.id | demo1234 |
| DLH Admin | dlh@demo.buzzr.id | demo1234 |
| Driver | budi@demo.buzzr.id | demo1234 |
| Petugas Kebersihan | ahmad@demo.buzzr.id | demo1234 |
| Operator TPS | siti@demo.buzzr.id | demo1234 |
| Operator TPST | wawan@demo.buzzr.id | demo1234 |
| Pemulung | 081234567890 | OTP |
| Masyarakat | 081234567891 | OTP |

## Architecture

### Multi-Tenancy (Schema-per-Tenant)

Setiap DLH memiliki schema PostgreSQL terpisah. Request diarahkan ke tenant yang benar melalui header `X-Tenant-Slug`.

```
Request → Nginx → NestJS API
                    ├── TenantMiddleware (resolve slug → schema)
                    ├── SET search_path TO '{schema}', public
                    └── Module handler (query tenant data)
```

### Role-Based Access

| Role | Platform | Auth | Deskripsi |
|------|----------|------|-----------|
| Masyarakat | Mobile | OTP SMS/WA | Lapor, bayar retribusi, reward |
| Petugas Kebersihan | Mobile | Password | Checklist tugas, absensi GPS |
| Operator TPS | Mobile | Password | Catat sampah masuk/keluar, bank sampah |
| Pemulung/Pengepul | Mobile | OTP | Setor daur ulang, cek saldo |
| Driver Truk | Mobile | Password | Rute, GPS tracking, checkpoint |
| Operator TPST | Mobile | Password | Terima manifest, verifikasi |
| Admin DLH | Web | Password | Dashboard, kelola operasional |
| Super Admin | Web | Password | Kelola tenant, konfigurasi global |

## Commands

```bash
pnpm run dev                          # Start all apps
pnpm run build                        # Build all
pnpm run test                         # Run all tests
pnpm run db:seed                      # Seed demo data

# Individual apps
pnpm run dev --filter=@buzzr/api      # API only
pnpm run dev --filter=@buzzr/web      # Web only
cd apps/mobile && npx expo start      # Mobile

# Testing
cd apps/api && npx jest               # All API tests
cd apps/api && npx jest --testPathPattern=auth  # Single module
```

## Production Deployment

```bash
# Configure environment
cp .env.example .env
# Edit .env with production values

# Deploy with Docker
docker compose -f docker/docker-compose.yml up -d --build
```

Lihat [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) untuk panduan lengkap.

## Documentation

- [API Reference](docs/API.md) — Daftar lengkap endpoint API
- [Development Guide](docs/DEVELOPMENT.md) — Panduan pengembangan
- [Deployment Guide](docs/DEPLOYMENT.md) — Panduan deployment
- [Platform Design](docs/plans/2026-03-07-buzzr-platform-design.md) — Dokumen desain
- [Implementation Plan](docs/plans/2026-03-07-buzzr-implementation-plan.md) — Rencana implementasi

## License

Proprietary — All rights reserved.
