# Live Operations Command Center Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-screen Leaflet-based command center at `/live` with floating panels for real-time fleet monitoring, TPS status, route tracking, and dispatch actions.

**Architecture:** Full-viewport Leaflet map with collapsible floating panels (KPI bar, vehicle list, alert feed, route timeline, layer toggle). WebSocket for real-time GPS, 30s polling for TPS/schedules/KPIs. New backend endpoints for batch vehicle positions and active schedules.

**Tech Stack:** Leaflet + react-leaflet (existing), leaflet.markercluster, leaflet.heat, leaflet-rotatedmarker (new), Zustand store, Socket.IO client (existing), NestJS raw SQL (existing pattern).

**Design doc:** `docs/plans/2026-03-09-live-operations-command-center-design.md`

---

## Task 1: Install Frontend Dependencies

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install new Leaflet plugins**

Run:
```bash
cd apps/web && pnpm add leaflet.markercluster leaflet-heat leaflet-rotatedmarker && pnpm add -D @types/leaflet.markercluster
```

**Step 2: Verify install**

Run: `cd apps/web && pnpm ls leaflet.markercluster leaflet-heat leaflet-rotatedmarker`
Expected: All three packages listed

**Step 3: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml pnpm-lock.yaml
git commit -m "chore(web): add leaflet plugins for live operations map"
```

---

## Task 2: Backend — Fleet Positions Endpoint (Test)

**Files:**
- Test: `apps/api/src/modules/fleet/fleet.service.spec.ts`

**Step 1: Write failing test for `getFleetPositions`**

Add to `apps/api/src/modules/fleet/fleet.service.spec.ts` after the existing `listVehicles` describe block:

```typescript
describe('getFleetPositions', () => {
  it('should return all active vehicles with latest GPS position', async () => {
    dataSource.query.mockResolvedValue([
      {
        id: 'v-1',
        plate_number: 'B 1234 CD',
        type: 'truk',
        capacity_tons: 8,
        driver_id: 'd-1',
        driver_name: 'Ahmad',
        driver_phone: '08123456789',
        latitude: -6.9175,
        longitude: 107.6191,
        speed: 25.5,
        last_update: '2026-03-09T10:00:00Z',
      },
    ]);

    const result = await service.getFleetPositions('dlh_demo');

    expect(result).toHaveLength(1);
    expect(result[0].plate_number).toBe('B 1234 CD');
    expect(result[0].latitude).toBe(-6.9175);
    expect(result[0].driver_name).toBe('Ahmad');
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('DISTINCT ON (v.id)'),
      [],
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && npx jest fleet.service.spec.ts --testNamePattern="getFleetPositions" -v`
Expected: FAIL — `service.getFleetPositions is not a function`

---

## Task 3: Backend — Fleet Positions Endpoint (Implementation)

**Files:**
- Modify: `apps/api/src/modules/fleet/fleet.service.ts`
- Modify: `apps/api/src/modules/fleet/fleet.controller.ts`

**Step 1: Add `getFleetPositions` to FleetService**

Add this method at the end of `FleetService` class in `apps/api/src/modules/fleet/fleet.service.ts`:

```typescript
async getFleetPositions(tenantSchema: string) {
  return this.dataSource.query(
    `SELECT v.id, v.plate_number, v.type, v.capacity_tons, v.driver_id, v.is_active,
            u.name as driver_name, u.phone as driver_phone,
            gl.latitude, gl.longitude, gl.speed, gl.last_update
     FROM "${tenantSchema}".vehicles v
     LEFT JOIN "${tenantSchema}".users u ON v.driver_id = u.id
     LEFT JOIN LATERAL (
       SELECT DISTINCT ON (vehicle_id)
              ST_Y(coordinates::geometry) as latitude,
              ST_X(coordinates::geometry) as longitude,
              speed, recorded_at as last_update, vehicle_id
       FROM "${tenantSchema}".gps_logs
       WHERE vehicle_id = v.id
       ORDER BY vehicle_id, recorded_at DESC
     ) gl ON true
     WHERE v.is_active = true
     ORDER BY v.plate_number`,
    [],
  );
}
```

**Step 2: Add controller endpoint**

Add this method to `FleetController` in `apps/api/src/modules/fleet/fleet.controller.ts`, **before** the `@Get()` list endpoint (route order matters):

```typescript
@Get('positions')
@Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
getPositions(@Req() req: Request) {
  return this.fleetService.getFleetPositions(req.tenantSchema!);
}
```

**Step 3: Run test to verify it passes**

Run: `cd apps/api && npx jest fleet.service.spec.ts -v`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add apps/api/src/modules/fleet/fleet.service.ts apps/api/src/modules/fleet/fleet.controller.ts apps/api/src/modules/fleet/fleet.service.spec.ts
git commit -m "feat(api): add GET /fleet/positions endpoint for batch vehicle GPS"
```

---

## Task 4: Backend — Active Schedules Endpoint (Test)

**Files:**
- Test: `apps/api/src/modules/schedule/schedule.service.spec.ts`

**Step 1: Write failing test for `getActiveSchedules`**

Create or add to `apps/api/src/modules/schedule/schedule.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleService } from './schedule.service';
import { DataSource } from 'typeorm';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<ScheduleService>(ScheduleService);
  });

  describe('getActiveSchedules', () => {
    it('should return today active schedules for all drivers with stops', async () => {
      dataSource.query.mockResolvedValue([
        {
          id: 's-1',
          route_name: 'Rute Selatan',
          schedule_type: 'recurring',
          status: 'in_progress',
          start_time: '07:00:00',
          driver_id: 'd-1',
          driver_name: 'Ahmad',
          vehicle_id: 'v-1',
          vehicle_plate: 'B 1234 CD',
          stops: [
            { id: 'st-1', tps_id: 't-1', tps_name: 'TPS Merdeka', stop_order: 1, estimated_arrival: '07:30:00' },
          ],
        },
      ]);

      const result = await service.getActiveSchedules('dlh_demo');

      expect(result).toHaveLength(1);
      expect(result[0].driver_name).toBe('Ahmad');
      expect(result[0].vehicle_plate).toBe('B 1234 CD');
      expect(result[0].stops).toHaveLength(1);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd apps/api && npx jest schedule.service.spec.ts --testNamePattern="getActiveSchedules" -v`
Expected: FAIL — `service.getActiveSchedules is not a function`

---

## Task 5: Backend — Active Schedules Endpoint (Implementation)

**Files:**
- Modify: `apps/api/src/modules/schedule/schedule.service.ts`
- Modify: `apps/api/src/modules/schedule/schedule.controller.ts`

**Step 1: Add `getActiveSchedules` to ScheduleService**

Add this method to `ScheduleService` class in `apps/api/src/modules/schedule/schedule.service.ts`:

```typescript
async getActiveSchedules(tenantSchema: string) {
  const today = new Date();
  const dayOfWeek = today.getDay();

  return this.dataSource.query(
    `SELECT s.id, s.route_name, s.schedule_type, s.status, s.start_time,
            s.driver_id, u.name as driver_name,
            s.vehicle_id, v.plate_number as vehicle_plate,
            json_agg(
              json_build_object(
                'id', ss.id, 'tps_id', ss.tps_id,
                'tps_name', t.name,
                'stop_order', ss.stop_order,
                'estimated_arrival', ss.estimated_arrival
              ) ORDER BY ss.stop_order
            ) FILTER (WHERE ss.id IS NOT NULL) as stops
     FROM "${tenantSchema}".schedules s
     LEFT JOIN "${tenantSchema}".users u ON s.driver_id = u.id
     LEFT JOIN "${tenantSchema}".vehicles v ON s.vehicle_id = v.id
     LEFT JOIN "${tenantSchema}".schedule_stops ss ON s.id = ss.schedule_id
     LEFT JOIN "${tenantSchema}".tps_locations t ON ss.tps_id = t.id
     WHERE (
       (s.schedule_type = 'recurring' AND $1 = ANY(s.recurring_days))
       OR (s.schedule_type = 'on_demand' AND s.scheduled_date = CURRENT_DATE)
     )
     GROUP BY s.id, u.name, v.plate_number
     ORDER BY s.start_time`,
    [dayOfWeek],
  );
}
```

**Step 2: Add controller endpoint**

Add to `ScheduleController` in `apps/api/src/modules/schedule/schedule.controller.ts`, **before** the `@Get('today')` endpoint:

```typescript
@Get('active')
@Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
getActive(@Req() req: Request) {
  return this.scheduleService.getActiveSchedules(req.tenantSchema!);
}
```

**Step 3: Run test to verify it passes**

Run: `cd apps/api && npx jest schedule.service.spec.ts -v`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add apps/api/src/modules/schedule/schedule.service.ts apps/api/src/modules/schedule/schedule.controller.ts apps/api/src/modules/schedule/schedule.service.spec.ts
git commit -m "feat(api): add GET /schedules/active endpoint for live operations"
```

---

## Task 6: Backend — Schedule Reassignment Endpoint (Test + Implementation)

**Files:**
- Modify: `apps/api/src/modules/schedule/schedule.service.ts`
- Modify: `apps/api/src/modules/schedule/schedule.controller.ts`
- Test: `apps/api/src/modules/schedule/schedule.service.spec.ts`

**Step 1: Write failing test**

Add to `schedule.service.spec.ts` describe block:

```typescript
describe('reassignSchedule', () => {
  it('should reassign schedule to new driver and vehicle', async () => {
    dataSource.query.mockResolvedValue([{
      id: 's-1',
      driver_id: 'd-2',
      vehicle_id: 'v-2',
    }]);

    const result = await service.reassignSchedule('dlh_demo', 's-1', {
      driverId: 'd-2',
      vehicleId: 'v-2',
    });

    expect(result.driver_id).toBe('d-2');
    expect(result.vehicle_id).toBe('v-2');
  });

  it('should throw if schedule not found', async () => {
    dataSource.query.mockResolvedValue([]);

    await expect(
      service.reassignSchedule('dlh_demo', 's-999', { driverId: 'd-2', vehicleId: 'v-2' }),
    ).rejects.toThrow('Jadwal tidak ditemukan');
  });
});
```

**Step 2: Run test to verify failure**

Run: `cd apps/api && npx jest schedule.service.spec.ts --testNamePattern="reassignSchedule" -v`
Expected: FAIL

**Step 3: Implement `reassignSchedule` in ScheduleService**

Add to `ScheduleService`:

```typescript
async reassignSchedule(
  tenantSchema: string,
  scheduleId: string,
  data: { driverId: string; vehicleId: string },
) {
  const result = await this.dataSource.query(
    `UPDATE "${tenantSchema}".schedules
     SET driver_id = $1, vehicle_id = $2
     WHERE id = $3
     RETURNING *`,
    [data.driverId, data.vehicleId, scheduleId],
  );
  if (!result.length) throw new NotFoundException('Jadwal tidak ditemukan');
  return result[0];
}
```

**Step 4: Add controller endpoint**

Add to `ScheduleController`:

```typescript
@Patch(':id/reassign')
@Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
reassign(
  @Param('id') id: string,
  @Body() body: { driverId: string; vehicleId: string },
  @Req() req: Request,
) {
  return this.scheduleService.reassignSchedule(req.tenantSchema!, id, body);
}
```

**Step 5: Run all tests**

Run: `cd apps/api && npx jest schedule.service.spec.ts -v`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add apps/api/src/modules/schedule/schedule.service.ts apps/api/src/modules/schedule/schedule.controller.ts apps/api/src/modules/schedule/schedule.service.spec.ts
git commit -m "feat(api): add PATCH /schedules/:id/reassign for dispatch"
```

---

## Task 7: Backend — Notification Push Endpoint (Test + Implementation)

**Files:**
- Modify: `apps/api/src/modules/notification/notification.service.ts`
- Modify: `apps/api/src/modules/notification/notification.controller.ts`
- Test: `apps/api/src/modules/notification/notification.service.spec.ts`

**Step 1: Write test file**

Create `apps/api/src/modules/notification/notification.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { DataSource } from 'typeorm';

describe('NotificationService', () => {
  let service: NotificationService;
  let dataSource: { query: jest.Mock };

  beforeEach(async () => {
    dataSource = { query: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();
    service = module.get<NotificationService>(NotificationService);
  });

  describe('sendPushToDriver', () => {
    it('should create a notification for the driver', async () => {
      dataSource.query.mockResolvedValue([{
        id: 'n-1',
        user_id: 'd-1',
        title: 'Rute baru ditugaskan',
        body: 'Anda ditugaskan ke Rute Selatan',
        type: 'dispatch',
      }]);

      const result = await service.sendPushToDriver('dlh_demo', {
        driverId: 'd-1',
        title: 'Rute baru ditugaskan',
        body: 'Anda ditugaskan ke Rute Selatan',
        type: 'dispatch',
      });

      expect(result.user_id).toBe('d-1');
      expect(result.title).toBe('Rute baru ditugaskan');
    });
  });
});
```

**Step 2: Run test to verify failure**

Run: `cd apps/api && npx jest notification.service.spec.ts -v`
Expected: FAIL — `service.sendPushToDriver is not a function`

**Step 3: Implement `sendPushToDriver` in NotificationService**

Add to `NotificationService`:

```typescript
async sendPushToDriver(tenantSchema: string, data: { driverId: string; title: string; body: string; type?: string }) {
  return this.createNotification(tenantSchema, {
    userId: data.driverId,
    title: data.title,
    body: data.body,
    type: data.type || 'dispatch',
  });
}
```

**Step 4: Add controller endpoint**

Add to `NotificationController`:

```typescript
@Post('push')
@Roles(UserRole.DLH_ADMIN, UserRole.SUPER_ADMIN)
sendPush(@Body() body: { driverId: string; title: string; body: string; type?: string }, @Req() req: any) {
  return this.notificationService.sendPushToDriver(req.tenantSchema, body);
}
```

Add `Post` and `Body` to the imports from `@nestjs/common`, and add `RolesGuard`, `Roles`, `UserRole` imports:

```typescript
import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@buzzr/shared-types';
```

Also add `RolesGuard` to the `@UseGuards` decorator on the controller class:

```typescript
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
```

**Step 5: Run tests**

Run: `cd apps/api && npx jest notification.service.spec.ts -v`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add apps/api/src/modules/notification/notification.service.ts apps/api/src/modules/notification/notification.controller.ts apps/api/src/modules/notification/notification.service.spec.ts
git commit -m "feat(api): add POST /notifications/push for driver messaging"
```

---

## Task 8: Backend — TPS Map Summary Endpoint

**Files:**
- Modify: `apps/api/src/modules/tps/tps.service.ts`
- Modify: `apps/api/src/modules/tps/tps.controller.ts`

**Step 1: Add `getMapSummary` to TpsService**

Add to `TpsService`:

```typescript
async getMapSummary(tenantSchema: string) {
  const results = await this.dataSource.query(
    `SELECT id, name, type, status, capacity_tons, current_load_tons,
            ST_Y(coordinates::geometry) as latitude,
            ST_X(coordinates::geometry) as longitude
     FROM "${tenantSchema}".tps_locations
     ORDER BY name`,
    [],
  );
  return results.map((tps: any) => ({
    ...tps,
    fill_percent: tps.capacity_tons > 0
      ? Math.round((tps.current_load_tons / tps.capacity_tons) * 100)
      : 0,
  }));
}
```

**Step 2: Add controller endpoint**

Add to `TpsController` **before** the existing `@Get()` list endpoint:

```typescript
@Get('map-summary')
getMapSummary(@Req() req: Request) {
  return this.tpsService.getMapSummary(req.tenantSchema!);
}
```

**Step 3: Run existing TPS tests**

Run: `cd apps/api && npx jest tps.service.spec -v` (if exists, otherwise skip)

**Step 4: Commit**

```bash
git add apps/api/src/modules/tps/tps.service.ts apps/api/src/modules/tps/tps.controller.ts
git commit -m "feat(api): add GET /tps/map-summary lightweight endpoint"
```

---

## Task 9: Backend — Broadcast GPS Updates to Web Clients

The current gateway saves GPS and publishes to Redis, but doesn't broadcast to Socket.IO rooms. We need the gateway to emit to `tracking:{tenantSchema}` room.

**Files:**
- Modify: `apps/api/src/modules/tracking/tracking.gateway.ts`

**Step 1: Add broadcast after save**

Replace the `handleGpsUpdate` method in `apps/api/src/modules/tracking/tracking.gateway.ts`:

```typescript
@SubscribeMessage('gps:update')
async handleGpsUpdate(
  @MessageBody() data: { tenantSchema: string; vehicleId: string; driverId: string; latitude: number; longitude: number; speed: number },
  @ConnectedSocket() client: Socket,
) {
  await this.trackingService.saveGpsLog(data.tenantSchema, {
    vehicleId: data.vehicleId,
    driverId: data.driverId,
    latitude: data.latitude,
    longitude: data.longitude,
    speed: data.speed,
  });

  // Broadcast to all subscribers in this tenant's tracking room
  this.server.to(`tracking:${data.tenantSchema}`).emit('gps:position', {
    vehicleId: data.vehicleId,
    driverId: data.driverId,
    latitude: data.latitude,
    longitude: data.longitude,
    speed: data.speed,
    timestamp: new Date().toISOString(),
  });
}
```

**Step 2: Run existing tracking tests**

Run: `cd apps/api && npx jest tracking.service.spec.ts -v`
Expected: ALL PASS (gateway logic not unit tested)

**Step 3: Commit**

```bash
git add apps/api/src/modules/tracking/tracking.gateway.ts
git commit -m "feat(api): broadcast GPS updates to tracking room via Socket.IO"
```

---

## Task 10: Frontend — TypeScript Types

**Files:**
- Create: `apps/web/src/pages/LiveOperationsPage/types.ts`

**Step 1: Create types file**

First create the directory:
```bash
mkdir -p apps/web/src/pages/LiveOperationsPage
```

Create `apps/web/src/pages/LiveOperationsPage/types.ts`:

```typescript
export interface VehiclePosition {
  id: string;
  plate_number: string;
  type: string;
  capacity_tons: number;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  last_update: string | null;
  is_active: boolean;
}

export type VehicleStatus = 'moving' | 'idle' | 'offline' | 'alert';

export interface VehicleWithStatus extends VehiclePosition {
  status: VehicleStatus;
}

export interface TpsMapItem {
  id: string;
  name: string;
  type: string;
  status: string;
  capacity_tons: number;
  current_load_tons: number;
  latitude: number;
  longitude: number;
  fill_percent: number;
}

export interface ActiveSchedule {
  id: string;
  route_name: string;
  schedule_type: string;
  status: string;
  start_time: string;
  driver_id: string;
  driver_name: string;
  vehicle_id: string;
  vehicle_plate: string;
  stops: ScheduleStop[] | null;
}

export interface ScheduleStop {
  id: string;
  tps_id: string;
  tps_name: string;
  stop_order: number;
  estimated_arrival: string | null;
}

export interface LiveAlert {
  id: string;
  type: 'tps_capacity' | 'vehicle_offline' | 'route_delayed' | 'sla_breach' | 'missed_stop';
  severity: 'critical' | 'warning';
  title: string;
  message: string;
  sourceId: string;
  sourceType: 'vehicle' | 'tps' | 'schedule' | 'complaint';
  latitude?: number;
  longitude?: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface DashboardKPIs {
  totalWasteTodayKg: number;
  activeDrivers: number;
  pendingComplaints: number;
  collectionRate: number;
}

export type MapLayer = 'vehicles' | 'tps' | 'routes' | 'heatmap' | 'areas' | 'complaints';

export interface GpsUpdatePayload {
  vehicleId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}
```

**Step 2: Verify types compile**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to the types file

**Step 3: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/types.ts
git commit -m "feat(web): add TypeScript types for live operations"
```

---

## Task 11: Frontend — API Service Layer

**Files:**
- Create: `apps/web/src/pages/LiveOperationsPage/api.ts`

**Step 1: Create API service**

Create `apps/web/src/pages/LiveOperationsPage/api.ts`:

```typescript
import api from '@/services/api';
import type { VehiclePosition, TpsMapItem, ActiveSchedule, DashboardKPIs } from './types';

export async function fetchFleetPositions(): Promise<VehiclePosition[]> {
  const { data } = await api.get<VehiclePosition[]>('/fleet/positions');
  return data;
}

export async function fetchTpsMapSummary(): Promise<TpsMapItem[]> {
  const { data } = await api.get<TpsMapItem[]>('/tps/map-summary');
  return data;
}

export async function fetchActiveSchedules(): Promise<ActiveSchedule[]> {
  const { data } = await api.get<ActiveSchedule[]>('/schedules/active');
  return data;
}

export async function fetchDashboardKPIs(): Promise<DashboardKPIs> {
  const { data } = await api.get<DashboardKPIs>('/reports/dashboard');
  return data;
}

export async function fetchWasteHeatmap(): Promise<{ latitude: number; longitude: number; total_kg: number }[]> {
  const { data } = await api.get('/reports/heatmap');
  return data;
}

export async function fetchPendingComplaints(): Promise<any[]> {
  const { data } = await api.get('/complaints', { params: { status: 'submitted' } });
  return Array.isArray(data) ? data : data.data || [];
}

export async function reassignSchedule(scheduleId: string, body: { driverId: string; vehicleId: string }) {
  const { data } = await api.patch(`/schedules/${scheduleId}/reassign`, body);
  return data;
}

export async function sendDriverMessage(body: { driverId: string; title: string; body: string }) {
  const { data } = await api.post('/notifications/push', body);
  return data;
}
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/api.ts
git commit -m "feat(web): add live operations API service layer"
```

---

## Task 12: Frontend — Zustand Store

**Files:**
- Create: `apps/web/src/pages/LiveOperationsPage/store.ts`

**Step 1: Create the store**

Create `apps/web/src/pages/LiveOperationsPage/store.ts`:

```typescript
import { create } from 'zustand';
import type {
  VehicleWithStatus,
  VehicleStatus,
  TpsMapItem,
  ActiveSchedule,
  LiveAlert,
  DashboardKPIs,
  MapLayer,
  GpsUpdatePayload,
} from './types';

interface LiveOpsState {
  // Data
  vehicles: VehicleWithStatus[];
  tpsLocations: TpsMapItem[];
  activeSchedules: ActiveSchedule[];
  kpis: DashboardKPIs | null;
  alerts: LiveAlert[];

  // UI State
  selectedVehicleId: string | null;
  selectedTpsId: string | null;
  activeLayers: Set<MapLayer>;
  vehicleSearch: string;
  isVehiclePanelOpen: boolean;
  isAlertPanelOpen: boolean;

  // Actions
  setVehicles: (vehicles: VehicleWithStatus[]) => void;
  updateVehicleGps: (payload: GpsUpdatePayload) => void;
  setTpsLocations: (tps: TpsMapItem[]) => void;
  setActiveSchedules: (schedules: ActiveSchedule[]) => void;
  setKpis: (kpis: DashboardKPIs) => void;
  setAlerts: (alerts: LiveAlert[]) => void;
  acknowledgeAlert: (alertId: string) => void;
  selectVehicle: (vehicleId: string | null) => void;
  selectTps: (tpsId: string | null) => void;
  toggleLayer: (layer: MapLayer) => void;
  setVehicleSearch: (search: string) => void;
  toggleVehiclePanel: () => void;
  toggleAlertPanel: () => void;
}

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function deriveVehicleStatus(
  speed: number | null,
  lastUpdate: string | null,
): VehicleStatus {
  if (!lastUpdate) return 'offline';
  const elapsed = Date.now() - new Date(lastUpdate).getTime();
  if (elapsed > OFFLINE_THRESHOLD_MS) return 'offline';
  if (speed != null && speed > 2) return 'moving';
  return 'idle';
}

export const useLiveOpsStore = create<LiveOpsState>((set) => ({
  vehicles: [],
  tpsLocations: [],
  activeSchedules: [],
  kpis: null,
  alerts: [],

  selectedVehicleId: null,
  selectedTpsId: null,
  activeLayers: new Set<MapLayer>(['vehicles', 'tps', 'routes']),
  vehicleSearch: '',
  isVehiclePanelOpen: true,
  isAlertPanelOpen: true,

  setVehicles: (vehicles) => set({ vehicles }),

  updateVehicleGps: (payload) =>
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === payload.vehicleId
          ? {
              ...v,
              latitude: payload.latitude,
              longitude: payload.longitude,
              speed: payload.speed,
              last_update: payload.timestamp,
              status: deriveVehicleStatus(payload.speed, payload.timestamp),
            }
          : v,
      ),
    })),

  setTpsLocations: (tpsLocations) => set({ tpsLocations }),
  setActiveSchedules: (activeSchedules) => set({ activeSchedules }),
  setKpis: (kpis) => set({ kpis }),

  setAlerts: (alerts) => set({ alerts }),

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a,
      ),
    })),

  selectVehicle: (vehicleId) => set({ selectedVehicleId: vehicleId, selectedTpsId: null }),
  selectTps: (tpsId) => set({ selectedTpsId: tpsId, selectedVehicleId: null }),

  toggleLayer: (layer) =>
    set((state) => {
      const next = new Set(state.activeLayers);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return { activeLayers: next };
    }),

  setVehicleSearch: (vehicleSearch) => set({ vehicleSearch }),
  toggleVehiclePanel: () => set((s) => ({ isVehiclePanelOpen: !s.isVehiclePanelOpen })),
  toggleAlertPanel: () => set((s) => ({ isAlertPanelOpen: !s.isAlertPanelOpen })),
}));
```

**Step 2: Verify compilation**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/store.ts
git commit -m "feat(web): add Zustand store for live operations state"
```

---

## Task 13: Frontend — Data Hooks (useLiveData)

**Files:**
- Create: `apps/web/src/pages/LiveOperationsPage/hooks.ts`

**Step 1: Create hooks file**

Create `apps/web/src/pages/LiveOperationsPage/hooks.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useLiveOpsStore, deriveVehicleStatus } from './store';
import {
  fetchFleetPositions,
  fetchTpsMapSummary,
  fetchActiveSchedules,
  fetchDashboardKPIs,
} from './api';
import type { GpsUpdatePayload, LiveAlert, VehicleWithStatus } from './types';

const POLL_INTERVAL_MS = 30_000;

export function useLiveData() {
  const store = useLiveOpsStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // WebSocket: real-time GPS updates
  useSocket('gps:position', (data: GpsUpdatePayload) => {
    store.updateVehicleGps(data);
  });

  // Subscribe to tenant tracking room on mount
  useEffect(() => {
    const socket = (await import('@/services/socket')).getSocket();
    const tenantSlug = localStorage.getItem('tenantSlug') || 'dlh-demo';
    // Map slug to schema (simple: replace hyphens with underscores)
    const tenantSchema = tenantSlug.replace(/-/g, '_');
    socket.emit('tracking:subscribe', { tenantSchema });
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const [fleet, tps, schedules, kpis] = await Promise.all([
        fetchFleetPositions(),
        fetchTpsMapSummary(),
        fetchActiveSchedules(),
        fetchDashboardKPIs(),
      ]);

      // Derive vehicle status from GPS data
      const vehiclesWithStatus: VehicleWithStatus[] = fleet.map((v) => ({
        ...v,
        status: deriveVehicleStatus(v.speed, v.last_update),
      }));

      store.setVehicles(vehiclesWithStatus);
      store.setTpsLocations(tps);
      store.setActiveSchedules(schedules);
      store.setKpis(kpis);

      // Generate alerts from data
      const alerts = generateAlerts(vehiclesWithStatus, tps, schedules);
      store.setAlerts(alerts);
    } catch (err) {
      console.error('Failed to load live operations data:', err);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    loadAllData();
    intervalRef.current = setInterval(loadAllData, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadAllData]);

  return { refresh: loadAllData };
}

let alertCounter = 0;

function generateAlerts(
  vehicles: VehicleWithStatus[],
  tps: { id: string; name: string; fill_percent: number; latitude: number; longitude: number }[],
  _schedules: any[],
): LiveAlert[] {
  const alerts: LiveAlert[] = [];

  // TPS near capacity
  for (const t of tps) {
    if (t.fill_percent >= 90) {
      alerts.push({
        id: `tps-cap-${t.id}`,
        type: 'tps_capacity',
        severity: 'critical',
        title: `${t.name} hampir penuh`,
        message: `Kapasitas ${t.fill_percent}% — perlu pengangkutan segera`,
        sourceId: t.id,
        sourceType: 'tps',
        latitude: t.latitude,
        longitude: t.longitude,
        timestamp: new Date(),
        acknowledged: false,
      });
    }
  }

  // Vehicles offline
  for (const v of vehicles) {
    if (v.status === 'offline' && v.driver_id) {
      alerts.push({
        id: `veh-off-${v.id}`,
        type: 'vehicle_offline',
        severity: 'warning',
        title: `${v.plate_number} offline`,
        message: `Tidak ada sinyal GPS dari ${v.driver_name || 'pengemudi'}`,
        sourceId: v.id,
        sourceType: 'vehicle',
        latitude: v.latitude ?? undefined,
        longitude: v.longitude ?? undefined,
        timestamp: new Date(),
        acknowledged: false,
      });
    }
  }

  return alerts;
}
```

**Note:** The `useEffect` with the dynamic import for socket subscription needs adjustment. Replace with a synchronous approach:

Actually, let's fix that. Replace the tracking subscribe `useEffect` block with:

```typescript
// Subscribe to tenant tracking room on mount
useEffect(() => {
  import('@/services/socket').then(({ getSocket, connectSocket }) => {
    connectSocket();
    const socket = getSocket();
    const tenantSlug = localStorage.getItem('tenantSlug') || 'dlh-demo';
    const tenantSchema = tenantSlug.replace(/-/g, '_');
    socket.emit('tracking:subscribe', { tenantSchema });
  });
}, []);
```

**Step 2: Verify compilation**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`
Fix any type errors found.

**Step 3: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/hooks.ts
git commit -m "feat(web): add live data hooks with WebSocket + polling"
```

---

## Task 14: Frontend — LiveMap Component

**Files:**
- Create: `apps/web/src/pages/LiveOperationsPage/map/LiveMap.tsx`

**Step 1: Create map directory and component**

```bash
mkdir -p apps/web/src/pages/LiveOperationsPage/map
```

Create `apps/web/src/pages/LiveOperationsPage/map/LiveMap.tsx`:

```typescript
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLiveOpsStore } from '../store';
import type { VehicleWithStatus, TpsMapItem, ActiveSchedule } from '../types';

const BANDUNG_CENTER: LatLngExpression = [-6.9175, 107.6191];

const vehicleStatusColors: Record<string, string> = {
  moving: '#22C55E',
  idle: '#EAB308',
  offline: '#9CA3AF',
  alert: '#EF4444',
};

function tpsFillColor(fillPercent: number): string {
  if (fillPercent >= 90) return '#EF4444';
  if (fillPercent >= 70) return '#F59E0B';
  return '#22C55E';
}

function FitBoundsOnSelect({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
}

interface LiveMapProps {
  className?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({ className }) => {
  const {
    vehicles,
    tpsLocations,
    activeSchedules,
    activeLayers,
    selectedVehicleId,
    selectVehicle,
    selectTps,
  } = useLiveOpsStore();

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId],
  );

  return (
    <MapContainer
      center={BANDUNG_CENTER}
      zoom={12}
      className={className}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {/* Vehicle markers */}
      {activeLayers.has('vehicles') &&
        vehicles
          .filter((v) => v.latitude != null && v.longitude != null)
          .map((v) => (
            <CircleMarker
              key={v.id}
              center={[v.latitude!, v.longitude!]}
              radius={8}
              pathOptions={{
                color: vehicleStatusColors[v.status],
                fillColor: vehicleStatusColors[v.status],
                fillOpacity: v.id === selectedVehicleId ? 1 : 0.7,
                weight: v.id === selectedVehicleId ? 3 : 2,
              }}
              eventHandlers={{
                click: () => selectVehicle(v.id),
              }}
            >
              <Popup>
                <div className="space-y-1 min-w-[180px]">
                  <p className="font-semibold text-sm">{v.plate_number}</p>
                  <p className="text-xs text-gray-600">{v.driver_name || 'Tidak ada pengemudi'}</p>
                  <p className="text-xs">
                    Status: <span className="font-medium capitalize">{v.status}</span>
                    {v.speed != null && ` · ${v.speed.toFixed(1)} km/h`}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

      {/* TPS markers */}
      {activeLayers.has('tps') &&
        tpsLocations
          .filter((t) => t.latitude != null && t.longitude != null)
          .map((t) => (
            <CircleMarker
              key={t.id}
              center={[t.latitude, t.longitude]}
              radius={10}
              pathOptions={{
                color: tpsFillColor(t.fill_percent),
                fillColor: tpsFillColor(t.fill_percent),
                fillOpacity: 0.7,
                weight: 2,
              }}
              eventHandlers={{
                click: () => selectTps(t.id),
              }}
            >
              <Popup>
                <div className="space-y-1 min-w-[180px]">
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-gray-600">{t.type}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, t.fill_percent)}%`,
                        backgroundColor: tpsFillColor(t.fill_percent),
                      }}
                    />
                  </div>
                  <p className="text-xs">
                    {t.current_load_tons.toFixed(1)} / {t.capacity_tons.toFixed(1)} ton ({t.fill_percent}%)
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

      {/* Route polylines */}
      {activeLayers.has('routes') &&
        activeSchedules
          .filter((s) => s.stops && s.stops.length > 0)
          .map((schedule) => {
            const stops = schedule.stops!;
            // Find TPS coordinates for each stop
            const positions: LatLngExpression[] = stops
              .map((stop) => {
                const tps = tpsLocations.find((t) => t.id === stop.tps_id);
                return tps ? [tps.latitude, tps.longitude] as LatLngExpression : null;
              })
              .filter((p): p is LatLngExpression => p !== null);

            if (positions.length < 2) return null;

            return (
              <Polyline
                key={schedule.id}
                positions={positions}
                pathOptions={{
                  color: schedule.status === 'completed' ? '#22C55E' : '#3B82F6',
                  weight: 3,
                  opacity: 0.7,
                  dashArray: schedule.status === 'in_progress' ? '10 5' : undefined,
                }}
              />
            );
          })}

      {/* Pan to selected vehicle */}
      {selectedVehicle && selectedVehicle.latitude != null && selectedVehicle.longitude != null && (
        <FitBoundsOnSelect lat={selectedVehicle.latitude} lng={selectedVehicle.longitude} />
      )}
    </MapContainer>
  );
};
```

**Step 2: Verify compilation**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 3: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/map/
git commit -m "feat(web): add LiveMap component with vehicle, TPS, and route layers"
```

---

## Task 15: Frontend — KPI Bar Panel

**Files:**
- Create: `apps/web/src/pages/LiveOperationsPage/panels/KPIBar.tsx`

**Step 1: Create panels directory and KPIBar**

```bash
mkdir -p apps/web/src/pages/LiveOperationsPage/panels
```

Create `apps/web/src/pages/LiveOperationsPage/panels/KPIBar.tsx`:

```typescript
import React from 'react';
import { Truck, Users, Package, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { useLiveOpsStore } from '../store';

export const KPIBar: React.FC = () => {
  const { vehicles, kpis, tpsLocations, alerts } = useLiveOpsStore();

  const activeVehicles = vehicles.filter((v) => v.status !== 'offline').length;
  const totalVehicles = vehicles.length;
  const movingVehicles = vehicles.filter((v) => v.status === 'moving').length;
  const nearCapacityTps = tpsLocations.filter((t) => t.fill_percent >= 80).length;
  const unacknowledgedAlerts = alerts.filter((a) => !a.acknowledged).length;

  const metrics = [
    {
      label: 'Kendaraan Aktif',
      value: `${activeVehicles}/${totalVehicles}`,
      icon: Truck,
      color: 'text-emerald-400',
    },
    {
      label: 'Bergerak',
      value: `${movingVehicles}`,
      icon: Truck,
      color: 'text-blue-400',
    },
    {
      label: 'Pengemudi Aktif',
      value: `${kpis?.activeDrivers ?? '-'}`,
      icon: Users,
      color: 'text-sky-400',
    },
    {
      label: 'Sampah Hari Ini',
      value: kpis ? `${(kpis.totalWasteTodayKg / 1000).toFixed(1)} ton` : '-',
      icon: Package,
      color: 'text-amber-400',
    },
    {
      label: 'TPS Hampir Penuh',
      value: `${nearCapacityTps}`,
      icon: AlertTriangle,
      color: nearCapacityTps > 0 ? 'text-red-400' : 'text-emerald-400',
    },
    {
      label: 'Tingkat Retribusi',
      value: kpis ? `${kpis.collectionRate}%` : '-',
      icon: CheckCircle,
      color: 'text-emerald-400',
    },
    {
      label: 'Peringatan',
      value: `${unacknowledgedAlerts}`,
      icon: Bell,
      color: unacknowledgedAlerts > 0 ? 'text-red-400' : 'text-gray-400',
    },
  ];

  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-gray-700/50">
      <div className="flex items-center justify-between px-4 h-12">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-2 px-3">
            <m.icon className={`h-4 w-4 ${m.color}`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 leading-tight">{m.label}</span>
              <span className="text-sm font-semibold text-white leading-tight">{m.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/panels/KPIBar.tsx
git commit -m "feat(web): add KPI bar panel for live operations"
```

---

## Task 16: Frontend — Vehicle Panel

**Files:**
- Create: `apps/web/src/pages/LiveOperationsPage/panels/VehiclePanel.tsx`

**Step 1: Create VehiclePanel**

Create `apps/web/src/pages/LiveOperationsPage/panels/VehiclePanel.tsx`:

```typescript
import React, { useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import { useLiveOpsStore } from '../store';
import type { VehicleWithStatus } from '../types';

const statusDot: Record<string, string> = {
  moving: 'bg-emerald-500',
  idle: 'bg-yellow-500',
  offline: 'bg-gray-400',
  alert: 'bg-red-500',
};

const statusLabel: Record<string, string> = {
  moving: 'Bergerak',
  idle: 'Diam',
  offline: 'Offline',
  alert: 'Peringatan',
};

export const VehiclePanel: React.FC = () => {
  const {
    vehicles,
    selectedVehicleId,
    selectVehicle,
    vehicleSearch,
    setVehicleSearch,
    isVehiclePanelOpen,
    toggleVehiclePanel,
  } = useLiveOpsStore();

  const filtered = useMemo(() => {
    if (!vehicleSearch) return vehicles;
    const q = vehicleSearch.toLowerCase();
    return vehicles.filter(
      (v) =>
        v.plate_number.toLowerCase().includes(q) ||
        (v.driver_name && v.driver_name.toLowerCase().includes(q)),
    );
  }, [vehicles, vehicleSearch]);

  // Sort: moving first, then idle, then offline
  const sorted = useMemo(() => {
    const order: Record<string, number> = { alert: 0, moving: 1, idle: 2, offline: 3 };
    return [...filtered].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }, [filtered]);

  if (!isVehiclePanelOpen) {
    return (
      <button
        onClick={toggleVehiclePanel}
        className="absolute top-16 left-2 z-40 bg-white rounded-lg shadow-lg p-2 hover:bg-gray-50"
        title="Buka panel kendaraan"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="absolute top-14 left-2 bottom-2 z-40 w-72 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold">Kendaraan</span>
          <span className="text-xs text-gray-400">({vehicles.length})</span>
        </div>
        <button onClick={toggleVehiclePanel} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari plat / pengemudi..."
            value={vehicleSearch}
            onChange={(e) => setVehicleSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Vehicle list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((v) => (
          <button
            key={v.id}
            onClick={() => selectVehicle(v.id === selectedVehicleId ? null : v.id)}
            className={`w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
              v.id === selectedVehicleId ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{v.plate_number}</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${statusDot[v.status]}`} />
                <span className="text-[10px] text-gray-500">{statusLabel[v.status]}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-gray-500">{v.driver_name || 'Tanpa pengemudi'}</span>
              {v.speed != null && v.status === 'moving' && (
                <span className="text-[10px] text-gray-400">{v.speed.toFixed(0)} km/h</span>
              )}
            </div>
          </button>
        ))}
        {sorted.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400">
            Tidak ada kendaraan ditemukan
          </div>
        )}
      </div>

      {/* Status summary */}
      <div className="px-3 py-2 border-t bg-gray-50 flex items-center gap-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {vehicles.filter((v) => v.status === 'moving').length}</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> {vehicles.filter((v) => v.status === 'idle').length}</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> {vehicles.filter((v) => v.status === 'offline').length}</span>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/panels/VehiclePanel.tsx
git commit -m "feat(web): add vehicle panel with search and status indicators"
```

---

## Task 17: Frontend — Alert Feed Panel

**Files:**
- Create: `apps/web/src/pages/LiveOperationsPage/panels/AlertFeed.tsx`

**Step 1: Create AlertFeed**

Create `apps/web/src/pages/LiveOperationsPage/panels/AlertFeed.tsx`:

```typescript
import React from 'react';
import { Bell, X, MapPin, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useLiveOpsStore } from '../store';

const severityStyles = {
  critical: { bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', text: 'text-red-700' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700' },
};

export const AlertFeed: React.FC = () => {
  const { alerts, acknowledgeAlert, selectVehicle, selectTps, isAlertPanelOpen, toggleAlertPanel } = useLiveOpsStore();

  const unacknowledged = alerts.filter((a) => !a.acknowledged);

  if (!isAlertPanelOpen) {
    return (
      <button
        onClick={toggleAlertPanel}
        className="absolute bottom-2 right-2 z-40 bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2 hover:bg-gray-50"
      >
        <Bell className="h-4 w-4" />
        {unacknowledged.length > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {unacknowledged.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="absolute bottom-2 right-2 z-40 w-80 max-h-[50vh] bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold">Peringatan</span>
          {unacknowledged.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unacknowledged.length}
            </span>
          )}
        </div>
        <button onClick={toggleAlertPanel} className="p-1 hover:bg-gray-100 rounded">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400">
            Tidak ada peringatan
          </div>
        ) : (
          alerts
            .filter((a) => !a.acknowledged)
            .map((alert) => {
              const style = severityStyles[alert.severity];
              return (
                <div
                  key={alert.id}
                  className={`px-3 py-2.5 border-b ${style.bg} ${style.border}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${style.text}`}>{alert.title}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {alert.latitude != null && (
                        <button
                          onClick={() => {
                            if (alert.sourceType === 'vehicle') selectVehicle(alert.sourceId);
                            else if (alert.sourceType === 'tps') selectTps(alert.sourceId);
                          }}
                          className="p-1 hover:bg-white/50 rounded"
                          title="Fokus di peta"
                        >
                          <MapPin className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="p-1 hover:bg-white/50 rounded"
                        title="Tandai sudah dibaca"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/panels/AlertFeed.tsx
git commit -m "feat(web): add alert feed panel with acknowledge/focus actions"
```

---

## Task 18: Frontend — Vehicle Detail Panel

**Files:**
- Create: `apps/web/src/pages/LiveOperationsPage/panels/VehicleDetail.tsx`

**Step 1: Create VehicleDetail**

Create `apps/web/src/pages/LiveOperationsPage/panels/VehicleDetail.tsx`:

```typescript
import React, { useMemo, useState } from 'react';
import { X, Phone, MessageSquare, RotateCw, AlertTriangle, MapPin } from 'lucide-react';
import { useLiveOpsStore } from '../store';
import { sendDriverMessage, reassignSchedule } from '../api';

const statusColors: Record<string, string> = {
  moving: 'text-emerald-600 bg-emerald-50',
  idle: 'text-yellow-600 bg-yellow-50',
  offline: 'text-gray-600 bg-gray-100',
  alert: 'text-red-600 bg-red-50',
};

export const VehicleDetail: React.FC = () => {
  const { vehicles, activeSchedules, selectedVehicleId, selectVehicle } = useLiveOpsStore();
  const [sending, setSending] = useState(false);

  const vehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId),
    [vehicles, selectedVehicleId],
  );

  const schedule = useMemo(
    () => activeSchedules.find((s) => s.vehicle_id === selectedVehicleId),
    [activeSchedules, selectedVehicleId],
  );

  if (!vehicle) return null;

  const handleCallDriver = () => {
    if (vehicle.driver_phone) {
      window.open(`tel:${vehicle.driver_phone}`, '_self');
    }
  };

  const handleMessageDriver = async () => {
    if (!vehicle.driver_id) return;
    setSending(true);
    try {
      await sendDriverMessage({
        driverId: vehicle.driver_id,
        title: 'Pesan dari Dispatcher',
        body: 'Mohon segera konfirmasi status Anda.',
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="absolute top-14 left-[calc(theme(spacing.72)+theme(spacing.4))] z-45 w-80 bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div>
          <p className="text-sm font-semibold">{vehicle.plate_number}</p>
          <p className="text-xs text-gray-500">{vehicle.type}</p>
        </div>
        <button onClick={() => selectVehicle(null)} className="p-1 hover:bg-gray-200 rounded">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Driver info */}
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-gray-500">Pengemudi</p>
        <p className="text-sm font-medium">{vehicle.driver_name || 'Tidak ditugaskan'}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[vehicle.status]}`}>
            {vehicle.status === 'moving' ? 'Bergerak' : vehicle.status === 'idle' ? 'Diam' : vehicle.status === 'offline' ? 'Offline' : 'Peringatan'}
          </span>
          {vehicle.speed != null && vehicle.status === 'moving' && (
            <span className="text-xs text-gray-500">{vehicle.speed.toFixed(1)} km/h</span>
          )}
        </div>
      </div>

      {/* Route progress */}
      {schedule && (
        <div className="px-4 py-3 border-b">
          <p className="text-xs text-gray-500">Rute Aktif</p>
          <p className="text-sm font-medium">{schedule.route_name}</p>
          {schedule.stops && (
            <div className="flex items-center gap-1 mt-2 overflow-x-auto">
              {schedule.stops.map((stop, i) => (
                <React.Fragment key={stop.id}>
                  <div className="flex flex-col items-center min-w-[40px]">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-white" />
                    <span className="text-[8px] text-gray-400 mt-0.5 truncate max-w-[50px]">
                      {stop.tps_name?.split(' ')[0] || `Stop ${stop.stop_order}`}
                    </span>
                  </div>
                  {i < schedule.stops!.length - 1 && (
                    <div className="flex-1 h-0.5 bg-blue-200 min-w-[12px]" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          {vehicle.driver_phone && (
            <button
              onClick={handleCallDriver}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100"
            >
              <Phone className="h-3.5 w-3.5" /> Telepon
            </button>
          )}
          {vehicle.driver_id && (
            <button
              onClick={handleMessageDriver}
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50"
            >
              <MessageSquare className="h-3.5 w-3.5" /> {sending ? '...' : 'Pesan'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/panels/VehicleDetail.tsx
git commit -m "feat(web): add vehicle detail panel with dispatch actions"
```

---

## Task 19: Frontend — Layer Toggle Control

**Files:**
- Create: `apps/web/src/pages/LiveOperationsPage/panels/LayerToggle.tsx`

**Step 1: Create LayerToggle**

Create `apps/web/src/pages/LiveOperationsPage/panels/LayerToggle.tsx`:

```typescript
import React from 'react';
import { Truck, MapPin, Route, Thermometer, Map, AlertTriangle } from 'lucide-react';
import { useLiveOpsStore } from '../store';
import type { MapLayer } from '../types';

const layers: { id: MapLayer; label: string; icon: React.ElementType }[] = [
  { id: 'vehicles', label: 'Kendaraan', icon: Truck },
  { id: 'tps', label: 'TPS', icon: MapPin },
  { id: 'routes', label: 'Rute', icon: Route },
  { id: 'heatmap', label: 'Heatmap', icon: Thermometer },
  { id: 'areas', label: 'Wilayah', icon: Map },
  { id: 'complaints', label: 'Pengaduan', icon: AlertTriangle },
];

export const LayerToggle: React.FC = () => {
  const { activeLayers, toggleLayer } = useLiveOpsStore();

  return (
    <div className="absolute top-16 right-2 z-40 bg-white rounded-lg shadow-lg overflow-hidden">
      {layers.map((layer) => {
        const isActive = activeLayers.has(layer.id);
        return (
          <button
            key={layer.id}
            onClick={() => toggleLayer(layer.id)}
            className={`flex items-center justify-center w-9 h-9 transition-colors ${
              isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={layer.label}
          >
            <layer.icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/panels/LayerToggle.tsx
git commit -m "feat(web): add map layer toggle control"
```

---

## Task 20: Frontend — Route Timeline Panel

**Files:**
- Create: `apps/web/src/pages/LiveOperationsPage/panels/RouteTimeline.tsx`

**Step 1: Create RouteTimeline**

Create `apps/web/src/pages/LiveOperationsPage/panels/RouteTimeline.tsx`:

```typescript
import React, { useMemo } from 'react';
import { useLiveOpsStore } from '../store';

export const RouteTimeline: React.FC = () => {
  const { activeSchedules, selectedVehicleId } = useLiveOpsStore();

  const schedule = useMemo(
    () => activeSchedules.find((s) => s.vehicle_id === selectedVehicleId),
    [activeSchedules, selectedVehicleId],
  );

  if (!schedule || !schedule.stops || schedule.stops.length === 0) return null;

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 bg-white rounded-lg shadow-lg px-4 py-3 max-w-lg">
      <p className="text-xs text-gray-500 mb-2">
        {schedule.route_name} — {schedule.driver_name}
      </p>
      <div className="flex items-center gap-0">
        {schedule.stops.map((stop, i) => (
          <React.Fragment key={stop.id}>
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-white flex items-center justify-center">
                <span className="text-[8px] font-bold text-blue-500">{stop.stop_order}</span>
              </div>
              <span className="text-[8px] text-gray-400 mt-1 max-w-[60px] truncate text-center">
                {stop.tps_name || `Stop ${stop.stop_order}`}
              </span>
              {stop.estimated_arrival && (
                <span className="text-[7px] text-gray-300">{stop.estimated_arrival}</span>
              )}
            </div>
            {i < schedule.stops!.length - 1 && (
              <div className="flex-1 h-0.5 bg-blue-200 min-w-[20px] mt-[-12px]" />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/panels/RouteTimeline.tsx
git commit -m "feat(web): add route timeline panel for selected vehicle"
```

---

## Task 21: Frontend — Main LiveOperationsPage Assembly

**Files:**
- Modify: `apps/web/src/pages/LiveOperationsPage.tsx` → move to `apps/web/src/pages/LiveOperationsPage/index.tsx`
- Create: `apps/web/src/pages/LiveOperationsPage/index.tsx`

**Step 1: Delete old placeholder and create new page**

Remove old file and create new `apps/web/src/pages/LiveOperationsPage/index.tsx`:

```typescript
import React from 'react';
import { LiveMap } from './map/LiveMap';
import { KPIBar } from './panels/KPIBar';
import { VehiclePanel } from './panels/VehiclePanel';
import { VehicleDetail } from './panels/VehicleDetail';
import { AlertFeed } from './panels/AlertFeed';
import { LayerToggle } from './panels/LayerToggle';
import { RouteTimeline } from './panels/RouteTimeline';
import { useLiveData } from './hooks';
import { useLiveOpsStore } from './store';

const LiveOperationsPage: React.FC = () => {
  useLiveData();
  const { selectedVehicleId } = useLiveOpsStore();

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      {/* Full-screen map */}
      <LiveMap className="absolute inset-0" />

      {/* Floating panels */}
      <KPIBar />
      <VehiclePanel />
      {selectedVehicleId && <VehicleDetail />}
      <LayerToggle />
      <AlertFeed />
      <RouteTimeline />
    </div>
  );
};

export default LiveOperationsPage;
```

**Step 2: Delete old placeholder file**

```bash
rm apps/web/src/pages/LiveOperationsPage.tsx
```

**Step 3: Update App.tsx import**

The lazy import in `App.tsx` uses `import('./pages/LiveOperationsPage')` which resolves to either `LiveOperationsPage.tsx` or `LiveOperationsPage/index.tsx`. Since we created `index.tsx` in the directory, the import should resolve correctly. Verify:

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 4: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/
git rm apps/web/src/pages/LiveOperationsPage.tsx 2>/dev/null || true
git add -A apps/web/src/pages/
git commit -m "feat(web): assemble LiveOperationsPage with all panels and map"
```

---

## Task 22: Fix Hooks File — Remove Async useEffect

The hooks file from Task 13 has a dynamic import inside useEffect that needs to work synchronously. Fix the implementation.

**Files:**
- Modify: `apps/web/src/pages/LiveOperationsPage/hooks.ts`

**Step 1: Rewrite hooks.ts to fix the async issue**

Replace entire content of `apps/web/src/pages/LiveOperationsPage/hooks.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { getSocket, connectSocket } from '@/services/socket';
import { useLiveOpsStore, deriveVehicleStatus } from './store';
import {
  fetchFleetPositions,
  fetchTpsMapSummary,
  fetchActiveSchedules,
  fetchDashboardKPIs,
} from './api';
import type { GpsUpdatePayload, LiveAlert, VehicleWithStatus, TpsMapItem } from './types';

const POLL_INTERVAL_MS = 30_000;

export function useLiveData() {
  const store = useLiveOpsStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // WebSocket: real-time GPS updates
  useSocket('gps:position', (data: GpsUpdatePayload) => {
    store.updateVehicleGps(data);
  });

  // Subscribe to tenant tracking room on mount
  useEffect(() => {
    connectSocket();
    const socket = getSocket();
    const tenantSlug = localStorage.getItem('tenantSlug') || 'dlh-demo';
    const tenantSchema = tenantSlug.replace(/-/g, '_');
    socket.emit('tracking:subscribe', { tenantSchema });
  }, []);

  const loadAllData = useCallback(async () => {
    try {
      const [fleet, tps, schedules, kpis] = await Promise.all([
        fetchFleetPositions(),
        fetchTpsMapSummary(),
        fetchActiveSchedules(),
        fetchDashboardKPIs(),
      ]);

      const vehiclesWithStatus: VehicleWithStatus[] = fleet.map((v) => ({
        ...v,
        status: deriveVehicleStatus(v.speed, v.last_update),
      }));

      store.setVehicles(vehiclesWithStatus);
      store.setTpsLocations(tps);
      store.setActiveSchedules(schedules);
      store.setKpis(kpis);

      const alerts = generateAlerts(vehiclesWithStatus, tps);
      store.setAlerts(alerts);
    } catch (err) {
      console.error('Failed to load live operations data:', err);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    loadAllData();
    intervalRef.current = setInterval(loadAllData, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadAllData]);

  return { refresh: loadAllData };
}

function generateAlerts(
  vehicles: VehicleWithStatus[],
  tps: TpsMapItem[],
): LiveAlert[] {
  const alerts: LiveAlert[] = [];

  for (const t of tps) {
    if (t.fill_percent >= 90) {
      alerts.push({
        id: `tps-cap-${t.id}`,
        type: 'tps_capacity',
        severity: 'critical',
        title: `${t.name} hampir penuh`,
        message: `Kapasitas ${t.fill_percent}% — perlu pengangkutan segera`,
        sourceId: t.id,
        sourceType: 'tps',
        latitude: t.latitude,
        longitude: t.longitude,
        timestamp: new Date(),
        acknowledged: false,
      });
    }
  }

  for (const v of vehicles) {
    if (v.status === 'offline' && v.driver_id) {
      alerts.push({
        id: `veh-off-${v.id}`,
        type: 'vehicle_offline',
        severity: 'warning',
        title: `${v.plate_number} offline`,
        message: `Tidak ada sinyal GPS dari ${v.driver_name || 'pengemudi'}`,
        sourceId: v.id,
        sourceType: 'vehicle',
        latitude: v.latitude ?? undefined,
        longitude: v.longitude ?? undefined,
        timestamp: new Date(),
        acknowledged: false,
      });
    }
  }

  return alerts;
}
```

**Step 2: Type check**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 3: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/hooks.ts
git commit -m "fix(web): fix hooks to use synchronous socket imports"
```

---

## Task 23: Build Verification

**Step 1: Run full type check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 2: Run API tests**

Run: `cd apps/api && npx jest --verbose`
Expected: All tests pass

**Step 3: Run dev server to visual check**

Run: `cd apps/web && pnpm run dev`
Navigate to `http://localhost:5173/live` — verify the page loads with the map and floating panels.

**Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "fix(web): resolve build issues for live operations page"
```

---

## Task 24: Heatmap Layer Integration

**Files:**
- Modify: `apps/web/src/pages/LiveOperationsPage/map/LiveMap.tsx`
- Modify: `apps/web/src/pages/LiveOperationsPage/hooks.ts`
- Modify: `apps/web/src/pages/LiveOperationsPage/store.ts`
- Modify: `apps/web/src/pages/LiveOperationsPage/types.ts`

**Step 1: Add heatmap data to types**

Add to `types.ts`:

```typescript
export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  total_kg: number;
}
```

**Step 2: Add to store**

Add to the `LiveOpsState` interface in `store.ts`:
- Property: `heatmapData: HeatmapPoint[]`
- Action: `setHeatmapData: (data: HeatmapPoint[]) => void`

Initialize: `heatmapData: []`
Implement: `setHeatmapData: (heatmapData) => set({ heatmapData })`

**Step 3: Fetch heatmap in hooks**

Add `fetchWasteHeatmap` to the `Promise.all` in `loadAllData` in `hooks.ts`, and call `store.setHeatmapData(heatmap)`.

**Step 4: Add heatmap layer to LiveMap**

Leaflet.heat doesn't have react-leaflet bindings. Create a simple wrapper using `useMap()`:

Add to `LiveMap.tsx` before the component:

```typescript
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

function HeatmapLayer({ points }: { points: { latitude: number; longitude: number; total_kg: number }[] }) {
  const map = useMap();

  React.useEffect(() => {
    if (points.length === 0) return;

    const maxKg = Math.max(...points.map((p) => p.total_kg));
    const heatData: [number, number, number][] = points.map((p) => [
      p.latitude,
      p.longitude,
      p.total_kg / maxKg,
    ]);

    const heat = (L as any).heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: { 0.4: 'green', 0.65: 'yellow', 1: 'red' },
    });

    heat.addTo(map);
    return () => { map.removeLayer(heat); };
  }, [map, points]);

  return null;
}
```

Add inside the `<MapContainer>` JSX, conditionally:

```typescript
{activeLayers.has('heatmap') && heatmapData.length > 0 && (
  <HeatmapLayer points={heatmapData} />
)}
```

Add `heatmapData` to the destructured store values.

**Step 5: Verify compilation**

Run: `cd apps/web && npx tsc --noEmit --pretty 2>&1 | head -30`

**Step 6: Commit**

```bash
git add apps/web/src/pages/LiveOperationsPage/
git commit -m "feat(web): add waste heatmap layer to live operations map"
```

---

## Task 25: Final Integration Test

**Step 1: Run all backend tests**

Run: `cd apps/api && npx jest --verbose`
Expected: All pass

**Step 2: Run frontend type check**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

**Step 3: Run full build**

Run: `pnpm run build`
Expected: Build succeeds

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete live operations command center implementation"
```
