# Web Dashboard UX Full Redesign

**Date:** 2026-03-08
**Approach:** Full Redesign (Pendekatan C)
**Target Users:** DLH Admin + Super Admin
**Visual Style:** Clean & Professional

## 1. Design System & Shared Components

### Design Tokens

Ant Design theme override — professional, consistent:

| Token | Value | Keterangan |
|-------|-------|------------|
| Primary | `#1677ff` | Profesional, familiar |
| Success | `#52c41a` | Aktif, paid, resolved |
| Warning | `#faad14` | Maintenance, pending, approaching limit |
| Danger | `#ff4d4f` | Full, overdue, rejected |
| Neutral BG | `#f5f5f5` | Background halaman |
| Card BG | `#ffffff` | Card & modal background |
| Border Radius | `8px` | Konsisten semua komponen |
| Spacing Unit | `16px` | Base spacing (8, 16, 24, 32) |

### Shared Components

| Component | Fungsi |
|-----------|--------|
| `<PageHeader>` | Judul + breadcrumb + deskripsi + action buttons |
| `<StatCard>` | KPI card: ikon, value, label, trend indicator, drill-down |
| `<SmartTable>` | Wrapper Ant Table: search, filter, sort, bulk select, export, expand, inline edit, empty state |
| `<FilterPanel>` | Collapsible advanced filter dengan multiple criteria |
| `<EmptyState>` | Ilustrasi + pesan + CTA button |
| `<StatusBadge>` | Konsisten status tag dengan warna & ikon |
| `<QuickAction>` | Shortcut untuk aksi cepat |
| `<InfoTooltip>` | Ikon "?" dengan penjelasan konteks |
| `<ActivityFeed>` | Timeline vertikal untuk log aktivitas |
| `<MapView>` | Wrapper Leaflet untuk TPS & driver |
| `<OnboardingTour>` | Step-by-step guided tour |
| `<ConfirmAction>` | Popconfirm konsisten untuk destructive actions |
| `<DetailDrawer>` | Drawer dari kanan untuk detail row |

### Folder Structure

```
src/
├── components/
│   ├── common/          # PageHeader, StatCard, StatusBadge, InfoTooltip, ConfirmAction
│   ├── data/            # SmartTable, FilterPanel, EmptyState, DetailDrawer
│   ├── feedback/        # ActivityFeed, OnboardingTour, QuickAction
│   └── map/             # MapView
├── theme/
│   └── config.ts        # Ant Design theme override tokens
├── hooks/
│   ├── useTableState.ts # Search, filter, sort, pagination, bulk select state
│   ├── useExport.ts     # CSV/Excel export logic
│   └── useOnboarding.ts # Tour state management
```

---

## 2. Layout & Navigasi

### Header Bar

- **Global Search** — cari TPS, user, complaint, kendaraan dari mana saja. Hasil grouped per kategori.
- **Notification Bell** — badge count: complaint baru, pembayaran jatuh tempo, TPS penuh. Dropdown list.
- **User Menu** — profil, pengaturan, switch tenant (Super Admin), logout.

### Sidebar

Menu dikelompokkan dalam 3 section:

- **OPERASIONAL:** Dashboard, TPS, Armada, Jadwal
- **MONITORING:** Laporan Warga (badge "N baru"), Pembayaran (badge "N overdue")
- **ADMINISTRASI:** Pengguna, Laporan, Pengaturan (Super Admin only), Bantuan

Badge counter di Laporan Warga & Pembayaran untuk hal yang butuh perhatian.

### Breadcrumb

Setiap halaman: `Dashboard > TPS > Detail TPS Cimahi Utara`

### Responsive

| Lebar | Behavior |
|-------|----------|
| >=1200px | Sidebar expanded + content full |
| 768-1199px | Sidebar collapsed (icon only), hover expand |
| <768px | Sidebar hidden, hamburger menu |

---

## 3. Dashboard (Command Center)

### Widget Layout (top to bottom)

**Row 1: 5 StatCards**
- Driver Aktif (count, klik → Fleet page)
- TPS Penuh (count + warning, klik → TPS page filtered)
- Complaint Baru (count, klik → Complaint page filtered)
- Tunggakan Overdue (Rp currency, klik → Payment page filtered)
- Volume Hari Ini (kg, trend % vs kemarin)

**Row 2: 2 columns**
- **Peta Real-time (kiri, 60%)** — Leaflet map. TPS markers color-coded by status, driver GPS positions via WebSocket, route lines. Filter: TPS | Driver | Route | Semua. Klik marker → popup detail.
- **Butuh Perhatian (kanan, 40%)** — Priority list: complaint belum assign, pembayaran jatuh tempo, TPS >90%. Klik → DetailDrawer, quick action: assign/resolve.

**Row 3: 2 columns**
- **Trend Volume Sampah (kiri)** — Area chart, line per kategori (Organik, Anorganik, B3, Daur Ulang). Toggle: 7d / 30d / 90d.
- **Aktivitas Terbaru (kanan)** — Timeline feed: assign, rute mulai/selesai, status change, pembayaran. "Lihat semua" link.

**Row 4: Ringkasan Mingguan**
- 4 progress cards: Collection Rate, Complaint Resolution, Payment Collection, Avg Resolution Time. Trend arrow vs minggu lalu.

### Data Sources

| Widget | Endpoint | Interaksi |
|--------|----------|-----------|
| StatCards | `/reports/dashboard` + `/payments/overdue` | Klik → navigate |
| Peta | `/tps` + WebSocket tracking | Filter, zoom, popup |
| Butuh Perhatian | Complaints (submitted), Payments (overdue), TPS (>90%) | Klik → drawer, quick action |
| Trend Volume | `/reports/waste-volume?range=` | Toggle periode |
| Aktivitas | `/reports/activity-feed` (new endpoint) | Scroll, klik → navigate |
| Ringkasan | `/reports/dashboard?compare=prev_week` | Visual progress bars |

### Role Differences

| Element | DLH Admin | Super Admin |
|---------|-----------|-------------|
| StatCards | 5 cards | + tenant count card |
| Peta | Tenant scope | Switch tenant |
| Butuh Perhatian | Tenant scope | Cross-tenant |
| Aktivitas | Tenant scope | System-wide |

---

## 4. Smart Table System

### SmartTable Features

| Fitur | Detail |
|-------|--------|
| Global Search | Debounced 300ms, highlight match |
| Advanced Filter | Collapsible panel, chip tags, reset button |
| Column Sort | Click header: asc → desc → none |
| Bulk Select | Checkbox per row + select all, bulk action toolbar |
| Export | CSV / Excel, respects active filters |
| Row Expand | Click row → inline detail panel |
| Inline Edit | Double-click cell → edit. Enter save, Esc cancel |
| Row Actions | "..." dropdown: Edit, Detail, Assign, Delete |
| Empty State | Illustration + message + CTA per page |
| Loading | Skeleton rows (not spinner) |
| Pagination | 10/25/50 per page, "Showing X-Y of Z" |

### Config-driven

Each page defines a config object:

```ts
SmartTable({
  columns: [...],
  filters: [...],
  searchFields: ['name', 'address'],
  bulkActions: ['assign', 'delete'],
  expandable: true | renderExpand(),
  editableColumns: ['status', 'capacity'],
  exportFileName: 'data-tps',
})
```

### Per-Page Improvements

| Halaman | Improvement |
|---------|-------------|
| TPS | Search, beban progress bar, expand riwayat pengangkutan |
| Fleet | Dropdown pilih driver (nama + foto), real-time status |
| Schedule | Nama driver & plat nomor, calendar view toggle |
| Complaint | Priority indicator, SLA countdown, bulk assign |
| Payment | Date range filter, currency summary, bulk reminder |
| User | Search nama/email/HP, inline status toggle, last active |

---

## 5. Form, Modal & Detail Drawer

### Form Principles

- **Progressive disclosure** — field muncul berdasarkan pilihan sebelumnya
- **Inline validation** — real-time saat mengetik
- **Helper text** — deskripsi di bawah field yang tidak obvious
- **Auto-save draft** — localStorage untuk form panjang

### Modal Pattern

- Judul: "Tambah [Entitas]" / "Edit [Entitas]"
- Field dikelompokkan dalam sections dengan heading
- Layout vertical, required ditandai `*`
- InfoTooltip `ⓘ` untuk field yang perlu penjelasan
- Footer: Batal (kiri) + Submit primary (kanan)
- Success → auto close + toast + refresh tabel

### Detail Drawer

- Lebar 480px, push content
- Info lengkap: semua field + mini map + foto/lampiran + timeline riwayat
- Action buttons di footer sesuai status
- Bisa edit langsung dari drawer

### Per-Page Form Improvements

| Halaman | Improvement |
|---------|-------------|
| TPS | Map picker untuk koordinat, auto-fill alamat |
| Fleet → Assign | Dropdown search driver (nama + foto + status) |
| Schedule | Dropdown kendaraan & driver, visual day picker |
| Complaint → Assign | Dropdown staff (nama + role + workload) |
| User | Stepper: role → data → konfirmasi preview |
| Payment | Create tagihan: pilih user → tipe → jumlah → due date |

### Toast Notifications

| Aksi | Message |
|------|---------|
| Create | "TPS berhasil ditambahkan" |
| Update | "Data berhasil diperbarui" |
| Delete | "Data berhasil dihapus" |
| Assign | "Driver berhasil ditugaskan" |
| Error | "Gagal menyimpan. Silakan coba lagi." |

---

## 6. Onboarding, Helper & Notifikasi

### Onboarding Tour (6 steps)

1. Welcome — pengenalan Buzzr
2. Dashboard — command center overview
3. TPS — kelola lokasi pembuangan
4. Laporan Warga — terima & tindaklanjuti complaint
5. Notification bell — real-time alerts
6. Selesai — link ke Bantuan untuk tour ulang

Implementation: Ant Design `Tour` component. State di localStorage + user preferences. Tour berbeda per role.

### Contextual Help (InfoTooltip)

| Lokasi | Tooltip |
|--------|---------|
| Collection Rate | "Persentase sampah berhasil diangkut dari total hari ini" |
| Tunggakan | "Total tagihan melewati jatuh tempo" |
| TPS Beban | "Estimasi beban berdasarkan laporan terakhir" |
| Complaint SLA | "Batas waktu: 3 hari kerja sejak dilaporkan" |
| Filter >90% | "TPS mendekati penuh, perlu segera diangkut" |
| Schedule Rutin | "Jadwal berulang setiap minggu di hari yang dipilih" |
| Payment Retribusi | "Iuran wajib pengelolaan sampah sesuai Perda" |

### Empty States

Each page has contextual empty state with illustration + message + CTA button. Filter empty state shows "Tidak ada data cocok" + [Reset Filter].

### Notification System (3 Layers)

**Layer 1: Bell Dropdown** — grouped (Baru / Sebelumnya), click → navigate, "Tandai semua dibaca"

**Layer 2: Toast Realtime** — via WebSocket, auto-dismiss 8s, max 3 concurrent, click "Lihat" → drawer

**Layer 3: Dashboard Widget** — persistent "Butuh Perhatian" list

| Event | Bell | Toast | Dashboard |
|-------|------|-------|-----------|
| Complaint baru | yes | yes | yes |
| TPS >90% | yes | yes | yes |
| Pembayaran jatuh tempo | yes | — | yes |
| Driver mulai/selesai rute | yes | — | — |
| Complaint resolved | yes | — | — |
| Pembayaran diterima | yes | — | — |
| User baru terdaftar | yes | — | — |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus global search |
| `n` | Open "Tambah baru" modal |
| `Esc` | Close modal/drawer |
| `?` | Show shortcut list |
| `g` then `d` | Go to Dashboard |
| `g` then `t` | Go to TPS |
| `g` then `c` | Go to Complaints |

---

## New Backend Endpoints Required

| Endpoint | Purpose |
|----------|---------|
| `GET /reports/activity-feed` | Activity timeline for dashboard |
| `GET /reports/dashboard?compare=prev_week` | Week-over-week comparison data |
| `GET /notifications` | User notifications list |
| `POST /notifications/:id/read` | Mark notification as read |
| WebSocket event subscriptions | Real-time toast notifications |

## New Dependencies

| Package | Purpose |
|---------|---------|
| `react-leaflet` + `leaflet` | Map visualization |
| `xlsx` or `file-saver` | Excel/CSV export |
| `react-joyride` or Ant `Tour` | Onboarding tour |
| `dayjs` (already installed) | Date formatting |
