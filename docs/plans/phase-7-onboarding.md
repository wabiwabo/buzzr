# Phase 7: Onboarding System

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a three-layer onboarding system: welcome flow for first login, progressive checklist for feature discovery, and contextual help tooltips.

**Depends on:** Phase 3 (DashboardLayout for sidebar integration).

---

### Task 32: Create WelcomeFlow Component

**Files:**
- Create: `apps/web/src/components/onboarding/WelcomeFlow.tsx`

**Step 1: Create full-screen welcome sequence for first login**

```tsx
import React, { useState } from 'react';
import { Button, Typography, Space, Switch } from 'antd';
import { RocketOutlined, BellOutlined, DashboardOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;

interface WelcomeFlowProps {
  userName: string;
  onComplete: () => void;
}

interface WelcomeStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  content?: React.ReactNode;
}

export const WelcomeFlow: React.FC<WelcomeFlowProps> = ({ userName, onComplete }) => {
  const [current, setCurrent] = useState(0);

  const steps: WelcomeStep[] = [
    {
      icon: <RocketOutlined style={{ fontSize: 48, color: '#2563EB' }} />,
      title: `Selamat Datang, ${userName}!`,
      description: 'Buzzr membantu Anda mengelola operasional persampahan dengan lebih efisien.',
    },
    {
      icon: <BellOutlined style={{ fontSize: 48, color: '#2563EB' }} />,
      title: 'Preferensi Notifikasi',
      description: 'Pilih jenis notifikasi yang ingin Anda terima.',
      content: (
        <div style={{ maxWidth: 320, margin: '0 auto' }}>
          {[
            { label: 'TPS Penuh', desc: 'Notifikasi saat TPS mendekati kapasitas' },
            { label: 'Keluhan Baru', desc: 'Notifikasi saat ada laporan warga' },
            { label: 'SLA Mendekati Batas', desc: 'Peringatan batas waktu penyelesaian' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div>
                <Text strong style={{ fontSize: 13 }}>{item.label}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>{item.desc}</Text>
              </div>
              <Switch defaultChecked size="small" />
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <DashboardOutlined style={{ fontSize: 48, color: '#2563EB' }} />,
      title: 'Siap Mulai!',
      description: 'Dashboard Anda sudah siap. Jelajahi fitur-fitur yang tersedia.',
    },
  ];

  const isLast = current === steps.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}
        >
          <div style={{ marginBottom: 24 }}>{steps[current].icon}</div>
          <Title level={3}>{steps[current].title}</Title>
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            {steps[current].description}
          </Paragraph>
          {steps[current].content && (
            <div style={{ marginBottom: 32 }}>{steps[current].content}</div>
          )}
          <Space>
            {current > 0 && (
              <Button onClick={() => setCurrent(current - 1)}>Kembali</Button>
            )}
            {isLast ? (
              <Button type="primary" size="large" onClick={onComplete}>
                Mulai Menggunakan Buzzr
              </Button>
            ) : (
              <Button type="primary" onClick={() => setCurrent(current + 1)}>
                Lanjut
              </Button>
            )}
          </Space>
          <div style={{ marginTop: 16 }}>
            <Button type="link" size="small" onClick={onComplete}>
              Lewati
            </Button>
          </div>
          {/* Step indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === current ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === current ? '#2563EB' : '#E5E7EB',
                  transition: 'all 250ms ease',
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/onboarding/WelcomeFlow.tsx
git commit -m "feat(web): add WelcomeFlow full-screen onboarding sequence"
```

---

### Task 33: Create ProgressChecklist Component

**Files:**
- Create: `apps/web/src/components/onboarding/ProgressChecklist.tsx`

**Step 1: Create sidebar-docked checklist for feature discovery**

```tsx
import React, { useState } from 'react';
import { Typography, Progress, Button } from 'antd';
import { CheckCircleFilled, RightOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

export interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  path: string;
  completed: boolean;
}

interface ProgressChecklistProps {
  items: ChecklistItem[];
  onDismiss: () => void;
  onItemClick?: (key: string) => void;
}

export const ProgressChecklist: React.FC<ProgressChecklistProps> = ({
  items,
  onDismiss,
  onItemClick,
}) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const completedCount = items.filter((i) => i.completed).length;
  const pct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  if (!expanded) {
    return (
      <div
        onClick={() => setExpanded(true)}
        style={{
          padding: '8px 16px', cursor: 'pointer', borderTop: '1px solid #F3F4F6',
          display: 'flex', alignItems: 'center', gap: 8,
        }}
      >
        <Progress type="circle" percent={pct} size={24} strokeWidth={8} />
        <Text style={{ fontSize: 12 }}>Setup {completedCount}/{items.length}</Text>
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid #F3F4F6', padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 13 }}>Setup Awal</Text>
        <Button type="text" size="small" icon={<CloseOutlined />} onClick={onDismiss} />
      </div>
      <Progress percent={pct} size="small" strokeColor="#2563EB" style={{ marginBottom: 8 }} />
      <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
        {completedCount} dari {items.length} selesai
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item) => (
          <div
            key={item.key}
            onClick={() => {
              onItemClick?.(item.key);
              navigate(item.path);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
              background: item.completed ? '#F0FDF4' : 'transparent',
            }}
          >
            <CheckCircleFilled style={{ color: item.completed ? '#22C55E' : '#D1D5DB', fontSize: 14 }} />
            <div style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, textDecoration: item.completed ? 'line-through' : 'none' }}>
                {item.label}
              </Text>
            </div>
            {!item.completed && <RightOutlined style={{ fontSize: 10, color: '#9CA3AF' }} />}
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/onboarding/ProgressChecklist.tsx
git commit -m "feat(web): add ProgressChecklist for guided feature discovery"
```

---

### Task 34: Create Onboarding Barrel Export and Hook

**Files:**
- Create: `apps/web/src/components/onboarding/index.ts`
- Create: `apps/web/src/hooks/useChecklist.ts`

**Step 1: Create useChecklist hook**

```ts
import { useState, useEffect } from 'react';
import type { ChecklistItem } from '../components/onboarding/ProgressChecklist';

const STORAGE_KEY = 'buzzr_checklist';
const DISMISSED_KEY = 'buzzr_checklist_dismissed';

interface UseChecklistReturn {
  items: ChecklistItem[];
  dismissed: boolean;
  markComplete: (key: string) => void;
  dismiss: () => void;
  reset: () => void;
}

const DEFAULT_ITEMS: Omit<ChecklistItem, 'completed'>[] = [
  { key: 'view_dashboard', label: 'Lihat Dashboard', description: 'Kunjungi halaman utama', path: '/' },
  { key: 'view_tps', label: 'Lihat Data TPS', description: 'Cek daftar TPS', path: '/tps' },
  { key: 'view_complaints', label: 'Lihat Laporan Warga', description: 'Pantau keluhan masuk', path: '/complaints' },
  { key: 'view_fleet', label: 'Lihat Armada', description: 'Cek kendaraan dan driver', path: '/fleet' },
  { key: 'view_schedules', label: 'Lihat Jadwal', description: 'Pantau jadwal pengangkutan', path: '/schedules' },
  { key: 'view_analytics', label: 'Buka Analytics', description: 'Jelajahi laporan analisis', path: '/analytics' },
];

export function useChecklist(): UseChecklistReturn {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(DISMISSED_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]));
  }, [completed]);

  const items: ChecklistItem[] = DEFAULT_ITEMS.map((item) => ({
    ...item,
    completed: completed.has(item.key),
  }));

  const markComplete = (key: string) => {
    setCompleted((prev) => new Set([...prev, key]));
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  const reset = () => {
    setCompleted(new Set());
    setDismissed(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DISMISSED_KEY);
  };

  return { items, dismissed, markComplete, dismiss, reset };
}
```

**Step 2: Create barrel export**

```ts
export { WelcomeFlow } from './WelcomeFlow';
export { ProgressChecklist } from './ProgressChecklist';
```

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/index.ts apps/web/src/hooks/useChecklist.ts
git commit -m "feat(web): add onboarding barrel export and useChecklist hook"
```

---

### Task 35: Integrate Onboarding into DashboardLayout

**Files:**
- Modify: `apps/web/src/layouts/DashboardLayout.tsx`

**Step 1: Add WelcomeFlow and ProgressChecklist**

Import and integrate:

```tsx
import { WelcomeFlow, ProgressChecklist } from '../components/onboarding';
import { useChecklist } from '../hooks/useChecklist';
```

Add state for welcome flow visibility:

```tsx
const [showWelcome, setShowWelcome] = useState(() => {
  return localStorage.getItem('buzzr_welcome_done') !== 'true';
});
const checklist = useChecklist();
```

Add welcome flow handler:

```tsx
const handleWelcomeComplete = () => {
  setShowWelcome(false);
  localStorage.setItem('buzzr_welcome_done', 'true');
};
```

Add WelcomeFlow before the layout:

```tsx
{showWelcome && <WelcomeFlow userName={user?.name || 'User'} onComplete={handleWelcomeComplete} />}
```

Add ProgressChecklist in the sidebar footer area (inside AppSidebar or at the bottom of sidebar content):

```tsx
{!checklist.dismissed && (
  <ProgressChecklist
    items={checklist.items}
    onDismiss={checklist.dismiss}
    onItemClick={checklist.markComplete}
  />
)}
```

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/layouts/DashboardLayout.tsx
git commit -m "feat(web): integrate WelcomeFlow and ProgressChecklist into layout"
```
