# Deployment Guide

## Architecture Overview

```
                    ┌─────────────────┐
                    │     Nginx       │
                    │  (reverse proxy)│
                    │   :80 / :443   │
                    └───────┬─────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        ┌─────▼────┐  ┌────▼────┐  ┌─────▼────┐
        │   Web    │  │   API   │  │ Socket.IO│
        │ (static) │  │ NestJS  │  │ (ws://)  │
        │  :80     │  │  :3000  │  │  :3000   │
        └──────────┘  └────┬────┘  └────┬─────┘
                           │            │
              ┌────────────┼────────────┤
              │            │            │
        ┌─────▼────┐ ┌────▼────┐ ┌────▼─────┐
        │PostgreSQL│ │  Redis  │ │  MinIO   │
        │ +PostGIS │ │         │ │          │
        │  :5432   │ │  :6379  │ │  :9000   │
        └──────────┘ └─────────┘ └──────────┘
```

## Prerequisites

- Server dengan Docker & Docker Compose
- Minimal 2 vCPU, 4GB RAM, 50GB disk
- Domain name (opsional, untuk SSL)
- Port 80 dan 443 terbuka

## Production Deployment

### 1. Clone & Configure

```bash
git clone https://github.com/wabiwabo/buzzr.git
cd buzzr
cp .env.example .env
```

Edit `.env` dengan nilai production:
```env
# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=buzzr
DATABASE_PASSWORD=<strong-password>
DATABASE_NAME=buzzr

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=<access-key>
MINIO_SECRET_KEY=<secret-key>
MINIO_USE_SSL=false
MINIO_BUCKET_PREFIX=buzzr

# JWT (generate random secrets)
JWT_ACCESS_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<random-64-char-string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OTP Provider (Fonnte)
OTP_PROVIDER_URL=https://api.fonnte.com/send
OTP_PROVIDER_TOKEN=<fonnte-token>

# Payment (Xendit)
XENDIT_SECRET_KEY=<xendit-secret>
XENDIT_WEBHOOK_TOKEN=<webhook-token>

# App
APP_PORT=3000
APP_ENV=production
```

Generate JWT secrets:
```bash
openssl rand -hex 32  # untuk JWT_ACCESS_SECRET
openssl rand -hex 32  # untuk JWT_REFRESH_SECRET
```

### 2. Build & Start

```bash
docker compose -f docker/docker-compose.yml up -d --build
```

Ini akan:
- Build API image (multi-stage, Node 20 Alpine)
- Build Web image (Vite build + Nginx)
- Start PostgreSQL dengan init.sql
- Start Redis dengan password
- Start MinIO
- Start Nginx reverse proxy pada port 80

### 3. Seed Initial Data

```bash
# Masuk ke API container
docker compose -f docker/docker-compose.yml exec api sh

# Jalankan seed
node -e "require('./dist/database/seeds/demo.seed.js')"
```

Atau dari host (jika Node.js tersedia):
```bash
cd apps/api
DATABASE_HOST=localhost pnpm run db:seed
```

### 4. Verifikasi

```bash
# Health check
curl http://localhost/health

# API test
curl http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: dlh-demo" \
  -d '{"email":"dlh@demo.buzzr.id","password":"demo1234"}'

# Web dashboard
# Buka http://localhost di browser
```

## SSL/HTTPS Setup

### Option A: Let's Encrypt (Recommended)

1. Install certbot di host:
```bash
apt install certbot
certbot certonly --standalone -d api.buzzr.id -d dashboard.buzzr.id
```

2. Update `docker/nginx/nginx.conf`:
```nginx
server {
    listen 443 ssl;
    server_name api.buzzr.id dashboard.buzzr.id;

    ssl_certificate /etc/letsencrypt/live/api.buzzr.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.buzzr.id/privkey.pem;

    # ... existing location blocks ...
}

server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

3. Mount certificates di docker-compose:
```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

### Option B: Cloudflare

Gunakan Cloudflare sebagai DNS dan SSL proxy. Set SSL mode ke "Full" di Cloudflare dashboard.

## Nginx Configuration

File: `docker/nginx/nginx.conf`

| Path | Target | Keterangan |
|------|--------|------------|
| `/api/*` | api:3000 | API endpoints |
| `/health` | api:3000 | Health check |
| `/socket.io` | api:3000 | WebSocket (upgrade) |
| `/` | web:80 | Admin dashboard (SPA) |

Features:
- Gzip compression untuk text, JSON, JS, CSS
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- WebSocket upgrade support
- Proxy headers forwarding (X-Real-IP, X-Forwarded-*)

## Docker Images

### API Dockerfile (`docker/api/Dockerfile`)

Multi-stage build:
1. **Builder**: Install all deps, build packages & API with turbo
2. **Runner**: Copy only dist artifacts & production deps, run with `node dist/main.js`

Final image: ~200MB (Node 20 Alpine)

### Web Dockerfile (`docker/web/Dockerfile`)

Multi-stage build:
1. **Builder**: Install deps, build Vite app
2. **Runner**: Copy build output to Nginx, serve static files

Final image: ~30MB (Nginx Alpine)

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
api:
  deploy:
    replicas: 3
```

Nginx akan load-balance ke semua API instances. Redis memastikan WebSocket events terpropagate antar instances.

### Database

- **Backup**: `pg_dump -U buzzr buzzr > backup.sql`
- **Point-in-time recovery**: Enable WAL archiving di PostgreSQL config
- **Connection pooling**: Pertimbangkan PgBouncer untuk >50 concurrent connections

### Redis

- **Persistence**: RDB snapshot sudah aktif (default)
- **Memory**: Monitor dengan `redis-cli info memory`

### MinIO

- **Backup**: `mc mirror minio/buzzr-* /backup/`
- **Multi-disk**: Konfigurasi erasure coding untuk redundansi

## Monitoring

### Health Check

```bash
# Endpoint tersedia tanpa auth
curl http://localhost/health
```

Response:
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "minio": "ok"
  },
  "timestamp": "2026-03-08T...",
  "uptime": 86400
}
```

### Docker Logs

```bash
# Semua services
docker compose -f docker/docker-compose.yml logs -f

# Service spesifik
docker compose -f docker/docker-compose.yml logs -f api
docker compose -f docker/docker-compose.yml logs -f nginx
```

### Uptime Monitoring

Gunakan tool seperti UptimeRobot atau Healthchecks.io untuk monitor `/health` endpoint secara berkala.

## Backup Strategy

| Data | Metode | Frekuensi |
|------|--------|-----------|
| PostgreSQL | pg_dump → S3/remote | Daily |
| Redis | RDB snapshot | Hourly (auto) |
| MinIO | mc mirror | Daily |
| .env config | Git (encrypted) | On change |

### PostgreSQL Backup Script

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec buzzr-postgres pg_dump -U buzzr buzzr | gzip > backup_${DATE}.sql.gz
```

## Troubleshooting

### API tidak start
```bash
docker compose -f docker/docker-compose.yml logs api
# Cek: database connection, missing env vars
```

### Database connection refused
```bash
docker compose -f docker/docker-compose.yml exec postgres pg_isready -U buzzr
# Cek: PostgreSQL container running, credentials benar
```

### Redis connection error
```bash
docker compose -f docker/docker-compose.yml exec redis redis-cli ping
```

### MinIO not accessible
```bash
docker compose -f docker/docker-compose.yml exec minio mc ready local
```

### Tenant not found
Pastikan header `X-Tenant-Slug` dikirim dan tenant ada di database:
```sql
SELECT * FROM public.tenants WHERE is_active = true;
```

### Reset semua data
```bash
docker compose -f docker/docker-compose.yml down -v  # Hapus volumes
docker compose -f docker/docker-compose.yml up -d     # Recreate
pnpm run db:seed                                       # Re-seed
```

## Mobile App Configuration

Mobile app (React Native/Expo) tidak di-containerize. Untuk produksi:

1. Update API URL di `apps/mobile/src/services/api.ts`:
```typescript
const API_URL = __DEV__
  ? 'http://192.168.1.100:3000/api/v1'
  : 'https://api.buzzr.id/api/v1';  // Ganti dengan domain production
```

2. Build:
```bash
cd apps/mobile
npx expo build:android  # Android APK/AAB
npx expo build:ios      # iOS IPA
```

Atau dengan EAS Build:
```bash
npx eas build --platform android
npx eas build --platform ios
```
