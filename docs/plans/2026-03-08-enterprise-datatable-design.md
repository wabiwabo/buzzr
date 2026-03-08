# Enterprise DataTable — Design Document

Date: 2026-03-08

## Overview

Replace SmartTable and TriageLayout with a single composable DataTable system built on TanStack Table. Supports server-side pagination, virtualized rows, keyboard navigation, inline + panel filters, split/drawer preview, and responsive column priority.

## Architecture: Composable (Approach B)

Modular system of components and hooks that can be composed per page:

- **Simple pages** (ReportPage): `DataTable` only
- **Detail pages** (UserPage): `DataTable` + `DataTablePreview` (drawer mode)
- **Triage pages** (ComplaintTriagePage): `DataTable` + `DataTablePreview` (split mode) + keyboard

## Structure

### Frontend

```
apps/web/src/
├── components/data-table/
│   ├── DataTable.tsx              # Orchestrator: toolbar + table + pagination
│   ├── DataTableToolbar.tsx       # Search, filter chips, column visibility, export, refresh, bulk actions
│   ├── DataTableColumnHeader.tsx  # Sort indicator + inline filter popover
│   ├── DataTablePagination.tsx    # Server-side pagination controls
│   ├── DataTablePreview.tsx       # Split panel / drawer toggle
│   ├── DataTableFilterPanel.tsx   # Side panel for complex filters
│   ├── DataTableSkeleton.tsx      # Loading skeleton
│   ├── DataTableHighlight.tsx     # Search match highlighting
│   ├── index.ts                   # Barrel export
│   └── types.ts                   # Shared types
├── hooks/
│   ├── useServerTable.ts          # Server-side pagination/sort/filter/search
│   ├── useDataTableKeyboard.ts    # J/K/Enter/X/Escape/Cmd+A shortcuts
│   └── useColumnVisibility.ts     # Column toggle + responsive priority
```

### Backend

```
apps/api/src/common/
├── dto/pagination.dto.ts                  # PaginationQueryDto
├── interfaces/paginated.interface.ts      # PaginatedResponse<T>
└── utils/query-builder.util.ts            # buildPaginatedQuery() helper
```

## Backend: Server-Side Pagination

### Query Parameters

```
GET /api/v1/users?page=1&limit=25&sort=name&order=asc&search=john&filters[role]=driver
```

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | 1 | Current page |
| `limit` | number | 25 | Rows per page (max 100) |
| `sort` | string | `created_at` | Column name, validated against whitelist |
| `order` | `asc` / `desc` | `desc` | Sort direction |
| `search` | string | — | Global search across module-specific columns |
| `filters` | object | — | Key-value column filters, validated against whitelist |

### Response Format

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 12847,
    "totalPages": 514
  }
}
```

### buildPaginatedQuery() Utility

Shared helper used by all services:

- Accepts base query, searchable columns whitelist, allowed sort columns, allowed filter columns
- Validates `sort` and `filters` keys against whitelists (SQL injection prevention)
- Generates parameterized WHERE (search + filters), ORDER BY, LIMIT/OFFSET
- Runs separate COUNT query for total
- All user values via parameterized queries ($1, $2)

### Searchable Columns Per Module

- **users** — name, email, phone
- **tps** — name, address
- **fleet** — plate_number, brand
- **complaints** — description, location_text
- **schedules** — route_name
- **payments** — reference_number

## Frontend: useServerTable Hook

### Input

```ts
useServerTable<T>({
  endpoint: '/users',
  defaultSort: { field: 'name', order: 'asc' },
  defaultLimit: 25,
  searchFields: ['name', 'email'],       // for UI highlight
  filterDefs: [
    { key: 'role', label: 'Peran', type: 'select', options: [...] },
  ],
  columnDefs: [...],                      // TanStack ColumnDef[]
})
```

### Output

```ts
{
  table: Table<T>,                // TanStack Table instance
  data: T[],                      // current page data
  isLoading: boolean,
  meta: { page, limit, total, totalPages },
  searchText: string,
  setSearchText: (text: string) => void,   // debounced 300ms
  filters: Record<string, any>,
  setFilter: (key: string, value: any) => void,
  resetFilters: () => void,
  activeFilterCount: number,
  refetch: () => void,
}
```

### Behavior

- Debounced search (300ms) before API call
- Auto-reset page to 1 on search/filter/sort change
- URL sync — page, sort, search, filters stored in URL search params
- Memoized columnDefs via useMemo
- Row selection managed by TanStack Table (enableRowSelection)

## Frontend: Components

### DataTable

Orchestrator composing all sub-components:

```
┌─────────────────────────────────────────────────────┐
│ DataTableToolbar (sticky)                            │
│ [Search...] [Filter (2)] [Columns] [Export] [↻]     │
│ Filter aktif: [role: Driver ✕] [Reset semua]        │
├─────────────────────────────────────────────────────┤
│ Table Header (sticky)                                │
│ ☐ │ Nama ↑ │ Email │ Role │ Status │ Aksi          │
├─────────────────────────────────────────────────────┤
│ Virtualized rows                                     │
├─────────────────────────────────────────────────────┤
│ Pagination (sticky bottom)                           │
│ 1-25 dari 12.847    [25 ▾] [◀] 1 / 514 [▶]        │
└─────────────────────────────────────────────────────┘
```

### DataTableToolbar

- Search input with icon, debounced, clearable (X button)
- Filter button with active filter count badge
- Column visibility dropdown checklist
- Export dropdown (CSV/Excel) — exports filtered data, not just current page
- Refresh button
- Bulk actions: appears when rows selected — "{n} dipilih" + action buttons + "Batal"
- Sticky at top on scroll

### DataTableColumnHeader

- Click label → toggle sort (none → asc → desc → none)
- Sort indicator icon (ChevronUp/ChevronDown)
- Small filter icon → inline filter popover per column
- Popover content depends on column type: select for enums, text for strings, date range for dates

### DataTablePagination

- Range info: "1-25 dari 12.847"
- Page size selector: 10, 25, 50, 100
- Previous/Next navigation + current page display

### DataTableSkeleton

- Pulse animation on placeholder rows
- Skeleton row count = active limit
- Column widths match defined column widths

### DataTableHighlight

- `<Highlight text={value} query={searchText} />`
- Wraps matching text in `<mark>` with transparent yellow background
- Only active when searchText is non-empty

## Preview Panel

### DataTablePreview

Two toggleable modes:

**Split mode (default for triage pages):**
- Table takes 60% width, preview panel 40%
- Selected row highlighted, detail shown in right panel

**Drawer mode (default for data pages):**
- Table stays full width
- Preview slides in as Sheet from right

- Toggle via toolbar icon button (PanelRightClose/PanelRightOpen)
- Mode preference stored in localStorage
- Content via render prop: `renderPreview: (item: T) => ReactNode`
- Empty state when nothing selected: "Pilih item untuk melihat detail"
- Close: X button or Escape key

## Keyboard Shortcuts

Via `useDataTableKeyboard` hook:

| Key | Action |
|-----|--------|
| `J` | Move to next row |
| `K` | Move to previous row |
| `Enter` | Open preview for active row |
| `X` | Toggle select active row |
| `Escape` | Close preview |
| `Cmd+A` | Select all rows on current page |
| `Cmd+Shift+A` | Deselect all |

- Shortcuts only active when focus is in table area (not in input/textarea)
- Active row (keyboard nav) gets visual ring/outline distinct from selected rows (checkbox)
- J at last row does not auto-paginate

## Responsive: Column Priority

Each column has optional `priority` (1-3):

| Priority | Behavior | Example |
|----------|----------|---------|
| 1 (required) | Always visible | Name, Status |
| 2 (important) | Hidden on mobile (<768px) | Email, Role |
| 3 (optional) | Hidden on tablet (<1024px) | Created date, Address |
| unset | Same as 2 | — |

- Implemented via `useColumnVisibility` with `window.matchMedia`
- When columns auto-hidden, "Lihat detail" button appears as last column
- Manual override via Column Visibility dropdown, saved to localStorage per page

## Virtualization

Using `@tanstack/react-virtual`:

- Only render visible rows + 5 row buffer above/below
- Estimated row height: 48px
- Table wrapped in div with max-height and overflow-y: auto
- Sticky header stays at top during vertical scroll
- Virtualization only active for > 50 rows to avoid overhead for small datasets

## Sticky Behavior

```
Toolbar         — sticky top: 0, z-20
Filter chips    — sticky top: 44px, z-10 (only when filters active)
Table header    — sticky inside scroll container, z-10
Pagination      — outside scroll container (always visible at bottom)
```

## Migration Plan

### Components to Remove

| File | Replaced by |
|------|-------------|
| `components/data/SmartTable.tsx` | DataTable |
| `components/data/FilterPanel.tsx` | DataTableFilterPanel |
| `components/data/DetailDrawer.tsx` | DataTablePreview |
| `hooks/useTableState.ts` | useServerTable |
| `hooks/useTriageSelection.ts` | TanStack Table row selection |
| `hooks/useTriageKeyboard.ts` | useDataTableKeyboard |
| `hooks/useFacetedFilter.ts` | useServerTable filters |
| `hooks/useSavedViews.ts` | URL sync in useServerTable |
| `components/triage/TriageLayout.tsx` | DataTable + DataTablePreview |
| `components/triage/TriageList.tsx` | DataTable |
| `components/triage/TriageListRow.tsx` | TanStack Table rows |
| `components/triage/TriageToolbar.tsx` | DataTableToolbar |
| `components/triage/TriagePreview.tsx` | DataTablePreview |
| `components/triage/TriageBulkBar.tsx` | Bulk actions in toolbar |
| `components/triage/FilterSidebar.tsx` | DataTableFilterPanel |
| `components/triage/FacetGroup.tsx` | Inline column filters |
| `components/triage/SavedViewList.tsx` | URL sync |

### Components to Keep

| File | Reason |
|------|--------|
| `components/triage/StatusStepper.tsx` | Used inside preview content |
| `components/triage/SlaCountdown.tsx` | Used inside preview content |
| `components/triage/CommandPalette.tsx` | Global feature, not table-specific |
| `hooks/useCommandPalette.ts` | Global feature |
| `hooks/useSlaTimer.ts` | Used by SlaCountdown |
| `hooks/useExport.ts` | Used by DataTable export |

### Pages to Migrate

- `UserPage.tsx` — SmartTable → DataTable
- `ReportPage.tsx` — SmartTable → DataTable
- `ComplaintTriagePage.tsx` — TriageLayout → DataTable + Preview (split)
- `TpsTriagePage.tsx` — TriageLayout → DataTable + Preview (split)
- `FleetTriagePage.tsx` — TriageLayout → DataTable + Preview (split)
- `ScheduleTriagePage.tsx` — TriageLayout → DataTable + Preview (split)
- `PaymentTriagePage.tsx` — TriageLayout → DataTable + Preview (split)

## Tech Stack

- `@tanstack/react-table` — table engine (sorting, filtering, column visibility, row selection)
- `@tanstack/react-virtual` — row virtualization
- `shadcn/ui` — UI primitives (Table, Input, Button, Badge, Popover, Sheet, DropdownMenu, Select, Checkbox, Skeleton, Dialog)
- `Tailwind CSS` — styling
- `lucide-react` — icons
