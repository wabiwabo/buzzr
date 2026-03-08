# Triage Inbox Redesign — Design Document

**Date:** 2026-03-08
**Approach:** Linear-style Triage Inbox with elements from Zendesk (SLA) and Datadog (faceted filters)
**UI System:** shadcn/ui + Tailwind CSS v4 (full Ant Design replacement)
**Typography:** IBM Plex Mono (monospace command center aesthetic)
**Icons:** Lucide React

## Goal

Replace the current PageHeader → SmartTable → DetailDrawer pattern on operational pages with a keyboard-first, three-column triage layout that reduces operator fatigue and scales for 50–200+ requests per shift. Simultaneously migrate the entire UI system from Ant Design to shadcn/ui + Tailwind CSS v4.

## UI System Migration

### Stack Change

| Layer | Current | New |
|-------|---------|-----|
| Component library | Ant Design 5 | shadcn/ui (copy-paste, full ownership) |
| Styling | Ant Design CSS-in-JS + custom CSS | Tailwind CSS v4 |
| Typography | Inter (Google Fonts) | IBM Plex Mono |
| Icons | @ant-design/icons (36 icons used) | Lucide React |
| Forms | Ant Design Form | react-hook-form + zod |
| Tables | Ant Design Table (via SmartTable) | TanStack Table + shadcn DataTable |
| Toasts | Ant Design message/notification | Sonner |
| Layout grid | Ant Design Row/Col | Tailwind flex/grid |

### Component Migration Map

| Ant Design (38 components) | shadcn/ui equivalent |
|---|---|
| Button | `Button` (variants via className) |
| Card | `Card` |
| Typography (Text/Title) | Native HTML + Tailwind utilities |
| Space | Tailwind `flex gap-*` |
| Tag | `Badge` |
| Row/Col | Tailwind `grid` / `flex` |
| Table | `DataTable` (TanStack Table) |
| Form | `Form` (react-hook-form + zod) |
| Input | `Input` |
| InputNumber | `Input type="number"` |
| Select | `Select` / `Combobox` |
| DatePicker | `DatePicker` (react-day-picker) |
| Tabs | `Tabs` |
| Dropdown | `DropdownMenu` |
| Drawer | `Sheet` (slide from any edge) |
| Popover | `Popover` |
| Popconfirm | `AlertDialog` |
| Tooltip | `Tooltip` |
| Dialog/Modal | `Dialog` |
| Menu | Custom sidebar component |
| Layout (Sider/Header) | Custom Tailwind layout |
| Breadcrumb | `Breadcrumb` |
| Avatar | `Avatar` |
| Badge | `Badge` |
| Progress | `Progress` |
| Statistic | Custom `StatCard` |
| Steps | Custom `Stepper` |
| Timeline | Custom component |
| Descriptions | `dl/dt/dd` + Tailwind |
| Empty | `Empty` |
| Spin | `Skeleton` / spinner |
| Segmented | `ToggleGroup` |
| Tour | Custom lightweight tour |
| Checkbox | `Checkbox` |
| ConfigProvider | CSS variables + Tailwind theme |
| Message/Notification | Sonner toast |
| List | Native HTML + Tailwind |
| Spin | `Skeleton` |

### Typography: IBM Plex Mono

```
Primary font:     IBM Plex Mono 400/500/600/700
Fallback:         ui-monospace, SFMono-Regular, monospace
```

Type scale:

| Token | Size | Usage |
|-------|------|-------|
| `text-xs` | 11px | Meta text, timestamps, facet counts |
| `text-sm` | 13px | List row content, form labels |
| `text-base` | 14px | Body text, descriptions |
| `text-lg` | 16px | Section headers, card titles |
| `text-xl` | 20px | Page titles |
| `text-2xl` | 24px | StatCard values, dashboard KPIs |

Monospace rationale: data aligns in tables/lists, SLA countdowns and IDs line up, gives operator console feel, IBM Plex Mono is highly legible at small sizes (critical for 40px dense rows).

### Tailwind CSS v4 Theme

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

@theme {
  --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;

  /* Primary */
  --color-primary: #2563EB;
  --color-primary-foreground: #FFFFFF;

  /* Semantic */
  --color-positive: #22C55E;
  --color-warning: #F59E0B;
  --color-negative: #EF4444;
  --color-info: #3B82F6;
  --color-neutral: #6B7280;

  /* Waste categories */
  --color-organic: #22C55E;
  --color-inorganic: #3B82F6;
  --color-b3: #EF4444;
  --color-recyclable: #F59E0B;

  /* SLA phases */
  --color-sla-normal: #3B82F6;
  --color-sla-warning: #F59E0B;
  --color-sla-critical: #EF4444;
  --color-sla-breached: #EF4444;

  /* Severity */
  --color-severity-critical: #EF4444;
  --color-severity-warning: #F59E0B;
  --color-severity-info: #3B82F6;

  /* Layout */
  --sidebar-width: 240px;
  --sidebar-collapsed: 64px;
  --header-height: 56px;
  --filter-sidebar-width: 220px;
  --preview-panel-width: 420px;

  /* Surfaces */
  --color-surface: #FFFFFF;
  --color-surface-hover: #F9FAFB;
  --color-surface-selected: #EFF6FF;
  --color-surface-muted: #F3F4F6;
  --color-border: #E5E7EB;
  --color-border-light: #F3F4F6;
}
```

Dark mode ready via token structure (not in scope, but supported).

## Layout Structure

Three-column layout inside the existing DashboardLayout content area:

- **Filter sidebar** (220px, collapsible): Saved views + faceted filter checkboxes
- **Request list** (flexible): Compact rows with grouping, keyboard navigation, bulk actions
- **Preview panel** (420px, toggleable): Selected item's full details with inline actions

Responsive breakpoints:
- ≥1440px: All three columns visible
- 1280–1439px: Filter sidebar collapsed by default
- <1280px: Preview hidden, row click opens full-width Sheet fallback

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
- Selected row: surface-selected background + 3px primary left border
- Hover row: surface-hover background

## Preview Panel (420px)

### Sticky Header
Status dropdown (inline-editable, valid transitions only), Assign dropdown (searchable staff list via Combobox), priority + category + area as compact Badge tags.

### Body Sections (scrollable)
1. **Title & description** — full text
2. **Photos** — thumbnail grid, click to lightbox
3. **Detail** — key-value pairs via dl/dt/dd (reporter, phone, address, coordinates → map link, created date, SLA remaining)
4. **Activity timeline** — custom vertical timeline with colored dots per event type, inline "Add note" input at end

### Sticky Footer
Context-sensitive action buttons (shadcn Button variants) based on current status:
- submitted → Verify, Reject
- verified → Assign
- assigned → Start
- in_progress → Resolve, Reject
- resolved/rejected → Reopen

Secondary actions in DropdownMenu: Link, Print, Export.

### Toggle
Space key toggles panel. Slides in from right (200ms). Content crossfades on selection change (150ms). Respects prefers-reduced-motion.

## Keyboard Navigation

### Navigation
| Key | Action |
|-----|--------|
| J/K | Move selection down/up |
| Space | Toggle preview panel |
| Enter | Open full-detail Sheet |
| Escape | Close panel / deselect |
| / | Focus search |
| ? | Shortcut cheat sheet |

### Actions (selected item)
| Key | Action |
|-----|--------|
| A | Open assign Combobox |
| S | Open status transition DropdownMenu |
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

Shortcuts disabled when any input/dropdown/Dialog is focused. Destructive actions require double-press confirmation (1.5s timeout).

## Filter Sidebar

### Saved Views (top)
Named filter sets with live counts. Defaults per role:
- dlh_admin: Triage Saya, SLA Kritis, Belum Ditugaskan, Semua Terbuka, Selesai Hari Ini
- tps_operator: Tugas Saya, Dalam Proses, Selesai
- driver: Rute Hari Ini, Pending Pickup

Custom views creatable by user. Stored in localStorage (API-backed later).

### Faceted Filters (below views)
Dimensions: Status, Priority, Category, Area, Assignee. Each shows Checkbox list with counts. Counts cross-filter (selecting a status updates counts on other facets). Facets with >5 values show top 5 + expandable link. Area and Assignee include mini search (Input) when expanded.

### Sidebar toggle
`[` key toggles visibility. Collapsed state in localStorage. Badge shows active filter count when collapsed.

### URL sync
Filter state serialized to query params: `?status=assigned,in_progress&priority=p1&area=kebon-jeruk`. Back/forward navigates filter history.

## Status & SLA Visualization

### SLA Countdown (4 phases)
| Phase | Condition | Color | Behavior |
|-------|-----------|-------|----------|
| Normal | >4h remaining | sla-normal (#3B82F6) | Static |
| Warning | 1–4h remaining | sla-warning (#F59E0B) | Static |
| Critical | <1h remaining | sla-critical (#EF4444) | Pulse animation |
| Breached | Past deadline | sla-breached (#EF4444) | Solid, negative time |

Updates every 60s client-side. Breached items auto-sort to top within group.

### Severity (auto-calculated)
- Critical (red): SLA breached OR P1
- Warning (amber): SLA <2h OR P2
- Info (blue): Everything else

### Status Lifecycle Stepper
Horizontal stepper in preview header: filled circles (completed) → ring (current) → empty circles (future). Clicking a valid future state triggers transition with AlertDialog confirmation.

### Priority Badges
P1: negative bg/white text. P2: warning bg/dark text. P3: muted bg/dark text. P4: text only. P1/P2 visually loud, P3/P4 fade.

### Unread Indicators
Bold title text (font-semibold) + 6px info dot. New items (<1h) show surface-selected tint that fades over 3s.

## Command Palette (Cmd+K)

Built with shadcn `Command` component (uses cmdk library). 560px wide centered Dialog. Empty state shows: Recent (5 items), Quick Actions, Navigation. Typing filters all sections with fuzzy matching. Arrow keys navigate, Enter executes, Escape closes.

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
| Users | Migrated to shadcn DataTable | CRUD-focused, not triage |
| Dashboard | Migrated to shadcn components | KPI overview |
| Reports | Migrated to shadcn + Recharts | Read-only analytics |
| Analytics | Migrated to shadcn + Recharts | Read-only analytics |
| Live Operations | Migrated to shadcn | Future map view |

All pages migrated to shadcn/ui. Triage layout for operational pages, shadcn DataTable/Card/etc for non-triage pages.

## Component Architecture

### New Triage Components
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
  CommandPalette.tsx       — Cmd+K overlay (shadcn Command)
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

### shadcn/ui Base Components (installed via CLI)
```
components/ui/
  button.tsx, card.tsx, badge.tsx, input.tsx, select.tsx,
  checkbox.tsx, dialog.tsx, sheet.tsx, dropdown-menu.tsx,
  popover.tsx, tooltip.tsx, alert-dialog.tsx, tabs.tsx,
  avatar.tsx, progress.tsx, breadcrumb.tsx, command.tsx,
  toggle-group.tsx, skeleton.tsx, separator.tsx, scroll-area.tsx,
  data-table.tsx (TanStack Table wrapper)
```

### Migrated Common Components
```
components/common/
  PageHeader.tsx           — rebuilt with Tailwind + Breadcrumb
  StatCard.tsx             — rebuilt with Card + custom stat layout
  StatusBadge.tsx          — rebuilt with Badge + semantic colors
  SlideOver.tsx            — replaced by Sheet
  EmptyState.tsx           — rebuilt with Tailwind
  PageTransition.tsx       — kept (framer-motion, no AntD dependency)
  VisualSelector.tsx       — rebuilt with Tailwind
  StepWizard.tsx           — rebuilt with custom Stepper
  QuickAction.tsx          — rebuilt with Popover
  InfoTooltip.tsx          — rebuilt with Tooltip
  ProgressRing.tsx         — kept (SVG, no AntD dependency)
  ConfirmAction.tsx        — replaced by AlertDialog
```

### State Management
No new Zustand store. Filter state in URL params, selection state ephemeral in hooks, saved views in localStorage, data fetching via existing api.get() + useState/useEffect. Forms via react-hook-form + zod.

## Interaction Details

### Loading
- Initial: 8 Skeleton rows + skeleton preview
- Filter change: list fades to 50% opacity (no skeleton, data visible)
- Preview switch: 150ms crossfade
- Infinite scroll: 50 items initial, next 50 at scroll bottom

### Optimistic Updates
Status/assign changes update UI immediately, revert on API failure with Sonner toast.

### Real-time
New requests slide in at top with surface-selected tint fade. Don't steal focus during triage. Badge counts update. Other operators' changes reflected silently; warning banner in preview if currently-viewed item changed.

### Conflict Handling
Assign conflict: Sonner toast warning with Confirm/Cancel. Stale view: resolved-by-other banner with updated state.

### Accessibility
- All keyboard shortcuts have mouse equivalents
- role="row" with aria-selected, aria-live="polite" on preview
- SLA color always paired with text (monospace makes alignment natural)
- Focus trap in Command palette
- Severity dots have aria-label
- Reduced motion: instant show/hide replaces animations

### Error Recovery
- Fetch failure: inline banner with retry Button, previous data stays
- WebSocket disconnect: amber dot in toolbar with Tooltip, auto-reconnect
- Stale data: banner after 5 minutes with refresh link

## Migration Phases

### Phase 1: Foundation
Install shadcn/ui + Tailwind CSS v4 + IBM Plex Mono. Configure theme tokens. Install all shadcn base components. Set up react-hook-form + zod.

### Phase 2: Core Triage Components
Build TriageLayout, TriageList, TriagePreview, keyboard hooks, SlaCountdown, StatusStepper. Test with mock data.

### Phase 3: Complaints Triage Page
Replace ComplaintPage with ComplaintTriagePage using triage layout. First page fully on shadcn/ui.

### Phase 4: Filter Sidebar + Saved Views
Build FilterSidebar, FacetGroup, useFacetedFilter, useSavedViews. Wire into Complaints.

### Phase 5: Command Palette
Build CommandPalette (shadcn Command) as global component in DashboardLayout.

### Phase 6: Remaining Triage Pages
Migrate TPS → Schedules → Payments → Fleet to triage layout. Each is a config object + page component.

### Phase 7: Non-Triage Page Migration
Migrate Dashboard, Users, Reports, Analytics, Live Operations from Ant Design to shadcn/ui components.

### Phase 8: Layout Migration
Migrate DashboardLayout, AppSidebar, AppHeader from Ant Design Layout/Menu to custom Tailwind components.

### Phase 9: Cleanup
Remove antd and @ant-design/icons dependencies. Remove old CSS (styles.css Ant overrides). Verify bundle size reduction.

### What Stays Unchanged
- API layer (no backend changes)
- Recharts (chart library, independent of component system)
- framer-motion (animation library, independent)
- Zustand auth store
- React Router routing structure
- Axios API service layer
