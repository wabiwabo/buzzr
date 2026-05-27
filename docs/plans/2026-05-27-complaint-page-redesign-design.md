# Complaint Page Redesign — Design Document

**Date:** 2026-05-27
**Pattern:** TPS Page (3-tab folder structure)
**Scope:** Frontend page rewrite + 2 new backend endpoints

---

## Overview

Redesign the single-file `ComplaintTriagePage.tsx` into a folder-based `ComplaintPage/` with three tabs: Triage, Peta (Map), and Analitik (Analytics). Follows the established TPS page pattern with `index.tsx`, `api.ts`, `store.ts`, `types.ts`, `components/`, and `tabs/`.

## File Structure

```
apps/web/src/pages/ComplaintPage/
├── index.tsx                # Tab router, data loading, URL sync
├── api.ts                   # Complaint-specific API calls
├── store.ts                 # Zustand store for complaint page state
├── types.ts                 # Complaint, MapComplaint, ComplaintStats interfaces
├── components/
│   ├── ComplaintMap.tsx      # Leaflet map with CircleMarkers + clusters
│   ├── ComplaintKpiBar.tsx   # 4 KPI stat cards
│   └── ComplaintForm.tsx     # Assign-to-sweeper modal
└── tabs/
    ├── TriageTab.tsx         # DataTable + enhanced preview panel
    ├── MapTab.tsx            # KPIs + filter chips + full map
    └── AnalyticsTab.tsx      # Charts + top-10 problem areas
```

## Tab 1: Triage

Migrates the current `ComplaintTriagePage.tsx` DataTable into a tab with an enhanced preview panel.

**DataTable columns (unchanged):**
- Deskripsi (truncated, highlighted search)
- Kategori (badge)
- Status (StatusBadge)
- Pelapor (highlighted search)
- Lokasi (truncated address)
- Tanggal (DD MMM YY)
- SLA (SlaCountdown)

**Enhanced preview panel:**
- Header: description + reporter name + date
- StatusStepper with clickable transitions (existing component)
- SlaCountdown prominent (existing component)
- Photo attachments grid — thumbnails from `complaint_attachments` table, click to enlarge
- Mini-map — small Leaflet map showing complaint pin location
- Assign action — button to open ComplaintForm modal for assigning to a sweeper
- Kategori, status, assignee detail rows

**Filters:** status (`c.status`) + category (`c.category`) — same as current.

**Data source:** `GET /complaints/paginated` (existing)

## Tab 2: Peta (Map)

Full-screen map view of all complaints with spatial context.

**KPI bar (4 cards):**
- Total Pengaduan (count)
- SLA Breach (count where created_at + 72h < now AND status not resolved)
- Rata-rata Resolusi (hours, from resolved complaints)
- Tingkat Selesai (% resolved out of total)

**Filter chips:** status + category, same filter definitions as Triage tab. Filters apply to both KPIs and map markers.

**Leaflet map:**
- CircleMarkers color-coded by status:
  - Green: `resolved`
  - Blue: `verified`, `assigned`
  - Orange: `in_progress`
  - Red: `submitted` (new/unverified)
  - Pulsing red: any non-resolved complaint past 72h SLA
- MarkerClusterGroup for dense areas
- Popup on click: description (truncated), category badge, status badge, SLA countdown, address
- Default center: average of all complaint coordinates (or Indonesia center fallback)

**Data source:** `GET /complaints/map-summary` (new endpoint)

## Tab 3: Analitik (Analytics)

Dashboard-style analytics with date range control.

**Date range picker:** default last 30 days, configurable.

**Charts (2x2 grid):**
1. Resolution Time Trend — AreaChart showing average resolution hours per day
2. SLA Compliance Rate — AreaChart showing % resolved within 72h per week
3. Category Distribution — PieChart with CATEGORY_LABELS
4. Status Distribution — horizontal BarChart with STATUS_LABELS colors

**Bottom section:** Top 10 Problem Areas
- Table: rank, address/area, complaint count, avg resolution hours
- Sorted by complaint count descending

**Data sources:**
- `GET /reports/complaints/timeseries?from=&to=` (new endpoint) — daily aggregation
- `GET /reports/complaints?from=&to=` (existing) — summary stats for KPIs

## Backend: Modified Endpoints

### GET /api/v1/complaints/:id (modify existing)

Extend to include attachments from `complaint_attachments` table.

**Add to response:** `attachments: Array<{ id, file_url, file_type, created_at }>`

**SQL addition:**
```sql
SELECT id, file_url, file_type, created_at
FROM "{schema}".complaint_attachments
WHERE complaint_id = $1
ORDER BY created_at
```

**Location:** `apps/api/src/modules/complaint/complaint.service.ts` (modify `findOne`)

---

## Backend: New Endpoints

### GET /api/v1/complaints/map-summary

Lightweight endpoint for map markers without pagination.

**Response:** `Array<{ id, latitude, longitude, status, category, created_at }>`

**Constraints:**
- No pagination — returns all matching rows
- Max 1000 rows, ordered by created_at DESC
- Last 90 days only
- No joins (no reporter name, no attachments, no description)

**SQL:**
```sql
SELECT id, latitude, longitude, status, category, created_at
FROM "{schema}".complaints
WHERE created_at > NOW() - INTERVAL '90 days'
ORDER BY created_at DESC
LIMIT 1000
```

**Location:** `apps/api/src/modules/complaint/complaint.controller.ts` + `complaint.service.ts`
**Auth:** JwtAuthGuard, Roles: DLH_ADMIN, SUPER_ADMIN
**Test:** `complaint.service.spec.ts`

### GET /api/v1/reports/complaints/timeseries

Daily aggregation for trend charts.

**Query params:** `from` (date), `to` (date)
**Response:** `Array<{ date, total, resolved, avg_resolution_hours, sla_compliance_pct }>`

**SQL:**
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*)::int as total,
  COUNT(*) FILTER (WHERE status = 'resolved')::int as resolved,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
    FILTER (WHERE resolved_at IS NOT NULL), 1) as avg_resolution_hours,
  CASE WHEN COUNT(*) = 0 THEN 100
  ELSE ROUND(
    COUNT(*) FILTER (WHERE resolved_at IS NOT NULL
      AND resolved_at - created_at <= INTERVAL '72 hours') * 100.0 / COUNT(*), 1
  ) END as sla_compliance_pct
FROM "{schema}".complaints
WHERE created_at BETWEEN $1 AND ($2::date + interval '1 day')
GROUP BY DATE(created_at)
ORDER BY date
```

**Location:** `apps/api/src/modules/report/report.controller.ts` + `report.service.ts`
**Auth:** JwtAuthGuard, Roles: DLH_ADMIN, SUPER_ADMIN
**Test:** `report.service.spec.ts`

## Routing & Navigation

- Route: `/complaints` → `ComplaintPage`
- URL sync: `?tab=triage|map|analytics` (default: `triage`)
- Update sidebar navigation label from "Pengaduan" pointing to new route
- Remove old `ComplaintTriagePage.tsx` after migration

## Reused Components

- `StatusBadge` — from `@/components/common`
- `StatusStepper` — from `@/components/triage/StatusStepper`
- `SlaCountdown` — from `@/components/triage/SlaCountdown`
- `DataTable` + `DataTableColumnHeader` + `Highlight` — from `@/components/data-table`
- `PageHeader`, `PageTransition`, `StatCard` — from `@/components/common`
- `useServerTable`, `useDataTableKeyboard` — from `@/hooks`

## Dependencies

No new dependencies needed. Uses existing: leaflet, react-leaflet, recharts, @tanstack/react-table, dayjs, zustand.

## Estimated Scope

- ~12 files new/modified
- 2 new backend endpoints + 2 test cases
- Frontend: ~800-1000 lines across tabs/components
- Remove 1 old file (ComplaintTriagePage.tsx)
