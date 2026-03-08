# Phase 9: Animation & Polish

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add page transitions, chart animation enhancements, loading skeletons, and verify `prefers-reduced-motion` support across all animated components.

**Depends on:** All previous phases.

---

### Task 41: Add Page Transition Wrapper

**Files:**
- Create: `apps/web/src/components/common/PageTransition.tsx`
- Modify: `apps/web/src/components/common/index.ts`

**Step 1: Create fade+slide page transition component**

```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);
```

**Step 2: Add to barrel export**

Append to `apps/web/src/components/common/index.ts`:

```ts
export { PageTransition } from './PageTransition';
```

**Step 3: Commit**

```bash
git add apps/web/src/components/common/PageTransition.tsx apps/web/src/components/common/index.ts
git commit -m "feat(web): add PageTransition fade+slide wrapper component"
```

---

### Task 42: Wrap Pages with PageTransition

**Files:**
- Modify: `apps/web/src/pages/DashboardPage.tsx`
- Modify: `apps/web/src/pages/TpsPage.tsx`
- Modify: `apps/web/src/pages/ComplaintPage.tsx`
- Modify: `apps/web/src/pages/FleetPage.tsx`
- Modify: `apps/web/src/pages/SchedulePage.tsx`
- Modify: `apps/web/src/pages/PaymentPage.tsx`
- Modify: `apps/web/src/pages/UserPage.tsx`
- Modify: `apps/web/src/pages/ReportPage.tsx`

**Step 1: Add PageTransition to each page**

For each page component, wrap the return JSX with `<PageTransition>`:

```tsx
import { PageTransition } from '../components/common';

// In the return:
return (
  <PageTransition>
    <div>
      {/* existing content */}
    </div>
  </PageTransition>
);
```

Also add to `AnalyticsPage.tsx` if it exists from Phase 6.

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/*.tsx
git commit -m "feat(web): wrap all pages with PageTransition for smooth navigation"
```

---

### Task 43: Add Loading Skeletons to Dashboard

**Files:**
- Modify: `apps/web/src/pages/DashboardPage.tsx`

**Step 1: Replace simple loading states with Ant Design Skeleton**

Replace the loading prop on StatCards and chart containers with proper skeleton layouts that match the actual content shape.

Key changes:
- Import `Skeleton` from antd
- When `loading` is true, render skeleton blocks matching the StatCard/chart dimensions:

```tsx
{loading ? (
  <Card>
    <Skeleton active paragraph={{ rows: 1 }} />
  </Card>
) : (
  <StatCard ... />
)}
```

For chart loading states:
```tsx
{loading ? (
  <Card size="small">
    <Skeleton.Node active style={{ width: '100%', height: 320 }}>
      <div style={{ width: '100%', height: 320 }} />
    </Skeleton.Node>
  </Card>
) : (
  <WasteTrendChart ... />
)}
```

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/DashboardPage.tsx
git commit -m "feat(web): add loading skeletons matching content layout to Dashboard"
```

---

### Task 44: Verify Reduced Motion Support and Final Polish

**Files:**
- Modify: `apps/web/src/theme/styles.css` (verify media query exists from Phase 1)
- Modify: `apps/web/src/components/common/PageTransition.tsx`

**Step 1: Add reduced motion hook**

Create `apps/web/src/hooks/useReducedMotion.ts`:

```ts
import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return reduced;
}
```

**Step 2: Update PageTransition to respect reduced motion**

```tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const reduced = useReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};
```

**Step 3: Verify CSS media query exists in styles.css**

Confirm this block is present (added in Phase 1 Task 1):

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Step 4: Final build verification**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 5: Commit**

```bash
git add apps/web/src/hooks/useReducedMotion.ts apps/web/src/components/common/PageTransition.tsx
git commit -m "feat(web): add reduced motion support and final animation polish"
```
