# Enterprise UX Redesign — Design Document

**Date:** 2026-03-08
**Status:** Approved
**Goal:** Transform Buzzr from a functional admin panel into an enterprise-grade SaaS product inspired by Stripe, Linear, and Vercel. Dual-persona design serving executives (insight-driven) and operations staff (task-driven).

---

## 1. Information Architecture

Three-tier hierarchy: Context → Domain → Detail.

```
COMMAND CENTER (Executive Layer)
├── Dashboard (role-aware: executive summary vs operational view)
├── Live Operations (real-time map + active routes + alerts)
└── Analytics Hub (interactive reports, exportable)

OPERATIONS (Staff Layer)
├── TPS Management (list + map + detail panel)
├── Collection
│   ├── Schedules (calendar + list toggle)
│   ├── Routes (map-based)
│   └── Transfers (manifest tracking)
├── Fleet & Drivers (vehicles + driver profiles)
└── Complaints (kanban + table toggle, SLA-driven sorting)

FINANCE
├── Billing & Retribution
├── Waste Bank Transactions
└── Payouts

ADMINISTRATION
├── Users & Roles
├── Areas & Zones
├── Settings (super_admin)
└── Audit Log
```

Key changes: Live Operations is new (separates real-time from dashboard). Collection groups schedules + routes + transfers. Finance splits into contextual views. Detail panels use slide-overs instead of page navigations.

---

## 2. Sidebar Navigation

Light sidebar (240px expanded, 64px collapsed). Search bar inline in sidebar (Linear-style). User card at bottom with role and quick actions. Tenant name displayed below logo for multi-tenant context.

### Structure

- Logo + Tenant name
- Inline search bar (with `/` hint)
- Dashboard, Live Operations, Analytics
- OPERASIONAL: TPS, Pengangkutan (expandable: Jadwal, Rute, Transfer), Armada & Driver, Laporan Warga (with badge count)
- KEUANGAN: Retribusi, Bank Sampah, Pencairan
- ADMINISTRASI: Pengguna, Wilayah, Audit Log
- User card at bottom (avatar, name, role, settings/notifications/collapse)

### Role-Based Visibility

- super_admin: All items + Tenant switcher + Pengaturan
- dlh_admin: All except Tenant/Pengaturan
- tps_operator: Dashboard, TPS Saya, Catat Sampah, Jadwal Masuk
- driver: Dashboard, Jadwal Hari Ini, Riwayat Transfer, Kendaraan Saya
- sweeper: Dashboard, area/complaint views

Badges on menu items update in real-time via WebSocket (pending complaints, overdue payments).

---

## 3. Dashboard Layout

### Executive View (dlh_admin, super_admin)

Row 1: 4 KPI StatCards with sparkline trends and week-over-week comparison (Volume, Active Drivers, Collection Rate, Pending Complaints). Each clickable to drill down.

Row 2 (60/40 split): Waste Volume Trend (stacked area chart, toggleable Harian/Mingguan/Bulanan, interactive with drill-down) + Perlu Perhatian queue (severity-sorted: red/orange/blue dots, clickable items for TPS full, SLA-expiring complaints, overdue payments).

Row 3 (60/40 split): Collection Rate by Area (horizontal bar chart with 85% target line, sorted descending) + Driver Performance leaderboard (top 5 with inline progress bars, clickable to profile).

No map on executive dashboard — map lives in Live Operations.

### Operational View (tps_operator, driver, sweeper)

Task-oriented layout showing "what do I need to do today." 3 compact KPIs (routes/TPS/complaints for today). Timeline layout for today's schedules with status indicators. Assigned complaints with inline action buttons.

---

## 4. Data Visualization Strategy

### Semantic Color Palette (consistent everywhere)

- Organik: #22C55E (green-500)
- Anorganik: #3B82F6 (blue-500)
- B3: #EF4444 (red-500)
- Daur Ulang: #F59E0B (amber-500)
- Status: Positive #22C55E, Neutral #6B7280, Negative #EF4444, Warning #F59E0B, Info #3B82F6

### Chart Types

1. **KPI Sparkline** — 7-day mini trend inside StatCard. Hover for daily tooltip, click to navigate.
2. **Stacked Area Chart** — Waste volume trends. Crosshair tooltip, brush selection for zoom, legend toggle, period selector.
3. **Horizontal Bar Chart** — Rankings (area collection rate, driver performance). Reference/target lines. Click bar to navigate.
4. **Donut Chart** — Status distributions (complaints, payments). Center label shows total. Click segment filters adjacent table.
5. **Progress Ring** — Single metric gauges (collection rate, SLA compliance, TPS capacity). Animated fill, color shifts green→amber→red.

### Analytics Hub

Scrollable page (not tabs) with linked charts. Global date range + area filter affects all charts. Compare toggle overlays previous period as dashed line. Sections: Volume & Koleksi, Keluhan & SLA, Keuangan, Performa Tim. Export as CSV/Excel/PDF.

---

## 5. Smart Form Flow

### Three Patterns

**Pattern A: Quick Actions (1-2 fields)** — Popover inline on the row. Used for: assign complaint, change status, assign driver.

**Pattern B: Standard Create (3-6 fields)** — Slide-over panel from right, single step. Visual selectors instead of dropdowns where possible. Smart defaults based on context. Searchable select with avatars for entity references. Used for: add vehicle, add TPS, add user.

**Pattern C: Multi-Step Wizard (7+ fields)** — Slide-over with step indicator. Progressive disclosure (fields appear based on previous selections). Review/confirmation step before submit with contextual warnings (non-blocking). Used for: create schedule, complex user creation.

### Error Prevention

- Inline validation on blur with helpful messages (not just "invalid")
- Soft warnings for unusual values ("Kapasitas biasanya 5-50 ton. Yakin 150 ton?")
- Stripe-style type-to-confirm for destructive actions
- Field-level tooltips explaining purpose
- Dismissible tips on first encounter with complex features

### Contextual Help

- Field-level info tooltips
- Section-level dismissible tips (shown once)
- Smart empty states with educational content and multiple CTAs (manual add + Excel import)

---

## 6. Role-Based User Experience

### Role Matrix

| Role | Dashboard | Primary Actions |
|------|-----------|----------------|
| super_admin | Executive + tenant switcher | Manage tenants, system settings, cross-tenant analytics |
| dlh_admin | Executive (full KPIs, trends) | Assign complaints, create schedules, manage users, reports |
| tps_operator | Task-oriented (my TPS, today's intake) | Record waste in/out, update TPS status |
| driver | Task-oriented (today's routes) | Start/complete routes, record checkpoints, GPS |
| sweeper | Task-oriented (assigned area) | Update complaint status, record waste |
| tpst_operator | Task-oriented (incoming transfers) | Verify manifests, confirm transfers |

### Implementation

Single DashboardPage with conditional rendering based on role. `usePermission` hook for UI element visibility and API call guarding. Permission map derived from role. Role-aware table actions — same data, different available actions per role. Super admin gets tenant switcher dropdown in sidebar.

---

## 7. Guided Onboarding

### Three Layers

**Layer 1: Welcome Flow (first login only)** — Full-screen sequence: welcome → preferences (notification settings, dashboard mode) → quick start cards. Role-adaptive (operational roles get simpler 2-step flow). Skippable.

**Layer 2: Feature Discovery (progressive)** — Checklist widget in sidebar footer. Role-specific items (dlh_admin: 6 items, driver: 5 items, tps_operator: 4 items). Tracks completion via localStorage. Dismissible. Items link to relevant pages with action hints.

**Layer 3: Contextual Help (always available)** — Educational empty states with multiple CTAs. First-encounter tooltips (shown once, dismissible). `?` keyboard shortcut opens command-palette-style help with shortcuts, guides, and links.

---

## 8. Microinteraction and Animation System

### Design Tokens

```css
--duration-instant: 100ms;  /* Hover, toggles */
--duration-fast:    150ms;  /* Buttons, chips */
--duration-normal:  250ms;  /* Panels, drawers */
--duration-slow:    400ms;  /* Page transitions, charts */

--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
--ease-in:     cubic-bezier(0.4, 0, 1, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Categories

1. **Navigation transitions** — Content area fade+slide (200ms). Sidebar and header stay static.
2. **Slide-over panels** — Panel slides from right (250ms). Content inside staggers in (title → fields → buttons, 50ms intervals).
3. **Data loading** — Skeleton shimmer matching exact content layout. Rows stagger in on load (30ms per row).
4. **Chart animations** — Area draws left-to-right (600ms). Bars grow from bottom (staggered 50ms). Donut sweeps clockwise. Numbers count up. Live updates morph smoothly.
5. **Feedback** — Toast enters from right with timer bar. Button shows loading→success flow (spinner → checkmark → green flash). New table rows highlight yellow (1s fade). Badge bounces on count change (spring easing).
6. **Status transitions** — Badge color cross-fades (150ms). Progress bars animate width and color smoothly.

### Implementation

CSS custom properties for tokens. CSS transitions for simple states. Recharts built-in animation for charts. `framer-motion` only for complex orchestrated sequences (stagger, panel cascade). `prefers-reduced-motion` media query disables all animation.

---

## Technical Notes

- **Design system built on Ant Design 5** with heavy token customization
- **Light theme** — no dark mode in v1 (can add later via Ant Design token switching)
- **framer-motion** added as single animation dependency
- **Recharts** continues as chart library with enhanced interaction handlers
- **react-leaflet v4** continues for map (Live Operations page)
- **All text in Indonesian** (Bahasa Indonesia)
- **Responsive**: Desktop-first, collapses gracefully to tablet. Mobile defers to React Native app.
