# Triage Inbox Redesign — Design Document

**Date:** 2026-03-08
**Approach:** Linear-style Triage Inbox with elements from Zendesk (SLA) and Datadog (faceted filters)

## Goal

Replace the current PageHeader → SmartTable → DetailDrawer pattern on operational pages with a keyboard-first, three-column triage layout that reduces operator fatigue and scales for 50–200+ requests per shift.

## Layout Structure

Three-column layout inside the existing DashboardLayout content area:

- **Filter sidebar** (220px, collapsible): Saved views + faceted filter checkboxes
- **Request list** (flexible): Compact rows with grouping, keyboard navigation, bulk actions
- **Preview panel** (420px, toggleable): Selected item's full details with inline actions

Responsive breakpoints:
- ≥1440px: All three columns visible
- 1280–1439px: Filter sidebar collapsed by default
- <1280px: Preview hidden, row click opens full-width SlideOver fallback

## Request List

### Row Design (40px compact)

Each row shows: checkbox, severity dot (8px), title (bold if unread), meta line (category · area · reporter), SLA countdown, assignee avatar (24px), age.

### Grouping

Rows grouped by configurable dimension (default: Status). Group headers are collapsible, show count. Options: Status, Priority, Category, Area, Assignee, None.

### Toolbar

Search (debounced 300ms), Group By dropdown, density toggle (40px/56px), refresh, keyboard shortcut hint. Active filter chips with ✕ to remove.

### Bulk Action Bar

Appears when ≥1 row checked. Shows: "[N] selected | Assign ▼ | Status ▼ | Merge | ✕ Clear". Sticky at top of list, replaces toolbar.

### Selection

- J/K keys move selection up/down
- Shift+Click for range select, Cmd+Click for toggle
- Selected row: #EFF6FF background + 3px blue left border
- Hover row: #F9FAFB background

## Preview Panel (420px)

### Sticky Header
Status dropdown (inline-editable, valid transitions only), Assign dropdown (searchable staff list), priority + category + area as compact tags.

### Body Sections (scrollable)
1. **Title & description** — full text
2. **Photos** — thumbnail grid, click to lightbox
3. **Detail** — key-value pairs (reporter, phone, address, coordinates → map link, created date, SLA remaining)
4. **Activity timeline** — vertical timeline with colored dots per event type, inline "Add note" input at end

### Sticky Footer
Context-sensitive action buttons based on current status:
- submitted → Verify, Reject
- verified → Assign
- assigned → Start
- in_progress → Resolve, Reject
- resolved/rejected → Reopen

Secondary actions in ··· overflow: Link, Print, Export.

### Toggle
Space key toggles panel. Slides in from right (200ms). Content crossfades on selection change (150ms). Respects prefers-reduced-motion.

## Keyboard Navigation

### Navigation
| Key | Action |
|-----|--------|
| J/K | Move selection down/up |
| Space | Toggle preview panel |
| Enter | Open full-detail SlideOver |
| Escape | Close panel / deselect |
| / | Focus search |
| ? | Shortcut cheat sheet |

### Actions (selected item)
| Key | Action |
|-----|--------|
| A | Open assign dropdown |
| S | Open status transition dropdown |
| R | Resolve |
| X | Reject (press twice to confirm) |
| N | Focus note input |
| P | Cycle priority |

### Bulk (when rows checked)
| Key | Action |
|-----|--------|
| Shift+A | Bulk assign |
| Shift+S | Bulk status change |
| Shift+X | Clear selection |

### Go-to (retained)
G D → Dashboard, G T → TPS, G C → Complaints, G F → Fleet

Shortcuts disabled when any input/dropdown/modal is focused. Destructive actions require double-press confirmation (1.5s timeout).

## Filter Sidebar

### Saved Views (top)
Named filter sets with live counts. Defaults per role:
- dlh_admin: Triage Saya, SLA Kritis, Belum Ditugaskan, Semua Terbuka, Selesai Hari Ini
- tps_operator: Tugas Saya, Dalam Proses, Selesai
- driver: Rute Hari Ini, Pending Pickup

Custom views creatable by user. Stored in localStorage (API-backed later).

### Faceted Filters (below views)
Dimensions: Status, Priority, Category, Area, Assignee. Each shows checkbox list with counts. Counts cross-filter (selecting a status updates counts on other facets). Facets with >5 values show top 5 + expandable link. Area and Assignee include mini search when expanded.

### Sidebar toggle
`[` key toggles visibility. Collapsed state in localStorage. Badge shows active filter count when collapsed.

### URL sync
Filter state serialized to query params: `?status=assigned,in_progress&priority=p1&area=kebon-jeruk`. Back/forward navigates filter history.

## Status & SLA Visualization

### SLA Countdown (4 phases)
| Phase | Condition | Color | Behavior |
|-------|-----------|-------|----------|
| Normal | >4h remaining | Blue #3B82F6 | Static |
| Warning | 1–4h remaining | Amber #F59E0B | Static |
| Critical | <1h remaining | Red #EF4444 | Pulse animation |
| Breached | Past deadline | Red #EF4444 | Solid, negative time |

Updates every 60s client-side. Breached items auto-sort to top within group.

### Severity (auto-calculated)
- Critical (red): SLA breached OR P1
- Warning (amber): SLA <2h OR P2
- Info (blue): Everything else

### Status Lifecycle Stepper
Horizontal stepper in preview header: filled circles (completed) → ring (current) → empty circles (future). Clicking a valid future state triggers transition.

### Priority Badges
P1: red bg/white text. P2: amber bg/dark text. P3: gray bg/dark text. P4: text only. P1/P2 visually loud, P3/P4 fade.

### Unread Indicators
Bold title text + 6px blue dot. New items (<1h) show blue tint that fades over 3s.

## Command Palette (Cmd+K)

560px wide centered overlay. Empty state shows: Recent (5 items), Quick Actions, Navigation. Typing filters all sections with fuzzy matching. Arrow keys navigate, Enter executes, Escape closes.

Search scope: Requests (title, reporter, address, ID), People (name, phone), TPS (name, code, area), Vehicles (plate, type), Actions (assign, resolve, export), Pages.

Contextual chaining: search → action → target without leaving the palette. Client-side index, no API calls per keystroke.

## Page Mapping

| Page | Layout | Rationale |
|------|--------|-----------|
| Complaints | Full triage (sidebar + list + preview) | Highest volume |
| TPS | List + preview + filter sidebar | Many items, useful facets |
| Schedules | List + preview | Fewer items, date grouping sufficient |
| Payments | List + preview | Tab filtering sufficient |
| Fleet | List + preview | Small dataset |
| Users | Current SmartTable | CRUD-focused, not triage |
| Dashboard | Current role-based | KPI overview |
| Reports | Current charts | Read-only |
| Analytics | Current charts | Read-only |
| Live Operations | Current placeholder | Future map view |

## Component Architecture

### New Components
```
components/triage/
  TriageLayout.tsx        — orchestrator: sidebar + list + preview
  TriageList.tsx           — list with grouping, selection, keyboard nav
  TriageListRow.tsx        — single row rendering
  TriagePreview.tsx        — right panel with sections
  TriageToolbar.tsx        — search, group-by, density, filter chips
  TriageBulkBar.tsx        — sticky bar for bulk actions
  FilterSidebar.tsx        — views + faceted checkboxes
  FacetGroup.tsx           — single facet dimension
  SavedViewList.tsx        — view list with counts
  StatusStepper.tsx        — horizontal lifecycle visualization
  SlaCountdown.tsx         — timer with color phases
  CommandPalette.tsx       — Cmd+K overlay
```

### New Hooks
```
hooks/
  useTriageKeyboard.ts     — J/K/Space/Enter/A/S/R/X handlers
  useTriageSelection.ts    — selected item, multi-select, shift-range
  useFacetedFilter.ts      — cross-filtering with counts, URL sync
  useSavedViews.ts         — localStorage CRUD for views
  useSlaTimer.ts           — 60s interval, phase calculation
  useCommandPalette.ts     — open/close, search index, fuzzy match
```

### State Management
No new Zustand store. Filter state in URL params, selection state ephemeral in hooks, saved views in localStorage, data fetching via existing api.get() + useState/useEffect.

### Reused Components
StatusBadge, SlideOver, PageTransition, EmptyState, QuickAction, InfoTooltip.

## Interaction Details

### Loading
- Initial: 8 skeleton rows + skeleton preview
- Filter change: list fades to 50% opacity (no skeleton, data visible)
- Preview switch: 150ms crossfade
- Infinite scroll: 50 items initial, next 50 at scroll bottom

### Optimistic Updates
Status/assign changes update UI immediately, revert on API failure with toast.

### Real-time
New requests slide in at top with blue tint fade. Don't steal focus during triage. Badge counts update. Other operators' changes reflected silently; yellow banner in preview if currently-viewed item changed.

### Conflict Handling
Assign conflict: toast warning with Confirm/Cancel. Stale view: resolved-by-other banner with updated state.

### Accessibility
- All keyboard shortcuts have mouse equivalents
- role="row" with aria-selected, aria-live="polite" on preview
- SLA color always paired with text
- Focus trap in CommandPalette
- Severity dots have aria-label
- Reduced motion: instant show/hide replaces animations

### Error Recovery
- Fetch failure: inline banner with retry, previous data stays
- WebSocket disconnect: amber dot in toolbar, auto-reconnect
- Stale data: banner after 5 minutes with refresh link

## Migration Strategy

### Phase 1: Core Infrastructure
TriageLayout, TriageList, TriagePreview, keyboard hooks, SlaCountdown, StatusStepper. Test with mock data.

### Phase 2: Complaints Migration
Replace ComplaintPage with ComplaintTriagePage. Highest value, most volume.

### Phase 3: Filter Sidebar + Saved Views
FilterSidebar, FacetGroup, useFacetedFilter, useSavedViews. Wire into Complaints.

### Phase 4: Command Palette
CommandPalette as global component in DashboardLayout. Works across all pages.

### Phase 5: Remaining Pages
TPS → Schedules → Payments → Fleet. Each is a config object + page component.

### What Stays Unchanged
DashboardLayout, AppSidebar, AppHeader, Dashboard, Reports, Analytics, Users, Live Operations, SmartTable (for non-triage pages), all chart components, API layer (no backend changes needed).
