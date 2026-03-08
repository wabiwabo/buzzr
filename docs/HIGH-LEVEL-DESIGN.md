# Buzzr Platform — High-Level Design Document

**Version:** 1.0
**Date:** 2026-03-08
**Status:** Implemented

---

## 1. Introduction

### 1.1 Purpose

Dokumen ini mendeskripsikan arsitektur tingkat tinggi platform Buzzr — sistem pengelolaan sampah terintegrasi untuk Dinas Lingkungan Hidup (DLH) pemerintah Indonesia. Dokumen mencakup keputusan arsitektur, pola desain, komponen sistem, alur data, dan model deployment.

### 1.2 Scope

Buzzr menghubungkan seluruh rantai pengelolaan sampah dalam satu platform:

- **Tracking & traceability** sampah dari sumber ke TPA
- **Koordinasi operasional** (penjadwalan, penugasan, rute, GPS)
- **Pelaporan & monitoring** untuk DLH
- **Pemberdayaan masyarakat** (pelaporan, reward)
- **Pembayaran terintegrasi** (retribusi, bank sampah, payout, reward)

### 1.3 Stakeholders

| Aktor | Platform | Autentikasi | Jumlah Estimasi |
|-------|----------|-------------|-----------------|
| Masyarakat | Mobile | OTP SMS/WA | Ribuan per kota |
| Petugas Kebersihan | Mobile | Email/password | Puluhan per kota |
| Operator TPS / Bank Sampah | Mobile | Email/password | Puluhan per kota |
| Pemulung / Pengepul | Mobile | OTP SMS/WA | Ratusan per kota |
| Driver Truk | Mobile | Email/password | Puluhan per kota |
| Operator TPST | Mobile | Email/password | Satuan per kota |
| Admin DLH | Web | Email/password | Satuan per kota |
| Super Admin (Buzzr) | Web | Email/password | 1-3 orang |

---

## 2. System Architecture

### 2.1 Architecture Style

**Monolith Modular + Multi-Tenant (Schema-per-Tenant)**

Dipilih karena:
- Lebih cepat develop dibanding microservices
- Cukup untuk skala DLH kota/kabupaten
- Bisa dipecah ke microservices di masa depan jika dibutuhkan
- Schema-per-tenant memberikan isolasi data yang kuat

### 2.2 System Context Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        External Systems                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Fonnte  │  │  Xendit  │  │ Firebase │  │  OpenStreetMap │  │
│  │ (OTP/WA) │  │(Payment) │  │  (FCM)   │  │    (Maps)     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘  │
└───────┼──────────────┼─────────────┼────────────────┼──────────┘
        │              │             │                │
┌───────▼──────────────▼─────────────▼────────────────▼──────────┐
│                                                                 │
│   ┌──────────┐    ┌─────────────────────────┐    ┌──────────┐  │
│   │  Mobile  │───▶│     Nginx Reverse       │◀───│   Web    │  │
│   │   App    │    │        Proxy            │    │Dashboard │  │
│   │ (Expo)   │◀───│   :80 / :443           │───▶│ (React)  │  │
│   └──────────┘    └───────────┬─────────────┘    └──────────┘  │
│                               │                                 │
│                    ┌──────────▼──────────┐                      │
│                    │   NestJS Monolith   │                      │
│                    │  ┌─────┬─────┬────┐ │                      │
│                    │  │Auth │Track│Pay │ │                      │
│                    │  │     │ WS  │ment│ │                      │
│                    │  ├─────┼─────┼────┤ │                      │
│                    │  │User │Fleet│TPS │ │                      │
│                    │  ├─────┼─────┼────┤ │                      │
│                    │  │Area │Sched│Comp│ │                      │
│                    │  ├─────┼─────┼────┤ │                      │
│                    │  │Xfer │Notif│Rpt │ │                      │
│                    │  └─────┴─────┴────┘ │                      │
│                    └──┬────┬────┬────────┘                      │
│                       │    │    │                                │
│              ┌────────▼┐ ┌─▼──┐ ┌▼─────┐                       │
│              │PostgreSQL│ │Redis│ │MinIO │                       │
│              │+PostGIS  │ │    │ │      │                       │
│              └──────────┘ └────┘ └──────┘                       │
│                                                                 │
│                        Buzzr Platform                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Technology Stack

| Layer | Teknologi | Versi | Alasan |
|-------|-----------|-------|--------|
| Backend | NestJS (TypeScript) | 10.4.0 | Modular by design, strong typing, decorator-based DI |
| Database | PostgreSQL + PostGIS | 16 + 3.4 | Relational + geospatial native |
| Cache/Realtime | Redis | 7 | OTP storage, GPS rate limiting, pub/sub tracking |
| Object Storage | MinIO | 8.0.0 | S3-compatible, self-hosted, per-tenant buckets |
| Admin Web | React + Vite + Ant Design | 18.3 + 6.0 + 5.23 | Dashboard-oriented, component library lengkap |
| Mobile App | React Native (Expo) | 0.76 + 52.0 | Single codebase iOS & Android, shared TypeScript |
| State Mgmt | Zustand | 5.0 | Lightweight, TypeScript-first, no boilerplate |
| Monorepo | Turborepo + pnpm | 2.4 + 9.15 | Build caching, workspace management |
| Reverse Proxy | Nginx | Alpine | SSL termination, load balancing, WebSocket |

---

## 3. Multi-Tenancy Architecture

### 3.1 Tenant Isolation Model

```
┌──────────────────────────────────────────┐
│              PostgreSQL Server            │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  public   │  │dlh_bekasi│  │dlh_bgr │ │
│  │ (shared)  │  │ (tenant) │  │(tenant)│ │
│  │           │  │          │  │        │ │
│  │ tenants   │  │ users    │  │ users  │ │
│  │ (registry)│  │ areas    │  │ areas  │ │
│  │           │  │ tps_locs │  │ tps_.. │ │
│  │           │  │ vehicles │  │ ...    │ │
│  │           │  │ ...14tbl │  │        │ │
│  └──────────┘  └──────────┘  └────────┘ │
└──────────────────────────────────────────┘
```

- **`public` schema**: Tenant registry dan konfigurasi global
- **Per-tenant schema**: 14 tabel data operasional (users, areas, TPS, vehicles, schedules, transfers, GPS logs, transactions, wallets, complaints, notifications, audit logs)
- **Isolasi penuh**: Setiap DLH tidak dapat mengakses data DLH lain

### 3.2 Tenant Resolution Flow

```
Client Request
    │
    │  Header: X-Tenant-Slug: dlh-bekasi
    │
    ▼
TenantMiddleware
    │
    ├─ Query: SELECT schema_name FROM public.tenants
    │         WHERE slug = 'dlh-bekasi' AND is_active = true
    │
    ├─ Validate: schema_name matches /^[a-z_][a-z0-9_]*$/
    │            (defense against SQL injection)
    │
    ├─ Execute: SET search_path TO 'dlh_bekasi', public
    │
    ├─ Attach: req.tenantSchema = 'dlh_bekasi'
    │          req.tenantId = 'uuid-...'
    │
    ▼
Module Controller/Service
    │
    │  Uses @TenantSchema() decorator to get schema name
    │  All SQL queries run in tenant context
    │
    ▼
Response
```

**Excluded routes** (tidak memerlukan tenant):
- `/health` — Health check
- `/api/v1/tenants` — Tenant management (super admin)
- `/api/v1/auth/super-admin/*` — Super admin auth
- `/api/v1/payments/webhook` — Payment callback dari Xendit

### 3.3 Tenant Provisioning

Saat tenant baru dibuat:
1. Insert record ke `public.tenants`
2. Panggil fungsi `create_tenant_schema(schema_name)`
3. Fungsi membuat 14 tabel di schema baru dengan semua kolom, foreign keys, dan indexes
4. Tenant siap digunakan

---

## 4. Module Architecture

### 4.1 Module Dependency Graph

```
                        AppModule
                            │
            ┌───────────────┼───────────────┐
            │               │               │
      ConfigModule    DatabaseModule    RedisModule
       (global)         (global)        (global)
            │               │               │
            └───────┬───────┘───────┬───────┘
                    │               │
    ┌───────────────┼───────────────┼───────────────┐
    │               │               │               │
AuthModule    TenantModule    UploadModule    HealthModule
    │                             │
    │  ┌──────────────────────────┤
    │  │                          │
    ▼  ▼                          ▼
UserModule  AreaModule  TpsModule  FleetModule  ScheduleModule
                │           │         │
                ▼           ▼         ▼
          TrackingModule  TransferModule  PaymentModule
                                            │
                                    ┌───────┼────────┐
                                    │       │        │
                              WalletSvc  RewardSvc  XenditSvc
                                    │
                                    ▼
                          ComplaintModule  NotificationModule  ReportModule
```

### 4.2 Module Responsibilities

| Module | Tanggung Jawab | Tabel Utama |
|--------|---------------|-------------|
| **Auth** | Login password/OTP, JWT token, RBAC guards | users (read) |
| **Tenant** | CRUD tenant, provisioning schema | public.tenants |
| **User** | Manajemen user, hashing password | users |
| **Area** | Hierarki wilayah (Provinsi→RT), PostGIS | areas |
| **TPS** | Lokasi TPS, kapasitas, catat sampah, nearby search | tps_locations |
| **Fleet** | Kendaraan, assign/unassign driver | vehicles |
| **Schedule** | Jadwal angkut, recurring/on-demand, TPS stops | schedules, schedule_stops |
| **Tracking** | Real-time GPS via WebSocket, rate limiting | gps_logs |
| **Transfer** | Checkpoint, manifest, verifikasi TPST | transfer_records |
| **Payment** | Retribusi, bank sampah, wallet, reward, Xendit | transactions, wallets |
| **Complaint** | Pengaduan warga, workflow, rating | complaints, complaint_attachments |
| **Notification** | Push notification FCM, in-app | notifications |
| **Upload** | File upload ke MinIO, presigned URL | - (external: MinIO) |
| **Report** | Dashboard summary, volume, heatmap, performa | - (aggregation queries) |
| **Health** | Cek DB, Redis, MinIO connectivity | - |

### 4.3 NestJS Module Pattern

Setiap module mengikuti pola konsisten:

```
modules/example/
├── example.module.ts        # Deklarasi, imports, exports
├── example.controller.ts    # HTTP endpoint handlers
│   ├── @UseGuards(JwtAuthGuard)     # Auth wajib
│   ├── @Roles('dlh_admin')          # Role restriction
│   ├── @UseGuards(RolesGuard)       # Role enforcement
│   └── @TenantSchema() schema       # Tenant context
├── example.service.ts       # Business logic
│   └── DataSource.query()           # Raw SQL (bukan TypeORM entities)
└── example.service.spec.ts  # Unit test dengan mocked deps
```

**Keputusan: Raw SQL vs TypeORM Entities**

TypeORM entities tidak digunakan karena tidak mendukung dynamic schema switching secara native. Semua query menggunakan `DataSource.query()` dengan parameterized queries untuk keamanan.

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flows                       │
│                                                              │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │  Password Login      │    │  OTP Login                 │  │
│  │  (Staff roles)       │    │  (Citizen & Collector)     │  │
│  │                      │    │                            │  │
│  │  POST /auth/login    │    │  POST /auth/otp/request    │  │
│  │  {email, password}   │    │  {phone}                   │  │
│  │       │              │    │       │                    │  │
│  │       ▼              │    │       ▼                    │  │
│  │  Query user by email │    │  Generate 6-digit code    │  │
│  │       │              │    │  Store in Redis (5m TTL)  │  │
│  │       ▼              │    │  Send via Fonnte SMS/WA   │  │
│  │  bcrypt.compare()    │    │       │                    │  │
│  │       │              │    │       ▼                    │  │
│  │       ▼              │    │  POST /auth/otp/verify     │  │
│  │  Generate tokens     │    │  {phone, code}             │  │
│  │                      │    │       │                    │  │
│  │                      │    │       ▼                    │  │
│  │                      │    │  Verify code from Redis   │  │
│  │                      │    │  Auto-register if new     │  │
│  │                      │    │       │                    │  │
│  │                      │    │       ▼                    │  │
│  │                      │    │  Generate tokens           │  │
│  └──────────┬───────────┘    └───────────┬────────────────┘  │
│             │                            │                    │
│             └─────────────┬──────────────┘                    │
│                           ▼                                   │
│              ┌────────────────────────┐                       │
│              │  JWT Token Pair        │                       │
│              │  Access:  15 minutes   │                       │
│              │  Refresh: 7 days       │                       │
│              │                        │                       │
│              │  Payload:              │                       │
│              │  {                     │                       │
│              │    sub: userId,        │                       │
│              │    role: UserRole,     │                       │
│              │    tenant: schemaName  │                       │
│              │  }                     │                       │
│              └────────────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Authorization (RBAC)

```
Request
    │
    ▼
JwtAuthGuard (Passport JWT strategy)
    │ Extract Bearer token → validate signature → attach user to request
    │
    ▼
@Roles('dlh_admin', 'super_admin')  ← decorator on controller method
    │
    ▼
RolesGuard (custom guard)
    │ Read required roles from Reflector metadata
    │ Compare with request.user.role
    │ Allow if match, reject with 403 if not
    │
    ▼
Controller Handler
```

### 5.3 Role Permission Matrix

| Capability | Citizen | Sweeper | TPS Op | Collector | Driver | TPST Op | DLH Admin | Super Admin |
|-----------|---------|---------|--------|-----------|--------|---------|-----------|-------------|
| Submit complaint | x | | | | | | | |
| View schedules | | | | | x | | x | x |
| Record waste | | x | x | | | | | |
| GPS tracking | | | | | x | | | |
| Create checkpoint | | | | | x | | | |
| Verify manifest | | | | | | x | x | |
| Manage users | | | | | | | x | x |
| Manage fleet | | | | | | | x | x |
| View reports | | | | | | | x | x |
| Manage tenants | | | | | | | | x |
| Bank sampah sell | | | x | | | | x | |
| View wallet | | | | x | | | | |
| Pay retribution | x | | | | | | | |

---

## 6. Data Architecture

### 6.1 Entity Relationship Diagram

```
                              public.tenants
                                    │
                        ┌───────────┼───────────┐
                        │     (per-tenant schema)│
                        ▼                        ▼
                ┌──────────────┐        ┌──────────────┐
                │    areas     │◀───┐   │    users     │
                │              │    │   │              │
                │ id           │    │   │ id           │
                │ name         │    │   │ name         │
                │ level (1-6)  │    │   │ email        │
                │ parent_id ───┘    ├──▶│ area_id      │
                │ geometry(MP) │    │   │ role         │
                └──────┬───────┘    │   │ reward_pts   │
                       │            │   └──────┬───────┘
                       │            │          │
            ┌──────────▼──────┐     │     ┌────▼────────────┐
            │  tps_locations  │     │     │    vehicles     │
            │                 │     │     │                 │
            │ id              │     │     │ id              │
            │ name            │     │     │ plate_number    │
            │ type            │     │     │ type            │
            │ coordinates(Pt) │     │     │ capacity_tons   │
            │ capacity_tons   │     │     │ driver_id ──────┘
            │ current_load    │     │     └────┬────────────┘
            │ area_id ────────┘     │          │
            │ qr_code         │     │     ┌────▼────────────┐
            └─────┬───────────┘     │     │   schedules     │
                  │                 │     │                 │
                  │                 │     │ vehicle_id      │
                  │                 │     │ driver_id       │
                  │                 │     │ route_name      │
                  │                 │     │ recurring_days[]│
                  │                 │     └────┬────────────┘
                  │                 │          │
            ┌─────▼─────────────────▼──────────▼──────────┐
            │              transfer_records                │
            │                                              │
            │ id, schedule_id, source_tps_id,             │
            │ vehicle_id, driver_id, operator_id,         │
            │ category, volume_kg, status,                │
            │ photo_url, checkpoint_at, verified_at       │
            └──────────────────────────────────────────────┘

            ┌──────────────────┐    ┌──────────────────┐
            │   transactions   │    │    complaints     │
            │                  │    │                   │
            │ user_id          │    │ reporter_id       │
            │ type             │    │ category          │
            │ amount           │    │ status            │
            │ status           │    │ lat/lng           │
            │ payment_method   │    │ assigned_to       │
            │ external_id      │    │ rating            │
            └──────────────────┘    └──────────────────┘

            ┌──────────────────┐    ┌──────────────────┐
            │     wallets      │    │    gps_logs       │
            │                  │    │                   │
            │ user_id (unique) │    │ vehicle_id        │
            │ balance          │    │ driver_id         │
            └──────────────────┘    │ coordinates(Pt)   │
                                    │ speed             │
            ┌──────────────────┐    │ recorded_at       │
            │  notifications   │    └──────────────────┘
            │                  │
            │ user_id          │    ┌──────────────────┐
            │ title, body      │    │   audit_logs     │
            │ type, is_read    │    │                  │
            │ data (JSONB)     │    │ user_id, action  │
            └──────────────────┘    │ entity_type/id   │
                                    │ old/new (JSONB)  │
                                    └──────────────────┘
```

### 6.2 PostGIS Usage

| Tabel | Kolom | Tipe Geometry | SRID | Kegunaan |
|-------|-------|---------------|------|----------|
| areas | geometry | MultiPolygon | 4326 | Batas wilayah administratif |
| tps_locations | coordinates | Point | 4326 | Lokasi TPS untuk nearby search |
| gps_logs | coordinates | Point | 4326 | Tracking posisi kendaraan |

**Query patterns:**
- `ST_DWithin()` — Cari TPS dalam radius tertentu
- `ST_MakePoint(lon, lat)` — Simpan koordinat GPS
- `ST_X(coordinates), ST_Y(coordinates)` — Baca koordinat

### 6.3 Data Flow — Siklus Pengangkutan Harian

```
1. DLH Admin membuat jadwal
   └─▶ INSERT schedules + schedule_stops

2. Driver terima notifikasi jadwal hari ini
   └─▶ GET /schedules/today

3. Driver mulai tracking GPS
   └─▶ WebSocket gps:update → INSERT gps_logs (rate limited 5s)
   └─▶ Redis PUBLISH gps:{schema} → Dashboard real-time

4. Di setiap TPS: Driver scan QR + catat volume + foto
   └─▶ POST /transfers/checkpoint
   └─▶ INSERT transfer_records (status: pending)
   └─▶ UPDATE tps_locations.current_load_tons

5. Sampai TPST: Operator verifikasi manifest
   └─▶ PATCH /transfers/manifest/:id/verify
   └─▶ UPDATE transfer_records SET status = 'verified'

6. Data masuk dashboard analytics
   └─▶ GET /reports/dashboard (aggregation queries)
```

---

## 7. Real-Time Architecture

### 7.1 GPS Tracking System

```
┌──────────┐     WebSocket      ┌──────────────┐     Redis      ┌──────────┐
│  Mobile  │────────────────────▶│  Tracking    │───────────────▶│  Redis   │
│  (Driver)│  gps:update         │  Gateway     │  PUBLISH       │  Pub/Sub │
│          │  {lat,lng,speed}    │  (Socket.IO) │  gps:{schema}  │          │
└──────────┘                     └──────┬───────┘                └────┬─────┘
                                        │                             │
                                        │ INSERT                      │ SUBSCRIBE
                                        ▼                             ▼
                                 ┌──────────────┐            ┌──────────────┐
                                 │  PostgreSQL  │            │  Web Admin   │
                                 │  gps_logs    │            │  Dashboard   │
                                 │  (PostGIS)   │            │  (real-time) │
                                 └──────────────┘            └──────────────┘
```

**Rate Limiting:**
- Redis key: `gps_rate:{vehicleId}` dengan TTL 5 detik
- Jika key exists, update diabaikan (prevent flooding)
- Setelah expire, update baru diterima dan disimpan

### 7.2 Notification System

```
Event Trigger (e.g., complaint status change)
    │
    ▼
NotificationService.create()
    │
    ├─▶ INSERT notifications (in-app)
    │
    └─▶ Firebase Cloud Messaging (push notification)
         └─▶ Mobile device
```

---

## 8. Payment Architecture

### 8.1 Payment Flows

```
┌────────────────────────────────────────────────────────────────┐
│                    Payment Flows                                │
│                                                                │
│  Flow 1: Retribusi (Waste Tax)                                │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐  │
│  │DLH Admin │───▶│ Create   │───▶│  Xendit  │───▶│Citizen │  │
│  │          │    │ Invoice  │    │  Payment │    │  Pays  │  │
│  └──────────┘    └──────────┘    │  Link    │    └───┬────┘  │
│                                  └──────────┘        │       │
│                                       ▲              │       │
│                                       │    Webhook   │       │
│                                       └──────────────┘       │
│                                                               │
│  Flow 2: Bank Sampah (Waste Trading)                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │Pemulung  │───▶│TPS Op    │───▶│ Record   │               │
│  │brings    │    │weighs &  │    │ sale +   │               │
│  │recyclable│    │categorize│    │ update   │               │
│  └──────────┘    └──────────┘    │ wallet   │               │
│                                  └──────────┘               │
│                                                               │
│  Flow 3: Reward Points                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐               │
│  │ Citizen  │───▶│ Action   │───▶│ Points   │               │
│  │ reports  │    │ verified │    │ credited │               │
│  │ problem  │    │ + closed │    │ → wallet │               │
│  └──────────┘    └──────────┘    └──────────┘               │
└────────────────────────────────────────────────────────────────┘
```

### 8.2 Payment Component Diagram

```
PaymentModule
├── PaymentController    ─── POST /payments (create invoice)
│                        ─── POST /payments/webhook (Xendit callback)
│                        ─── GET  /payments (list)
│
├── BankSampahController ─── POST /bank-sampah/sell (record sale)
│                        ─── POST /bank-sampah/payout (request payout)
│                        ─── GET  /bank-sampah/wallet (check balance)
│
├── RewardController     ─── GET  /rewards/points
│                        ─── POST /rewards/redeem
│
├── PaymentService       ─── createInvoice(), processWebhook()
├── WalletService        ─── getBalance(), credit(), debit()
├── RewardService        ─── getPoints(), addPoints(), redeem()
└── XenditService        ─── createInvoice(), verifyWebhook()
```

---

## 9. Frontend Architecture

### 9.1 Web Admin Dashboard

```
┌────────────────────────────────────────────────────────────┐
│                   React + Vite + Ant Design                 │
│                                                             │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Zustand  │    │ React Router │    │   Ant Design     │  │
│  │  Auth     │    │              │    │   Components     │  │
│  │  Store    │◀──▶│ /login       │    │                  │  │
│  │          │    │ /dashboard   │    │ Layout, Table,   │  │
│  │ user     │    │ /tps         │    │ Form, Modal,     │  │
│  │ token    │    │ /fleet       │    │ Charts           │  │
│  │ tenant   │    │ /schedules   │    │                  │  │
│  └──────────┘    │ /complaints  │    └──────────────────┘  │
│       │          │ /payments    │                           │
│       ▼          │ /users       │                           │
│  ┌──────────┐    │ /reports     │                           │
│  │  Axios   │    └──────────────┘                           │
│  │  Client  │                                               │
│  │          │ ─ Bearer token (localStorage)                 │
│  │          │ ─ X-Tenant-Slug (localStorage)                │
│  │          │ ─ Proxy /api → localhost:3000 (dev)           │
│  └──────────┘                                               │
└────────────────────────────────────────────────────────────┘
```

### 9.2 Mobile App — Role-Based Navigation

```
┌─────────────────────────────────────────────────────────┐
│              React Native (Expo) Mobile App              │
│                                                          │
│  ┌──────────────┐                                        │
│  │ RootNavigator│                                        │
│  │              │─── Not authenticated ──▶ LoginScreen   │
│  │              │                                        │
│  │              │─── Authenticated ──▶ getRoleNavigator() │
│  └──────────────┘         │                              │
│                           │                              │
│     ┌─────────────────────┼─────────────────────┐        │
│     │                     │                     │        │
│  citizen              driver              tps_operator   │
│  ┌──────────┐      ┌──────────┐      ┌──────────────┐   │
│  │Beranda   │      │Jadwal    │      │Sampah Masuk  │   │
│  │Lapor     │      │Tracking  │      │Sampah Keluar │   │
│  │Bayar     │      │Checkpoint│      │Bank Sampah   │   │
│  │Profil    │      │Profil+   │      │Status TPS    │   │
│  └──────────┘      │ Manifest │      └──────────────┘   │
│                    └──────────┘                          │
│     ┌─────────────────────┼─────────────────────┐        │
│     │                     │                     │        │
│  collector            sweeper            tpst_operator   │
│  ┌──────────┐      ┌──────────┐      ┌──────────────┐   │
│  │Setor     │      │Tugas     │      │Terima Manifest│  │
│  │Dompet    │      │Absensi   │      │Verifikasi    │   │
│  │Profil    │      │Profil    │      │Profil        │   │
│  └──────────┘      └──────────┘      └──────────────┘   │
│                                                          │
│  Shared: api.ts (Axios), auth.store.ts (Zustand),       │
│          format.ts (date/currency), expo-secure-store    │
└─────────────────────────────────────────────────────────┘
```

### 9.3 Shared Packages

```
packages/
├── shared-types/     Digunakan oleh: API, Web, Mobile
│   ├── roles.ts      UserRole enum, OTP_ROLES, PASSWORD_ROLES
│   ├── waste.ts      WasteCategory, TpsStatus, TpsType, TransferStatus
│   ├── complaint.ts  ComplaintCategory, ComplaintStatus
│   └── payment.ts    PaymentType, PaymentStatus, PaymentMethod
│
├── constants/        Digunakan oleh: Web, Mobile
│   ├── roles.ts              ROLE_LABELS (Indonesian)
│   ├── waste-categories.ts   WASTE_CATEGORY_LABELS
│   ├── complaint-status.ts   COMPLAINT_STATUS_LABELS
│   ├── complaint-category.ts COMPLAINT_CATEGORY_LABELS
│   └── payment-status.ts     PAYMENT_STATUS_LABELS
│
└── validators/       Digunakan oleh: API, Web
    ├── auth.validators.ts    Zod schemas: login, register
    └── tps.validators.ts     Zod schemas: TPS create/update
```

---

## 10. Infrastructure & Deployment

### 10.1 Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Production Server                       │
│                                                           │
│   ┌─────────────────────────────────────────────────┐    │
│   │                 Docker Compose                    │    │
│   │                                                   │    │
│   │   ┌─────────┐                                    │    │
│   │   │  Nginx  │ :80 / :443                         │    │
│   │   │         │ ─ SSL termination                  │    │
│   │   │         │ ─ Gzip compression                 │    │
│   │   │         │ ─ Security headers                 │    │
│   │   │         │ ─ WebSocket upgrade                │    │
│   │   └────┬────┘                                    │    │
│   │        │                                         │    │
│   │   ┌────▼────┐  ┌──────────┐                     │    │
│   │   │   API   │  │   Web    │                     │    │
│   │   │ NestJS  │  │  Nginx   │                     │    │
│   │   │ :3000   │  │  (SPA)   │                     │    │
│   │   │         │  │  :80     │                     │    │
│   │   └────┬────┘  └──────────┘                     │    │
│   │        │                                         │    │
│   │   ┌────▼──────┐ ┌────────┐ ┌────────┐          │    │
│   │   │PostgreSQL │ │ Redis  │ │ MinIO  │          │    │
│   │   │+ PostGIS  │ │        │ │        │          │    │
│   │   │ :5432     │ │ :6379  │ │ :9000  │          │    │
│   │   └───────────┘ └────────┘ └────────┘          │    │
│   │                                                   │    │
│   │   Volumes: postgres_data, redis_data, minio_data │    │
│   └───────────────────────────────────────────────────┘    │
│                                                           │
│   Mobile App: Distributed via App Store / Play Store      │
└──────────────────────────────────────────────────────────┘
```

### 10.2 Build Pipeline

```
Source Code (Git)
    │
    ▼
Turborepo Build
    │
    ├── packages/shared-types  ─▶ tsc ─▶ dist/
    ├── packages/constants     ─▶ tsc ─▶ dist/
    ├── packages/validators    ─▶ tsc ─▶ dist/
    │
    ├── apps/api              ─▶ nest build ─▶ dist/
    │   └── Docker: node:20-alpine (multi-stage)
    │       Stage 1: pnpm install + turbo build
    │       Stage 2: Copy dist + prod deps only
    │       Entrypoint: node dist/main.js
    │
    ├── apps/web              ─▶ vite build ─▶ dist/
    │   └── Docker: node:20-alpine → nginx:alpine
    │       Stage 1: pnpm install + vite build
    │       Stage 2: Copy dist to nginx html
    │
    └── apps/mobile           ─▶ expo build (EAS)
        └── APK/AAB (Android), IPA (iOS)
```

### 10.3 Nginx Routing

| Path | Target | Keterangan |
|------|--------|------------|
| `/health` | api:3000 | Health check (no auth) |
| `/api/*` | api:3000 | REST API endpoints |
| `/socket.io/*` | api:3000 | WebSocket (HTTP upgrade) |
| `/` | web:80 | SPA dashboard (fallback to index.html) |

---

## 11. Security Architecture

### 11.1 Security Layers

| Layer | Implementasi |
|-------|-------------|
| **Transport** | HTTPS/TLS via Nginx, WSS untuk WebSocket |
| **Authentication** | JWT access token (15min) + refresh token (7d) |
| **Authorization** | Role-Based Access Control (RBAC) via NestJS guards |
| **Tenant Isolation** | Schema-per-tenant, regex validation pada schema name |
| **Input Validation** | class-validator DTOs, Zod schemas, ValidationPipe (whitelist + forbidNonWhitelisted) |
| **SQL Injection** | Parameterized queries ($1, $2), regex schema validation |
| **API Security** | Rate limiting per tenant, CORS configuration |
| **File Upload** | Type validation (images only), size limit (5MB) |
| **Payment** | Webhook signature verification, idempotency |
| **Mobile Storage** | expo-secure-store (encrypted keychain/keystore) |
| **Audit** | audit_logs table untuk operasi sensitif |
| **Headers** | X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy |

### 11.2 Data Protection

```
Sensitive Data Handling:
├── Passwords    → bcrypt hash (salt rounds: 10)
├── JWT Secrets  → Environment variables (never in code)
├── Tokens       → expo-secure-store (mobile), localStorage (web)
├── OTP Codes    → Redis with 5-minute TTL (auto-expire)
├── File Access  → Presigned URLs with 7-day expiry
└── DB Creds     → Environment variables, Docker secrets
```

---

## 12. Monitoring & Observability

### 12.1 Health Check

Endpoint: `GET /health` (tanpa autentikasi)

Cek paralel terhadap 3 komponen infrastruktur:
1. **PostgreSQL** — `SELECT 1` query
2. **Redis** — `PING` command
3. **MinIO** — `listBuckets()` API call

Response mengembalikan status per komponen dan overall system status.

### 12.2 Logging

- NestJS built-in logger (JSON format di production)
- Docker container logs (`docker compose logs -f`)
- Audit logs di database untuk operasi sensitif

### 12.3 Backup Strategy

| Data | Metode | Frekuensi |
|------|--------|-----------|
| PostgreSQL | pg_dump + point-in-time recovery | Daily |
| Redis | RDB snapshot | Hourly (auto) |
| MinIO | mc mirror ke backup storage | Daily |

---

## 13. Scalability Considerations

### 13.1 Current Capacity

Platform saat ini dirancang untuk:
- **10-50 tenant** (DLH kota/kabupaten)
- **100-500 concurrent users** per tenant
- **1000+ GPS updates/menit** (dengan rate limiting 5s/vehicle)
- **5TB+ file storage** (MinIO scalable)

### 13.2 Scaling Path

```
Phase 1 (Current): Single Server
├── 1 PostgreSQL instance
├── 1 Redis instance
├── 1 MinIO instance
├── 1-3 API instances (behind Nginx)
└── Sufficient for: 10 tenants, 500 users

Phase 2: Vertical + Horizontal
├── PostgreSQL with read replicas
├── Redis Sentinel (HA)
├── MinIO multi-disk (erasure coding)
├── 3-5 API instances (load balanced)
└── Sufficient for: 50 tenants, 5000 users

Phase 3: Split Services (if needed)
├── Separate tracking microservice (high-throughput GPS)
├── Separate payment microservice (PCI compliance)
├── Message queue for async operations (BullMQ → dedicated)
├── CDN for static assets
└── Sufficient for: 100+ tenants, 50000+ users
```

### 13.3 Database Scaling Notes

- Schema-per-tenant scales well to ~100 tenants per PostgreSQL instance
- Beyond that, consider database-per-tenant atau tenant sharding
- PostGIS spatial indexes memastikan nearby search tetap cepat
- GPS logs bisa di-partition by month untuk query performance

---

## 14. Key Design Decisions

| Keputusan | Alasan | Trade-off |
|-----------|--------|-----------|
| Monolith modular vs microservices | Lebih cepat develop, cukup untuk skala DLH | Harus refactor jika butuh independent scaling |
| Schema-per-tenant vs DB-per-tenant | Lebih efisien resource, backup/restore lebih mudah | Less isolation dibanding DB-per-tenant |
| Schema-per-tenant vs row-level security | Isolasi lebih kuat, query lebih sederhana | More schemas to manage, migration lebih complex |
| Raw SQL vs TypeORM entities | Dynamic schema switching tidak didukung ORM | Manual query writing, no auto-migration |
| React Native (Expo) vs Flutter | Shared TypeScript dengan backend | Performance sedikit dibawah native |
| Turborepo vs Nx | Lebih ringan, cukup untuk 3 apps + 3 packages | Less features dibanding Nx |
| PostgreSQL + PostGIS vs MongoDB | Relational cocok untuk data pemerintah, PostGIS untuk geospatial | Less flexible schema evolution |
| Redis vs dedicated message broker | Cukup untuk pub/sub sederhana + caching | Kurang reliable dibanding RabbitMQ/Kafka |
| Socket.IO vs raw WebSocket | Auto-reconnect, room support, fallback | Larger library size |
| MinIO vs cloud S3 | Self-hosted, no vendor lock-in, bisa on-premise | Need to manage storage infra |
| Zustand vs Redux | Minimal boilerplate, TypeScript-first | Smaller ecosystem |

---

## 15. Appendix

### 15.1 Enum Reference

**User Roles:** `citizen`, `sweeper`, `tps_operator`, `collector`, `driver`, `tpst_operator`, `dlh_admin`, `super_admin`

**Waste Categories:** `organic`, `inorganic`, `b3`, `recyclable`

**TPS Types:** `tps`, `tps3r`, `bank_sampah`

**TPS Status:** `active`, `full`, `maintenance`

**Transfer Status:** `pending` → `in_transit` → `delivered` → `verified`

**Complaint Status:** `submitted` → `verified` → `assigned` → `in_progress` → `resolved` | `rejected`

**Payment Types:** `retribution`, `bank_sampah_buy`, `bank_sampah_sell`, `reward_redeem`, `payout`

**Payment Status:** `pending` → `paid` | `failed` | `expired` | `refunded`

**Payment Methods:** `qris`, `va_bca`, `va_bni`, `va_mandiri`, `ewallet_ovo`, `ewallet_gopay`, `ewallet_dana`

### 15.2 Related Documents

- [API Reference](API.md)
- [Development Guide](DEVELOPMENT.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Platform Design](plans/2026-03-07-buzzr-platform-design.md)
- [Implementation Plan](plans/2026-03-07-buzzr-implementation-plan.md)
