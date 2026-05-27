# Complaint Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the single-file `ComplaintTriagePage.tsx` into a folder-based `ComplaintPage/` with Triage, Map, and Analytics tabs — matching the established TPS page pattern.

**Architecture:** Folder-based page with `index.tsx` tab router, Zustand store, dedicated API layer, and three tabs. Backend gains two new endpoints (map-summary, timeseries) and one modified endpoint (detail with attachments). Existing DataTable, StatusStepper, SlaCountdown components are reused.

**Tech Stack:** React 18, Leaflet + react-leaflet, Recharts, @tanstack/react-table, Zustand, dayjs, shadcn/ui

**Design Doc:** `docs/plans/2026-05-27-complaint-page-redesign-design.md`

---

## File Structure

```
Backend (apps/api/src/):
  modules/complaint/complaint.service.ts    ← modify: add getMapSummary, getByIdWithAttachments
  modules/complaint/complaint.controller.ts ← modify: add map-summary endpoint, update :id
  modules/complaint/complaint.service.spec.ts ← modify: add tests
  modules/report/report.service.ts          ← modify: add getComplaintTimeseries
  modules/report/report.controller.ts       ← modify: add complaints/timeseries endpoint
  modules/report/report.service.spec.ts     ← modify: add test

Frontend (apps/web/src/):
  pages/ComplaintPage/types.ts              ← create
  pages/ComplaintPage/api.ts                ← create
  pages/ComplaintPage/store.ts              ← create
  pages/ComplaintPage/components/ComplaintKpiBar.tsx  ← create
  pages/ComplaintPage/components/ComplaintMap.tsx     ← create
  pages/ComplaintPage/tabs/TriageTab.tsx    ← create
  pages/ComplaintPage/tabs/MapTab.tsx       ← create
  pages/ComplaintPage/tabs/AnalyticsTab.tsx ← create
  pages/ComplaintPage/index.tsx             ← create
  App.tsx                                   ← modify: update lazy import + route
  pages/ComplaintTriagePage.tsx             ← delete after migration
```

---

### Task 1: Backend — Complaint Map Summary Endpoint

**Files:**
- Modify: `apps/api/src/modules/complaint/complaint.service.ts`
- Modify: `apps/api/src/modules/complaint/complaint.controller.ts`
- Modify: `apps/api/src/modules/complaint/complaint.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to `apps/api/src/modules/complaint/complaint.service.spec.ts`, inside the main `describe('ComplaintService')` block, after the existing test suites:

```ts
describe('getMapSummary', () => {
  it('should return lightweight complaint markers for map', async () => {
    const mockData = [
      { id: 'c-1', latitude: -6.19, longitude: 106.82, status: 'submitted', category: 'illegal_dumping', created_at: '2026-05-01T10:00:00Z' },
      { id: 'c-2', latitude: -6.20, longitude: 106.83, status: 'resolved', category: 'tps_full', created_at: '2026-05-02T10:00:00Z' },
    ];
    dataSource.query.mockResolvedValueOnce(mockData);

    const result = await service.getMapSummary('dlh_demo');
    expect(result).toEqual(mockData);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('latitude'),
      expect.any(Array),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /opt/buzzr/apps/api && npx jest --testPathPattern=complaint.service.spec --verbose`

Expected: FAIL — `service.getMapSummary is not a function`

- [ ] **Step 3: Implement getMapSummary in ComplaintService**

Add to `apps/api/src/modules/complaint/complaint.service.ts`, after the `getComplaintById` method:

```ts
async getMapSummary(tenantSchema: string, limit: number = 1000): Promise<any[]> {
  const schemaName = tenantSchema.replace(/[^a-z0-9_]/gi, '');
  return this.dataSource.query(
    `SELECT id, latitude, longitude, status, category, created_at
     FROM "${schemaName}".complaints
     WHERE created_at > NOW() - INTERVAL '90 days'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit],
  );
}
```

- [ ] **Step 4: Add controller endpoint**

Add to `apps/api/src/modules/complaint/complaint.controller.ts`, before the `@Get(':id')` route (order matters — `:id` is a catch-all):

```ts
@Get('map-summary')
@Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
getMapSummary(@Req() req: Request) {
  return this.complaintService.getMapSummary(req.tenantSchema!);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /opt/buzzr/apps/api && npx jest --testPathPattern=complaint.service.spec --verbose`

Expected: PASS — all existing tests + new `getMapSummary` test pass

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/complaint/
git commit -m "feat(api): add GET /complaints/map-summary for map markers"
```

---

### Task 2: Backend — Extend GET /complaints/:id with Attachments

**Files:**
- Modify: `apps/api/src/modules/complaint/complaint.service.ts`
- Modify: `apps/api/src/modules/complaint/complaint.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to `complaint.service.spec.ts` inside the main describe block:

```ts
describe('getComplaintById (with attachments)', () => {
  it('should return complaint detail with attachments array', async () => {
    dataSource.query
      .mockResolvedValueOnce([{
        id: 'c-1', category: 'illegal_dumping', status: 'submitted',
        reporter_name: 'Budi', description: 'Sampah liar',
      }])
      .mockResolvedValueOnce([
        { id: 'att-1', file_url: '/uploads/photo1.jpg', file_type: 'image/jpeg', created_at: '2026-05-01T10:00:00Z' },
      ]);

    const result = await service.getComplaintById('dlh_demo', 'c-1');
    expect(result.attachments).toBeDefined();
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].file_url).toBe('/uploads/photo1.jpg');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /opt/buzzr/apps/api && npx jest --testPathPattern=complaint.service.spec --verbose`

Expected: FAIL — `result.attachments` is undefined (current implementation doesn't fetch attachments)

- [ ] **Step 3: Update getComplaintById to include attachments**

Replace the existing `getComplaintById` method in `complaint.service.ts`:

```ts
async getComplaintById(tenantSchema: string, id: string) {
  const result = await this.dataSource.query(
    `SELECT c.*, u.name as reporter_name, a.name as assignee_name
     FROM "${tenantSchema}".complaints c
     LEFT JOIN "${tenantSchema}".users u ON c.reporter_id = u.id
     LEFT JOIN "${tenantSchema}".users a ON c.assigned_to = a.id
     WHERE c.id = $1`,
    [id],
  );
  if (!result.length) throw new NotFoundException('Laporan tidak ditemukan');

  const attachments = await this.dataSource.query(
    `SELECT id, file_url, file_type, created_at
     FROM "${tenantSchema}".complaint_attachments
     WHERE complaint_id = $1
     ORDER BY created_at`,
    [id],
  );

  return { ...result[0], attachments };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /opt/buzzr/apps/api && npx jest --testPathPattern=complaint.service.spec --verbose`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/complaint/
git commit -m "feat(api): include attachments in GET /complaints/:id response"
```

---

### Task 3: Backend — Complaint Timeseries Endpoint

**Files:**
- Modify: `apps/api/src/modules/report/report.service.ts`
- Modify: `apps/api/src/modules/report/report.controller.ts`
- Modify: `apps/api/src/modules/report/report.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Add to `report.service.spec.ts` inside the main describe block:

```ts
describe('getComplaintTimeseries', () => {
  it('should return daily complaint aggregation', async () => {
    const mockData = [
      { date: '2026-05-01', total: 5, resolved: 3, avg_resolution_hours: 24.5, sla_compliance_pct: 80 },
      { date: '2026-05-02', total: 3, resolved: 2, avg_resolution_hours: 18.2, sla_compliance_pct: 100 },
    ];
    dataSource.query.mockResolvedValueOnce(mockData);

    const result = await service.getComplaintTimeseries('dlh_demo', '2026-05-01', '2026-05-07');
    expect(result).toEqual(mockData);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('sla_compliance_pct'),
      ['2026-05-01', '2026-05-07'],
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /opt/buzzr/apps/api && npx jest --testPathPattern=report.service.spec --verbose`

Expected: FAIL — `service.getComplaintTimeseries is not a function`

- [ ] **Step 3: Implement getComplaintTimeseries in ReportService**

Add to `apps/api/src/modules/report/report.service.ts`, after the `getDashboardWithComparison` method:

```ts
async getComplaintTimeseries(tenantSchema: string, from: string, to: string): Promise<any[]> {
  const schemaName = tenantSchema.replace(/[^a-z0-9_]/gi, '');
  return this.dataSource.query(
    `SELECT
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
    FROM "${schemaName}".complaints
    WHERE created_at BETWEEN $1 AND ($2::date + interval '1 day')
    GROUP BY DATE(created_at)
    ORDER BY date`,
    [from, to],
  );
}
```

- [ ] **Step 4: Add controller endpoint**

Add to `apps/api/src/modules/report/report.controller.ts`, after the existing `@Get('complaints')` route:

```ts
@Get('complaints/timeseries')
getComplaintTimeseries(
  @Req() req: Request,
  @Query('from') from: string,
  @Query('to') to: string,
) {
  return this.reportService.getComplaintTimeseries(req.tenantSchema!, from, to);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd /opt/buzzr/apps/api && npx jest --testPathPattern=report.service.spec --verbose`

Expected: PASS — all 6 tests (5 existing + 1 new)

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/report/
git commit -m "feat(api): add GET /reports/complaints/timeseries for trend charts"
```

---

### Task 4: Frontend — Types, API, and Store

**Files:**
- Create: `apps/web/src/pages/ComplaintPage/types.ts`
- Create: `apps/web/src/pages/ComplaintPage/api.ts`
- Create: `apps/web/src/pages/ComplaintPage/store.ts`

- [ ] **Step 1: Create types.ts**

```ts
// apps/web/src/pages/ComplaintPage/types.ts

export interface Complaint {
  id: string;
  category: string;
  description: string;
  status: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number | null;
  created_at: string;
  resolved_at: string | null;
  reporter_name: string;
  assignee_name: string | null;
}

export interface ComplaintDetail extends Complaint {
  attachments: { id: string; file_url: string; file_type: string; created_at: string }[];
}

export interface MapComplaint {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  category: string;
  created_at: string;
}

export interface ComplaintTimeseriesRow {
  date: string;
  total: number;
  resolved: number;
  avg_resolution_hours: number | null;
  sla_compliance_pct: number;
}

export interface ComplaintAnalytics {
  totalCount: number;
  slaBreach: number;
  avgResolutionHours: number;
  resolvedPct: number;
  byCategory: { category: string; count: number }[];
  byStatus: { status: string; count: number }[];
  topAreas: { address: string; count: number; avgHours: number }[];
}

export type ComplaintTab = 'triage' | 'peta' | 'analitik';

export const CATEGORY_LABELS: Record<string, string> = {
  illegal_dumping: 'Pembuangan Ilegal',
  tps_full: 'TPS Penuh',
  missed_pickup: 'Tidak Diangkut',
  other: 'Lainnya',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const STATUS_COLOR_MAP: Record<string, string> = {
  submitted: '#EF4444',
  verified: '#3B82F6',
  assigned: '#3B82F6',
  in_progress: '#F59E0B',
  resolved: '#22C55E',
  rejected: '#6B7280',
};
```

- [ ] **Step 2: Create api.ts**

```ts
// apps/web/src/pages/ComplaintPage/api.ts

import api from '@/services/api';
import type { MapComplaint, ComplaintDetail, ComplaintTimeseriesRow } from './types';

export async function fetchComplaintMapData(): Promise<MapComplaint[]> {
  const { data } = await api.get<MapComplaint[]>('/complaints/map-summary');
  return data.map((c) => ({
    ...c,
    latitude: Number(c.latitude),
    longitude: Number(c.longitude),
  }));
}

export async function fetchComplaintDetail(id: string): Promise<ComplaintDetail> {
  const { data } = await api.get<ComplaintDetail>(`/complaints/${id}`);
  return data;
}

export async function fetchComplaintTimeseries(
  from: string,
  to: string,
): Promise<ComplaintTimeseriesRow[]> {
  const { data } = await api.get<ComplaintTimeseriesRow[]>('/reports/complaints/timeseries', {
    params: { from, to },
  });
  return data.map((r) => ({
    ...r,
    total: Number(r.total),
    resolved: Number(r.resolved),
    avg_resolution_hours: r.avg_resolution_hours != null ? Number(r.avg_resolution_hours) : null,
    sla_compliance_pct: Number(r.sla_compliance_pct),
  }));
}

export async function fetchComplaintStats(from: string, to: string) {
  const { data } = await api.get('/reports/complaints', { params: { from, to } });
  return data;
}
```

- [ ] **Step 3: Create store.ts**

```ts
// apps/web/src/pages/ComplaintPage/store.ts

import { create } from 'zustand';
import type { MapComplaint, ComplaintTab, ComplaintAnalytics } from './types';
import { CATEGORY_LABELS } from './types';

interface ComplaintPageState {
  mapComplaints: MapComplaint[];
  activeTab: ComplaintTab;
  filterStatuses: Set<string>;
  filterCategories: Set<string>;
  isLoading: boolean;
  dataVersion: number;

  setMapComplaints: (data: MapComplaint[]) => void;
  setActiveTab: (tab: ComplaintTab) => void;
  toggleFilterStatus: (status: string) => void;
  toggleFilterCategory: (category: string) => void;
  setLoading: (loading: boolean) => void;
  invalidateData: () => void;
}

export const useComplaintPageStore = create<ComplaintPageState>((set) => ({
  mapComplaints: [],
  activeTab: 'triage',
  filterStatuses: new Set<string>(),
  filterCategories: new Set<string>(),
  isLoading: false,
  dataVersion: 0,

  setMapComplaints: (mapComplaints) => set({ mapComplaints }),
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleFilterStatus: (status) =>
    set((s) => {
      const next = new Set(s.filterStatuses);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return { filterStatuses: next };
    }),
  toggleFilterCategory: (category) =>
    set((s) => {
      const next = new Set(s.filterCategories);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return { filterCategories: next };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  invalidateData: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
}));

const SLA_HOURS = 72;

export function computeAnalytics(complaints: MapComplaint[]): ComplaintAnalytics {
  const totalCount = complaints.length;
  const now = Date.now();
  const slaMs = SLA_HOURS * 60 * 60 * 1000;

  const slaBreach = complaints.filter(
    (c) => c.status !== 'resolved' && c.status !== 'rejected' && now - new Date(c.created_at).getTime() > slaMs,
  ).length;

  const resolved = complaints.filter((c) => c.status === 'resolved');
  const resolvedPct = totalCount > 0 ? Math.round((resolved.length / totalCount) * 100) : 0;

  const categoryMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  const areaMap = new Map<string, { count: number }>();

  for (const c of complaints) {
    categoryMap.set(c.category, (categoryMap.get(c.category) || 0) + 1);
    statusMap.set(c.status, (statusMap.get(c.status) || 0) + 1);
  }

  const byCategory = Array.from(categoryMap, ([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
  const byStatus = Array.from(statusMap, ([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalCount,
    slaBreach,
    avgResolutionHours: 0,
    resolvedPct,
    byCategory,
    byStatus,
    topAreas: [],
  };
}
```

- [ ] **Step 4: Create the directory and verify**

Run:
```bash
mkdir -p /opt/buzzr/apps/web/src/pages/ComplaintPage/components /opt/buzzr/apps/web/src/pages/ComplaintPage/tabs
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `cd /opt/buzzr/apps/web && npx tsc --noEmit`

Expected: PASS (0 errors)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/ComplaintPage/types.ts apps/web/src/pages/ComplaintPage/api.ts apps/web/src/pages/ComplaintPage/store.ts
git commit -m "feat(web): scaffold ComplaintPage with types, api, and store"
```

---

### Task 5: Frontend — ComplaintKpiBar Component

**Files:**
- Create: `apps/web/src/pages/ComplaintPage/components/ComplaintKpiBar.tsx`

- [ ] **Step 1: Create ComplaintKpiBar.tsx**

```tsx
// apps/web/src/pages/ComplaintPage/components/ComplaintKpiBar.tsx

import React from 'react';
import { AlertCircle, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { StatCard } from '@/components/common';

interface ComplaintKpiBarProps {
  totalCount: number;
  slaBreach: number;
  avgResolutionHours: number;
  resolvedPct: number;
  loading?: boolean;
}

export const ComplaintKpiBar: React.FC<ComplaintKpiBarProps> = ({
  totalCount,
  slaBreach,
  avgResolutionHours,
  resolvedPct,
  loading = false,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        title="Total Pengaduan"
        value={totalCount}
        prefix={<AlertCircle className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="SLA Breach"
        value={slaBreach}
        prefix={<AlertTriangle className="h-4 w-4" />}
        loading={loading}
        valueStyle={slaBreach > 0 ? { color: 'var(--color-negative)' } : undefined}
      />
      <StatCard
        title="Rata-rata Resolusi"
        value={avgResolutionHours}
        suffix="jam"
        prefix={<Clock className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Tingkat Selesai"
        value={resolvedPct}
        suffix="%"
        prefix={<CheckCircle2 className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
};
```

- [ ] **Step 2: Verify build**

Run: `cd /opt/buzzr/apps/web && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/ComplaintPage/components/ComplaintKpiBar.tsx
git commit -m "feat(web): add ComplaintKpiBar component with 4 stat cards"
```

---

### Task 6: Frontend — ComplaintMap Component

**Files:**
- Create: `apps/web/src/pages/ComplaintPage/components/ComplaintMap.tsx`

- [ ] **Step 1: Create ComplaintMap.tsx**

```tsx
// apps/web/src/pages/ComplaintPage/components/ComplaintMap.tsx

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/common';
import { SlaCountdown } from '@/components/triage/SlaCountdown';
import type { MapComplaint } from '../types';
import { CATEGORY_LABELS, STATUS_COLOR_MAP } from '../types';

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456];
const DEFAULT_ZOOM = 12;
const SLA_HOURS = 72;

function isSlaBreach(c: MapComplaint): boolean {
  if (c.status === 'resolved' || c.status === 'rejected') return false;
  return Date.now() - new Date(c.created_at).getTime() > SLA_HOURS * 60 * 60 * 1000;
}

function markerColor(c: MapComplaint): string {
  if (isSlaBreach(c)) return '#DC2626';
  return STATUS_COLOR_MAP[c.status] || '#6B7280';
}

function FitBounds({ data }: { data: MapComplaint[] }) {
  const map = useMap();

  React.useEffect(() => {
    const valid = data.filter((c) => c.latitude && c.longitude);
    if (valid.length === 0) return;
    const bounds: LatLngBounds = L.latLngBounds(
      valid.map((c) => [c.latitude, c.longitude]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, data]);

  return null;
}

function SinglePin({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();

  React.useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 15, { animate: false });
    }
  }, [map, lat, lng]);

  return (
    <CircleMarker
      center={[lat, lng]}
      radius={8}
      pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.8, weight: 2 }}
    />
  );
}

interface ComplaintMapProps {
  data: MapComplaint[];
  height?: string;
  singlePin?: { lat: number; lng: number };
  interactive?: boolean;
  className?: string;
}

export const ComplaintMap: React.FC<ComplaintMapProps> = ({
  data,
  height = '100%',
  singlePin,
  interactive = true,
  className,
}) => {
  const validData = useMemo(
    () => data.filter((c) => c.latitude && c.longitude),
    [data],
  );

  const center: [number, number] = singlePin
    ? [singlePin.lat, singlePin.lng]
    : DEFAULT_CENTER;

  const zoom = singlePin ? 15 : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
      className={className}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {singlePin ? (
        <SinglePin lat={singlePin.lat} lng={singlePin.lng} />
      ) : (
        <>
          <FitBounds data={validData} />
          {validData.map((c) => {
            const breach = isSlaBreach(c);
            return (
              <CircleMarker
                key={c.id}
                center={[c.latitude, c.longitude]}
                radius={breach ? 12 : 9}
                pathOptions={{
                  color: markerColor(c),
                  fillColor: markerColor(c),
                  fillOpacity: 0.7,
                  weight: breach ? 3 : 2,
                  className: breach ? 'animate-pulse' : undefined,
                }}
              >
                <Popup>
                  <div className="space-y-2 min-w-[200px]">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </Badge>
                      <StatusBadge status={c.status} />
                    </div>
                    <SlaCountdown createdAt={c.created_at} slaHours={72} className="text-xs" />
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </>
      )}
    </MapContainer>
  );
};
```

- [ ] **Step 2: Verify build**

Run: `cd /opt/buzzr/apps/web && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/ComplaintPage/components/ComplaintMap.tsx
git commit -m "feat(web): add ComplaintMap component with status-colored markers"
```

---

### Task 7: Frontend — MapTab

**Files:**
- Create: `apps/web/src/pages/ComplaintPage/tabs/MapTab.tsx`

- [ ] **Step 1: Create MapTab.tsx**

```tsx
// apps/web/src/pages/ComplaintPage/tabs/MapTab.tsx

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS } from '@/theme/tokens';
import { useComplaintPageStore, computeAnalytics } from '../store';
import { ComplaintKpiBar } from '../components/ComplaintKpiBar';
import { ComplaintMap } from '../components/ComplaintMap';
import { CATEGORY_OPTIONS, STATUS_COLOR_MAP } from '../types';

const COMPLAINT_STATUS_OPTIONS = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved', 'rejected']
  .map((value) => ({ value, label: STATUS_LABELS[value] || value }));

export const MapTab: React.FC = () => {
  const {
    mapComplaints,
    isLoading,
    filterStatuses,
    filterCategories,
    toggleFilterStatus,
    toggleFilterCategory,
  } = useComplaintPageStore();

  const analytics = useMemo(() => computeAnalytics(mapComplaints), [mapComplaints]);

  const filtered = useMemo(() => {
    let result = mapComplaints;
    if (filterStatuses.size > 0) {
      result = result.filter((c) => filterStatuses.has(c.status));
    }
    if (filterCategories.size > 0) {
      result = result.filter((c) => filterCategories.has(c.category));
    }
    return result;
  }, [mapComplaints, filterStatuses, filterCategories]);

  return (
    <div className="space-y-4">
      <ComplaintKpiBar
        totalCount={analytics.totalCount}
        slaBreach={analytics.slaBreach}
        avgResolutionHours={analytics.avgResolutionHours}
        resolvedPct={analytics.resolvedPct}
        loading={isLoading}
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Kategori:</span>
        {CATEGORY_OPTIONS.map((opt) => {
          const active = filterCategories.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggleFilterCategory(opt.value)}
            >
              <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer text-xs">
                {opt.label}
              </Badge>
            </button>
          );
        })}
        <span className="text-xs text-muted-foreground ml-3 mr-1">Status:</span>
        {COMPLAINT_STATUS_OPTIONS.map((opt) => {
          const active = filterStatuses.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggleFilterStatus(opt.value)}
            >
              <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer text-xs">
                {opt.label}
              </Badge>
            </button>
          );
        })}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border" style={{ height: 'calc(100vh - 340px)' }}>
        <ComplaintMap data={filtered} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR_MAP.resolved }} /> Selesai
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR_MAP.in_progress }} /> Proses
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR_MAP.assigned }} /> Ditugaskan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR_MAP.submitted }} /> Baru
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" /> SLA Breach
        </span>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify build**

Run: `cd /opt/buzzr/apps/web && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/ComplaintPage/tabs/MapTab.tsx
git commit -m "feat(web): add MapTab with KPIs, filter chips, map, and legend"
```

---

### Task 8: Frontend — TriageTab

**Files:**
- Create: `apps/web/src/pages/ComplaintPage/tabs/TriageTab.tsx`

- [ ] **Step 1: Create TriageTab.tsx**

This migrates the current ComplaintTriagePage DataTable into a tab with an enhanced preview panel (mini-map + attachments).

```tsx
// apps/web/src/pages/ComplaintPage/tabs/TriageTab.tsx

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';
import { useDataTableKeyboard } from '@/hooks/useDataTableKeyboard';
import { StatusStepper } from '@/components/triage/StatusStepper';
import { SlaCountdown } from '@/components/triage/SlaCountdown';
import { PageHeader, StatusBadge } from '@/components/common';
import { STATUS_LABELS } from '@/theme/tokens';
import { ComplaintMap } from '../components/ComplaintMap';
import { fetchComplaintDetail } from '../api';
import type { Complaint, ComplaintDetail } from '../types';
import { CATEGORY_LABELS, CATEGORY_OPTIONS } from '../types';

const statusOptions = Object.entries(STATUS_LABELS)
  .filter(([k]) => ['submitted', 'verified', 'assigned', 'in_progress', 'resolved', 'rejected'].includes(k))
  .map(([value, label]) => ({ value, label: label as string }));

const complaintFilterDefs: FilterDef[] = [
  { key: 'c.status', label: 'Status', type: 'select', options: statusOptions },
  { key: 'c.category', label: 'Kategori', type: 'select', options: CATEGORY_OPTIONS },
];

const columnHelper = createColumnHelper<Complaint>();

export const TriageTab: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [complaintDetail, setComplaintDetail] = useState<ComplaintDetail | null>(null);
  const searchTextRef = useRef('');

  // Fetch full detail (with attachments) when a complaint is selected
  useEffect(() => {
    if (!selectedComplaint) {
      setComplaintDetail(null);
      return;
    }
    let cancelled = false;
    fetchComplaintDetail(selectedComplaint.id).then((detail) => {
      if (!cancelled) setComplaintDetail(detail);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedComplaint?.id]);

  const columns = useMemo(() => [
    columnHelper.accessor('description', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi" />,
      cell: (info) => (
        <span className="line-clamp-1 text-sm">
          <Highlight text={info.getValue()?.slice(0, 80) || '-'} query={searchTextRef.current} />
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('category', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kategori" />,
      cell: (info) => (
        <Badge variant="outline" className="text-xs">
          {CATEGORY_LABELS[info.getValue()] || info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('status', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: (info) => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('reporter_name', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Pelapor" />,
      cell: (info) => (
        <span className="text-sm">
          <Highlight text={info.getValue() || '-'} query={searchTextRef.current} />
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('address', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Lokasi" />,
      cell: (info) => (
        <span className="line-clamp-1 text-sm text-muted-foreground">
          <Highlight text={info.getValue()?.slice(0, 40) || '-'} query={searchTextRef.current} />
        </span>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('created_at', {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
      cell: (info) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {dayjs(info.getValue()).format('DD MMM YY')}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'sla',
      header: 'SLA',
      cell: ({ row }) => <SlaCountdown createdAt={row.original.created_at} slaHours={72} className="text-xs" />,
    }),
  ], []);

  const {
    table, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch, setPage, setLimit,
  } = useServerTable<Complaint>({
    endpoint: '/complaints',
    columnDefs: columns,
    defaultSort: { field: 'created_at', order: 'desc' },
    filterDefs: complaintFilterDefs,
    columnMap: { category: 'c.category', status: 'c.status', created_at: 'c.created_at' },
  });

  searchTextRef.current = searchText;

  useDataTableKeyboard({
    table,
    activeIndex,
    setActiveIndex,
    onEnter: (row) => setSelectedComplaint(row),
    onEscape: () => setSelectedComplaint(null),
  });

  const handleStatusTransition = useCallback(async (id: string, newStatus: string) => {
    try {
      await api.patch(`/complaints/${id}/status`, { status: newStatus });
      toast.success(`Status diubah ke ${STATUS_LABELS[newStatus] || newStatus}`);
      refetch();
      setSelectedComplaint(null);
    } catch {
      toast.error('Gagal mengubah status');
    }
  }, [refetch]);

  const renderPreview = useCallback(() => {
    if (!selectedComplaint) return null;
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm">{selectedComplaint.description?.slice(0, 100)}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Dilaporkan oleh {selectedComplaint.reporter_name} · {dayjs(selectedComplaint.created_at).format('DD MMM YYYY, HH:mm')}
          </p>
        </div>

        {/* Status + SLA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Kategori</span>
            <Badge variant="outline">{CATEGORY_LABELS[selectedComplaint.category] || selectedComplaint.category}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={selectedComplaint.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">SLA</span>
            <SlaCountdown createdAt={selectedComplaint.created_at} slaHours={72} />
          </div>
          {selectedComplaint.assignee_name && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ditugaskan ke</span>
              <span className="text-sm">{selectedComplaint.assignee_name}</span>
            </div>
          )}
          {selectedComplaint.address && (
            <div>
              <span className="text-xs text-muted-foreground block">Lokasi</span>
              <span className="text-sm">{selectedComplaint.address}</span>
            </div>
          )}
        </div>

        {/* Photo attachments */}
        {complaintDetail?.attachments && complaintDetail.attachments.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground block mb-2">Foto</span>
            <div className="grid grid-cols-3 gap-2">
              {complaintDetail.attachments
                .filter((a) => a.file_type.startsWith('image/'))
                .map((a) => (
                  <a
                    key={a.id}
                    href={a.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md overflow-hidden border hover:ring-2 hover:ring-primary/50 transition-shadow"
                  >
                    <img
                      src={a.file_url}
                      alt="Lampiran"
                      className="w-full h-20 object-cover"
                    />
                  </a>
                ))}
            </div>
          </div>
        )}

        {/* Mini-map */}
        {selectedComplaint.latitude && selectedComplaint.longitude && (
          <div className="rounded-md overflow-hidden border">
            <ComplaintMap
              data={[]}
              singlePin={{ lat: selectedComplaint.latitude, lng: selectedComplaint.longitude }}
              height="180px"
              interactive={false}
            />
          </div>
        )}

        {/* Status stepper */}
        <StatusStepper
          currentStatus={selectedComplaint.status}
          onTransition={(newStatus) => handleStatusTransition(selectedComplaint.id, newStatus)}
        />
      </div>
    );
  }, [selectedComplaint, complaintDetail, handleStatusTransition]);

  return (
    <DataTable
      table={table}
      meta={meta}
      isLoading={isLoading}
      searchText={searchText}
      onSearchChange={setSearchText}
      searchPlaceholder="Cari deskripsi, lokasi..."
      filters={filters}
      onFilterChange={setFilter}
      onResetFilters={resetFilters}
      activeFilterCount={activeFilterCount}
      filterDefs={complaintFilterDefs}
      filterLabels={{ 'c.status': 'Status', 'c.category': 'Kategori' }}
      onPageChange={setPage}
      onLimitChange={setLimit}
      onRefresh={refetch}
      onRowClick={(r) => setSelectedComplaint(r)}
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
      previewOpen={!!selectedComplaint}
      onPreviewClose={() => setSelectedComplaint(null)}
      renderPreview={renderPreview}
      previewMode="split"
      emptyTitle="Tidak ada pengaduan"
      emptyDescription="Belum ada pengaduan yang masuk"
    />
  );
};
```

- [ ] **Step 2: Verify build**

Run: `cd /opt/buzzr/apps/web && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/ComplaintPage/tabs/TriageTab.tsx
git commit -m "feat(web): add TriageTab with DataTable, enhanced preview, mini-map, and attachments"
```

---

### Task 9: Frontend — AnalyticsTab

**Files:**
- Create: `apps/web/src/pages/ComplaintPage/tabs/AnalyticsTab.tsx`

- [ ] **Step 1: Create AnalyticsTab.tsx**

```tsx
// apps/web/src/pages/ComplaintPage/tabs/AnalyticsTab.tsx

import React, { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STATUS_LABELS } from '@/theme/tokens';
import { ComplaintKpiBar } from '../components/ComplaintKpiBar';
import { fetchComplaintTimeseries, fetchComplaintStats } from '../api';
import type { ComplaintTimeseriesRow } from '../types';
import { CATEGORY_LABELS, STATUS_COLOR_MAP } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  illegal_dumping: '#EF4444',
  tps_full: '#F59E0B',
  missed_pickup: '#3B82F6',
  other: '#6B7280',
};

export const AnalyticsTab: React.FC = () => {
  const [from, setFrom] = useState(() => dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [timeseries, setTimeseries] = useState<ComplaintTimeseriesRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchComplaintTimeseries(from, to),
      fetchComplaintStats(from, to),
    ])
      .then(([ts, st]) => {
        if (!cancelled) {
          setTimeseries(ts);
          setStats(st);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [from, to]);

  const kpis = useMemo(() => {
    if (!stats) return { total: 0, resolved: 0, avgHours: 0, resolvedPct: 0 };
    return {
      total: Number(stats.total) || 0,
      resolved: Number(stats.resolved) || 0,
      avgHours: Number(stats.avg_resolution_hours) || 0,
      resolvedPct: stats.total > 0
        ? Math.round((Number(stats.resolved) / Number(stats.total)) * 100)
        : 0,
    };
  }, [stats]);

  const slaBreach = useMemo(() => {
    return timeseries.reduce(
      (sum, r) => sum + (r.total - Math.round(r.total * r.sla_compliance_pct / 100)),
      0,
    );
  }, [timeseries]);

  // Build category distribution from stats (or timeseries aggregation)
  // Stats endpoint returns aggregated — we use it for summary KPIs only.
  // For pie charts, we derive from timeseries totals by category is not available,
  // so we use the stats breakdown if the API returns it, otherwise show timeseries totals.

  const chartData = useMemo(() => timeseries.map((r) => ({
    date: dayjs(r.date).format('DD MMM'),
    total: r.total,
    resolved: r.resolved,
    avgHours: r.avg_resolution_hours ?? 0,
    slaPct: r.sla_compliance_pct,
  })), [timeseries]);

  // Simple status distribution from the timeseries
  const statusData = useMemo(() => {
    const totalResolved = timeseries.reduce((s, r) => s + r.resolved, 0);
    const totalAll = timeseries.reduce((s, r) => s + r.total, 0);
    const unresolved = totalAll - totalResolved;
    return [
      { name: 'Selesai', value: totalResolved, fill: STATUS_COLOR_MAP.resolved },
      { name: 'Belum Selesai', value: unresolved, fill: STATUS_COLOR_MAP.submitted },
    ].filter((d) => d.value > 0);
  }, [timeseries]);

  return (
    <div className="space-y-4">
      {/* Date range */}
      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Dari</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-8 w-40 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sampai</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-8 w-40 text-sm"
          />
        </div>
      </div>

      <ComplaintKpiBar
        totalCount={kpis.total}
        slaBreach={slaBreach}
        avgResolutionHours={kpis.avgHours}
        resolvedPct={kpis.resolvedPct}
        loading={loading}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Resolution Time Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Resolusi (jam)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} jam`, 'Avg Resolusi']}
                />
                <Area
                  type="monotone"
                  dataKey="avgHours"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* SLA Compliance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'SLA']}
                />
                <Area
                  type="monotone"
                  dataKey="slaPct"
                  stroke="#22C55E"
                  fill="#22C55E"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Volume */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume Harian</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Selesai" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribusi Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify build**

Run: `cd /opt/buzzr/apps/web && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/ComplaintPage/tabs/AnalyticsTab.tsx
git commit -m "feat(web): add AnalyticsTab with time-series charts and KPIs"
```

---

### Task 10: Frontend — ComplaintPage Index with Tab Router

**Files:**
- Create: `apps/web/src/pages/ComplaintPage/index.tsx`

- [ ] **Step 1: Create index.tsx**

```tsx
// apps/web/src/pages/ComplaintPage/index.tsx

import React, { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, MapPin, BarChart3 } from 'lucide-react';
import { PageHeader, PageTransition } from '@/components/common';
import { useComplaintPageStore } from './store';
import { fetchComplaintMapData } from './api';
import { TriageTab } from './tabs/TriageTab';
import { MapTab } from './tabs/MapTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import type { ComplaintTab } from './types';

const TABS: { id: ComplaintTab; label: string; icon: React.ElementType }[] = [
  { id: 'triage', label: 'Triage', icon: AlertCircle },
  { id: 'peta', label: 'Peta', icon: MapPin },
  { id: 'analitik', label: 'Analitik', icon: BarChart3 },
];

const ComplaintPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, setActiveTab, setMapComplaints, setLoading, dataVersion } = useComplaintPageStore();

  // Sync tab from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as ComplaintTab | null;
    if (tabParam && ['triage', 'peta', 'analitik'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);

  const handleTabChange = (tab: ComplaintTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Load map data (used by Map tab)
  const loadMapData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchComplaintMapData();
      setMapComplaints(data);
    } catch (err) {
      console.error('Failed to load complaint map data:', err);
    } finally {
      setLoading(false);
    }
  }, [setMapComplaints, setLoading]);

  useEffect(() => {
    loadMapData();
  }, [loadMapData, dataVersion]);

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Pengaduan"
          description="Kelola dan pantau laporan pengaduan masyarakat"
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Pengaduan' }]}
        />

        {/* Tabs */}
        <div className="border-b mb-4">
          <div className="flex gap-0" role="tablist" aria-label="Complaint Tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'triage' && <TriageTab />}
          {activeTab === 'peta' && <MapTab />}
          {activeTab === 'analitik' && <AnalyticsTab />}
        </div>
      </div>
    </PageTransition>
  );
};

export default ComplaintPage;
```

- [ ] **Step 2: Verify build**

Run: `cd /opt/buzzr/apps/web && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/ComplaintPage/index.tsx
git commit -m "feat(web): assemble ComplaintPage with tabs, data loading, and URL sync"
```

---

### Task 11: Routing Update and Remove Old Page

**Files:**
- Modify: `apps/web/src/App.tsx`
- Delete: `apps/web/src/pages/ComplaintTriagePage.tsx`

- [ ] **Step 1: Update App.tsx lazy import and route**

In `apps/web/src/App.tsx`, find and replace:

```ts
// Old:
const ComplaintTriagePage = React.lazy(() => import('./pages/ComplaintTriagePage'));

// New:
const ComplaintPage = React.lazy(() => import('./pages/ComplaintPage'));
```

And in the routes, find and replace:

```tsx
// Old:
<Route path="complaints" element={<ComplaintTriagePage />} />

// New:
<Route path="complaints" element={<ComplaintPage />} />
```

- [ ] **Step 2: Delete old file**

Run: `rm /opt/buzzr/apps/web/src/pages/ComplaintTriagePage.tsx`

- [ ] **Step 3: Verify build**

Run: `cd /opt/buzzr/apps/web && npx tsc --noEmit`

Expected: PASS

- [ ] **Step 4: Verify vite build succeeds**

Run: `cd /opt/buzzr/apps/web && npx vite build 2>&1 | tail -10`

Expected: Build succeeds with no errors

- [ ] **Step 5: Run full API test suite**

Run: `cd /opt/buzzr/apps/api && npx jest --silent`

Expected: All tests pass (including new ones from Tasks 1-3)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/App.tsx
git rm apps/web/src/pages/ComplaintTriagePage.tsx
git commit -m "refactor(web): remove old ComplaintTriagePage, update navigation"
```

---

## Execution Order

```
Task 1 (map-summary) ──┐
Task 2 (attachments)   ├── Backend (parallel, independent)
Task 3 (timeseries)  ──┘
                         ↓
Task 4 (types/api/store) ── Foundation (depends on nothing)
                         ↓
Task 5 (KpiBar)  ────────┐
Task 6 (Map)     ────────├── Components (parallel, depend on Task 4)
                          ↓
Task 7 (MapTab)  ────────── Depends on Tasks 5 + 6
Task 8 (TriageTab)  ─────── Depends on Task 4 + Task 6 (ComplaintMap for mini-map)
Task 9 (AnalyticsTab) ───── Depends on Task 5
                          ↓
Task 10 (index.tsx) ──────── Depends on Tasks 7 + 8 + 9
Task 11 (routing + cleanup) ── Final step
```

**Parallelization notes:**
- Tasks 1, 2, 3 are fully independent backend work — run all 3 in parallel
- Tasks 5 and 6 are independent components — run in parallel
- Tasks 7, 8, 9 can run in parallel once their deps (5, 6) are done
- Task 10 and 11 must be sequential (last)
