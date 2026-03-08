# Phase 5: Smart Forms

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace modal-based forms with slide-over panels, add quick action popovers, and create a multi-step wizard for complex flows.

**Depends on:** Phase 2 (SlideOver component).

---

### Task 22: Create QuickAction Popover Component

**Files:**
- Create: `apps/web/src/components/common/QuickAction.tsx`

**Step 1: Create inline quick action popover**

```tsx
import React, { useState } from 'react';
import { Popover, Button, Space } from 'antd';

interface QuickActionProps {
  title: string;
  trigger: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  loading?: boolean;
  children: React.ReactNode;
}

export const QuickAction: React.FC<QuickActionProps> = ({
  title,
  trigger,
  onConfirm,
  confirmLabel = 'Konfirmasi',
  loading = false,
  children,
}) => {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <Popover
      title={title}
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      content={
        <div style={{ minWidth: 240 }}>
          {children}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button size="small" onClick={() => setOpen(false)}>Batal</Button>
            <Button size="small" type="primary" onClick={handleConfirm} loading={loading}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      }
    >
      {trigger}
    </Popover>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/common/QuickAction.tsx
git commit -m "feat(web): add QuickAction popover for inline form actions"
```

---

### Task 23: Create StepWizard Component

**Files:**
- Create: `apps/web/src/components/common/StepWizard.tsx`

**Step 1: Create multi-step wizard with step indicator**

```tsx
import React, { useState } from 'react';
import { Steps, Button, Typography } from 'antd';
import { SlideOver } from './SlideOver';

const { Title, Text } = Typography;

interface WizardStep {
  title: string;
  content: React.ReactNode;
  validate?: () => boolean;
}

interface StepWizardProps {
  open: boolean;
  onClose: () => void;
  title: string;
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  completeLabel?: string;
  loading?: boolean;
  width?: number;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  open,
  onClose,
  title,
  steps,
  onComplete,
  completeLabel = 'Simpan',
  loading = false,
  width = 560,
}) => {
  const [current, setCurrent] = useState(0);

  const handleNext = () => {
    const step = steps[current];
    if (step.validate && !step.validate()) return;
    setCurrent(current + 1);
  };

  const handleBack = () => setCurrent(Math.max(0, current - 1));

  const handleComplete = async () => {
    await onComplete();
    setCurrent(0);
  };

  const handleClose = () => {
    setCurrent(0);
    onClose();
  };

  const isLast = current === steps.length - 1;

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      title={title}
      width={width}
      footer={
        <>
          {current > 0 && (
            <Button onClick={handleBack}>Kembali</Button>
          )}
          <div style={{ flex: 1 }} />
          <Button onClick={handleClose}>Batal</Button>
          {isLast ? (
            <Button type="primary" onClick={handleComplete} loading={loading}>
              {completeLabel}
            </Button>
          ) : (
            <Button type="primary" onClick={handleNext}>
              Lanjut
            </Button>
          )}
        </>
      }
    >
      <Steps
        current={current}
        size="small"
        items={steps.map((s) => ({ title: s.title }))}
        style={{ marginBottom: 24 }}
      />
      {steps[current]?.content}
    </SlideOver>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/common/StepWizard.tsx
git commit -m "feat(web): add StepWizard multi-step form component"
```

---

### Task 24: Create VisualSelector Component

**Files:**
- Create: `apps/web/src/components/common/VisualSelector.tsx`

**Step 1: Create card-based visual selector (replaces dropdowns for small option sets)**

```tsx
import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface VisualSelectorProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
}

export const VisualSelector: React.FC<VisualSelectorProps> = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', gap: 12 }}>
    {options.map((opt) => {
      const selected = value === opt.value;
      return (
        <div
          key={opt.value}
          onClick={() => onChange?.(opt.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 8,
            border: `2px solid ${selected ? '#2563EB' : '#E5E7EB'}`,
            background: selected ? '#EFF6FF' : '#FAFAFA',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all var(--duration-fast) ease',
          }}
        >
          {opt.icon && <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>}
          <Text strong style={{ fontSize: 13, color: selected ? '#2563EB' : '#1F2937' }}>
            {opt.label}
          </Text>
          {opt.description && (
            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
              {opt.description}
            </Text>
          )}
        </div>
      );
    })}
  </div>
);
```

**Step 2: Commit**

```bash
git add apps/web/src/components/common/VisualSelector.tsx
git commit -m "feat(web): add VisualSelector card-based option picker"
```

---

### Task 25: Update Common Barrel Export

**Files:**
- Modify: `apps/web/src/components/common/index.ts`

**Step 1: Add new form components**

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
export { QuickAction } from './QuickAction';
export { StepWizard } from './StepWizard';
export { VisualSelector } from './VisualSelector';
```

**Step 2: Commit**

```bash
git add apps/web/src/components/common/index.ts
git commit -m "feat(web): export form components from barrel"
```

---

### Task 26: Migrate FleetPage to SlideOver Form

**Files:**
- Modify: `apps/web/src/pages/FleetPage.tsx`

**Step 1: Replace Modal with SlideOver and add VisualSelector for vehicle type**

In FleetPage, replace `<Modal>` with `<SlideOver>` for the create vehicle form. Replace the vehicle type `<Select>` with `<VisualSelector>`. Keep all existing table/data logic unchanged.

Key changes:
- Import `SlideOver` and `VisualSelector` from `../components/common`
- Remove `Modal` from antd imports
- Replace `<Modal ... footer={null}>` with `<SlideOver open={modalOpen} onClose={...} title="Tambah Kendaraan" footer={<buttons>}>`
- Replace vehicle type Select with VisualSelector options: `[{ value: 'truk', label: 'Truk', icon: '🚛' }, { value: 'gerobak', label: 'Gerobak', icon: '🛻' }, { value: 'motor', label: 'Motor', icon: '🏍️' }]`

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/FleetPage.tsx
git commit -m "feat(web): migrate FleetPage form to SlideOver with VisualSelector"
```
