# Phase 1: Design System Foundation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the basic Ant Design theme with an enterprise-grade design system featuring semantic colors, animation tokens, and typography refinements.

**Depends on:** Nothing — this is the foundation.

---

### Task 1: Animation & Layout CSS Tokens

**Files:**
- Modify: `apps/web/src/theme/styles.css`

**Step 1: Add animation and layout tokens to styles.css**

Add these CSS custom properties at the top of the `:root` block (before existing vars). Keep all existing styles intact.

```css
:root {
  /* Animation tokens */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Semantic colors */
  --color-organic: #22C55E;
  --color-inorganic: #3B82F6;
  --color-b3: #EF4444;
  --color-recyclable: #F59E0B;
  --color-positive: #22C55E;
  --color-neutral: #6B7280;
  --color-negative: #EF4444;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;

  /* Layout */
  --sidebar-width: 240px;
  --sidebar-collapsed-width: 64px;
  --header-height: 56px;

  /* existing vars below... */
}
```

**Step 2: Add reduced motion support**

Append to end of styles.css:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 3: Add slide-over panel styles**

Append to styles.css:

```css
.slide-over-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  opacity: 0;
  transition: opacity var(--duration-normal) var(--ease-out);
}

.slide-over-backdrop.open {
  opacity: 1;
}

.slide-over-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 480px;
  max-width: 100vw;
  background: #fff;
  z-index: 201;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
  transform: translateX(100%);
  transition: transform var(--duration-normal) var(--ease-out);
  display: flex;
  flex-direction: column;
}

.slide-over-panel.open {
  transform: translateX(0);
}

.slide-over-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slide-over-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.slide-over-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
```

**Step 4: Add page transition styles**

```css
.page-content-enter {
  opacity: 0;
  transform: translateY(8px);
}

.page-content-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}

.row-highlight {
  animation: row-flash 1s ease-out;
}

@keyframes row-flash {
  0% { background-color: #fef9c3; }
  100% { background-color: transparent; }
}
```

**Step 5: Commit**

```bash
git add apps/web/src/theme/styles.css
git commit -m "feat(web): add design system CSS tokens for animations, colors, and layout"
```

---

### Task 2: Update Ant Design Theme Config

**Files:**
- Modify: `apps/web/src/theme/config.ts`

**Step 1: Update theme config with refined tokens**

Replace entire config.ts content:

```ts
import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#2563EB',
    colorSuccess: '#22C55E',
    colorWarning: '#F59E0B',
    colorError: '#EF4444',
    colorInfo: '#3B82F6',

    colorBgLayout: '#FAFAFA',
    colorBgContainer: '#FFFFFF',
    colorBgElevated: '#FFFFFF',
    colorBorder: '#E5E7EB',
    colorBorderSecondary: '#F3F4F6',

    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 22,
    fontSizeHeading3: 18,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,
    fontSizeSM: 12,

    controlHeight: 36,
    controlHeightLG: 40,
    controlHeightSM: 28,

    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
    boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.08)',

    lineHeight: 1.6,
    marginXS: 4,
    marginSM: 8,
    margin: 16,
    marginLG: 24,
    marginXL: 32,
  },
  components: {
    Card: {
      paddingLG: 20,
      borderRadiusLG: 12,
    },
    Table: {
      headerBg: '#FAFAFA',
      headerColor: '#6B7280',
      rowHoverBg: '#F9FAFB',
      headerSortActiveBg: '#F3F4F6',
      fontSize: 13,
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#4B5563',
      itemSelectedColor: '#2563EB',
      itemSelectedBg: '#EFF6FF',
      itemHoverColor: '#1F2937',
      itemHoverBg: '#F9FAFB',
      groupTitleColor: '#9CA3AF',
      groupTitleFontSize: 11,
    },
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none',
    },
    Input: {
      activeShadow: '0 0 0 2px rgba(37, 99, 235, 0.15)',
    },
    Select: {
      optionActiveBg: '#F3F4F6',
      optionSelectedBg: '#EFF6FF',
    },
    Drawer: {
      paddingLG: 24,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Badge: {
      dotSize: 8,
    },
    Tabs: {
      inkBarColor: '#2563EB',
      itemActiveColor: '#2563EB',
      itemSelectedColor: '#2563EB',
      itemHoverColor: '#4B5563',
    },
    Tooltip: {
      borderRadius: 6,
    },
  },
};
```

**Step 2: Commit**

```bash
git add apps/web/src/theme/config.ts
git commit -m "feat(web): update Ant Design theme with enterprise color palette and refined tokens"
```

---

### Task 3: Install framer-motion

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install framer-motion**

```bash
cd /opt/buzzr && pnpm add framer-motion --filter=@buzzr/web
```

**Step 2: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add framer-motion for animation system"
```

---

### Task 4: Create Color Constants Module

**Files:**
- Create: `apps/web/src/theme/colors.ts`

**Step 1: Create semantic color constants**

```ts
export const WASTE_COLORS = {
  organic: '#22C55E',
  inorganic: '#3B82F6',
  b3: '#EF4444',
  recyclable: '#F59E0B',
} as const;

export const STATUS_COLORS = {
  positive: '#22C55E',
  neutral: '#6B7280',
  negative: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const;

export const CHART_COLORS = [
  '#2563EB', '#22C55E', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
] as const;

export const SEVERITY_COLORS = {
  critical: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const;
```

**Step 2: Commit**

```bash
git add apps/web/src/theme/colors.ts
git commit -m "feat(web): add semantic color constants module"
```

---

### Task 5: Update StatusBadge Colors

**Files:**
- Modify: `apps/web/src/components/common/StatusBadge.tsx`

**Step 1: Update color mapping to new palette**

Replace the `statusColors` mapping with refined colors that match the new design system. Update the component to use the new semantic naming.

Replace the entire statusColors record:

```ts
const statusColors: Record<string, string> = {
  // TPS
  active: 'green',
  full: 'red',
  maintenance: 'orange',
  // Complaints
  submitted: 'blue',
  verified: 'cyan',
  assigned: 'orange',
  in_progress: 'gold',
  resolved: 'green',
  rejected: 'red',
  // Payments
  pending: 'orange',
  paid: 'green',
  failed: 'red',
  expired: 'default',
  refunded: 'purple',
  // Vehicles
  available: 'green',
  in_use: 'blue',
  // Schedules
  completed: 'green',
  cancelled: 'red',
  // Users
  inactive: 'red',
};
```

No functional changes needed — the color strings stay the same for Ant Design Tags. The StatusBadge component itself is fine.

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/components/common/StatusBadge.tsx
git commit -m "feat(web): verify StatusBadge compatibility with new design system"
```
