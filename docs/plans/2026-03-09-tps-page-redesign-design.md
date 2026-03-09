# TPS Page Redesign — Design Document

**Date:** 2026-03-09
**Status:** Approved

## Context

The current TPS page (`/tps`) is a basic DataTable with a split-pane preview. It lacks spatial visualization, analytics, and CRUD capabilities. DLH admins need a page that serves both strategic monitoring (where are problem areas?) and daily operations (manage TPS, update status, add new locations).

### Research: DLH Jakarta Reference

Jakarta's DLH uses SILIKA (silika.jakarta.go.id/tps) for map-based TPS visualization, Pesapa Kawan for waste flow tracking, and SIPSN at national level. Key TPS types: TPS (basic collection), TPS 3R (sorting/composting/recycling, min 200m², serves 400+ households), TPST (full integrated processing), Depo (intermediate transfer), Bank Sampah (citizen recycling points).

Standard KPIs tracked: fill rate, collection frequency, waste diversion rate, near-capacity alerts, average load percentage, TPS status distribution.

## Target Users

- **DLH Admin (Kepala Bidang/Seksi)** — strategic oversight: monitoring fill levels across the city, capacity allocation
- **DLH Operator (field coordinator)** — daily operations: checking which TPS need collection, managing TPS data, handling incidents

## Architecture

### Page Structure

Replace `TpsTriagePage.tsx` with a `TpsPage/` directory. Three horizontal tabs at top of page:

- **Peta** (default) — Map view for spatial monitoring
- **Kelola** — DataTable with preview panel for management and CRUD
- **Analitik** — KPI cards and charts for summary analytics

Tab state stored in URL query param (`?tab=peta|kelola|analitik`) for shareability.

### File Structure

```
pages/TpsPage/
  index.tsx          — Tab container + PageHeader
  types.ts           — Shared interfaces
  api.ts             — TPS API functions
  store.ts           — Zustand store (shared across tabs)
  tabs/
    MapTab.tsx        — Map view
    ManageTab.tsx     — Table + preview + CRUD
    AnalyticsTab.tsx  — KPI cards + charts
  components/
    TpsMap.tsx        — Leaflet map (reusable)
    TpsKpiBar.tsx     — KPI summary row
    TpsForm.tsx       — Add/Edit modal form
    CapacityBar.tsx   — Visual fill-level bar
```

### Zustand Store

```typescript
interface TpsPageState {
  allTps: TpsMapItem[];
  selectedTpsId: string | null;
  activeTab: 'peta' | 'kelola' | 'analitik';
  mapFilters: { types: Set<string>; statuses: Set<string> };
  setAllTps(tps: TpsMapItem[]): void;
  selectTps(id: string | null): void;
  setActiveTab(tab: string): void;
  toggleMapFilter(kind: 'types' | 'statuses', value: string): void;
}
```

The Kelola tab also uses `useServerTable` separately for its paginated server-side table.

## Tab Designs

### Tab 1: Peta (Map View)

**Top:** KPI summary bar — Total TPS, Aktif, Hampir Penuh (≥80%), Rata-rata Beban %.

**Below:** Full-height Leaflet map.

- CircleMarkers color-coded by fill level: green (<70%), amber (70-89%), red (≥90%), gray (maintenance)
- Click opens Leaflet Popup: name, type badge, status badge, CapacityBar, address, "Lihat Detail →" link (switches to Kelola tab with TPS selected)
- Filter chips above map to toggle by type (TPS / TPS3R / Bank Sampah) and status
- Map auto-fits bounds to all visible TPS on load
- Legend at bottom: green/amber/red/gray meaning

**Data source:** `GET /tps/map-summary` (existing endpoint).

### Tab 2: Kelola (Management View)

**Layout:** DataTable (65% width) + Preview Panel (35% width).

**DataTable (left):**
- Columns: Nama, Tipe (badge), Status (badge), Alamat, Kapasitas (ton), Beban (CapacityBar)
- Server-side pagination, search (name, address), sort, filter (status, type)
- Row click opens preview panel
- Keyboard navigation (↑↓ Enter Escape)
- "Tambah TPS" button top-right → opens TpsForm modal in create mode

**Preview Panel (right):**
- Header: name, type badge, status badge
- Capacity section: CapacityBar with `current / max ton (pct%)`
- Mini-map: Small static Leaflet map (200px), single marker, non-interactive
- Details: address, coordinates, QR code, area
- Actions: "Edit" button → TpsForm modal pre-filled, "Ubah Status" dropdown → quick status transition

**TpsForm modal fields:**
- Nama (text, required, 2-100 chars)
- Tipe (select: TPS, TPS3R, Bank Sampah)
- Alamat (textarea, required, 5-500 chars)
- Kapasitas dalam Ton (number, required, min 0.1)
- Latitude (number, -90 to 90)
- Longitude (number, -180 to 180)
- Area (select, from areas table)

Validation: `@buzzr/validators` Zod schema (`createTpsSchema`).

### Tab 3: Analitik (Analytics View)

**Top:** Same KPI summary bar as Map tab (shared component).

**Charts (2×2 grid):**

1. **Distribusi Beban** — Horizontal bar chart. Buckets: 0-25%, 25-50%, 50-75%, 75-90%, 90-100%. Color-coded green→red.
2. **TPS per Tipe** — Donut chart: TPS, TPS3R, Bank Sampah counts.
3. **Status TPS** — Donut chart: active, full, maintenance counts.
4. **TPS Hampir Penuh (Top 10)** — Ranked list of highest fill-level TPS with CapacityBar. Rows clickable → switches to Kelola tab with TPS selected.

**Charting library:** Recharts.

**Data source:** All computed client-side from `/tps/map-summary` response. No new backend endpoint needed.

## Shared Components

### CapacityBar

Colored progress bar. Props: `current: number`, `max: number`, `showLabel?: boolean`.
Colors: green <70%, amber 70-89%, red ≥90%. Used in: Map popup, Kelola preview, Kelola table column, Analytics top-10 list.

### TpsKpiBar

Row of 4 KPI metric cards. Computed from TPS array. Props: `data: TpsMapItem[]`.
Metrics: Total TPS, Aktif, Hampir Penuh (≥80%), Rata-rata Beban %. Used in: Map tab (top), Analytics tab (top).

### TpsMap

Leaflet map with TPS CircleMarkers. Props: `data: TpsMapItem[]`, `onTpsClick?: (id) => void`, `selectedId?: string`, `filterTypes?: Set<string>`, `filterStatuses?: Set<string>`, `height?: string`, `interactive?: boolean`, `singleMarker?: boolean`.
Used in: Map tab (full height, all markers), Kelola preview (mini, single marker, 200px height).

### TpsForm

Modal dialog for create/edit. Props: `open: boolean`, `onClose: () => void`, `tps?: TpsMapItem | null` (null = create mode).
Uses Zod validation. Calls `POST /tps` for create, `PATCH /tps/:id` for edit.

## Backend Changes

### 1. PATCH /tps/:id (new endpoint)

- **Roles:** DLH_ADMIN, SUPER_ADMIN
- **DTO:** `UpdateTpsDto` — all fields optional: name, type, status, address, latitude, longitude, capacityTons, areaId
- **Service:** Dynamic SET clause, recalculates PostGIS coordinates if lat/lng provided, updates `updated_at`
- **Returns:** Updated TPS object

### 2. No new analytics endpoint

All analytics derived client-side from existing `GET /tps/map-summary`.

## Numeric Coercion

All numeric values from raw SQL (`capacity_tons`, `current_load_tons`, `fill_percent`, `latitude`, `longitude`) must be coerced with `Number()` when mapping API responses — same pattern established in Live Ops hooks.

## Dependencies

- `recharts` — charting library (new, add to `apps/web`)
- `leaflet`, `react-leaflet` — already installed (used in Live Ops)
- `zustand` — already installed
- `@tanstack/react-table` — already installed
- `@buzzr/validators` — already installed
