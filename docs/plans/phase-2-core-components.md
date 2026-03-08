# Phase 2: Core Components

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build foundational components used across the redesign: permissions hook, slide-over panel, enhanced stat cards, progress ring, and count-up animation.

**Depends on:** Phase 1 (design tokens and colors).

---

### Task 6: Create usePermission Hook

**Files:**
- Create: `apps/web/src/hooks/usePermission.ts`

**Step 1: Create the permission hook**

```ts
import { useAuthStore } from '../stores/auth.store';

const PERMISSIONS: Record<string, string[]> = {
  super_admin: [
    'tenant:manage', 'user:create', 'user:edit', 'user:delete',
    'tps:create', 'tps:edit', 'tps:delete', 'tps:record_waste',
    'complaint:assign', 'complaint:resolve', 'complaint:reject',
    'schedule:create', 'schedule:edit', 'schedule:delete',
    'fleet:create', 'fleet:edit', 'fleet:assign_driver',
    'payment:create', 'payment:view_all',
    'report:view', 'analytics:view',
    'area:create', 'area:edit',
    'audit:view', 'settings:manage',
  ],
  dlh_admin: [
    'user:create', 'user:edit',
    'tps:create', 'tps:edit', 'tps:record_waste',
    'complaint:assign', 'complaint:resolve', 'complaint:reject',
    'schedule:create', 'schedule:edit',
    'fleet:create', 'fleet:edit', 'fleet:assign_driver',
    'payment:create', 'payment:view_all',
    'report:view', 'analytics:view',
    'area:create', 'area:edit',
  ],
  tps_operator: [
    'tps:record_waste', 'tps:view',
    'schedule:view',
  ],
  driver: [
    'schedule:update_status', 'schedule:view',
    'transfer:create', 'transfer:view',
    'fleet:view_own',
  ],
  sweeper: [
    'complaint:update_status', 'tps:record_waste',
  ],
  tpst_operator: [
    'transfer:verify', 'transfer:view',
    'schedule:view',
  ],
  collector: [],
  citizen: [],
};

export function usePermission() {
  const { user } = useAuthStore();
  const role = user?.role || '';
  const perms = PERMISSIONS[role] || [];

  const can = (permission: string): boolean => perms.includes(permission);

  const canAny = (...permissions: string[]): boolean =>
    permissions.some((p) => perms.includes(p));

  const isExecutive = ['dlh_admin', 'super_admin'].includes(role);
  const isSuperAdmin = role === 'super_admin';

  return { can, canAny, isExecutive, isSuperAdmin, role };
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/usePermission.ts
git commit -m "feat(web): add usePermission hook for role-based UI"
```

---

### Task 7: Create SlideOver Component

**Files:**
- Create: `apps/web/src/components/common/SlideOver.tsx`

**Step 1: Create the SlideOver component**

Uses CSS classes from Phase 1 Task 1 plus framer-motion for content stagger.

```tsx
import React, { useEffect } from 'react';
import { Typography, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Title } = Typography;

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  open,
  onClose,
  title,
  width = 480,
  footer,
  children,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="slide-over-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{ opacity: 1 }}
          />
          <motion.div
            className="slide-over-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ width, transform: 'none' }}
          >
            <div className="slide-over-header">
              <Title level={5} style={{ margin: 0 }}>{title}</Title>
              <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
            </div>
            <div className="slide-over-body">
              {children}
            </div>
            {footer && (
              <div className="slide-over-footer">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/common/SlideOver.tsx
git commit -m "feat(web): add SlideOver panel component with framer-motion"
```

---

### Task 8: Create Sparkline Component

**Files:**
- Create: `apps/web/src/components/common/Sparkline.tsx`

**Step 1: Create mini sparkline chart**

```tsx
import React from 'react';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#2563EB',
  height = 32,
  showTooltip = true,
}) => {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={true}
          animationDuration={600}
        />
        {showTooltip && (
          <Tooltip
            contentStyle={{
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #e5e7eb',
            }}
            formatter={(value: number) => [value.toLocaleString('id-ID'), '']}
            labelFormatter={() => ''}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/common/Sparkline.tsx
git commit -m "feat(web): add Sparkline mini chart component"
```

---

### Task 9: Create ProgressRing Component

**Files:**
- Create: `apps/web/src/components/common/ProgressRing.tsx`

**Step 1: Create animated progress ring**

```tsx
import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  suffix?: string;
}

const getColor = (value: number): string => {
  if (value >= 80) return '#22C55E';
  if (value >= 50) return '#F59E0B';
  return '#EF4444';
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 80,
  strokeWidth = 6,
  label,
  suffix = '%',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const color = getColor(value);

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: `stroke-dashoffset 500ms cubic-bezier(0.34, 1.56, 0.64, 1), stroke 300ms ease`,
          }}
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: 'center',
            fontSize: size * 0.22,
            fontWeight: 600,
            fill: '#1F2937',
          }}
        >
          {Math.round(value)}{suffix}
        </text>
      </svg>
      {label && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
          {label}
        </Text>
      )}
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/common/ProgressRing.tsx
git commit -m "feat(web): add ProgressRing animated gauge component"
```

---

### Task 10: Update Common Components Barrel Export

**Files:**
- Modify: `apps/web/src/components/common/index.ts`

**Step 1: Add new exports**

```ts
export { PageHeader } from './PageHeader';
export { InfoTooltip } from './InfoTooltip';
export { StatCard } from './StatCard';
export { StatusBadge } from './StatusBadge';
export { EmptyState } from './EmptyState';
export { ConfirmAction } from './ConfirmAction';
export { SlideOver } from './SlideOver';
export { Sparkline } from './Sparkline';
export { ProgressRing } from './ProgressRing';
```

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/components/common/index.ts
git commit -m "feat(web): export new core components from barrel"
```
