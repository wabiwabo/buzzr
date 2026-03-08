# Buzzr API Reference

Base URL: `/api/v1`

Semua endpoint memerlukan header `X-Tenant-Slug` kecuali yang ditandai **(no tenant)**.

Endpoint yang dilindungi memerlukan header `Authorization: Bearer <token>`.

---

## Authentication

### POST /auth/login
Login dengan email dan password.

**Body:**
```json
{
  "email": "admin@demo.buzzr.id",
  "password": "demo1234"
}
```

**Response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "name": "Admin DLH",
    "email": "admin@demo.buzzr.id",
    "role": "dlh_admin"
  }
}
```

### POST /auth/otp/request
Minta kode OTP via SMS/WhatsApp.

**Body:**
```json
{ "phone": "081234567890" }
```

### POST /auth/otp/verify
Verifikasi OTP dan login. Auto-register jika pengguna baru.

**Body:**
```json
{
  "phone": "081234567890",
  "code": "123456"
}
```

**Response:** Sama seperti `/auth/login`.

---

## Users

### POST /users
Buat user baru.

**Roles:** `dlh_admin`, `super_admin`

**Body:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@demo.buzzr.id",
  "password": "password123",
  "role": "driver",
  "phone": "081234567890",
  "areaId": "uuid"
}
```

### GET /users
Daftar user dengan filter.

**Roles:** `dlh_admin`, `super_admin`

**Query:** `?role=driver&areaId=uuid`

### GET /users/me
Profil pengguna saat ini.

**Auth:** JWT required

### GET /users/:id
Detail user berdasarkan ID.

**Roles:** `dlh_admin`, `super_admin`

---

## Areas

Wilayah disusun secara hierarki: Provinsi (level 1) > Kota (2) > Kecamatan (3) > Kelurahan (4) > RW (5) > RT (6).

### POST /areas
Buat wilayah baru.

**Roles:** `dlh_admin`, `super_admin`

**Body:**
```json
{
  "name": "Jakarta Selatan",
  "level": 2,
  "parentId": "uuid-provinsi"
}
```

### GET /areas
Daftar wilayah. **Query:** `?level=3&parentId=uuid`

### GET /areas/:id
Detail wilayah.

### GET /areas/:id/children
Daftar wilayah anak (sub-wilayah).

---

## TPS (Titik Pengumpulan Sampah)

### POST /tps
Buat lokasi TPS baru.

**Roles:** `dlh_admin`, `super_admin`

**Body:**
```json
{
  "name": "TPS Senayan",
  "type": "tps",
  "address": "Jl. Senayan No. 1",
  "latitude": -6.2256,
  "longitude": 106.8025,
  "capacity_tons": 10.0,
  "area_id": "uuid",
  "qr_code": "TPS-001"
}
```

Type: `tps` | `tps3r` | `bank_sampah`

### GET /tps
Daftar TPS. **Query:** `?areaId=uuid&type=tps&status=active`

### GET /tps/nearby
Cari TPS terdekat (PostGIS).

**Query:** `?lat=-6.2256&lng=106.8025&radius=5000` (radius dalam meter)

### GET /tps/:id
Detail TPS termasuk kapasitas dan beban saat ini.

### POST /tps/waste
Catat sampah masuk/keluar di TPS.

**Roles:** `tps_operator`, `sweeper`, `dlh_admin`

**Body:**
```json
{
  "tps_id": "uuid",
  "direction": "in",
  "category": "organic",
  "volume_kg": 150.5,
  "notes": "Sampah organik pasar"
}
```

Direction: `in` (masuk) | `out` (keluar)
Category: `organic` | `inorganic` | `b3` | `recyclable`

---

## Fleet (Armada)

### POST /fleet
Tambah kendaraan.

**Roles:** `dlh_admin`, `super_admin`

**Body:**
```json
{
  "plate_number": "B 1234 ABC",
  "type": "truck",
  "capacity_tons": 5.0
}
```

### GET /fleet
Daftar kendaraan. **Query:** `?type=truck`

### GET /fleet/:id
Detail kendaraan termasuk driver yang ditugaskan.

### PATCH /fleet/:id/assign
Tugaskan driver ke kendaraan.

**Roles:** `dlh_admin`, `super_admin`

**Body:** `{ "driver_id": "uuid" }`

### PATCH /fleet/:id/unassign
Lepaskan driver dari kendaraan.

**Roles:** `dlh_admin`, `super_admin`

---

## Schedules (Jadwal)

### POST /schedules
Buat jadwal angkut.

**Roles:** `dlh_admin`, `super_admin`

**Body:**
```json
{
  "vehicle_id": "uuid",
  "driver_id": "uuid",
  "route_name": "Rute Kebayoran",
  "schedule_type": "recurring",
  "recurring_days": [1, 3, 5],
  "start_time": "07:00"
}
```

`recurring_days`: 0=Minggu, 1=Senin, ..., 6=Sabtu

### POST /schedules/:id/stops
Tambah TPS stop ke jadwal.

**Body:** `{ "tps_id": "uuid", "stop_order": 1, "estimated_arrival": "07:30" }`

### GET /schedules/today
Jadwal hari ini untuk driver yang login.

**Roles:** `driver`

### GET /schedules/:id
Detail jadwal dengan TPS stops.

### PATCH /schedules/:id/status
Update status jadwal.

**Roles:** `driver`, `dlh_admin`

**Body:** `{ "status": "in_progress" }`

---

## GPS Tracking

### WebSocket: /tracking

Connect ke namespace `/tracking` dengan Socket.IO.

**Events:**

| Event | Direction | Payload |
|-------|-----------|---------|
| `gps:update` | Client > Server | `{ tenantSchema, vehicleId, driverId, latitude, longitude, speed }` |
| `tracking:subscribe` | Client > Server | `{ tenantSchema }` |

GPS update di-throttle setiap 5 detik per kendaraan.

### GET /tracking/:vehicleId/history
Riwayat GPS. **Query:** `?from=2026-03-01&to=2026-03-08`

### GET /tracking/:vehicleId/latest
Posisi terakhir kendaraan.

---

## Transfers (Serah Terima Sampah)

### POST /transfers/checkpoint
Buat checkpoint di TPS (scan QR, catat volume).

**Roles:** `driver`

**Body:**
```json
{
  "schedule_id": "uuid",
  "source_tps_id": "uuid",
  "category": "organic",
  "volume_kg": 500,
  "notes": "Normal pickup",
  "photo_url": "https://..."
}
```

### GET /transfers/manifest/:scheduleId
Lihat manifest trip (daftar semua transfer record).

### PATCH /transfers/manifest/:scheduleId/verify
Verifikasi seluruh manifest oleh operator TPST.

**Roles:** `tpst_operator`, `dlh_admin`

### PATCH /transfers/:id/status
Update status transfer individual.

**Roles:** `driver`, `dlh_admin`

**Body:** `{ "status": "delivered" }`

Status: `pending` > `in_transit` > `delivered` > `verified`

---

## Payments (Pembayaran)

### POST /payments
Buat invoice/tagihan.

**Roles:** `dlh_admin`, `super_admin`

**Body:**
```json
{
  "user_id": "uuid",
  "type": "retribution",
  "amount": 50000,
  "description": "Retribusi sampah Maret 2026"
}
```

Type: `retribution` | `bank_sampah_buy` | `bank_sampah_sell` | `reward_redeem` | `payout`

### POST /payments/webhook **(no auth, no tenant)**
Terima callback dari Xendit. Diverifikasi dengan `X-Callback-Token`.

### GET /payments
Daftar pembayaran. **Query:** `?type=retribution&status=pending`

### GET /payments/my
Pembayaran milik pengguna saat ini.

### GET /payments/overdue
Tagihan yang jatuh tempo.

**Roles:** `dlh_admin`

---

## Bank Sampah

### GET /bank-sampah/prices
Daftar harga sampah per kategori.

### GET /bank-sampah/wallet
Saldo dompet pengguna.

### POST /bank-sampah/sell
Catat penjualan sampah daur ulang.

**Roles:** `tps_operator`, `dlh_admin`

**Body:**
```json
{
  "seller_id": "uuid",
  "category": "recyclable",
  "volume_kg": 5.0,
  "price_per_kg": 3000
}
```

### POST /bank-sampah/payout
Request penarikan saldo.

**Body:** `{ "amount": 50000 }`

### GET /bank-sampah/history
Riwayat transaksi bank sampah.

---

## Rewards

### GET /rewards/config
Konfigurasi poin reward (berapa poin per aksi).

### GET /rewards/points
Total poin reward pengguna.

### POST /rewards/redeem
Tukar poin reward.

**Body:** `{ "points": 100, "type": "wallet_credit" }`

---

## Complaints (Pengaduan)

### POST /complaints
Buat laporan pengaduan.

**Roles:** `citizen`

**Body:**
```json
{
  "category": "illegal_dumping",
  "description": "Tumpukan sampah di pinggir jalan",
  "latitude": -6.2256,
  "longitude": 106.8025,
  "address": "Jl. Sudirman No. 10"
}
```

Category: `illegal_dumping` | `tps_full` | `missed_pickup` | `other`

### GET /complaints
Daftar pengaduan. **Query:** `?status=submitted`

### GET /complaints/my
Pengaduan milik pengguna.

**Roles:** `citizen`

### GET /complaints/:id
Detail pengaduan.

### PATCH /complaints/:id/assign
Tugaskan petugas ke pengaduan.

**Roles:** `dlh_admin`

**Body:** `{ "assigned_to": "uuid" }`

### PATCH /complaints/:id/status
Update status pengaduan.

**Roles:** `dlh_admin`, `sweeper`

**Body:** `{ "status": "resolved" }`

Status: `submitted` > `verified` > `assigned` > `in_progress` > `resolved` | `rejected`

### PATCH /complaints/:id/rate
Beri rating setelah selesai.

**Roles:** `citizen`

**Body:** `{ "rating": 5 }`

---

## Notifications

### GET /notifications
Daftar notifikasi pengguna.

### GET /notifications/unread-count
Jumlah notifikasi belum dibaca.

### PATCH /notifications/:id/read
Tandai notifikasi sebagai dibaca.

### PATCH /notifications/read-all
Tandai semua notifikasi sebagai dibaca.

---

## Reports & Analytics

### GET /reports/dashboard
Ringkasan dashboard.

**Roles:** `dlh_admin`, `super_admin`

**Response:**
```json
{
  "totalTps": 25,
  "totalVehicles": 10,
  "totalComplaints": 150,
  "todayVolume": 5000,
  "complianceRate": 85.5
}
```

### GET /reports/waste-volume
Volume sampah per periode. **Query:** `?from=2026-03-01&to=2026-03-08`

### GET /reports/complaints
Statistik pengaduan. **Query:** `?from=2026-03-01&to=2026-03-08`

### GET /reports/heatmap
Heatmap volume sampah per TPS (PostGIS).

### GET /reports/driver-performance
Performa driver (jumlah trip, volume, compliance). **Query:** `?from=2026-03-01&to=2026-03-08`

---

## Tenants **(no tenant header)**

### POST /tenants
Buat tenant baru (otomatis buat schema).

**Roles:** `super_admin`

**Body:**
```json
{
  "name": "DLH Bekasi",
  "slug": "dlh-bekasi"
}
```

### GET /tenants
Daftar semua tenant.

**Roles:** `super_admin`

---

## Upload

### POST /upload
Upload file (multipart/form-data).

**Auth:** JWT required

**Body:** `file` (binary), `folder` (string, e.g. "complaints", "checkpoints")

**Validasi:** Hanya gambar (jpg, jpeg, png, gif, webp), maks 5MB.

**Response:**
```json
{
  "key": "complaints/abc123-photo.jpg",
  "url": "https://minio.../buzzr-dlh_demo/complaints/abc123-photo.jpg?..."
}
```

---

## Health **(no auth, no tenant)**

### GET /health
Cek kesehatan sistem.

**Response:**
```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "minio": "ok"
  },
  "timestamp": "2026-03-08T10:00:00.000Z",
  "uptime": 3600
}
```
