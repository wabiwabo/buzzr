# Triage Inbox + shadcn/ui Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Ant Design with shadcn/ui + Tailwind CSS v4, IBM Plex Mono typography, and build a Linear-style keyboard-first triage inbox for operational pages.

**Architecture:** Full UI system migration from Ant Design to shadcn/ui (copy-paste component model). New triage layout with three-column design (filter sidebar + request list + preview panel). All styling via Tailwind CSS v4 utility classes. Forms via react-hook-form + zod. Tables via TanStack Table. Toasts via Sonner.

**Tech Stack:** React 18, shadcn/ui, Tailwind CSS v4, IBM Plex Mono, Lucide React, TanStack Table, react-hook-form, zod, Sonner, cmdk, framer-motion (kept), Recharts (kept), Zustand (kept)

**Design Doc:** `docs/plans/2026-03-08-triage-inbox-design.md`

---

## Phase 1: Foundation

### Task 1: Install Tailwind CSS v4 + PostCSS

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/postcss.config.js`
- Modify: `apps/web/vite.config.ts`

**Step 1: Install Tailwind CSS v4 and PostCSS**

Run from project root:
```bash
cd apps/web && pnpm add tailwindcss@^4 @tailwindcss/vite@^4
```

**Step 2: Configure Vite plugin**

Edit `apps/web/vite.config.ts` — add Tailwind plugin:
```ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ... rest unchanged
});
```

**Step 3: Create main CSS entry with Tailwind**

Create `apps/web/src/styles/globals.css`:
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

@theme {
  --font-sans: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;
  --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace;

  --color-background: #FFFFFF;
  --color-foreground: #111827;
  --color-muted: #F3F4F6;
  --color-muted-foreground: #6B7280;
  --color-border: #E5E7EB;
  --color-input: #E5E7EB;
  --color-ring: #2563EB;

  --color-primary: #2563EB;
  --color-primary-foreground: #FFFFFF;
  --color-secondary: #F3F4F6;
  --color-secondary-foreground: #111827;
  --color-accent: #F3F4F6;
  --color-accent-foreground: #111827;
  --color-destructive: #EF4444;
  --color-destructive-foreground: #FFFFFF;

  --color-positive: #22C55E;
  --color-warning: #F59E0B;
  --color-negative: #EF4444;
  --color-info: #3B82F6;
  --color-neutral: #6B7280;

  --color-organic: #22C55E;
  --color-inorganic: #3B82F6;
  --color-b3: #EF4444;
  --color-recyclable: #F59E0B;

  --color-sla-normal: #3B82F6;
  --color-sla-warning: #F59E0B;
  --color-sla-critical: #EF4444;

  --color-severity-critical: #EF4444;
  --color-severity-warning: #F59E0B;
  --color-severity-info: #3B82F6;

  --color-surface: #FFFFFF;
  --color-surface-hover: #F9FAFB;
  --color-surface-selected: #EFF6FF;
  --color-surface-muted: #F3F4F6;

  --color-card: #FFFFFF;
  --color-card-foreground: #111827;
  --color-popover: #FFFFFF;
  --color-popover-foreground: #111827;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --sidebar-width: 240px;
  --sidebar-collapsed: 64px;
  --header-height: 56px;
  --filter-sidebar-width: 220px;
  --preview-panel-width: 420px;

  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-feature-settings: "tnum";
  }
}
```

**Step 4: Verify Tailwind works**

Run: `cd apps/web && pnpm run build`
Expected: Build succeeds with Tailwind processing CSS.

**Step 5: Commit**

```bash
git add apps/web/package.json apps/web/vite.config.ts apps/web/src/styles/globals.css pnpm-lock.yaml
git commit -m "feat(web): install Tailwind CSS v4 + IBM Plex Mono"
```

---

### Task 2: Install shadcn/ui + supporting libraries

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/lib/utils.ts`
- Create: `apps/web/components.json`

**Step 1: Install dependencies**

```bash
cd apps/web && pnpm add class-variance-authority clsx tailwind-merge lucide-react sonner cmdk @tanstack/react-table react-hook-form @hookform/resolvers zod react-day-picker
```

**Step 2: Create utility function**

Create `apps/web/src/lib/utils.ts`:
```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 3: Create shadcn config**

Create `apps/web/components.json`:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "src/components",
    "utils": "src/lib/utils",
    "ui": "src/components/ui",
    "lib": "src/lib",
    "hooks": "src/hooks"
  },
  "iconLibrary": "lucide"
}
```

**Step 4: Install shadcn base components**

```bash
cd apps/web && npx shadcn@latest add button card badge input select checkbox dialog sheet dropdown-menu popover tooltip tabs avatar progress breadcrumb command toggle-group skeleton separator scroll-area alert-dialog label textarea switch radio-group sonner
```

This creates files in `apps/web/src/components/ui/`.

**Step 5: Verify components installed**

Run: `ls apps/web/src/components/ui/`
Expected: All component files present (button.tsx, card.tsx, etc.)

**Step 6: Commit**

```bash
git add apps/web/
git commit -m "feat(web): install shadcn/ui components + supporting libraries"
```

---

### Task 3: Create shared design tokens and color constants

**Files:**
- Create: `apps/web/src/theme/tokens.ts`

**Step 1: Create token constants**

Create `apps/web/src/theme/tokens.ts`:
```ts
// Semantic color constants for use in JS/TSX (mirrors CSS theme vars)
export const WASTE_COLORS = {
  organic: 'var(--color-organic)',
  inorganic: 'var(--color-inorganic)',
  b3: 'var(--color-b3)',
  recyclable: 'var(--color-recyclable)',
} as const;

export const STATUS_COLORS = {
  positive: 'var(--color-positive)',
  negative: 'var(--color-negative)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
  neutral: 'var(--color-neutral)',
} as const;

export const SEVERITY_COLORS = {
  critical: 'var(--color-severity-critical)',
  warning: 'var(--color-severity-warning)',
  info: 'var(--color-severity-info)',
} as const;

export const SLA_COLORS = {
  normal: 'var(--color-sla-normal)',
  warning: 'var(--color-sla-warning)',
  critical: 'var(--color-sla-critical)',
} as const;

export const CHART_COLORS = [
  '#2563EB', '#22C55E', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
] as const;

// Status label maps (Indonesian)
export const STATUS_LABELS: Record<string, string> = {
  submitted: 'Baru',
  verified: 'Terverifikasi',
  assigned: 'Ditugaskan',
  in_progress: 'Dalam Proses',
  resolved: 'Selesai',
  rejected: 'Ditolak',
  active: 'Aktif',
  inactive: 'Nonaktif',
  maintenance: 'Pemeliharaan',
  available: 'Tersedia',
  in_use: 'Digunakan',
  full: 'Penuh',
  pending: 'Menunggu',
  paid: 'Dibayar',
  failed: 'Gagal',
  overdue: 'Terlambat',
};

// Priority labels
export const PRIORITY_LABELS: Record<string, string> = {
  p1: 'P1 Kritis',
  p2: 'P2 Tinggi',
  p3: 'P3 Normal',
  p4: 'P4 Rendah',
};

// Valid status transitions
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  submitted: ['verified', 'rejected'],
  verified: ['assigned', 'rejected'],
  assigned: ['in_progress'],
  in_progress: ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
};
```

**Step 2: Commit**

```bash
git add apps/web/src/theme/tokens.ts
git commit -m "feat(web): add shared design tokens for shadcn/ui migration"
```

---

## Phase 2: Core Triage Components

### Task 4: SlaCountdown component + useSlaTimer hook

**Files:**
- Create: `apps/web/src/hooks/useSlaTimer.ts`
- Create: `apps/web/src/components/triage/SlaCountdown.tsx`

**Step 1: Create useSlaTimer hook**

Create `apps/web/src/hooks/useSlaTimer.ts`:
```ts
import { useState, useEffect, useCallback } from 'react';

export type SlaPhase = 'normal' | 'warning' | 'critical' | 'breached';

interface SlaState {
  remaining: number; // milliseconds (negative = breached)
  phase: SlaPhase;
  label: string;
}

function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  const hours = Math.floor(abs / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const prefix = ms < 0 ? '-' : '';
  if (hours > 0) return `${prefix}${hours}j ${minutes}m`;
  return `${prefix}${minutes}m`;
}

function getPhase(remaining: number): SlaPhase {
  if (remaining <= 0) return 'breached';
  if (remaining <= 3_600_000) return 'critical'; // <1h
  if (remaining <= 14_400_000) return 'warning'; // <4h
  return 'normal';
}

export function useSlaTimer(deadline: string | Date | null, slaHours = 72): SlaState {
  const calcRemaining = useCallback(() => {
    if (!deadline) return slaHours * 3_600_000;
    const deadlineMs = new Date(deadline).getTime() + slaHours * 3_600_000;
    return deadlineMs - Date.now();
  }, [deadline, slaHours]);

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    setRemaining(calcRemaining());
    const interval = setInterval(() => setRemaining(calcRemaining()), 60_000);
    return () => clearInterval(interval);
  }, [calcRemaining]);

  const phase = getPhase(remaining);
  const label = formatDuration(remaining);

  return { remaining, phase, label };
}
```

**Step 2: Create SlaCountdown component**

Create `apps/web/src/components/triage/SlaCountdown.tsx`:
```tsx
import { cn } from '../../lib/utils';
import { useSlaTimer, type SlaPhase } from '../../hooks/useSlaTimer';

const phaseStyles: Record<SlaPhase, string> = {
  normal: 'text-sla-normal',
  warning: 'text-sla-warning',
  critical: 'text-sla-critical animate-pulse',
  breached: 'text-sla-critical font-semibold',
};

interface SlaCountdownProps {
  createdAt: string | Date | null;
  slaHours?: number;
  className?: string;
}

export function SlaCountdown({ createdAt, slaHours = 72, className }: SlaCountdownProps) {
  const { phase, label } = useSlaTimer(createdAt, slaHours);

  return (
    <span
      className={cn('text-xs font-mono tabular-nums', phaseStyles[phase], className)}
      title={phase === 'breached' ? 'SLA terlewat' : `Sisa ${label}`}
    >
      {label}
    </span>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/hooks/useSlaTimer.ts apps/web/src/components/triage/SlaCountdown.tsx
git commit -m "feat(web): add SlaCountdown component with timer hook"
```

---

### Task 5: StatusStepper component

**Files:**
- Create: `apps/web/src/components/triage/StatusStepper.tsx`

**Step 1: Create StatusStepper**

Create `apps/web/src/components/triage/StatusStepper.tsx`:
```tsx
import { cn } from '../../lib/utils';
import { STATUS_LABELS, STATUS_TRANSITIONS } from '../../theme/tokens';

const LIFECYCLE = ['submitted', 'verified', 'assigned', 'in_progress', 'resolved'] as const;

interface StatusStepperProps {
  currentStatus: string;
  onTransition?: (newStatus: string) => void;
  className?: string;
}

export function StatusStepper({ currentStatus, onTransition, className }: StatusStepperProps) {
  const currentIdx = LIFECYCLE.indexOf(currentStatus as typeof LIFECYCLE[number]);
  const validTransitions = STATUS_TRANSITIONS[currentStatus] || [];

  // If rejected, show as terminal after current position
  const isRejected = currentStatus === 'rejected';

  return (
    <div className={cn('flex items-center gap-0', className)}>
      {LIFECYCLE.map((status, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = status === currentStatus;
        const isFuture = idx > currentIdx;
        const canTransition = validTransitions.includes(status);

        return (
          <div key={status} className="flex items-center">
            {idx > 0 && (
              <div
                className={cn(
                  'h-[2px] w-6',
                  isCompleted ? 'bg-positive' : 'bg-border',
                )}
              />
            )}
            <button
              type="button"
              disabled={!canTransition}
              onClick={() => canTransition && onTransition?.(status)}
              className={cn(
                'w-3 h-3 rounded-full shrink-0 transition-colors',
                isCompleted && 'bg-positive',
                isCurrent && 'bg-primary ring-2 ring-primary/30',
                isFuture && !canTransition && 'bg-border',
                isFuture && canTransition && 'bg-border hover:bg-primary/50 cursor-pointer',
              )}
              title={STATUS_LABELS[status] || status}
            />
          </div>
        );
      })}
      {isRejected && (
        <>
          <div className="h-[2px] w-6 bg-destructive" />
          <div
            className="w-3 h-3 rounded-full bg-destructive ring-2 ring-destructive/30"
            title="Ditolak"
          />
        </>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/triage/StatusStepper.tsx
git commit -m "feat(web): add StatusStepper lifecycle visualization"
```

---

### Task 6: useTriageSelection hook

**Files:**
- Create: `apps/web/src/hooks/useTriageSelection.ts`

**Step 1: Create hook**

Create `apps/web/src/hooks/useTriageSelection.ts`:
```ts
import { useState, useCallback } from 'react';

interface UseTriageSelectionOptions<T> {
  items: T[];
  getId: (item: T) => string;
}

export function useTriageSelection<T>({ items, getId }: UseTriageSelectionOptions<T>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const selectedItem = items.find((item) => getId(item) === selectedId) ?? null;
  const checkedItems = items.filter((item) => checkedIds.has(getId(item)));

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const selectNext = useCallback(() => {
    if (items.length === 0) return;
    const idx = items.findIndex((item) => getId(item) === selectedId);
    const nextIdx = idx < items.length - 1 ? idx + 1 : idx;
    setSelectedId(getId(items[nextIdx]));
  }, [items, selectedId, getId]);

  const selectPrev = useCallback(() => {
    if (items.length === 0) return;
    const idx = items.findIndex((item) => getId(item) === selectedId);
    const prevIdx = idx > 0 ? idx - 1 : 0;
    setSelectedId(getId(items[prevIdx]));
  }, [items, selectedId, getId]);

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const checkRange = useCallback((toId: string) => {
    const fromIdx = items.findIndex((item) => getId(item) === selectedId);
    const toIdx = items.findIndex((item) => getId(item) === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
    setCheckedIds((prev) => {
      const next = new Set(prev);
      for (let i = start; i <= end; i++) next.add(getId(items[i]));
      return next;
    });
  }, [items, selectedId, getId]);

  const clearChecked = useCallback(() => {
    setCheckedIds(new Set());
  }, []);

  const checkAll = useCallback(() => {
    setCheckedIds(new Set(items.map(getId)));
  }, [items, getId]);

  return {
    selectedId,
    selectedItem,
    checkedIds,
    checkedItems,
    checkedCount: checkedIds.size,
    select,
    selectNext,
    selectPrev,
    toggleCheck,
    checkRange,
    clearChecked,
    checkAll,
  };
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/useTriageSelection.ts
git commit -m "feat(web): add useTriageSelection hook with keyboard navigation"
```

---

### Task 7: useTriageKeyboard hook

**Files:**
- Create: `apps/web/src/hooks/useTriageKeyboard.ts`

**Step 1: Create hook**

Create `apps/web/src/hooks/useTriageKeyboard.ts`:
```ts
import { useEffect, useCallback } from 'react';

interface TriageKeyboardActions {
  onNext: () => void;
  onPrev: () => void;
  onTogglePreview: () => void;
  onOpenDetail: () => void;
  onAssign: () => void;
  onStatusChange: () => void;
  onResolve: () => void;
  onReject: () => void;
  onAddNote: () => void;
  onCyclePriority: () => void;
  onFocusSearch: () => void;
  onShowHelp: () => void;
  onToggleSidebar: () => void;
  onBulkAssign?: () => void;
  onBulkStatus?: () => void;
  onClearSelection?: () => void;
}

const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function useTriageKeyboard(actions: TriageKeyboardActions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (IGNORED_TAGS.has(target.tagName) || target.isContentEditable) return;

    // Prevent shortcuts when dialogs/modals are open
    if (document.querySelector('[role="dialog"]')) return;

    const key = e.key.toLowerCase();
    const shift = e.shiftKey;

    switch (key) {
      case 'j': e.preventDefault(); actions.onNext(); break;
      case 'k': e.preventDefault(); actions.onPrev(); break;
      case ' ': e.preventDefault(); actions.onTogglePreview(); break;
      case 'enter': e.preventDefault(); actions.onOpenDetail(); break;
      case 'escape': e.preventDefault(); actions.onTogglePreview(); break;
      case '/': e.preventDefault(); actions.onFocusSearch(); break;
      case '?': e.preventDefault(); actions.onShowHelp(); break;
      case '[': e.preventDefault(); actions.onToggleSidebar(); break;
      case 'a':
        e.preventDefault();
        if (shift) actions.onBulkAssign?.();
        else actions.onAssign();
        break;
      case 's':
        e.preventDefault();
        if (shift) actions.onBulkStatus?.();
        else actions.onStatusChange();
        break;
      case 'r': e.preventDefault(); actions.onResolve(); break;
      case 'x':
        e.preventDefault();
        if (shift) actions.onClearSelection?.();
        else actions.onReject();
        break;
      case 'n': e.preventDefault(); actions.onAddNote(); break;
      case 'p': e.preventDefault(); actions.onCyclePriority(); break;
    }
  }, [actions]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/useTriageKeyboard.ts
git commit -m "feat(web): add useTriageKeyboard hook with shortcut bindings"
```

---

### Task 8: TriageListRow component

**Files:**
- Create: `apps/web/src/components/triage/TriageListRow.tsx`

**Step 1: Create component**

Create `apps/web/src/components/triage/TriageListRow.tsx`:
```tsx
import { cn } from '../../lib/utils';
import { Checkbox } from '../ui/checkbox';
import { SlaCountdown } from './SlaCountdown';

export interface TriageRowData {
  id: string;
  title: string;
  meta: string;
  severity: 'critical' | 'warning' | 'info';
  createdAt: string;
  slaHours?: number;
  assigneeAvatar?: string;
  assigneeName?: string;
  isUnread?: boolean;
}

interface TriageListRowProps {
  data: TriageRowData;
  isSelected: boolean;
  isChecked: boolean;
  onSelect: (id: string) => void;
  onCheck: (id: string) => void;
  onShiftClick: (id: string) => void;
  showCheckbox: boolean;
}

const severityColor: Record<string, string> = {
  critical: 'bg-severity-critical',
  warning: 'bg-severity-warning',
  info: 'bg-severity-info',
};

function relativeAge(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}h`;
  return `${Math.floor(days / 7)}mg`;
}

export function TriageListRow({
  data,
  isSelected,
  isChecked,
  onSelect,
  onCheck,
  onShiftClick,
  showCheckbox,
}: TriageListRowProps) {
  return (
    <div
      role="row"
      aria-selected={isSelected}
      className={cn(
        'group flex items-center gap-2 px-3 h-10 cursor-pointer border-l-3 transition-colors',
        isSelected
          ? 'bg-surface-selected border-l-primary'
          : 'bg-surface border-l-transparent hover:bg-surface-hover',
      )}
      onClick={(e) => {
        if (e.shiftKey) onShiftClick(data.id);
        else onSelect(data.id);
      }}
    >
      {/* Checkbox */}
      <div className={cn('shrink-0', showCheckbox ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
        <Checkbox
          checked={isChecked}
          onCheckedChange={() => onCheck(data.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5"
        />
      </div>

      {/* Severity dot */}
      <div
        className={cn('w-2 h-2 rounded-full shrink-0', severityColor[data.severity])}
        aria-label={`Prioritas ${data.severity}`}
      />

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm truncate leading-tight',
          data.isUnread ? 'font-semibold' : 'font-normal',
        )}>
          {data.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {data.meta}
        </p>
      </div>

      {/* SLA */}
      <SlaCountdown
        createdAt={data.createdAt}
        slaHours={data.slaHours}
        className="shrink-0 w-14 text-right"
      />

      {/* Assignee avatar */}
      <div className="w-6 h-6 rounded-full shrink-0 overflow-hidden bg-muted flex items-center justify-center">
        {data.assigneeAvatar ? (
          <img src={data.assigneeAvatar} alt={data.assigneeName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] text-muted-foreground">?</span>
        )}
      </div>

      {/* Age */}
      <span className="text-xs text-muted-foreground tabular-nums w-8 text-right shrink-0">
        {relativeAge(data.createdAt)}
      </span>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/triage/TriageListRow.tsx
git commit -m "feat(web): add TriageListRow component"
```

---

### Task 9: TriageToolbar component

**Files:**
- Create: `apps/web/src/components/triage/TriageToolbar.tsx`

**Step 1: Create component**

Create `apps/web/src/components/triage/TriageToolbar.tsx`:
```tsx
import { Search, SlidersHorizontal, RotateCw, Keyboard } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

interface TriageToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  groupBy: string;
  onGroupByChange: (value: string) => void;
  groupByOptions: Array<{ value: string; label: string }>;
  activeFilters: ActiveFilter[];
  onRemoveFilter: (key: string, value: string) => void;
  onRefresh: () => void;
  onShowHelp: () => void;
  density: 'compact' | 'comfortable';
  onDensityChange: (density: 'compact' | 'comfortable') => void;
  className?: string;
}

export function TriageToolbar({
  search,
  onSearchChange,
  searchRef,
  groupBy,
  onGroupByChange,
  groupByOptions,
  activeFilters,
  onRemoveFilter,
  onRefresh,
  onShowHelp,
  density,
  onDensityChange,
  className,
}: TriageToolbarProps) {
  return (
    <div className={cn('border-b border-border', className)}>
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari..."
            className="h-8 pl-8 text-sm"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1 rounded">
            /
          </kbd>
        </div>

        {/* Group by */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Group: {groupByOptions.find((o) => o.value === groupBy)?.label || 'None'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {groupByOptions.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={() => onGroupByChange(opt.value)}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Density toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onDensityChange(density === 'compact' ? 'comfortable' : 'compact')}
          title={density === 'compact' ? 'Mode nyaman' : 'Mode padat'}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </Button>

        {/* Refresh */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onRefresh} title="Refresh">
          <RotateCw className="h-3.5 w-3.5" />
        </Button>

        {/* Keyboard help */}
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onShowHelp} title="Pintasan keyboard">
          <Keyboard className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-1 px-3 pb-2 flex-wrap">
          {activeFilters.map((f) => (
            <Badge key={`${f.key}-${f.value}`} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => onRemoveFilter(f.key, f.value)}>
              {f.label}: {f.value}
              <span className="ml-0.5">✕</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/triage/TriageToolbar.tsx
git commit -m "feat(web): add TriageToolbar with search, grouping, and filter chips"
```

---

### Task 10: TriageBulkBar component

**Files:**
- Create: `apps/web/src/components/triage/TriageBulkBar.tsx`

**Step 1: Create component**

Create `apps/web/src/components/triage/TriageBulkBar.tsx`:
```tsx
import { X, UserPlus, ArrowRightLeft, Merge } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface TriageBulkBarProps {
  count: number;
  onAssign: () => void;
  onStatusChange: () => void;
  onMerge?: () => void;
  onClear: () => void;
  className?: string;
}

export function TriageBulkBar({
  count,
  onAssign,
  onStatusChange,
  onMerge,
  onClear,
  className,
}: TriageBulkBarProps) {
  if (count === 0) return null;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-primary/20',
      className,
    )}>
      <span className="text-sm font-medium text-primary">
        {count} dipilih
      </span>

      <div className="flex items-center gap-1 ml-2">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onAssign}>
          <UserPlus className="h-3 w-3" />
          Tugaskan
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onStatusChange}>
          <ArrowRightLeft className="h-3 w-3" />
          Status
        </Button>
        {onMerge && (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onMerge}>
            <Merge className="h-3 w-3" />
            Gabung
          </Button>
        )}
      </div>

      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={onClear}>
        <X className="h-3 w-3" />
        Batal
      </Button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/triage/TriageBulkBar.tsx
git commit -m "feat(web): add TriageBulkBar for bulk actions"
```

---

### Task 11: TriageList component

**Files:**
- Create: `apps/web/src/components/triage/TriageList.tsx`

**Step 1: Create component**

Create `apps/web/src/components/triage/TriageList.tsx`:
```tsx
import { useRef, useMemo } from 'react';
import { ChevronDown, ChevronRight, Inbox, SearchX } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { TriageListRow, type TriageRowData } from './TriageListRow';
import { TriageToolbar } from './TriageToolbar';
import { TriageBulkBar } from './TriageBulkBar';
import { useState } from 'react';

interface GroupConfig {
  key: string;
  getGroup: (item: TriageRowData) => string;
}

interface TriageListProps {
  items: TriageRowData[];
  loading?: boolean;
  selectedId: string | null;
  checkedIds: Set<string>;
  onSelect: (id: string) => void;
  onCheck: (id: string) => void;
  onShiftClick: (id: string) => void;
  onClearChecked: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  groupBy: string;
  onGroupByChange: (value: string) => void;
  groupByOptions: Array<{ value: string; label: string }>;
  groupConfig?: Record<string, GroupConfig>;
  activeFilters: Array<{ key: string; label: string; value: string }>;
  onRemoveFilter: (key: string, value: string) => void;
  onRefresh: () => void;
  onShowHelp: () => void;
  onBulkAssign: () => void;
  onBulkStatus: () => void;
  emptyMessage?: string;
  className?: string;
}

export function TriageList({
  items,
  loading,
  selectedId,
  checkedIds,
  onSelect,
  onCheck,
  onShiftClick,
  onClearChecked,
  search,
  onSearchChange,
  searchRef,
  groupBy,
  onGroupByChange,
  groupByOptions,
  groupConfig,
  activeFilters,
  onRemoveFilter,
  onRefresh,
  onShowHelp,
  onBulkAssign,
  onBulkStatus,
  emptyMessage = 'Tidak ada item',
  className,
}: TriageListProps) {
  const [density, setDensity] = useState<'compact' | 'comfortable'>('compact');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const showCheckbox = checkedIds.size > 0;

  const grouped = useMemo(() => {
    if (groupBy === 'none' || !groupConfig?.[groupBy]) {
      return [{ key: '__all__', label: '', items }];
    }
    const config = groupConfig[groupBy];
    const groups: Record<string, TriageRowData[]> = {};
    items.forEach((item) => {
      const group = config.getGroup(item);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return Object.entries(groups).map(([label, groupItems]) => ({
      key: label,
      label,
      items: groupItems,
    }));
  }, [items, groupBy, groupConfig]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isFiltered = search.length > 0 || activeFilters.length > 0;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {checkedIds.size > 0 ? (
        <TriageBulkBar
          count={checkedIds.size}
          onAssign={onBulkAssign}
          onStatusChange={onBulkStatus}
          onClear={onClearChecked}
        />
      ) : (
        <TriageToolbar
          search={search}
          onSearchChange={onSearchChange}
          searchRef={searchRef}
          groupBy={groupBy}
          onGroupByChange={onGroupByChange}
          groupByOptions={groupByOptions}
          activeFilters={activeFilters}
          onRemoveFilter={onRemoveFilter}
          onRefresh={onRefresh}
          onShowHelp={onShowHelp}
          density={density}
          onDensityChange={setDensity}
        />
      )}

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            {isFiltered ? (
              <>
                <SearchX className="h-8 w-8 mb-2" />
                <p className="text-sm">Tidak ada hasil untuk filter ini</p>
              </>
            ) : (
              <>
                <Inbox className="h-8 w-8 mb-2" />
                <p className="text-sm">{emptyMessage}</p>
              </>
            )}
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.key}>
              {group.label && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 hover:bg-muted cursor-pointer"
                  onClick={() => toggleGroup(group.key)}
                >
                  {collapsedGroups.has(group.key)
                    ? <ChevronRight className="h-3 w-3" />
                    : <ChevronDown className="h-3 w-3" />
                  }
                  {group.label}
                  <span className="text-muted-foreground/60 ml-1">({group.items.length})</span>
                </button>
              )}
              {!collapsedGroups.has(group.key) &&
                group.items.map((item) => (
                  <TriageListRow
                    key={item.id}
                    data={item}
                    isSelected={item.id === selectedId}
                    isChecked={checkedIds.has(item.id)}
                    onSelect={onSelect}
                    onCheck={onCheck}
                    onShiftClick={onShiftClick}
                    showCheckbox={showCheckbox}
                  />
                ))
              }
            </div>
          ))
        )}
      </ScrollArea>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/triage/TriageList.tsx
git commit -m "feat(web): add TriageList with grouping and keyboard selection"
```

---

### Task 12: TriagePreview component

**Files:**
- Create: `apps/web/src/components/triage/TriagePreview.tsx`

**Step 1: Create component**

Create `apps/web/src/components/triage/TriagePreview.tsx`:
```tsx
import { ExternalLink, MoreHorizontal, MapPin, Phone, Calendar, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { StatusStepper } from './StatusStepper';
import { SlaCountdown } from './SlaCountdown';
import { STATUS_LABELS, STATUS_TRANSITIONS } from '../../theme/tokens';

interface TimelineEntry {
  time: string;
  label: string;
  type: 'created' | 'assigned' | 'status_change' | 'note' | 'resolved' | 'rejected';
}

export interface TriagePreviewData {
  id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  category?: string;
  area?: string;
  reporterName?: string;
  reporterPhone?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  createdAt: string;
  slaHours?: number;
  photos?: string[];
  timeline?: TimelineEntry[];
  assigneeName?: string;
}

interface TriagePreviewProps {
  data: TriagePreviewData | null;
  onStatusTransition: (id: string, newStatus: string) => void;
  onAssign: (id: string) => void;
  className?: string;
}

const timelineTypeColor: Record<string, string> = {
  created: 'bg-info',
  assigned: 'bg-warning',
  status_change: 'bg-neutral',
  note: 'bg-neutral',
  resolved: 'bg-positive',
  rejected: 'bg-negative',
};

const actionLabels: Record<string, string> = {
  verified: 'Verifikasi',
  assigned: 'Tugaskan',
  in_progress: 'Mulai',
  resolved: 'Selesaikan',
  rejected: 'Tolak',
  submitted: 'Buka Kembali',
};

export function TriagePreview({ data, onStatusTransition, onAssign, className }: TriagePreviewProps) {
  if (!data) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        <div className="text-center">
          <p className="text-sm">Pilih item dari daftar</p>
          <p className="text-xs mt-1">Tekan J/K untuk navigasi</p>
        </div>
      </div>
    );
  }

  const validTransitions = STATUS_TRANSITIONS[data.status] || [];
  const primaryAction = validTransitions[0];
  const secondaryActions = validTransitions.slice(1);

  return (
    <div className={cn('flex flex-col h-full border-l border-border', className)}>
      {/* Sticky header */}
      <div className="shrink-0 px-4 py-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {STATUS_LABELS[data.status] || data.status}
            </Badge>
            {data.priority && (
              <Badge
                variant={data.priority === 'p1' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {data.priority.toUpperCase()}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-7" onClick={() => onAssign(data.id)}>
            {data.assigneeName || 'Tugaskan'}
          </Button>
        </div>

        <StatusStepper currentStatus={data.status} onTransition={(s) => onStatusTransition(data.id, s)} />

        <div className="flex items-center gap-1.5 flex-wrap">
          {data.category && <Badge variant="secondary" className="text-xs">{data.category}</Badge>}
          {data.area && <Badge variant="secondary" className="text-xs">{data.area}</Badge>}
          <SlaCountdown createdAt={data.createdAt} slaHours={data.slaHours} />
        </div>
      </div>

      {/* Scrollable body */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Title & description */}
          <div>
            <h3 className="text-lg font-semibold leading-tight">{data.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{data.description}</p>
          </div>

          {/* Photos */}
          {data.photos && data.photos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {data.photos.slice(0, 4).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-md overflow-hidden bg-muted">
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </a>
              ))}
              {data.photos.length > 4 && (
                <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  +{data.photos.length - 4}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Detail fields */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Detail</h4>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              {data.reporterName && (
                <>
                  <dt className="text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />Pelapor</dt>
                  <dd>{data.reporterName}</dd>
                </>
              )}
              {data.reporterPhone && (
                <>
                  <dt className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />Telepon</dt>
                  <dd><a href={`tel:${data.reporterPhone}`} className="text-primary hover:underline">{data.reporterPhone}</a></dd>
                </>
              )}
              {data.address && (
                <>
                  <dt className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Alamat</dt>
                  <dd>{data.address}</dd>
                </>
              )}
              {data.coordinates && (
                <>
                  <dt className="text-muted-foreground flex items-center gap-1"><ExternalLink className="h-3 w-3" />Koordinat</dt>
                  <dd>
                    <a
                      href={`https://maps.google.com/?q=${data.coordinates.lat},${data.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {data.coordinates.lat.toFixed(4)}, {data.coordinates.lng.toFixed(4)}
                    </a>
                  </dd>
                </>
              )}
              <dt className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Dibuat</dt>
              <dd>{new Date(data.createdAt).toLocaleString('id-ID')}</dd>
            </dl>
          </div>

          <Separator />

          {/* Timeline */}
          {data.timeline && data.timeline.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aktivitas</h4>
              <div className="space-y-3 pl-3 border-l-2 border-border">
                {data.timeline.map((entry, i) => (
                  <div key={i} className="relative">
                    <div className={cn(
                      'absolute -left-[17px] top-0.5 w-2.5 h-2.5 rounded-full',
                      timelineTypeColor[entry.type] || 'bg-neutral',
                    )} />
                    <p className="text-xs text-muted-foreground">{new Date(entry.time).toLocaleString('id-ID')}</p>
                    <p className="text-sm">{entry.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Sticky footer */}
      <div className="shrink-0 flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
        {secondaryActions.map((status) => (
          <Button
            key={status}
            variant={status === 'rejected' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => onStatusTransition(data.id, status)}
          >
            {actionLabels[status] || status}
          </Button>
        ))}
        {primaryAction && (
          <Button size="sm" onClick={() => onStatusTransition(data.id, primaryAction)}>
            {actionLabels[primaryAction] || primaryAction}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Cetak</DropdownMenuItem>
            <DropdownMenuItem>Ekspor</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/triage/TriagePreview.tsx
git commit -m "feat(web): add TriagePreview panel with status actions and timeline"
```

---

### Task 13: TriageLayout orchestrator component

**Files:**
- Create: `apps/web/src/components/triage/TriageLayout.tsx`
- Create: `apps/web/src/components/triage/index.ts`

**Step 1: Create TriageLayout**

Create `apps/web/src/components/triage/TriageLayout.tsx`:
```tsx
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { TriageList } from './TriageList';
import { TriagePreview, type TriagePreviewData } from './TriagePreview';
import type { TriageRowData } from './TriageListRow';

interface TriageLayoutProps {
  // List data
  items: TriageRowData[];
  loading?: boolean;
  selectedId: string | null;
  checkedIds: Set<string>;
  onSelect: (id: string) => void;
  onCheck: (id: string) => void;
  onShiftClick: (id: string) => void;
  onClearChecked: () => void;

  // Search & filter
  search: string;
  onSearchChange: (value: string) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
  groupBy: string;
  onGroupByChange: (value: string) => void;
  groupByOptions: Array<{ value: string; label: string }>;
  groupConfig?: Record<string, { key: string; getGroup: (item: TriageRowData) => string }>;
  activeFilters: Array<{ key: string; label: string; value: string }>;
  onRemoveFilter: (key: string, value: string) => void;
  onRefresh: () => void;
  onShowHelp: () => void;

  // Bulk
  onBulkAssign: () => void;
  onBulkStatus: () => void;

  // Preview
  previewData: TriagePreviewData | null;
  onStatusTransition: (id: string, newStatus: string) => void;
  onAssign: (id: string) => void;

  // Filter sidebar (slot)
  filterSidebar?: React.ReactNode;

  className?: string;
}

export function TriageLayout({
  items,
  loading,
  selectedId,
  checkedIds,
  onSelect,
  onCheck,
  onShiftClick,
  onClearChecked,
  search,
  onSearchChange,
  searchRef,
  groupBy,
  onGroupByChange,
  groupByOptions,
  groupConfig,
  activeFilters,
  onRemoveFilter,
  onRefresh,
  onShowHelp,
  onBulkAssign,
  onBulkStatus,
  previewData,
  onStatusTransition,
  onAssign,
  filterSidebar,
  className,
}: TriageLayoutProps) {
  const [previewOpen, setPreviewOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={cn('flex h-[calc(100vh-var(--header-height)-48px)] overflow-hidden rounded-lg border border-border bg-surface', className)}>
      {/* Filter sidebar */}
      {filterSidebar && sidebarOpen && (
        <div className="w-[var(--filter-sidebar-width)] shrink-0 border-r border-border overflow-y-auto">
          {filterSidebar}
        </div>
      )}

      {/* Request list */}
      <TriageList
        items={items}
        loading={loading}
        selectedId={selectedId}
        checkedIds={checkedIds}
        onSelect={onSelect}
        onCheck={onCheck}
        onShiftClick={onShiftClick}
        onClearChecked={onClearChecked}
        search={search}
        onSearchChange={onSearchChange}
        searchRef={searchRef}
        groupBy={groupBy}
        onGroupByChange={onGroupByChange}
        groupByOptions={groupByOptions}
        groupConfig={groupConfig}
        activeFilters={activeFilters}
        onRemoveFilter={onRemoveFilter}
        onRefresh={onRefresh}
        onShowHelp={onShowHelp}
        onBulkAssign={onBulkAssign}
        onBulkStatus={onBulkStatus}
        className="flex-1 min-w-0"
      />

      {/* Preview panel */}
      {previewOpen && (
        <TriagePreview
          data={previewData}
          onStatusTransition={onStatusTransition}
          onAssign={onAssign}
          className="w-[var(--preview-panel-width)] shrink-0"
        />
      )}
    </div>
  );
}

// Re-export toggle helpers for keyboard hook
export type { TriageLayoutProps };
```

**Step 2: Create barrel export**

Create `apps/web/src/components/triage/index.ts`:
```ts
export { TriageLayout } from './TriageLayout';
export { TriageList } from './TriageList';
export { TriageListRow, type TriageRowData } from './TriageListRow';
export { TriagePreview, type TriagePreviewData } from './TriagePreview';
export { TriageToolbar } from './TriageToolbar';
export { TriageBulkBar } from './TriageBulkBar';
export { SlaCountdown } from './SlaCountdown';
export { StatusStepper } from './StatusStepper';
```

**Step 3: Commit**

```bash
git add apps/web/src/components/triage/
git commit -m "feat(web): add TriageLayout orchestrator and barrel exports"
```

---

## Phase 3: Filter System

### Task 14: useFacetedFilter hook

**Files:**
- Create: `apps/web/src/hooks/useFacetedFilter.ts`

**Step 1: Create hook**

Create `apps/web/src/hooks/useFacetedFilter.ts`:
```ts
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface FacetDimension {
  key: string;
  label: string;
  getValue: (item: Record<string, unknown>) => string;
}

interface FacetCount {
  value: string;
  count: number;
  checked: boolean;
}

interface UseFacetedFilterOptions<T> {
  items: T[];
  dimensions: FacetDimension[];
  searchFields?: string[];
}

export function useFacetedFilter<T extends Record<string, unknown>>({
  items,
  dimensions,
  searchFields = [],
}: UseFacetedFilterOptions<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');

  // Parse active filters from URL
  const activeFilterMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    dimensions.forEach((dim) => {
      const values = searchParams.get(dim.key);
      if (values) map[dim.key] = new Set(values.split(','));
    });
    return map;
  }, [searchParams, dimensions]);

  // Apply search filter
  const searchFiltered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const val = item[field];
        return typeof val === 'string' && val.toLowerCase().includes(q);
      }),
    );
  }, [items, search, searchFields]);

  // Apply facet filters
  const filtered = useMemo(() => {
    return searchFiltered.filter((item) => {
      return dimensions.every((dim) => {
        const active = activeFilterMap[dim.key];
        if (!active || active.size === 0) return true;
        return active.has(dim.getValue(item));
      });
    });
  }, [searchFiltered, dimensions, activeFilterMap]);

  // Compute cross-filtered facet counts
  const facetCounts = useMemo(() => {
    const result: Record<string, FacetCount[]> = {};
    dimensions.forEach((dim) => {
      const counts: Record<string, number> = {};
      // Filter by all OTHER dimensions (not this one) for cross-filtering
      const otherFiltered = searchFiltered.filter((item) =>
        dimensions.every((otherDim) => {
          if (otherDim.key === dim.key) return true;
          const active = activeFilterMap[otherDim.key];
          if (!active || active.size === 0) return true;
          return active.has(otherDim.getValue(item));
        }),
      );
      otherFiltered.forEach((item) => {
        const val = dim.getValue(item);
        counts[val] = (counts[val] || 0) + 1;
      });
      const active = activeFilterMap[dim.key] || new Set();
      result[dim.key] = Object.entries(counts)
        .map(([value, count]) => ({ value, count, checked: active.has(value) }))
        .sort((a, b) => b.count - a.count);
    });
    return result;
  }, [searchFiltered, dimensions, activeFilterMap]);

  // Toggle a facet value
  const toggleFilter = useCallback((dimensionKey: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const current = next.get(dimensionKey);
      const values = current ? new Set(current.split(',')) : new Set<string>();
      if (values.has(value)) values.delete(value);
      else values.add(value);
      if (values.size === 0) next.delete(dimensionKey);
      else next.set(dimensionKey, Array.from(values).join(','));
      return next;
    });
  }, [setSearchParams]);

  // Remove a specific filter
  const removeFilter = useCallback((dimensionKey: string, value: string) => {
    toggleFilter(dimensionKey, value);
  }, [toggleFilter]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchParams({});
    setSearch('');
  }, [setSearchParams]);

  // Active filters as flat array (for chips)
  const activeFilters = useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = [];
    dimensions.forEach((dim) => {
      const active = activeFilterMap[dim.key];
      if (active) {
        active.forEach((value) => {
          result.push({ key: dim.key, label: dim.label, value });
        });
      }
    });
    return result;
  }, [dimensions, activeFilterMap]);

  // Sync search to URL
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (search) next.set('q', search);
      else next.delete('q');
      return next;
    });
  }, [search, setSearchParams]);

  return {
    filtered,
    facetCounts,
    search,
    setSearch,
    toggleFilter,
    removeFilter,
    resetFilters,
    activeFilters,
    totalCount: items.length,
    filteredCount: filtered.length,
  };
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/useFacetedFilter.ts
git commit -m "feat(web): add useFacetedFilter hook with URL sync and cross-filtering"
```

---

### Task 15: FilterSidebar + FacetGroup + SavedViewList components

**Files:**
- Create: `apps/web/src/components/triage/FacetGroup.tsx`
- Create: `apps/web/src/components/triage/SavedViewList.tsx`
- Create: `apps/web/src/components/triage/FilterSidebar.tsx`
- Create: `apps/web/src/hooks/useSavedViews.ts`

**Step 1: Create useSavedViews hook**

Create `apps/web/src/hooks/useSavedViews.ts`:
```ts
import { useState, useCallback, useEffect } from 'react';

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, string[]>;
  isDefault?: boolean;
}

const STORAGE_KEY = 'buzzr_saved_views';

export function useSavedViews(page: string, defaultViews: SavedView[] = []) {
  const storageKey = `${STORAGE_KEY}_${page}`;

  const [views, setViews] = useState<SavedView[]>(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* fall through */ }
    }
    return defaultViews;
  });

  const [activeViewId, setActiveViewId] = useState<string | null>(views[0]?.id || null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(views));
  }, [views, storageKey]);

  const addView = useCallback((view: Omit<SavedView, 'id'>) => {
    const newView = { ...view, id: crypto.randomUUID() };
    setViews((prev) => [...prev, newView]);
    return newView.id;
  }, []);

  const removeView = useCallback((id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
    if (activeViewId === id) setActiveViewId(null);
  }, [activeViewId]);

  const selectView = useCallback((id: string) => {
    setActiveViewId(id);
  }, []);

  const activeView = views.find((v) => v.id === activeViewId) || null;

  return { views, activeView, activeViewId, addView, removeView, selectView };
}
```

**Step 2: Create FacetGroup**

Create `apps/web/src/components/triage/FacetGroup.tsx`:
```tsx
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

interface FacetCount {
  value: string;
  count: number;
  checked: boolean;
}

interface FacetGroupProps {
  label: string;
  counts: FacetCount[];
  onToggle: (value: string) => void;
  labelMap?: Record<string, string>;
  searchable?: boolean;
  maxVisible?: number;
}

export function FacetGroup({
  label,
  counts,
  onToggle,
  labelMap,
  searchable = false,
  maxVisible = 5,
}: FacetGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search
    ? counts.filter((c) => {
        const display = labelMap?.[c.value] || c.value;
        return display.toLowerCase().includes(search.toLowerCase());
      })
    : counts;

  const visible = expanded ? filtered : filtered.slice(0, maxVisible);
  const hasMore = filtered.length > maxVisible;

  return (
    <div className="py-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
        {label}
      </p>

      {searchable && counts.length > maxVisible && (
        <div className="px-3 mb-1.5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari..."
            className="h-6 text-xs"
          />
        </div>
      )}

      <div className="space-y-0.5">
        {visible.map((item) => (
          <label
            key={item.value}
            className="flex items-center gap-2 px-3 py-1 cursor-pointer hover:bg-surface-hover text-sm"
          >
            <Checkbox
              checked={item.checked}
              onCheckedChange={() => onToggle(item.value)}
              className="h-3.5 w-3.5"
            />
            <span className="flex-1 truncate">
              {labelMap?.[item.value] || item.value}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {item.count}
            </span>
          </label>
        ))}
      </div>

      {hasMore && !expanded && (
        <button
          type="button"
          className="text-xs text-primary px-3 mt-1 hover:underline"
          onClick={() => setExpanded(true)}
        >
          + {filtered.length - maxVisible} lainnya
        </button>
      )}
      {expanded && hasMore && (
        <button
          type="button"
          className="text-xs text-muted-foreground px-3 mt-1 hover:underline"
          onClick={() => setExpanded(false)}
        >
          Tampilkan lebih sedikit
        </button>
      )}
    </div>
  );
}
```

**Step 3: Create SavedViewList**

Create `apps/web/src/components/triage/SavedViewList.tsx`:
```tsx
import { cn } from '../../lib/utils';
import { Plus } from 'lucide-react';

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, string[]>;
}

interface SavedViewListProps {
  views: SavedView[];
  activeViewId: string | null;
  onSelectView: (id: string) => void;
  onCreateView?: () => void;
  counts?: Record<string, number>; // viewId → count
}

export function SavedViewList({
  views,
  activeViewId,
  onSelectView,
  onCreateView,
  counts,
}: SavedViewListProps) {
  return (
    <div className="py-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
        Views
      </p>
      <div className="space-y-0.5">
        {views.map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() => onSelectView(view.id)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-1.5 text-sm rounded-none transition-colors',
              activeViewId === view.id
                ? 'bg-surface-selected font-medium text-primary'
                : 'hover:bg-surface-hover',
            )}
          >
            <span className="truncate">{view.name}</span>
            {counts?.[view.id] != null && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {counts[view.id]}
              </span>
            )}
          </button>
        ))}
        {onCreateView && (
          <button
            type="button"
            onClick={onCreateView}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover"
          >
            <Plus className="h-3 w-3" />
            Buat View Baru
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Create FilterSidebar**

Create `apps/web/src/components/triage/FilterSidebar.tsx`:
```tsx
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { SavedViewList } from './SavedViewList';
import { FacetGroup } from './FacetGroup';

interface FacetCount {
  value: string;
  count: number;
  checked: boolean;
}

interface FacetDef {
  key: string;
  label: string;
  labelMap?: Record<string, string>;
  searchable?: boolean;
}

interface FilterSidebarProps {
  views: Array<{ id: string; name: string; filters: Record<string, string[]> }>;
  activeViewId: string | null;
  onSelectView: (id: string) => void;
  onCreateView?: () => void;
  viewCounts?: Record<string, number>;
  facets: FacetDef[];
  facetCounts: Record<string, FacetCount[]>;
  onToggleFilter: (dimensionKey: string, value: string) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

export function FilterSidebar({
  views,
  activeViewId,
  onSelectView,
  onCreateView,
  viewCounts,
  facets,
  facetCounts,
  onToggleFilter,
  onResetFilters,
  hasActiveFilters,
}: FilterSidebarProps) {
  return (
    <ScrollArea className="h-full">
      <SavedViewList
        views={views}
        activeViewId={activeViewId}
        onSelectView={onSelectView}
        onCreateView={onCreateView}
        counts={viewCounts}
      />

      <Separator />

      {facets.map((facet) => (
        <FacetGroup
          key={facet.key}
          label={facet.label}
          counts={facetCounts[facet.key] || []}
          onToggle={(value) => onToggleFilter(facet.key, value)}
          labelMap={facet.labelMap}
          searchable={facet.searchable}
        />
      ))}

      {hasActiveFilters && (
        <div className="px-3 py-2">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onResetFilters}>
            Reset Filter
          </Button>
        </div>
      )}
    </ScrollArea>
  );
}
```

**Step 5: Update barrel export**

Add to `apps/web/src/components/triage/index.ts`:
```ts
export { FilterSidebar } from './FilterSidebar';
export { FacetGroup } from './FacetGroup';
export { SavedViewList } from './SavedViewList';
```

**Step 6: Commit**

```bash
git add apps/web/src/components/triage/ apps/web/src/hooks/useSavedViews.ts
git commit -m "feat(web): add FilterSidebar with faceted filters and saved views"
```

---

## Phase 4: Complaints Triage Page

### Task 16: ComplaintTriagePage — wire triage layout to API

**Files:**
- Create: `apps/web/src/pages/ComplaintTriagePage.tsx`
- Modify: `apps/web/src/App.tsx` — swap route

**Step 1: Create the page**

Create `apps/web/src/pages/ComplaintTriagePage.tsx`. This is the full page component that:
1. Fetches complaints from `/complaints` API
2. Maps API data to `TriageRowData` and `TriagePreviewData`
3. Configures facet dimensions (status, category, area)
4. Configures saved views per role
5. Wires keyboard hooks
6. Handles status transitions and assignments via API calls

The page should follow the pattern established in the existing `ComplaintPage.tsx` for API calls but use `TriageLayout` instead of `SmartTable`.

Key wiring:
- `useFacetedFilter` with dimensions: status, category
- `useTriageSelection` with items from filtered results
- `useTriageKeyboard` connected to selection + preview toggle
- `useSavedViews` with default views: "Triage Saya", "SLA Kritis", "Belum Ditugaskan"
- Status transitions: PATCH `/complaints/:id/status` with new status
- Assignment: PATCH `/complaints/:id/assign` with staff ID

**Step 2: Swap route in App.tsx**

Replace the ComplaintPage lazy import with ComplaintTriagePage:
```tsx
const ComplaintTriagePage = React.lazy(() => import('./pages/ComplaintTriagePage'));
// Remove: const ComplaintPage = React.lazy(() => import('./pages/ComplaintPage'));
```

Update route:
```tsx
<Route path="/complaints" element={<ComplaintTriagePage />} />
```

**Step 3: Verify the page loads**

Run: `cd apps/web && pnpm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add apps/web/src/pages/ComplaintTriagePage.tsx apps/web/src/App.tsx
git commit -m "feat(web): add ComplaintTriagePage with triage layout"
```

---

## Phase 5: Command Palette

### Task 17: CommandPalette component

**Files:**
- Create: `apps/web/src/components/triage/CommandPalette.tsx`
- Create: `apps/web/src/hooks/useCommandPalette.ts`

**Step 1: Create useCommandPalette hook**

Create `apps/web/src/hooks/useCommandPalette.ts`:
```ts
import { useState, useEffect, useCallback } from 'react';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  return { open, setOpen, toggle };
}
```

**Step 2: Create CommandPalette component**

Create `apps/web/src/components/triage/CommandPalette.tsx` using shadcn `Command` component (built on cmdk). Sections: Recent, Quick Actions, Navigation. Fuzzy search across all sections. Navigate to pages via react-router.

**Step 3: Wire into DashboardLayout**

Add CommandPalette as a global component rendered in the layout, controlled by `useCommandPalette`.

**Step 4: Commit**

```bash
git add apps/web/src/components/triage/CommandPalette.tsx apps/web/src/hooks/useCommandPalette.ts
git commit -m "feat(web): add Cmd+K command palette with global search"
```

---

## Phase 6: Remaining Triage Pages

### Task 18: TPS Triage Page
Create `apps/web/src/pages/TpsTriagePage.tsx` following the same pattern as ComplaintTriagePage. Facets: type, status, area. Swap route.

### Task 19: Schedule Triage Page
Create `apps/web/src/pages/ScheduleTriagePage.tsx`. Facets: type, status. Group by date default. Swap route.

### Task 20: Payment Triage Page
Create `apps/web/src/pages/PaymentTriagePage.tsx`. Facets: status, type. Swap route.

### Task 21: Fleet Triage Page
Create `apps/web/src/pages/FleetTriagePage.tsx`. Facets: type, status. No filter sidebar (small dataset). Swap route.

Each task follows the same pattern: create page → configure facets/views → swap route → build → commit.

---

## Phase 7: Non-Triage Page Migration (Ant Design → shadcn/ui)

### Task 22: Migrate LoginPage
Replace Ant Design Form/Input/Button/Card with shadcn equivalents + react-hook-form + zod validation.

### Task 23: Migrate StatCard + common components
Rebuild StatCard, StatusBadge, EmptyState, InfoTooltip, ConfirmAction using shadcn primitives + Tailwind.

### Task 24: Migrate DashboardPage + dashboard components
Rebuild ExecutiveDashboard, OperationalDashboard, AttentionQueue, DriverLeaderboard using shadcn Card/Badge + Tailwind. Keep Recharts unchanged.

### Task 25: Migrate UserPage
Replace Ant Design Table/Tabs/Form with shadcn DataTable (TanStack Table) + Tabs + react-hook-form.

### Task 26: Migrate ReportPage
Replace Ant Design Card/Tabs/Statistic with shadcn equivalents. Keep Recharts charts unchanged.

### Task 27: Migrate AnalyticsPage
Replace Ant Design DatePicker/Card/Typography with shadcn equivalents. Keep Recharts charts unchanged.

### Task 28: Migrate LiveOperationsPage
Replace Ant Design placeholder with shadcn Card + Tailwind layout.

### Task 29: Migrate feedback components
Rebuild NotificationBell, KeyboardShortcuts, OnboardingTour, RealtimeToast, ActivityFeed using shadcn/Tailwind.

---

## Phase 8: Layout Migration

### Task 30: Migrate AppSidebar
Replace Ant Design Layout.Sider/Menu with custom Tailwind sidebar. Keep menu config structure. Use Lucide icons.

### Task 31: Migrate AppHeader
Replace Ant Design Layout.Header with Tailwind flex header.

### Task 32: Migrate DashboardLayout
Replace Ant Design Layout wrapper with Tailwind flex layout. Wire new sidebar + header.

### Task 33: Migrate main.tsx entry point
Remove Ant Design ConfigProvider + locale. Add Sonner Toaster. Import new globals.css instead of styles.css + antd.

---

## Phase 9: Cleanup

### Task 34: Remove Ant Design dependencies

```bash
cd apps/web && pnpm remove antd @ant-design/icons
```

Verify build: `pnpm run build`
Verify no imports remain: `grep -r "from 'antd'" src/` should return nothing.

### Task 35: Remove old theme files

Delete:
- `apps/web/src/theme/config.ts` (Ant Design theme config)
- `apps/web/src/theme/styles.css` (old CSS with Ant overrides)
- `apps/web/src/theme/colors.ts` (replaced by tokens.ts)

Update any remaining imports to use `theme/tokens.ts`.

### Task 36: Final verification

Run:
```bash
cd apps/web && pnpm run build
cd apps/api && npx jest
```

Expected: Build succeeds with no Ant Design references. All API tests pass. Bundle size should be smaller (no antd CSS-in-JS runtime).

Commit:
```bash
git add -A
git commit -m "chore(web): remove Ant Design, complete shadcn/ui migration"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1. Foundation | 1–3 | Tailwind v4, shadcn/ui, IBM Plex Mono, tokens |
| 2. Core Triage | 4–13 | SLA, Stepper, List, Preview, Layout, hooks |
| 3. Filters | 14–15 | Faceted filters, saved views, sidebar |
| 4. Complaints | 16 | First triage page (highest value) |
| 5. Command Palette | 17 | Cmd+K global search |
| 6. Remaining Triage | 18–21 | TPS, Schedules, Payments, Fleet |
| 7. Page Migration | 22–29 | Login, Dashboard, Users, Reports, etc. |
| 8. Layout Migration | 30–33 | Sidebar, Header, Layout, entry point |
| 9. Cleanup | 34–36 | Remove antd, old files, verify |

**Total: 36 tasks across 9 phases**
