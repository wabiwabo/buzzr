# Web Dashboard UX Full Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete redesign of the Buzzr web admin dashboard with enterprise-grade UI components, improved UX flows, and real-time features.

**Architecture:** Build a shared component library on top of Ant Design 5, then redesign all 8 pages + layout using those components. Add real-time notifications via existing WebSocket gateway and backend notification endpoints.

**Tech Stack:** React 18, Ant Design 5, Zustand, Recharts, Leaflet (maps), file-saver + xlsx (export), Ant Design Tour (onboarding), Socket.IO client (real-time)

**Design Doc:** `docs/plans/2026-03-08-web-ux-full-redesign-design.md`

**Enterprise-Grade 2026 Patterns:**
- Skeleton loading (no spinners)
- Subtle glass-morphism on cards (backdrop-filter)
- Smooth transitions (CSS transitions on all interactive elements)
- Micro-interactions (hover states, active states, focus rings)
- Consistent 8px spacing grid
- CSS custom properties for theming

---

## Phase Overview

| Phase | File | Tasks | Focus |
|-------|------|-------|-------|
| 1 | `phase-1-foundation.md` | 1-4 | Theme, dependencies, common components |
| 2 | `phase-2-data-components.md` | 5-8 | SmartTable, FilterPanel, DetailDrawer, hooks |
| 3 | `phase-3-layout.md` | 9-11 | Sidebar, header, breadcrumb |
| 4 | `phase-4-dashboard.md` | 12-15 | Dashboard command center |
| 5 | `phase-5-pages.md` | 16-21 | TPS, Fleet, Schedule, Complaint, Payment, User, Report pages |
| 6 | `phase-6-features.md` | 22-25 | Notifications, onboarding, keyboard shortcuts |
| 7 | `phase-7-backend.md` | 26-27 | Activity feed + dashboard comparison endpoints |

Each phase can be executed independently after Phase 1. Phases 2-3 should complete before Phase 5.

---

## Dependency Installation (run first)

```bash
cd /opt/buzzr
pnpm add --filter=@buzzr/web react-leaflet leaflet @types/leaflet file-saver @types/file-saver xlsx socket.io-client
```

## File Structure (final state)

```
apps/web/src/
├── components/
│   ├── common/
│   │   ├── PageHeader.tsx
│   │   ├── StatCard.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── InfoTooltip.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ConfirmAction.tsx
│   │   └── index.ts
│   ├── data/
│   │   ├── SmartTable.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── DetailDrawer.tsx
│   │   └── index.ts
│   ├── feedback/
│   │   ├── ActivityFeed.tsx
│   │   ├── OnboardingTour.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── KeyboardShortcuts.tsx
│   │   └── index.ts
│   ├── map/
│   │   ├── MapView.tsx
│   │   └── index.ts
│   └── layout/
│       ├── AppSidebar.tsx
│       ├── AppHeader.tsx
│       ├── GlobalSearch.tsx
│       └── index.ts
├── hooks/
│   ├── useTableState.ts
│   ├── useExport.ts
│   ├── useOnboarding.ts
│   ├── useKeyboardShortcut.ts
│   └── useSocket.ts
├── stores/
│   ├── auth.store.ts (existing)
│   └── notification.store.ts
├── theme/
│   ├── config.ts
│   └── styles.css
├── layouts/
│   └── DashboardLayout.tsx (rewrite)
├── pages/ (all rewritten)
├── services/
│   ├── api.ts (existing)
│   └── socket.ts
├── App.tsx (updated routes)
└── main.tsx (updated theme)
```

---

## Execution Order

```
Phase 7 (Backend) ──────────────────────────────┐
                                                  │
Phase 1 (Foundation) ──→ Phase 2 (Data) ──┐      ├──→ Integration Test
                                           │      │
Phase 1 (Foundation) ──→ Phase 3 (Layout) ─┤      │
                                           │      │
                                           ├──→ Phase 5 (Pages) ──→ Phase 6 (Features) ──┘
                                           │
                                           └──→ Phase 4 (Dashboard) ─────────────────────┘
```

**Parallelization:**
- Phase 7 (backend) is fully independent — run it in parallel with everything
- Phase 2 + Phase 3 can run in parallel (both depend only on Phase 1)
- Phase 4 + Phase 5 can start after Phase 2 + 3
- Phase 6 is last (depends on layout being complete)

## Task Summary (27 tasks)

| # | Task | Phase | Est. New Files | Est. Modified Files |
|---|------|-------|----------------|---------------------|
| 1 | Install deps + theme config | 1 | 2 | 2 |
| 2 | PageHeader + InfoTooltip | 1 | 2 | 0 |
| 3 | StatCard + StatusBadge + EmptyState + ConfirmAction | 1 | 5 | 0 |
| 4 | Socket service + Notification store | 1 | 3 | 0 |
| 5 | useTableState + useExport hooks | 2 | 2 | 0 |
| 6 | SmartTable component | 2 | 1 | 0 |
| 7 | FilterPanel + DetailDrawer | 2 | 3 | 0 |
| 8 | ActivityFeed component | 2 | 2 | 0 |
| 9 | AppSidebar | 3 | 1 | 0 |
| 10 | AppHeader + GlobalSearch + NotificationBell | 3 | 4 | 0 |
| 11 | Rewrite DashboardLayout | 3 | 0 | 1 |
| 12 | MapView component | 4 | 2 | 0 |
| 13 | Dashboard redesign | 4 | 0 | 1 |
| 14-15 | (reserved for dashboard iterations) | 4 | 0 | 0 |
| 16 | TPS page redesign | 5 | 0 | 1 |
| 17 | Fleet page redesign | 5 | 0 | 1 |
| 18 | Complaint page redesign | 5 | 0 | 1 |
| 19 | Schedule + Payment + User pages | 5 | 0 | 3 |
| 20 | Report page redesign | 5 | 0 | 1 |
| 21 | Login page polish | 5 | 0 | 1 |
| 22 | Realtime toast notifications | 6 | 1 | 1 |
| 23 | Onboarding tour | 6 | 2 | 1 |
| 24 | Keyboard shortcuts | 6 | 2 | 1 |
| 25 | Final layout integration | 6 | 0 | 1 |
| 26 | Backend: activity feed endpoint | 7 | 0 | 2 |
| 27 | Backend: dashboard comparison | 7 | 0 | 2 |

**New files created:** ~30
**Files modified:** ~18
**Total components:** 13 shared + 8 pages + 1 layout = 22
