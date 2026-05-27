# Phase 6: Notifications, Onboarding & Keyboard Shortcuts

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add real-time notification system, guided onboarding tour, and keyboard shortcuts.

**Depends on:** Phase 1-3 complete. Phase 4-5 recommended.

---

### Task 22: Real-time Toast Notifications via WebSocket

**Files:**
- Create: `apps/web/src/components/feedback/RealtimeToast.tsx`
- Modify: `apps/web/src/layouts/DashboardLayout.tsx`

**Step 1: Create RealtimeToast**

This component listens to WebSocket events and shows toast notifications.

Create `apps/web/src/components/feedback/RealtimeToast.tsx`:

```tsx
import React, { useEffect } from 'react';
import { notification, Button } from 'antd';
import { AlertOutlined, EnvironmentOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useNotificationStore } from '../../stores/notification.store';

const typeConfig: Record<string, { icon: React.ReactNode; path: string }> = {
  complaint_new: { icon: <AlertOutlined style={{ color: '#1677ff' }} />, path: '/complaints' },
  tps_full: { icon: <EnvironmentOutlined style={{ color: '#ff4d4f' }} />, path: '/tps' },
  payment_overdue: { icon: <DollarOutlined style={{ color: '#faad14' }} />, path: '/payments' },
};

export const RealtimeToast: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification, fetchUnreadCount } = useNotificationStore();
  const [api, contextHolder] = notification.useNotification();

  useSocket('notification', (data: any) => {
    const config = typeConfig[data.type] || { icon: <AlertOutlined />, path: '/' };

    addNotification({
      id: data.id || Date.now().toString(),
      type: data.type,
      title: data.title || 'Notifikasi Baru',
      message: data.message || '',
      read: false,
      created_at: new Date().toISOString(),
      metadata: data.metadata,
    });

    fetchUnreadCount();

    api.open({
      message: data.title || 'Notifikasi Baru',
      description: data.message,
      icon: config.icon,
      btn: (
        <Button type="link" size="small" onClick={() => navigate(config.path)}>
          Lihat
        </Button>
      ),
      duration: 8,
      placement: 'topRight',
    });
  });

  return <>{contextHolder}</>;
};
```

**Step 2: Add RealtimeToast to DashboardLayout**

In `DashboardLayout.tsx`, add inside the Layout after `<AppHeader>`:

```tsx
import { RealtimeToast } from '../components/feedback/RealtimeToast';

// Inside the component return, after <AppHeader>:
<RealtimeToast />
```

**Step 3: Commit**

```bash
git add apps/web/src/components/feedback/RealtimeToast.tsx apps/web/src/layouts/DashboardLayout.tsx
git commit -m "feat(web): add real-time toast notifications via WebSocket"
```

---

### Task 23: Onboarding Tour

**Files:**
- Create: `apps/web/src/components/feedback/OnboardingTour.tsx`
- Create: `apps/web/src/hooks/useOnboarding.ts`
- Modify: `apps/web/src/layouts/DashboardLayout.tsx`

**Step 1: Create useOnboarding hook**

Create `apps/web/src/hooks/useOnboarding.ts`:

```ts
import { useState, useCallback } from 'react';

const TOUR_KEY = 'buzzr_tour_completed';

export function useOnboarding() {
  const [tourOpen, setTourOpen] = useState(() => {
    return !localStorage.getItem(TOUR_KEY);
  });

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_KEY, 'true');
    setTourOpen(false);
  }, []);

  const restartTour = useCallback(() => {
    localStorage.removeItem(TOUR_KEY);
    setTourOpen(true);
  }, []);

  return { tourOpen, completeTour, restartTour };
}
```

**Step 2: Create OnboardingTour**

Create `apps/web/src/components/feedback/OnboardingTour.tsx`:

```tsx
import React, { useRef } from 'react';
import { Tour } from 'antd';
import type { TourProps } from 'antd';

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
  refs: {
    sidebar?: React.RefObject<HTMLElement>;
    dashboard?: React.RefObject<HTMLElement>;
    notificationBell?: React.RefObject<HTMLElement>;
    globalSearch?: React.RefObject<HTMLElement>;
  };
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose, refs }) => {
  const steps: TourProps['steps'] = [
    {
      title: 'Selamat Datang di Buzzr!',
      description: 'Buzzr membantu Anda mengelola operasional persampahan. Mari kami tunjukkan fitur utamanya dalam 1 menit.',
      cover: null,
      target: null,
    },
    {
      title: 'Dashboard',
      description: 'Pantau semua operasional dari satu layar: status TPS, driver aktif, dan complaint yang butuh perhatian.',
      target: refs.dashboard?.current || null,
    },
    {
      title: 'Pencarian Global',
      description: 'Cari TPS, pengguna, atau laporan dari mana saja. Tekan "/" untuk fokus langsung ke pencarian.',
      target: refs.globalSearch?.current || null,
    },
    {
      title: 'Notifikasi',
      description: 'Notifikasi real-time untuk complaint baru, TPS penuh, dan pembayaran jatuh tempo.',
      target: refs.notificationBell?.current || null,
    },
    {
      title: 'Menu Navigasi',
      description: 'Akses semua fitur dari sidebar: TPS, Armada, Jadwal, Laporan Warga, dan lainnya.',
      target: refs.sidebar?.current || null,
    },
    {
      title: 'Siap!',
      description: 'Anda bisa mengulang tour ini kapan saja dari menu Bantuan di sidebar. Selamat bekerja!',
      target: null,
    },
  ];

  return (
    <Tour
      open={open}
      onClose={onClose}
      steps={steps}
      type="primary"
    />
  );
};
```

**Step 3: Wire up in DashboardLayout**

Add tour refs and component to layout. The sidebar help menu item should call `restartTour()`.

**Step 4: Commit**

```bash
git add apps/web/src/hooks/useOnboarding.ts apps/web/src/components/feedback/OnboardingTour.tsx apps/web/src/layouts/DashboardLayout.tsx
git commit -m "feat(web): add onboarding tour with Ant Design Tour component"
```

---

### Task 24: Keyboard Shortcuts

**Files:**
- Create: `apps/web/src/hooks/useKeyboardShortcut.ts`
- Create: `apps/web/src/components/feedback/KeyboardShortcuts.tsx`
- Modify: `apps/web/src/layouts/DashboardLayout.tsx`

**Step 1: Create useKeyboardShortcut**

Create `apps/web/src/hooks/useKeyboardShortcut.ts`:

```ts
import { useEffect, useCallback } from 'react';

type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  description: string;
}

export function useKeyboardShortcut(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger in inputs/textareas
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target.isContentEditable) return;

      for (const shortcut of shortcuts) {
        const keyMatch = e.key === shortcut.key || e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

        if (keyMatch && ctrlMatch && shiftMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

**Step 2: Create KeyboardShortcuts modal**

Create `apps/web/src/components/feedback/KeyboardShortcuts.tsx`:

```tsx
import React from 'react';
import { Modal, Typography, Space } from 'antd';

const { Text } = Typography;

interface KeyboardShortcutsProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: '/', description: 'Fokus pencarian global' },
  { keys: 'n', description: 'Buka form tambah baru' },
  { keys: 'Esc', description: 'Tutup modal/drawer' },
  { keys: '?', description: 'Tampilkan shortcut ini' },
  { keys: 'g → d', description: 'Ke Dashboard' },
  { keys: 'g → t', description: 'Ke TPS' },
  { keys: 'g → c', description: 'Ke Laporan Warga' },
  { keys: 'g → f', description: 'Ke Armada' },
  { keys: 'g → p', description: 'Ke Pembayaran' },
];

const Kbd: React.FC<{ children: string }> = ({ children }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 8px',
      background: '#f5f5f5',
      border: '1px solid #d9d9d9',
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 12,
      lineHeight: '20px',
      boxShadow: '0 1px 0 rgba(0,0,0,0.1)',
    }}
  >
    {children}
  </span>
);

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ open, onClose }) => (
  <Modal
    title="Keyboard Shortcuts"
    open={open}
    onCancel={onClose}
    footer={null}
    width={400}
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {shortcuts.map((s, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text>{s.description}</Text>
          <Space size={4}>
            {s.keys.split(' → ').map((k, j) => (
              <React.Fragment key={j}>
                {j > 0 && <Text type="secondary" style={{ fontSize: 11 }}>lalu</Text>}
                <Kbd>{k}</Kbd>
              </React.Fragment>
            ))}
          </Space>
        </div>
      ))}
    </div>
  </Modal>
);
```

**Step 3: Wire up in DashboardLayout**

In the layout, use `useKeyboardShortcut` with handlers for:
- `/` → focus `#global-search-input`
- `?` → open KeyboardShortcuts modal
- `g` → set pending, then `d`/`t`/`c`/`f`/`p` navigates

**Step 4: Update feedback barrel**

```ts
// apps/web/src/components/feedback/index.ts
export { ActivityFeed } from './ActivityFeed';
export { NotificationBell } from './NotificationBell';
export { RealtimeToast } from './RealtimeToast';
export { OnboardingTour } from './OnboardingTour';
export { KeyboardShortcuts } from './KeyboardShortcuts';
```

**Step 5: Commit**

```bash
git add apps/web/src/hooks/useKeyboardShortcut.ts apps/web/src/components/feedback/ apps/web/src/layouts/DashboardLayout.tsx
git commit -m "feat(web): add keyboard shortcuts and shortcut help modal"
```

---

### Task 25: Final Layout Integration

**Files:**
- Modify: `apps/web/src/layouts/DashboardLayout.tsx` (final version)

**Step 1: Integrate all features into DashboardLayout**

Final `DashboardLayout.tsx` should include:
- `<AppSidebar>` with help menu triggering tour restart
- `<AppHeader>` with global search and notification bell
- `<RealtimeToast>` for WebSocket notifications
- `<OnboardingTour>` with refs
- `<KeyboardShortcuts>` modal
- `useKeyboardShortcut` for `/`, `?`, `g+*` shortcuts
- `useOnboarding` for tour state

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/layouts/DashboardLayout.tsx
git commit -m "feat(web): integrate onboarding, shortcuts, realtime toast into layout"
```
