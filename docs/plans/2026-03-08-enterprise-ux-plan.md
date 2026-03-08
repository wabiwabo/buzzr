# Enterprise UX Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Buzzr from a functional admin panel into an enterprise-grade SaaS product with role-aware dashboards, smart forms, interactive charts, guided onboarding, and purposeful animations.

**Architecture:** Incremental refactor of existing Ant Design 5 + React 18 app. No framework changes. New components extend the existing library. Role-based rendering via `usePermission` hook. `framer-motion` added for orchestrated animations. Existing Recharts enhanced with interaction handlers.

**Tech Stack:** React 18, Ant Design 5, Recharts, framer-motion (new), react-leaflet 4, Zustand, Socket.IO client, Vite

**Design Reference:** `docs/plans/2026-03-08-enterprise-ux-redesign-design.md`

---

## Phase Overview

| Phase | Tasks | Focus |
|-------|-------|-------|
| 1 | 1-5 | Design System Foundation |
| 2 | 6-10 | Core Components |
| 3 | 11-15 | Sidebar & Navigation |
| 4 | 16-21 | Dashboard Redesign |
| 5 | 22-26 | Smart Forms |
| 6 | 27-31 | Data Visualization & Analytics |
| 7 | 32-35 | Onboarding System |
| 8 | 36-40 | Page Enhancements |
| 9 | 41-44 | Animation & Polish |

**Total: 44 tasks across 9 phases**

---

## Phase Details

- [Phase 1: Design System Foundation](./phase-1-design-system.md) — Theme tokens, animation CSS, color palette, typography
- [Phase 2: Core Components](./phase-2-core-components.md) — usePermission, SlideOver, enhanced StatCard, ProgressRing, CountUp
- [Phase 3: Sidebar & Navigation](./phase-3-sidebar-navigation.md) — Light sidebar, role-based menu, tenant switcher, search relocation
- [Phase 4: Dashboard Redesign](./phase-4-dashboard-redesign.md) — Executive view, operational view, sparklines, attention queue
- [Phase 5: Smart Forms](./phase-5-smart-forms.md) — Quick action popover, standard slide-over form, multi-step wizard
- [Phase 6: Data Visualization & Analytics](./phase-6-data-visualization.md) — Enhanced charts, Analytics Hub page, chart interactions
- [Phase 7: Onboarding System](./phase-7-onboarding.md) — Welcome flow, progressive checklist, contextual help
- [Phase 8: Page Enhancements](./phase-8-page-enhancements.md) — Live Operations, complaints kanban, updated forms
- [Phase 9: Animation & Polish](./phase-9-animation-polish.md) — Page transitions, chart animations, microinteractions, reduced motion

---

## Execution Notes

- Each phase builds on the previous. Phases 1-3 are foundational and must run sequentially.
- Phases 4-8 can be parallelized after Phase 3 is complete.
- Phase 9 is final polish and depends on all other phases.
- Verify build after each phase: `pnpm run build --filter=@buzzr/web`
- Backend has no changes in this plan — all endpoints already exist.
