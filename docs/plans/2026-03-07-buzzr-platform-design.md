# Buzzr Platform — Design Document

**Date:** 2026-03-07
**Status:** Approved

## Overview

Buzzr adalah platform pengelolaan sampah terintegrasi untuk Dinas Lingkungan Hidup (DLH) pemerintah Indonesia. Sistem ini menghubungkan seluruh rantai pengelolaan sampah — dari masyarakat penghasil sampah hingga TPST Bantar Gebang — dalam satu platform multi-tenant.

### Aktor

| Aktor | Platform | Autentikasi |
|-------|----------|-------------|
| Masyarakat | Mobile | OTP SMS/WA |
| Petugas Kebersihan | Mobile | Email/password |
| Operator TPS / Bank Sampah | Mobile | Email/password |
| Pemulung / Pengepul | Mobile | OTP SMS/WA |
| Driver Truk | Mobile | Email/password |
| Operator TPST | Mobile | Email/password |
| DLH Admin | Web | Email/password atau SSO |
| Super Admin | Web | Email/password |

### Scope

- Tracking & traceability sampah dari sumber ke TPA
- Pelaporan & monitoring untuk DLH
- Koordinasi operasional (penjadwalan, penugasan, rute)
- Pemberdayaan masyarakat (pelaporan, reward)
- Pembayaran terintegrasi (retribusi, bank sampah, payout, reward)

---

## Tech Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Backend | NestJS (TypeScript) | Modular by design, strong typing |
| Database | PostgreSQL + PostGIS | Relational + geospatial |
| Cache/Realtime | Redis | Session, caching, pub/sub GPS |
| Message Queue | BullMQ (Redis-based) | Job scheduling |
| Object Storage | MinIO (S3-compatible) | Foto, dokumen, bisa on-premise |
| Admin Web | React + Vite + Ant Design | Dashboard-oriented |
| Mobile App | React Native (Expo) | Satu codebase iOS & Android |
| Maps | Mapbox / OpenStreetMap+Leaflet | GPS tracking, visualisasi zona |
| Payment | Midtrans / Xendit | Payment gateway lokal Indonesia |
| Push Notification | Firebase Cloud Messaging | Mobile notification |
| Monorepo | Turborepo | Build caching, workspace management |

---

## Architecture

### Monolith Modular + Multi-Tenant (Schema-per-Tenant)

```
┌─────────────────────────────────────┐
│           Nginx (reverse proxy)     │
│         (tenant resolution)         │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        NestJS Monolith              │
│  ┌──────┬──────┬───────┬─────────┐  │
│  │ Auth │Track │Payment│Reporting│  │
│  │Module│Module│Module │ Module  │  │
│  ├──────┼──────┼───────┼─────────┤  │
│  │ User │ TPS  │ Fleet │  Waste  │  │
│  │Module│Module│Module │ Module  │  │
│  └──────┴──────┴───────┴─────────┘  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  PostgreSQL (schema-per-tenant)     │
│  ┌─────────┐ ┌──────────┐          │
│  │ public  │ │dlh_bekasi│ ...      │
│  │(shared) │ │(tenant)  │          │
│  └─────────┘ └──────────┘          │
└─────────────────────────────────────┘
```

- **`public` schema** — data shared: daftar tenant, master kategori sampah, konfigurasi global
- **Per-tenant schema** — data operasional: user, TPS, transaksi, tracking, pembayaran

---

## Domain Modules

### 1. Auth Module
- Login OTP (SMS/WA) untuk masyarakat via Zenziva/Fonnte
- Login email/password untuk petugas & admin
- RBAC dengan roles: `citizen`, `sweeper`, `tps_operator`, `collector`, `driver`, `tpst_operator`, `dlh_admin`, `super_admin`
- Tenant-aware middleware

### 2. User & Area Module
- Manajemen user per role
- Hierarki wilayah: Provinsi → Kota/Kabupaten → Kecamatan → Kelurahan → RW/RT
- Zona operasional — penugasan petugas dan TPS ke zona

### 3. TPS & Bank Sampah Module
- CRUD titik kumpul (TPS, TPS3R, bank sampah) dengan koordinat GPS
- Kapasitas dan status (aktif, penuh, maintenance)
- Pencatatan sampah masuk/keluar per kategori (organik, anorganik, B3, daur ulang)
- IoT scale integration-ready

### 4. Fleet & Logistics Module
- Manajemen armada (truk, gerobak, motor)
- Penjadwalan rute (recurring & on-demand)
- Real-time GPS tracking via WebSocket → Redis pub/sub → dashboard
- Checkpoint system: driver scan QR di TPS → catat waktu, volume, foto

### 5. Waste Tracking Module
- Lifecycle: Sumber → TPS → Pengangkutan → TPST
- `transfer_record` per perpindahan: asal, tujuan, volume, kategori, timestamp, petugas
- QR code per TPS untuk verifikasi
- Manifest digital per trip

### 6. Payment & Transaction Module
- Retribusi sampah — tagihan periodik, bayar via QRIS/VA/e-wallet
- Bank sampah — transaksi jual-beli daur ulang, saldo per anggota
- Reward points — poin dari partisipasi, tukar ke saldo/voucher
- Payout — pembayaran ke pemulung/pengepul
- Integrasi Midtrans/Xendit

### 7. Reporting & Complaint Module
- Lapor: sampah liar, TPS penuh, petugas tidak datang (foto + GPS)
- Workflow: Laporan → Verifikasi → Penugasan → Penyelesaian → Feedback
- Status tracking real-time

### 8. Dashboard & Analytics Module
- Volume harian/bulanan, compliance rate, performa petugas
- Heatmap sampah per zona
- Trend analysis & prediksi volume
- Export PDF/Excel

---

## ERD Inti

```
tenants
users (→ tenants, roles)
areas (→ tenants, self-referencing hierarchy)
tps_locations (→ tenants, areas, coordinates)
vehicles (→ tenants, assignments)
schedules (→ tenants, vehicles, routes)
transfer_records (→ tenants, tps_locations, users, categories)
transactions (→ tenants, users, payments)
complaints (→ tenants, users, attachments, assignments)
```

Granularitas tracking: per TPS/titik kumpul (bukan per rumah tangga).

---

## Fitur per Aktor

| Aktor | Fitur Utama |
|-------|-------------|
| Masyarakat | Lapor sampah liar, lihat jadwal angkut, bayar retribusi, cek poin reward, status pengaduan |
| Petugas Kebersihan | Checklist tugas harian, absensi lokasi GPS, catat volume per zona |
| Operator TPS/Bank Sampah | Catat sampah masuk/keluar, timbang & kategorisasi, transaksi bank sampah |
| Pemulung/Pengepul | Setor sampah daur ulang, lihat harga, cek saldo & riwayat payout |
| Driver Truk | Rute & jadwal, navigasi, checkpoint scan, manifest, GPS tracking |
| Operator TPST | Terima manifest, catat volume & kategori, verifikasi serah-terima |
| DLH Admin | Dashboard analytics, kelola petugas & armada, monitoring real-time, laporan |
| Super Admin | Kelola tenant, master data, konfigurasi global |

---

## Flow Utama

### Flow 1: Siklus Harian Pengangkutan
```
Jadwal dibuat (DLH Admin)
  → Driver terima notifikasi
  → Driver berangkat (GPS tracking mulai)
  → Di setiap TPS: scan QR → catat volume → foto → checkpoint saved
  → Sampai TPST: serah-terima manifest → Operator verifikasi
  → Trip selesai → Data masuk dashboard
```

### Flow 2: Laporan Masyarakat
```
Masyarakat foto + lokasi GPS → Pilih kategori
  → Masuk ke DLH Admin
  → Admin assign ke petugas terdekat
  → Petugas tindak lanjut → Upload bukti
  → Masyarakat dapat notifikasi → Rating
  → Reward points
```

### Flow 3: Transaksi Bank Sampah
```
Pemulung bawa sampah → Operator timbang → Kategorisasi
  → Harga otomatis dari master data
  → Saldo masuk akun → Payout ke rekening/e-wallet
```

### Flow 4: Retribusi Sampah
```
Sistem generate tagihan bulanan
  → Push notification → Bayar via QRIS/VA/e-wallet
  → Payment callback → Status lunas
  → Dashboard: monitoring tunggakan
```

---

## Notifikasi

| Event | Channel | Penerima |
|-------|---------|----------|
| Jadwal angkut hari ini | Push + in-app | Driver |
| Laporan baru masuk | Push + in-app | DLH Admin |
| Status laporan berubah | Push + in-app | Masyarakat |
| Tagihan retribusi | Push + SMS/WA | Masyarakat |
| Payout berhasil | Push + in-app | Pemulung/Pengepul |
| TPS mendekati kapasitas | Push + in-app | DLH Admin, Driver |

---

## Infrastructure & Deployment

### Deployment
- Docker Compose (dev, staging, production)
- Bisa deploy ke cloud (AWS/GCP/DigitalOcean) atau on-premise
- Nginx reverse proxy + static file serving untuk admin web

### Security

| Layer | Implementasi |
|-------|-------------|
| API | JWT access token (15min) + refresh token (7d), rate limiting per tenant |
| Data | Schema isolation, enkripsi data sensitif (NIK, no HP) |
| Transport | HTTPS/TLS, WSS untuk WebSocket |
| File Upload | Validasi tipe, size limit |
| Payment | Webhook signature verification, idempotency keys |
| Audit | Audit log untuk operasi sensitif |
| Mobile | Certificate pinning, secure storage |

### Monitoring
- Structured JSON logs
- Health check endpoint `/health`
- Uptime monitoring

### Backup
- PostgreSQL: daily backup + point-in-time recovery
- MinIO: periodic sync
- Redis: RDB snapshot

---

## Project Structure

```
buzzr/
├── apps/
│   ├── api/                    # NestJS backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/
│   │       │   ├── user/
│   │       │   ├── tenant/
│   │       │   ├── area/
│   │       │   ├── tps/
│   │       │   ├── fleet/
│   │       │   ├── schedule/
│   │       │   ├── tracking/
│   │       │   ├── transfer/
│   │       │   ├── payment/
│   │       │   ├── complaint/
│   │       │   └── report/
│   │       ├── common/
│   │       ├── config/
│   │       └── database/
│   ├── web/                    # React admin dashboard
│   │   └── src/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       └── stores/
│   └── mobile/                 # React Native (Expo)
│       └── src/
│           ├── screens/
│           │   ├── citizen/
│           │   ├── sweeper/
│           │   ├── tps-operator/
│           │   ├── collector/
│           │   ├── driver/
│           │   └── tpst-operator/
│           ├── components/
│           ├── services/
│           ├── navigation/
│           └── stores/
├── packages/
│   ├── shared-types/
│   ├── constants/
│   └── validators/
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── Dockerfiles
├── docs/plans/
├── turbo.json
├── package.json
└── .env.example
```

---

## Decisions Log

| Keputusan | Alasan |
|-----------|--------|
| Monolith modular vs microservices | Lebih cepat develop, cukup untuk skala DLH, bisa dipecah nanti |
| Schema-per-tenant vs DB-per-tenant | Lebih efisien resource, cukup untuk isolasi data |
| React Native (Expo) vs Flutter | Shared TypeScript dengan backend, ekosistem lebih besar |
| Turborepo vs Nx | Lebih ringan, cukup untuk 3 apps + packages |
| PostgreSQL + PostGIS vs MongoDB | Relational cocok untuk data terstruktur pemerintah, PostGIS untuk geospatial |
| Midtrans/Xendit vs custom | Payment gateway lokal, sudah comply regulasi BI |
| Mobile-first vs web-first | Mayoritas aktor di lapangan, DLH admin saja yang butuh web |
