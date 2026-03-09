# Live Operations Command Center — Design Document

**Date**: 2026-03-09
**Status**: Approved
**Target**: `/live` route — `LiveOperationsPage`

## Overview

Full-screen Leaflet map with floating, collapsible panels for real-time monitoring and dispatch operations. Serves both DLH admins (oversight) and dispatchers (active route/driver management). Enterprise-grade command center for waste management fleet and operations.

## Layout

Full-viewport map as background. Floating panels overlay the map with solid backgrounds, rounded corners, shadows, and collapse toggles.

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─KPI Bar (fixed top, semi-transparent, 48px)─────────────┐│
│ │ 🟢 12 Active │ 🚛 8 Moving │ 📦 4.2t │ ⚠ 3 │ 78% rate  ││
│ └──────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─Vehicle Panel─┐        FULL SCREEN MAP           ┌────┐  │
│ │ [🔍 Search]   │                                   │Lyr │  │
│ │ ● Truk-01  ▸  │    🚛→ · · · · 📍                │Tog │  │
│ │ ● Truk-02     │                                   │gle │  │
│ │ ○ Truk-03     │  📍TPS-A (78%)  📍TPS-B (92%)    └────┘  │
│ │ ⚠ Truk-04  ▸  │                                          │
│ │ [◀ Collapse]  │    🚛→ · · 📍               ┌──────────┐ │
│ └───────────────┘                              │Alert Feed│ │
│                                                │ ⚠ TPS-B  │ │
│                 ┌─Route Timeline───────────┐   │ ⚠ Truk-04│ │
│                 │ ●━━●━━●━━○━━○━━○         │   └──────────┘ │
│                 └──────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### Panel Behaviors

| Panel | Position | Default | Collapse To | Z-Index |
|---|---|---|---|---|
| KPI Bar | Top, full width | Visible | Hidden (toggle) | 50 |
| Vehicle Panel | Left, top-to-bottom | Visible | 40px icon strip | 40 |
| Alert Feed | Bottom-right | Visible | Badge with count | 40 |
| Route Timeline | Bottom-center | Hidden (shows on vehicle select) | Hidden | 30 |
| Layer Toggle | Right side | Visible | Single toggle button | 30 |
| Detail Panel | Expands from vehicle panel | Hidden | Hidden | 45 |

## Map Layers

6 togglable layers with distinct visual styles:

### Layer 1: Vehicles (Default ON)
- **Moving** (speed > 2 km/h): Green directional arrow marker, rotated to heading, trail line (last 20 positions, fading opacity)
- **Idle** (speed 0-2, update < 5 min): Yellow circle marker, gentle pulse after 10+ min
- **Offline** (no update > 5 min): Gray circle marker, no animation
- **Alert** (flagged issues): Red circle marker, pulse animation, highest z-index
- **Clustering**: At zoom < 14, MarkerCluster groups with status color of worst vehicle in cluster

### Layer 2: TPS Stations (Default ON)
- Pin markers color-coded by fill level:
  - `< 70%`: Green
  - `70-89%`: Amber
  - `≥ 90%`: Red with pulse animation
- Click popup: name, capacity bar, current load %, last collection time, "Dispatch truck" button

### Layer 3: Active Routes (Default ON)
- Polyline per active schedule with multi-segment coloring:
  - Completed: Solid green line
  - Current: Animated dashed blue line
  - Remaining: Light gray dashed line
- Small numbered circle markers at each stop
- Only today's active schedules displayed

### Layer 4: Waste Heatmap (Default OFF)
- Gradient overlay using `leaflet.heat` plugin
- Data from `GET /reports/heatmap` (returns lat, lng, total_kg per TPS)
- Gradient: green → yellow → red

### Layer 5: Geofences / Areas (Default OFF)
- Semi-transparent polygons from `areas` table boundaries
- Color-coded: served (green tint), pending (amber), overdue (red)

### Layer 6: Complaints (Default OFF)
- Warning triangle markers at complaint coordinates
- Within SLA: amber | SLA breached: red
- Click shows summary + "Assign driver" action

### Layer Toggle Control
Right-side floating button group with icon per layer (on/off state).

## Real-Time Data Flow

### WebSocket (GPS — Real-Time)

```
Mobile App (GPS every 5s)
  → WebSocket: gps:update → TrackingGateway (rate limit 5s)
  → PostgreSQL: gps_logs insert
  → Redis PubSub: gps:{tenantSchema}
  → Web Dashboard: useSocket('gps:update')
  → Smooth marker animation via requestAnimationFrame
```

Payload: `{ vehicleId, driverId, latitude, longitude, speed }`

Client-side marker animation: linear interpolation between old and new position over 500ms using `requestAnimationFrame`. Trail line extends with new point, oldest drops off (max 20 points).

### Polling (30-Second Intervals)

| Data | Endpoint | Purpose |
|---|---|---|
| TPS fill levels | `GET /tps/map-summary` (new) | Station markers + capacity |
| Active schedules | `GET /schedules/active` (new) | Route polylines + progress |
| Dashboard KPIs | `GET /reports/dashboard` | KPI bar metrics |
| Complaints | `GET /complaints?status=pending` | Complaint markers |

### Vehicle Status Derivation (Client-Side)

- **Moving**: `speed > 2` and last update < 5 min ago
- **Idle**: `speed <= 2` and last update < 5 min ago
- **Offline**: Last update > 5 min ago

## KPI Bar

Fixed 48px strip, semi-transparent dark background, 7 metrics:

| Metric | Source | Format |
|---|---|---|
| Active Vehicles | Fleet + GPS status | `12/15` ratio |
| Drivers On Route | Active schedules | `8 on route` |
| Waste Collected | `/reports/dashboard` | `4.2 ton` + trend arrow |
| TPS Near Capacity | TPS filtered ≥ 80% | `3 ⚠` amber/red |
| Active Complaints | Pending complaints | `5 pending` |
| Collection Rate | `/reports/dashboard` | `78%` + mini ring |
| Active Alerts | Client-computed | `3` badge |

## Dispatch Actions

### Vehicle Detail Panel

Slides out from vehicle panel when clicking a vehicle:

- **Header**: Plate number, vehicle type, driver name
- **Status**: Moving/Idle/Offline indicator, current speed
- **Route Progress**: Horizontal timeline (stop 1 → stop N), ETA to next stop
- **Actions**:
  1. **Call Driver** — `tel:` link with driver phone
  2. **Message Driver** — push notification via `POST /notifications/push` (new)
  3. **Reassign Route** — dropdown to pick schedule, `PATCH /schedules/:id/reassign` (new)
  4. **Flag Issue** — create alert/incident
  5. **View Full Route** — zoom map to show entire route

### TPS Station Actions (on marker click)

1. **Dispatch Nearest Truck** — show nearby available vehicles (using `findNearby`), one-click assign
2. **Mark as Collected** — reset current_load_tons to 0
3. **Report Issue** — create complaint linked to TPS

### Complaint Actions (on marker click)

1. **Assign Driver** — pick from available drivers/vehicles
2. **View Details** — show full complaint info
3. **Acknowledge** — update complaint status

## Alert System

Client-side generated from polled data:

| Alert Type | Trigger | Severity |
|---|---|---|
| TPS Near Capacity | `current_load / capacity ≥ 0.9` | Critical (red) |
| Vehicle Offline | No GPS update > 5 min | Warning (amber) |
| Route Delayed | Behind schedule ETA > 15 min | Warning (amber) |
| SLA Breach | Complaint past SLA deadline | Critical (red) |
| Missed Stop | Schedule stop time passed, no check-in | Warning (amber) |

Alert feed: newest first, each with **Acknowledge** (dismiss) and **Focus** (center map on source) actions.

## New API Endpoints Required

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/fleet/positions` | All vehicles with latest GPS position (batch, avoids N+1) |
| `GET` | `/schedules/active` | Today's in-progress schedules for all drivers (admin view) |
| `GET` | `/tps/map-summary` | Lightweight TPS data: id, name, lat, lng, capacity, current_load, status |
| `PATCH` | `/schedules/:id/reassign` | Reassign schedule to different driver/vehicle |
| `POST` | `/notifications/push` | Send push notification message to specific driver |

## Frontend Component Architecture

```
apps/web/src/pages/LiveOperationsPage/
├── LiveOperationsPage.tsx            // Main page orchestrator
├── hooks/
│   ├── useLiveMap.ts                 // Map state, layer toggles, viewport
│   ├── useLiveVehicles.ts            // Vehicle positions (WebSocket + polling)
│   ├── useLiveAlerts.ts              // Alert generation from data conditions
│   └── useLiveKPIs.ts               // KPI aggregation from multiple endpoints
├── panels/
│   ├── KPIBar.tsx                    // Top metrics strip
│   ├── VehiclePanel.tsx              // Left vehicle list (search, filter, status)
│   ├── VehicleDetail.tsx             // Expanded info + dispatch actions
│   ├── AlertFeed.tsx                 // Bottom-right alert stream
│   ├── RouteTimeline.tsx             // Bottom route progress (selected vehicle)
│   ├── TpsDetail.tsx                 // TPS popup/panel with actions
│   └── LayerToggle.tsx               // Right-side layer toggle buttons
├── map/
│   ├── LiveMap.tsx                   // Leaflet MapContainer with all layers
│   ├── VehicleMarker.tsx             // Animated marker with trail line
│   ├── TpsMarker.tsx                 // Fill-level colored pin
│   ├── RoutePolyline.tsx             // Multi-segment colored route line
│   ├── WasteHeatmap.tsx              // leaflet.heat overlay
│   ├── AreaPolygon.tsx               // Geofence boundary polygons
│   └── ComplaintMarker.tsx           // Complaint location marker
└── utils/
    ├── markerAnimation.ts            // requestAnimationFrame interpolation
    └── alertRules.ts                 // Alert condition definitions
```

## Dependencies

### New Packages
- `leaflet.markercluster` + `@types/leaflet.markercluster` — vehicle clustering
- `leaflet.heat` — heatmap layer
- `leaflet-rotatedmarker` — directional vehicle arrows

### Existing (No Changes)
- `leaflet` (1.9.4) + `react-leaflet` (4.2.1)
- `socket.io-client` (4.8.3) + `useSocket` hook
- `recharts` (for KPI sparklines if needed)

## Performance

- **Vehicle markers**: Smooth animation via `requestAnimationFrame`, not React re-renders
- **Layer management**: Each layer is a separate Leaflet `LayerGroup`, added/removed from map
- **Data freshness**: WebSocket for GPS (real-time), 30s polling for everything else
- **Memory**: Max 20 trail points per vehicle, pruned on each update
- **Expected scale**: 20-100 vehicles + 50-200 TPS per municipality — well within Leaflet's capabilities without virtualization
- **Panel rendering**: Panels are React components overlaying the map, independent of map renders

## Tile Provider

Existing CARTO `light_all` basemap. No change needed. Free, no API key, good coverage of Indonesia.
