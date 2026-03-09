# TPS Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the basic TPS data table with an enterprise-grade three-tab page (Map, Management, Analytics) for DLH admins managing waste collection points.

**Architecture:** New `TpsPage/` directory with shared Zustand store, reusable components (CapacityBar, TpsMap, TpsKpiBar, TpsForm), and three tab views. Backend adds PATCH endpoint for TPS updates. All numeric SQL values coerced client-side.

**Tech Stack:** React, Zustand, Leaflet/react-leaflet, Recharts, TanStack Table, Radix Dialog, NestJS, PostGIS, class-validator

---

### Task 1: Install Dependencies and Create File Structure

**Files:**
- Create: `apps/web/src/pages/TpsPage/types.ts`
- Create: `apps/web/src/pages/TpsPage/api.ts`
- Create: `apps/web/src/pages/TpsPage/store.ts`
- Create: `apps/web/src/pages/TpsPage/index.tsx` (stub)

**Step 1: Create types.ts**

```typescript
// apps/web/src/pages/TpsPage/types.ts

export interface TpsItem {
  id: string;
  name: string;
  type: string;
  status: string;
  address: string;
  area_id: string;
  capacity_tons: number;
  current_load_tons: number;
  fill_percent: number;
  latitude: number;
  longitude: number;
  qr_code: string;
  created_at: string;
  updated_at: string;
}

export interface TpsAnalytics {
  totalCount: number;
  activeCount: number;
  nearCapacityCount: number;
  averageFillPercent: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  fillDistribution: { bracket: string; count: number; color: string }[];
  topFilled: TpsItem[];
}

export type TpsTab = 'peta' | 'kelola' | 'analitik';
```

**Step 2: Create api.ts**

```typescript
// apps/web/src/pages/TpsPage/api.ts

import api from '@/services/api';
import type { TpsItem } from './types';

export async function fetchTpsMapData(): Promise<TpsItem[]> {
  const { data } = await api.get<TpsItem[]>('/tps/map-summary');
  return data.map((t) => ({
    ...t,
    latitude: Number(t.latitude),
    longitude: Number(t.longitude),
    capacity_tons: Number(t.capacity_tons),
    current_load_tons: Number(t.current_load_tons),
    fill_percent: Number(t.fill_percent),
  }));
}

export async function createTps(body: {
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  areaId: string;
  capacityTons: number;
}): Promise<TpsItem> {
  const { data } = await api.post('/tps', body);
  return data;
}

export async function updateTps(
  id: string,
  body: Partial<{
    name: string;
    type: string;
    status: string;
    address: string;
    latitude: number;
    longitude: number;
    areaId: string;
    capacityTons: number;
  }>,
): Promise<TpsItem> {
  const { data } = await api.patch(`/tps/${id}`, body);
  return data;
}
```

**Step 3: Create store.ts**

```typescript
// apps/web/src/pages/TpsPage/store.ts

import { create } from 'zustand';
import type { TpsItem, TpsTab, TpsAnalytics } from './types';

interface TpsPageState {
  allTps: TpsItem[];
  selectedTpsId: string | null;
  activeTab: TpsTab;
  mapFilterTypes: Set<string>;
  mapFilterStatuses: Set<string>;
  isLoading: boolean;

  setAllTps: (tps: TpsItem[]) => void;
  selectTps: (id: string | null) => void;
  setActiveTab: (tab: TpsTab) => void;
  toggleMapFilterType: (type: string) => void;
  toggleMapFilterStatus: (status: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useTpsPageStore = create<TpsPageState>((set) => ({
  allTps: [],
  selectedTpsId: null,
  activeTab: 'peta',
  mapFilterTypes: new Set<string>(),
  mapFilterStatuses: new Set<string>(),
  isLoading: false,

  setAllTps: (allTps) => set({ allTps }),
  selectTps: (selectedTpsId) => set({ selectedTpsId }),
  setActiveTab: (activeTab) => set({ activeTab }),
  toggleMapFilterType: (type) =>
    set((s) => {
      const next = new Set(s.mapFilterTypes);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return { mapFilterTypes: next };
    }),
  toggleMapFilterStatus: (status) =>
    set((s) => {
      const next = new Set(s.mapFilterStatuses);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return { mapFilterStatuses: next };
    }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export function computeAnalytics(tps: TpsItem[]): TpsAnalytics {
  const totalCount = tps.length;
  const activeCount = tps.filter((t) => t.status === 'active').length;
  const nearCapacityCount = tps.filter((t) => t.fill_percent >= 80).length;
  const averageFillPercent =
    totalCount > 0
      ? Math.round(tps.reduce((sum, t) => sum + t.fill_percent, 0) / totalCount)
      : 0;

  const typeMap = new Map<string, number>();
  const statusMap = new Map<string, number>();
  for (const t of tps) {
    typeMap.set(t.type, (typeMap.get(t.type) || 0) + 1);
    statusMap.set(t.status, (statusMap.get(t.status) || 0) + 1);
  }

  const byType = Array.from(typeMap, ([type, count]) => ({ type, count }));
  const byStatus = Array.from(statusMap, ([status, count]) => ({ status, count }));

  const brackets = [
    { label: '0–25%', min: 0, max: 25, color: '#22C55E' },
    { label: '25–50%', min: 25, max: 50, color: '#84CC16' },
    { label: '50–75%', min: 50, max: 75, color: '#EAB308' },
    { label: '75–90%', min: 75, max: 90, color: '#F59E0B' },
    { label: '90–100%', min: 90, max: 101, color: '#EF4444' },
  ];
  const fillDistribution = brackets.map((b) => ({
    bracket: b.label,
    count: tps.filter((t) => t.fill_percent >= b.min && t.fill_percent < b.max).length,
    color: b.color,
  }));

  const topFilled = [...tps]
    .sort((a, b) => b.fill_percent - a.fill_percent)
    .slice(0, 10);

  return {
    totalCount,
    activeCount,
    nearCapacityCount,
    averageFillPercent,
    byType,
    byStatus,
    fillDistribution,
    topFilled,
  };
}
```

**Step 4: Create index.tsx stub**

```typescript
// apps/web/src/pages/TpsPage/index.tsx

import React from 'react';
import { PageHeader, PageTransition } from '@/components/common';

const TpsPage: React.FC = () => {
  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Tempat Penampungan Sementara"
          description="Kelola titik pengumpulan sampah"
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'TPS' }]}
        />
        <p className="text-muted-foreground p-4">Tabs coming soon...</p>
      </div>
    </PageTransition>
  );
};

export default TpsPage;
```

**Step 5: Update App.tsx routing**

In `apps/web/src/App.tsx`, replace the TpsTriagePage lazy import with TpsPage:

Change:
```typescript
const TpsTriagePage = React.lazy(() => import('./pages/TpsTriagePage'));
```
To:
```typescript
const TpsPage = React.lazy(() => import('./pages/TpsPage'));
```

And in the routes, change:
```typescript
<Route path="tps" element={<TpsTriagePage />} />
```
To:
```typescript
<Route path="tps" element={<TpsPage />} />
```

**Step 6: Verify the app compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add apps/web/src/pages/TpsPage/ apps/web/src/App.tsx
git commit -m "feat(web): scaffold TpsPage with types, api, store, and routing"
```

---

### Task 2: Create CapacityBar Shared Component

**Files:**
- Create: `apps/web/src/pages/TpsPage/components/CapacityBar.tsx`

**Step 1: Create CapacityBar component**

```typescript
// apps/web/src/pages/TpsPage/components/CapacityBar.tsx

import React from 'react';
import { cn } from '@/lib/utils';

interface CapacityBarProps {
  current: number;
  max: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

function getBarColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export const CapacityBar: React.FC<CapacityBarProps> = ({
  current,
  max,
  showLabel = true,
  size = 'md',
}) => {
  const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'flex-1 rounded-full bg-gray-200 overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className={cn('h-full rounded-full transition-all', getBarColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            'tabular-nums text-right shrink-0',
            size === 'sm' ? 'text-[10px] w-8' : 'text-xs w-10',
            pct >= 90
              ? 'text-red-600 font-medium'
              : pct >= 70
                ? 'text-amber-600'
                : 'text-muted-foreground',
          )}
        >
          {pct}%
        </span>
      )}
    </div>
  );
};
```

**Step 2: Verify the app compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/pages/TpsPage/components/CapacityBar.tsx
git commit -m "feat(web): add CapacityBar component for TPS fill visualization"
```

---

### Task 3: Create TpsKpiBar Shared Component

**Files:**
- Create: `apps/web/src/pages/TpsPage/components/TpsKpiBar.tsx`

**Step 1: Create TpsKpiBar component**

```typescript
// apps/web/src/pages/TpsPage/components/TpsKpiBar.tsx

import React from 'react';
import { MapPin, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { StatCard } from '@/components/common';

interface TpsKpiBarProps {
  totalCount: number;
  activeCount: number;
  nearCapacityCount: number;
  averageFillPercent: number;
  loading?: boolean;
}

export const TpsKpiBar: React.FC<TpsKpiBarProps> = ({
  totalCount,
  activeCount,
  nearCapacityCount,
  averageFillPercent,
  loading = false,
}) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard
        title="Total TPS"
        value={totalCount}
        prefix={<MapPin className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Aktif"
        value={activeCount}
        prefix={<CheckCircle className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        title="Hampir Penuh"
        value={nearCapacityCount}
        prefix={<AlertTriangle className="h-4 w-4" />}
        loading={loading}
        valueStyle={nearCapacityCount > 0 ? { color: 'var(--negative)' } : undefined}
      />
      <StatCard
        title="Rata-rata Beban"
        value={averageFillPercent}
        suffix="%"
        prefix={<Activity className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
};
```

**Step 2: Verify the app compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/pages/TpsPage/components/TpsKpiBar.tsx
git commit -m "feat(web): add TpsKpiBar component with 4 KPI stat cards"
```

---

### Task 4: Create TpsMap Shared Component

**Files:**
- Create: `apps/web/src/pages/TpsPage/components/TpsMap.tsx`

**Step 1: Create TpsMap component**

```typescript
// apps/web/src/pages/TpsPage/components/TpsMap.tsx

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TpsItem } from '../types';
import { CapacityBar } from './CapacityBar';

const DEFAULT_CENTER: [number, number] = [-6.2088, 106.8456]; // Jakarta
const DEFAULT_ZOOM = 12;

const TYPE_LABELS: Record<string, string> = {
  tps: 'TPS',
  tps3r: 'TPS3R',
  bank_sampah: 'Bank Sampah',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  full: 'Penuh',
  maintenance: 'Pemeliharaan',
};

function fillColor(pct: number, status: string): string {
  if (status === 'maintenance') return '#9CA3AF';
  if (pct >= 90) return '#EF4444';
  if (pct >= 70) return '#F59E0B';
  return '#22C55E';
}

function FitBounds({ data }: { data: TpsItem[] }) {
  const map = useMap();

  React.useEffect(() => {
    const valid = data.filter((t) => t.latitude && t.longitude);
    if (valid.length === 0) return;
    const bounds: LatLngBounds = L.latLngBounds(
      valid.map((t) => [t.latitude, t.longitude]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, data]);

  return null;
}

function SingleMarker({ tps }: { tps: TpsItem }) {
  const map = useMap();

  React.useEffect(() => {
    if (tps.latitude && tps.longitude) {
      map.setView([tps.latitude, tps.longitude], 15, { animate: false });
    }
  }, [map, tps.latitude, tps.longitude]);

  return (
    <CircleMarker
      center={[tps.latitude, tps.longitude]}
      radius={8}
      pathOptions={{
        color: fillColor(tps.fill_percent, tps.status),
        fillColor: fillColor(tps.fill_percent, tps.status),
        fillOpacity: 0.8,
        weight: 2,
      }}
    />
  );
}

interface TpsMapProps {
  data: TpsItem[];
  onTpsClick?: (id: string) => void;
  selectedId?: string | null;
  height?: string;
  singleMarker?: TpsItem;
  interactive?: boolean;
  className?: string;
}

export const TpsMap: React.FC<TpsMapProps> = ({
  data,
  onTpsClick,
  selectedId,
  height = '100%',
  singleMarker,
  interactive = true,
  className,
}) => {
  const filteredData = useMemo(
    () => data.filter((t) => t.latitude && t.longitude),
    [data],
  );

  const center: [number, number] = singleMarker
    ? [singleMarker.latitude, singleMarker.longitude]
    : DEFAULT_CENTER;

  const zoom = singleMarker ? 15 : DEFAULT_ZOOM;

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

      {singleMarker ? (
        <SingleMarker tps={singleMarker} />
      ) : (
        <>
          <FitBounds data={filteredData} />
          {filteredData.map((t) => (
            <CircleMarker
              key={t.id}
              center={[t.latitude, t.longitude]}
              radius={10}
              pathOptions={{
                color: fillColor(t.fill_percent, t.status),
                fillColor: fillColor(t.fill_percent, t.status),
                fillOpacity: t.id === selectedId ? 1 : 0.7,
                weight: t.id === selectedId ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onTpsClick?.(t.id),
              }}
            >
              <Popup>
                <div className="space-y-2 min-w-[200px]">
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">
                      {TYPE_LABELS[t.type] || t.type} · {STATUS_LABELS[t.status] || t.status}
                    </p>
                  </div>
                  <CapacityBar current={t.current_load_tons} max={t.capacity_tons} />
                  <p className="text-xs text-gray-500">
                    {t.current_load_tons.toFixed(1)} / {t.capacity_tons.toFixed(1)} ton
                  </p>
                  {t.address && (
                    <p className="text-xs text-gray-400">{t.address}</p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </>
      )}
    </MapContainer>
  );
};
```

**Step 2: Verify the app compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/pages/TpsPage/components/TpsMap.tsx
git commit -m "feat(web): add TpsMap component with CircleMarkers and popups"
```

---

### Task 5: Create MapTab

**Files:**
- Create: `apps/web/src/pages/TpsPage/tabs/MapTab.tsx`

**Step 1: Create MapTab component**

```typescript
// apps/web/src/pages/TpsPage/tabs/MapTab.tsx

import React, { useMemo } from 'react';
import { useTpsPageStore, computeAnalytics } from '../store';
import { TpsKpiBar } from '../components/TpsKpiBar';
import { TpsMap } from '../components/TpsMap';
import { Badge } from '@/components/ui/badge';

const TYPE_OPTIONS = [
  { value: 'tps', label: 'TPS' },
  { value: 'tps3r', label: 'TPS3R' },
  { value: 'bank_sampah', label: 'Bank Sampah' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktif' },
  { value: 'full', label: 'Penuh' },
  { value: 'maintenance', label: 'Pemeliharaan' },
];

export const MapTab: React.FC = () => {
  const {
    allTps,
    isLoading,
    selectedTpsId,
    selectTps,
    mapFilterTypes,
    mapFilterStatuses,
    toggleMapFilterType,
    toggleMapFilterStatus,
    setActiveTab,
  } = useTpsPageStore();

  const analytics = useMemo(() => computeAnalytics(allTps), [allTps]);

  const filtered = useMemo(() => {
    let result = allTps;
    if (mapFilterTypes.size > 0) {
      result = result.filter((t) => mapFilterTypes.has(t.type));
    }
    if (mapFilterStatuses.size > 0) {
      result = result.filter((t) => mapFilterStatuses.has(t.status));
    }
    return result;
  }, [allTps, mapFilterTypes, mapFilterStatuses]);

  const handleTpsClick = (id: string) => {
    selectTps(id);
    setActiveTab('kelola');
  };

  return (
    <div className="space-y-4">
      <TpsKpiBar
        totalCount={analytics.totalCount}
        activeCount={analytics.activeCount}
        nearCapacityCount={analytics.nearCapacityCount}
        averageFillPercent={analytics.averageFillPercent}
        loading={isLoading}
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Tipe:</span>
        {TYPE_OPTIONS.map((opt) => (
          <Badge
            key={opt.value}
            variant={mapFilterTypes.has(opt.value) ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => toggleMapFilterType(opt.value)}
          >
            {opt.label}
          </Badge>
        ))}
        <span className="text-xs text-muted-foreground ml-3 mr-1">Status:</span>
        {STATUS_OPTIONS.map((opt) => (
          <Badge
            key={opt.value}
            variant={mapFilterStatuses.has(opt.value) ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => toggleMapFilterStatus(opt.value)}
          >
            {opt.label}
          </Badge>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border" style={{ height: 'calc(100vh - 340px)' }}>
        <TpsMap
          data={filtered}
          onTpsClick={handleTpsClick}
          selectedId={selectedTpsId}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500" /> &lt;70%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> 70–89%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" /> ≥90%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-400" /> Pemeliharaan
        </span>
      </div>
    </div>
  );
};
```

**Step 2: Verify the app compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/pages/TpsPage/tabs/MapTab.tsx
git commit -m "feat(web): add MapTab with KPIs, filter chips, map, and legend"
```

---

### Task 6: Backend — Add PATCH /tps/:id Endpoint

**Files:**
- Create: `apps/api/src/modules/tps/dto/update-tps.dto.ts`
- Modify: `apps/api/src/modules/tps/tps.controller.ts`
- Modify: `apps/api/src/modules/tps/tps.service.ts`
- Modify: `apps/api/src/modules/tps/tps.service.spec.ts`

**Step 1: Create UpdateTpsDto**

```typescript
// apps/api/src/modules/tps/dto/update-tps.dto.ts

import { IsString, IsNumber, IsEnum, IsUUID, IsOptional, MinLength, MaxLength, Min, Max } from 'class-validator';
import { TpsType, TpsStatus } from '@buzzr/shared-types';

export class UpdateTpsDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsEnum(TpsType)
  @IsOptional()
  type?: TpsType;

  @IsEnum(TpsStatus)
  @IsOptional()
  status?: TpsStatus;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @IsUUID()
  @IsOptional()
  areaId?: string;

  @IsNumber()
  @Min(0.1)
  @IsOptional()
  capacityTons?: number;
}
```

**Step 2: Add updateTps method to TpsService**

In `apps/api/src/modules/tps/tps.service.ts`, add this method after `getTpsById`:

```typescript
async updateTps(tenantSchema: string, id: string, dto: UpdateTpsDto) {
  // Verify TPS exists
  await this.getTpsById(tenantSchema, id);

  const setClauses: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (dto.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    params.push(dto.name);
  }
  if (dto.type !== undefined) {
    setClauses.push(`type = $${paramIndex++}`);
    params.push(dto.type);
  }
  if (dto.status !== undefined) {
    setClauses.push(`status = $${paramIndex++}`);
    params.push(dto.status);
  }
  if (dto.address !== undefined) {
    setClauses.push(`address = $${paramIndex++}`);
    params.push(dto.address);
  }
  if (dto.areaId !== undefined) {
    setClauses.push(`area_id = $${paramIndex++}`);
    params.push(dto.areaId);
  }
  if (dto.capacityTons !== undefined) {
    setClauses.push(`capacity_tons = $${paramIndex++}`);
    params.push(dto.capacityTons);
  }
  if (dto.latitude !== undefined && dto.longitude !== undefined) {
    setClauses.push(`coordinates = ST_SetSRID(ST_MakePoint($${paramIndex++}, $${paramIndex++}), 4326)`);
    params.push(dto.longitude, dto.latitude);
  }

  if (setClauses.length === 0) {
    return this.getTpsById(tenantSchema, id);
  }

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const result = await this.dataSource.query(
    `UPDATE "${tenantSchema}".tps_locations
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, type, status, address, area_id,
       ST_Y(coordinates::geometry) as latitude,
       ST_X(coordinates::geometry) as longitude,
       capacity_tons, current_load_tons, qr_code, created_at, updated_at`,
    params,
  );

  return result[0];
}
```

Add the import at the top of `tps.service.ts`:
```typescript
import { UpdateTpsDto } from './dto/update-tps.dto';
```

**Step 3: Add PATCH endpoint to TpsController**

In `apps/api/src/modules/tps/tps.controller.ts`, add this method **before** the `@Get()` routes (after the POST routes):

```typescript
@Patch(':id')
@Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
update(
  @Param('id') id: string,
  @Body() dto: UpdateTpsDto,
  @Req() req: Request,
) {
  return this.tpsService.updateTps(req.tenantSchema!, id, dto);
}
```

Add imports to the controller:
```typescript
import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { UpdateTpsDto } from './dto/update-tps.dto';
```

**Step 4: Add test for updateTps**

In `apps/api/src/modules/tps/tps.service.spec.ts`, add this test in the describe block:

```typescript
describe('updateTps', () => {
  it('should update TPS status', async () => {
    const mockTps = { id: 'tps-1', name: 'TPS Test', status: 'active' };
    mockDataSource.query
      .mockResolvedValueOnce([mockTps])  // getTpsById check
      .mockResolvedValueOnce([{ ...mockTps, status: 'full' }]); // UPDATE

    const result = await service.updateTps('test_schema', 'tps-1', {
      status: 'full' as any,
    });

    expect(result.status).toBe('full');
    expect(mockDataSource.query).toHaveBeenCalledTimes(2);
  });
});
```

**Step 5: Run tests**

Run: `cd apps/api && npx jest --testPathPattern=tps --verbose`
Expected: All tests pass including new `updateTps` test

**Step 6: Commit**

```bash
git add apps/api/src/modules/tps/
git commit -m "feat(api): add PATCH /tps/:id endpoint for TPS updates"
```

---

### Task 7: Create TpsForm Modal Component

**Files:**
- Create: `apps/web/src/pages/TpsPage/components/TpsForm.tsx`

**Step 1: Create TpsForm component**

```typescript
// apps/web/src/pages/TpsPage/components/TpsForm.tsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createTps, updateTps } from '../api';
import type { TpsItem } from '../types';

const TYPE_OPTIONS = [
  { value: 'tps', label: 'TPS' },
  { value: 'tps3r', label: 'TPS3R' },
  { value: 'bank_sampah', label: 'Bank Sampah' },
];

interface TpsFormProps {
  open: boolean;
  onClose: () => void;
  tps?: TpsItem | null;
  onSuccess: () => void;
}

export const TpsForm: React.FC<TpsFormProps> = ({ open, onClose, tps, onSuccess }) => {
  const isEdit = !!tps;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'tps',
    address: '',
    capacityTons: '',
    latitude: '',
    longitude: '',
    areaId: '',
  });

  useEffect(() => {
    if (tps) {
      setForm({
        name: tps.name,
        type: tps.type,
        address: tps.address || '',
        capacityTons: String(tps.capacity_tons),
        latitude: String(tps.latitude),
        longitude: String(tps.longitude),
        areaId: tps.area_id || '',
      });
    } else {
      setForm({
        name: '',
        type: 'tps',
        address: '',
        capacityTons: '',
        latitude: '',
        longitude: '',
        areaId: '',
      });
    }
  }, [tps, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.address || !form.capacityTons || !form.latitude || !form.longitude) {
      toast.error('Semua field wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        name: form.name,
        type: form.type,
        address: form.address,
        capacityTons: Number(form.capacityTons),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        areaId: form.areaId || undefined,
      };

      if (isEdit) {
        await updateTps(tps!.id, body);
        toast.success('TPS berhasil diperbarui');
      } else {
        await createTps(body as any);
        toast.success('TPS berhasil ditambahkan');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Gagal menyimpan TPS');
    } finally {
      setSubmitting(false);
    }
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit TPS' : 'Tambah TPS Baru'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="TPS Cempaka"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipe</Label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => update('type', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Jl. Contoh No. 123"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacityTons">Kapasitas (ton)</Label>
            <Input
              id="capacityTons"
              type="number"
              step="0.1"
              min="0.1"
              value={form.capacityTons}
              onChange={(e) => update('capacityTons', e.target.value)}
              placeholder="5.0"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => update('latitude', e.target.value)}
                placeholder="-6.2088"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => update('longitude', e.target.value)}
                placeholder="106.8456"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

**Step 2: Verify the app compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/pages/TpsPage/components/TpsForm.tsx
git commit -m "feat(web): add TpsForm modal for create and edit TPS"
```

---

### Task 8: Create ManageTab

**Files:**
- Create: `apps/web/src/pages/TpsPage/tabs/ManageTab.tsx`

**Step 1: Create ManageTab component**

```typescript
// apps/web/src/pages/TpsPage/tabs/ManageTab.tsx

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, DataTableColumnHeader, Highlight } from '@/components/data-table';
import type { FilterDef } from '@/components/data-table';
import { useServerTable } from '@/hooks/useServerTable';
import { useDataTableKeyboard } from '@/hooks/useDataTableKeyboard';
import { StatusBadge } from '@/components/common';
import { STATUS_LABELS } from '@/theme/tokens';
import { CapacityBar } from '../components/CapacityBar';
import { TpsMap } from '../components/TpsMap';
import { TpsForm } from '../components/TpsForm';
import { useTpsPageStore } from '../store';
import type { TpsItem } from '../types';

const TYPE_LABELS: Record<string, string> = {
  tps: 'TPS',
  tps3r: 'TPS3R',
  bank_sampah: 'Bank Sampah',
};

const typeOptions = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const statusOptions = Object.entries(STATUS_LABELS)
  .filter(([k]) => ['active', 'full', 'maintenance'].includes(k))
  .map(([value, label]) => ({ value, label: label as string }));

const tpsFilterDefs: FilterDef[] = [
  { key: 'status', label: 'Status', type: 'select', options: statusOptions },
  { key: 'type', label: 'Tipe', type: 'select', options: typeOptions },
];

interface TpsPaginated {
  id: string;
  name: string;
  type: string;
  status: string;
  capacity_tons: number;
  current_load_tons: number;
  address: string;
  latitude: number;
  longitude: number;
  qr_code: string;
  area_id: string;
}

const columnHelper = createColumnHelper<TpsPaginated>();

export const ManageTab: React.FC = () => {
  const { selectedTpsId, selectTps } = useTpsPageStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedTps, setSelectedTps] = useState<TpsPaginated | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTps, setEditTps] = useState<TpsPaginated | null>(null);
  const searchTextRef = useRef('');

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
        cell: (info) => (
          <span className="text-sm font-medium">
            <Highlight text={info.getValue() || '-'} query={searchTextRef.current} />
          </span>
        ),
      }),
      columnHelper.accessor('type', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe" />,
        cell: (info) => (
          <Badge variant="outline" className="text-xs">
            {TYPE_LABELS[info.getValue()] || info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('status', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('address', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Alamat" />,
        cell: (info) => (
          <span className="line-clamp-1 text-sm text-muted-foreground">
            <Highlight text={info.getValue()?.slice(0, 40) || '-'} query={searchTextRef.current} />
          </span>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('capacity_tons', {
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kapasitas" />,
        cell: (info) => (
          <span className="text-sm tabular-nums">{Number(info.getValue())} ton</span>
        ),
      }),
      columnHelper.display({
        id: 'load_pct',
        header: 'Beban',
        cell: ({ row }) => {
          const cap = Number(row.original.capacity_tons);
          const load = Number(row.original.current_load_tons);
          return <CapacityBar current={load} max={cap} size="sm" />;
        },
      }),
    ],
    [],
  );

  const {
    table, isLoading, meta, searchText, setSearchText,
    filters, setFilter, resetFilters, activeFilterCount, refetch, setPage, setLimit,
  } = useServerTable<TpsPaginated>({
    endpoint: '/tps',
    columnDefs: columns,
    defaultSort: { field: 'name', order: 'asc' },
    filterDefs: tpsFilterDefs,
  });

  searchTextRef.current = searchText;

  useDataTableKeyboard({
    table,
    activeIndex,
    setActiveIndex,
    onEnter: (row) => {
      setSelectedTps(row);
      selectTps(row.id);
    },
    onEscape: () => {
      setSelectedTps(null);
      selectTps(null);
    },
  });

  // Auto-select from store (e.g., clicking on map)
  React.useEffect(() => {
    if (selectedTpsId && !selectedTps) {
      const rows = table.getRowModel().rows;
      const found = rows.find((r) => r.original.id === selectedTpsId);
      if (found) setSelectedTps(found.original);
    }
  }, [selectedTpsId, table]);

  const handleStatusTransition = useCallback(
    async (id: string, newStatus: string) => {
      try {
        await api.patch(`/tps/${id}`, { status: newStatus });
        toast.success(`Status TPS diubah ke ${STATUS_LABELS[newStatus] || newStatus}`);
        refetch();
        setSelectedTps(null);
        selectTps(null);
      } catch {
        toast.error('Gagal mengubah status TPS');
      }
    },
    [refetch, selectTps],
  );

  const handleFormSuccess = () => {
    refetch();
    // Also refresh store data
    useTpsPageStore.getState().setLoading(true);
  };

  const renderPreview = useCallback(() => {
    if (!selectedTps) return null;

    const loadPct =
      Number(selectedTps.capacity_tons) > 0
        ? Math.round(
            (Number(selectedTps.current_load_tons) / Number(selectedTps.capacity_tons)) * 100,
          )
        : 0;

    const tpsForMap: TpsItem = {
      ...selectedTps,
      latitude: Number(selectedTps.latitude),
      longitude: Number(selectedTps.longitude),
      capacity_tons: Number(selectedTps.capacity_tons),
      current_load_tons: Number(selectedTps.current_load_tons),
      fill_percent: loadPct,
      created_at: '',
      updated_at: '',
    };

    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-sm">{selectedTps.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {TYPE_LABELS[selectedTps.type] || selectedTps.type}
          </p>
        </div>

        {/* Capacity */}
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">Kapasitas</span>
          <CapacityBar current={Number(selectedTps.current_load_tons)} max={Number(selectedTps.capacity_tons)} />
          <p className="text-xs tabular-nums text-muted-foreground">
            {Number(selectedTps.current_load_tons).toFixed(1)} / {Number(selectedTps.capacity_tons).toFixed(1)} ton ({loadPct}%)
          </p>
        </div>

        {/* Mini map */}
        {selectedTps.latitude && selectedTps.longitude && (
          <div className="rounded-md overflow-hidden border">
            <TpsMap
              data={[]}
              singleMarker={tpsForMap}
              height="180px"
              interactive={false}
            />
          </div>
        )}

        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status</span>
            <StatusBadge status={selectedTps.status} />
          </div>
          {selectedTps.address && (
            <div>
              <span className="text-xs text-muted-foreground block">Alamat</span>
              <span className="text-sm">{selectedTps.address}</span>
            </div>
          )}
          {selectedTps.qr_code && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">QR Code</span>
              <span className="text-sm font-mono">{selectedTps.qr_code}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setEditTps(selectedTps);
              setFormOpen(true);
            }}
          >
            Edit TPS
          </Button>
          <div className="flex gap-2">
            {selectedTps.status !== 'active' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleStatusTransition(selectedTps.id, 'active')}
              >
                Aktifkan
              </Button>
            )}
            {selectedTps.status !== 'full' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleStatusTransition(selectedTps.id, 'full')}
              >
                Tandai Penuh
              </Button>
            )}
            {selectedTps.status !== 'maintenance' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleStatusTransition(selectedTps.id, 'maintenance')}
              >
                Pemeliharaan
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedTps, handleStatusTransition]);

  return (
    <>
      <DataTable
        table={table}
        meta={meta}
        isLoading={isLoading}
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Cari nama, alamat..."
        filters={filters}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        activeFilterCount={activeFilterCount}
        filterDefs={tpsFilterDefs}
        filterLabels={{ status: 'Status', type: 'Tipe' }}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefresh={refetch}
        onRowClick={(r) => {
          setSelectedTps(r);
          selectTps(r.id);
        }}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        previewOpen={!!selectedTps}
        onPreviewClose={() => {
          setSelectedTps(null);
          selectTps(null);
        }}
        renderPreview={renderPreview}
        previewMode="split"
        emptyTitle="Tidak ada TPS"
        emptyDescription="Belum ada titik pengumpulan yang terdaftar"
        emptyActionLabel="Tambah TPS"
        onEmptyAction={() => setFormOpen(true)}
        toolbarExtra={
          <Button size="sm" onClick={() => { setEditTps(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Tambah TPS
          </Button>
        }
      />

      <TpsForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTps(null); }}
        tps={editTps as any}
        onSuccess={handleFormSuccess}
      />
    </>
  );
};
```

**Step 2: Verify the app compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/pages/TpsPage/tabs/ManageTab.tsx
git commit -m "feat(web): add ManageTab with DataTable, preview panel, mini-map, and CRUD"
```

---

### Task 9: Create AnalyticsTab

**Files:**
- Create: `apps/web/src/pages/TpsPage/tabs/AnalyticsTab.tsx`

**Step 1: Create AnalyticsTab component**

```typescript
// apps/web/src/pages/TpsPage/tabs/AnalyticsTab.tsx

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTpsPageStore, computeAnalytics } from '../store';
import { TpsKpiBar } from '../components/TpsKpiBar';
import { CapacityBar } from '../components/CapacityBar';

const TYPE_LABELS: Record<string, string> = {
  tps: 'TPS',
  tps3r: 'TPS3R',
  bank_sampah: 'Bank Sampah',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  full: 'Penuh',
  maintenance: 'Pemeliharaan',
};

const TYPE_COLORS: Record<string, string> = {
  tps: '#3B82F6',
  tps3r: '#22C55E',
  bank_sampah: '#EAB308',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#22C55E',
  full: '#EF4444',
  maintenance: '#F59E0B',
};

export const AnalyticsTab: React.FC = () => {
  const { allTps, isLoading, selectTps, setActiveTab } = useTpsPageStore();
  const analytics = useMemo(() => computeAnalytics(allTps), [allTps]);

  const typeData = analytics.byType.map((d) => ({
    name: TYPE_LABELS[d.type] || d.type,
    value: d.count,
    fill: TYPE_COLORS[d.type] || '#9CA3AF',
  }));

  const statusData = analytics.byStatus.map((d) => ({
    name: STATUS_LABELS[d.status] || d.status,
    value: d.count,
    fill: STATUS_COLORS[d.status] || '#9CA3AF',
  }));

  const handleTopFilledClick = (id: string) => {
    selectTps(id);
    setActiveTab('kelola');
  };

  return (
    <div className="space-y-4">
      <TpsKpiBar
        totalCount={analytics.totalCount}
        activeCount={analytics.activeCount}
        nearCapacityCount={analytics.nearCapacityCount}
        averageFillPercent={analytics.averageFillPercent}
        loading={isLoading}
      />

      <div className="grid grid-cols-2 gap-4">
        {/* Fill Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distribusi Beban</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.fillDistribution} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="bracket" width={70} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} TPS`, 'Jumlah']}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {analytics.fillDistribution.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* TPS by Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TPS per Tipe</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {typeData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* TPS by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Status TPS</CardTitle>
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

        {/* Top 10 Near Capacity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TPS Hampir Penuh (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topFilled.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tidak ada data
                </p>
              )}
              {analytics.topFilled.map((t, i) => (
                <button
                  key={t.id}
                  className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded-md px-2 py-1.5 transition-colors"
                  onClick={() => handleTopFilledClick(t.id)}
                >
                  <span className="text-xs text-muted-foreground w-4 tabular-nums">
                    {i + 1}.
                  </span>
                  <span className="text-sm font-medium flex-1 truncate">{t.name}</span>
                  <div className="w-24">
                    <CapacityBar current={t.current_load_tons} max={t.capacity_tons} size="sm" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
```

**Step 2: Verify the app compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/pages/TpsPage/tabs/AnalyticsTab.tsx
git commit -m "feat(web): add AnalyticsTab with charts and top-10 list"
```

---

### Task 10: Assemble TpsPage index.tsx with Tabs and Data Loading

**Files:**
- Modify: `apps/web/src/pages/TpsPage/index.tsx`

**Step 1: Replace index.tsx stub with full implementation**

```typescript
// apps/web/src/pages/TpsPage/index.tsx

import React, { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Map, ClipboardList, BarChart3 } from 'lucide-react';
import { PageHeader, PageTransition } from '@/components/common';
import { useTpsPageStore } from './store';
import { fetchTpsMapData } from './api';
import { MapTab } from './tabs/MapTab';
import { ManageTab } from './tabs/ManageTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import type { TpsTab } from './types';

const TABS: { id: TpsTab; label: string; icon: React.ElementType }[] = [
  { id: 'peta', label: 'Peta', icon: Map },
  { id: 'kelola', label: 'Kelola', icon: ClipboardList },
  { id: 'analitik', label: 'Analitik', icon: BarChart3 },
];

const TpsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, setActiveTab, setAllTps, setLoading, allTps } = useTpsPageStore();

  // Sync tab from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TpsTab | null;
    if (tabParam && ['peta', 'kelola', 'analitik'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);

  const handleTabChange = (tab: TpsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // Load map data (used by Map and Analytics tabs)
  const loadMapData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTpsMapData();
      setAllTps(data);
    } catch (err) {
      console.error('Failed to load TPS map data:', err);
    } finally {
      setLoading(false);
    }
  }, [setAllTps, setLoading]);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Reload when store signals (e.g., after form submit)
  const { isLoading } = useTpsPageStore();
  useEffect(() => {
    if (isLoading && allTps.length > 0) {
      loadMapData();
    }
  }, [isLoading]);

  return (
    <PageTransition>
      <div>
        <PageHeader
          title="Tempat Penampungan Sementara"
          description="Kelola dan pantau titik pengumpulan sampah"
          breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'TPS' }]}
        />

        {/* Tabs */}
        <div className="border-b mb-4">
          <nav className="flex gap-0" aria-label="Tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
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
          </nav>
        </div>

        {/* Tab content */}
        {activeTab === 'peta' && <MapTab />}
        {activeTab === 'kelola' && <ManageTab />}
        {activeTab === 'analitik' && <AnalyticsTab />}
      </div>
    </PageTransition>
  );
};

export default TpsPage;
```

**Step 2: Verify the app compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/pages/TpsPage/index.tsx
git commit -m "feat(web): assemble TpsPage with tabs, data loading, and URL sync"
```

---

### Task 11: Update Sidebar Navigation Label

**Files:**
- Modify: `apps/web/src/layouts/DashboardLayout.tsx`

**Step 1: Find the TPS sidebar menu item and update label**

In `apps/web/src/layouts/DashboardLayout.tsx`, find the navigation item for the TPS page. The label likely says "TPS" — update it to "TPS" (keep as is, it's already short and clear). No changes needed if label is already correct.

Verify the sidebar icon and label are appropriate. If the current TPS item uses a generic icon, consider updating to `MapPin` from lucide-react to match the TPS context.

**Step 2: Delete old TpsTriagePage**

Remove the old file:
```bash
rm apps/web/src/pages/TpsTriagePage.tsx
```

**Step 3: Verify the app compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors (old file should not be imported anywhere since we updated App.tsx in Task 1)

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor(web): remove old TpsTriagePage, update navigation"
```

---

### Task 12: End-to-End Verification

**Step 1: Run API tests**

Run: `cd apps/api && npx jest --testPathPattern=tps --verbose`
Expected: All tests pass including `updateTps`

**Step 2: Run web type check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Build web app**

Run: `cd /opt/buzzr && pnpm run build --filter=@buzzr/web`
Expected: Build succeeds without errors

**Step 4: Rebuild and redeploy Docker containers**

```bash
docker compose -f docker/docker-compose.yml build --no-cache api web
docker compose -f docker/docker-compose.yml up -d --force-recreate api web
```

**Step 5: Verify live deployment**

- Navigate to `https://dlh.buzzr.id/tps` — should show new tabbed TPS page
- Click "Peta" tab — map with TPS markers and KPI bar
- Click "Kelola" tab — data table with preview panel
- Click "Analitik" tab — KPI cards and charts
- Test "Tambah TPS" button opens form modal
- Verify map z-index: overlay panels should not be covered by Leaflet
