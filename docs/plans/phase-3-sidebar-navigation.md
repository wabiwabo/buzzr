# Phase 3: Sidebar & Navigation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the dark sidebar with a light, role-aware sidebar featuring inline search, tenant branding, user card at bottom, and badge counts.

**Depends on:** Phase 2 (usePermission hook).

---

### Task 11: Create Sidebar Menu Config

**Files:**
- Create: `apps/web/src/config/menu.tsx`

**Step 1: Create menu configuration file**

Centralizes menu items with permission requirements:

```tsx
import React from 'react';
import {
  DashboardOutlined, RadarChartOutlined, BarChartOutlined,
  EnvironmentOutlined, CarOutlined, ScheduleOutlined,
  AlertOutlined, DollarOutlined, BankOutlined, WalletOutlined,
  TeamOutlined, GlobalOutlined, AuditOutlined,
  SettingOutlined, AppstoreOutlined,
} from '@ant-design/icons';

export interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  permission?: string;
  badge?: string; // store key for badge count
  children?: MenuItem[];
}

export interface MenuSection {
  key: string;
  label: string | null;
  items: MenuItem[];
}

export const getMenuSections = (isSuperAdmin: boolean): MenuSection[] => [
  {
    key: 'main',
    label: null,
    items: [
      { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
      { key: '/live', icon: <RadarChartOutlined />, label: 'Live Operations' },
      { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics', permission: 'analytics:view' },
    ],
  },
  {
    key: 'operations',
    label: 'OPERASIONAL',
    items: [
      { key: '/tps', icon: <EnvironmentOutlined />, label: 'TPS', permission: 'tps:view' },
      {
        key: '/collection',
        icon: <ScheduleOutlined />,
        label: 'Pengangkutan',
        children: [
          { key: '/schedules', icon: <ScheduleOutlined />, label: 'Jadwal' },
          { key: '/transfers', icon: <AppstoreOutlined />, label: 'Transfer' },
        ],
      },
      { key: '/fleet', icon: <CarOutlined />, label: 'Armada & Driver', permission: 'fleet:view' },
      { key: '/complaints', icon: <AlertOutlined />, label: 'Laporan Warga', badge: 'pendingComplaints' },
    ],
  },
  {
    key: 'finance',
    label: 'KEUANGAN',
    items: [
      { key: '/payments', icon: <DollarOutlined />, label: 'Retribusi', permission: 'payment:view_all' },
      { key: '/bank-sampah', icon: <BankOutlined />, label: 'Bank Sampah', permission: 'payment:view_all' },
      { key: '/payouts', icon: <WalletOutlined />, label: 'Pencairan', permission: 'payment:view_all' },
    ],
  },
  {
    key: 'admin',
    label: 'ADMINISTRASI',
    items: [
      { key: '/users', icon: <TeamOutlined />, label: 'Pengguna', permission: 'user:create' },
      { key: '/areas', icon: <GlobalOutlined />, label: 'Wilayah', permission: 'area:create' },
      { key: '/audit', icon: <AuditOutlined />, label: 'Audit Log', permission: 'audit:view' },
      ...(isSuperAdmin
        ? [{ key: '/settings', icon: <SettingOutlined />, label: 'Pengaturan', permission: 'settings:manage' }]
        : []),
    ],
  },
];
```

**Step 2: Commit**

```bash
git add apps/web/src/config/menu.tsx
git commit -m "feat(web): add centralized menu configuration with permissions"
```

---

### Task 12: Rewrite AppSidebar — Light Theme

**Files:**
- Modify: `apps/web/src/components/layout/AppSidebar.tsx`

**Step 1: Rewrite sidebar with light theme, role-based filtering, badges**

```tsx
import React from 'react';
import { Layout, Menu, Typography, Badge, Input, Avatar, Space, Dropdown, Button } from 'antd';
import {
  SearchOutlined, SettingOutlined, BellOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMenuSections } from '../../config/menu';
import { usePermission } from '../../hooks/usePermission';
import type { MenuSection, MenuItem } from '../../config/menu';

const { Sider } = Layout;
const { Text } = Typography;

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onRestartTour?: () => void;
  userName?: string;
  userRole?: string;
  tenantName?: string;
  onLogout?: () => void;
  badgeCounts?: Record<string, number>;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onCollapse,
  onRestartTour,
  userName = 'Admin',
  userRole = '',
  tenantName = 'Buzzr',
  onLogout,
  badgeCounts = {},
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { can, isSuperAdmin } = usePermission();

  const sections = getMenuSections(isSuperAdmin);

  const filterByPermission = (item: MenuItem): boolean => {
    if (!item.permission) return true;
    return can(item.permission);
  };

  const buildMenuItems = (sections: MenuSection[]) => {
    const items: any[] = [];

    sections.forEach((section) => {
      const visibleItems = section.items.filter(filterByPermission);
      if (visibleItems.length === 0) return;

      if (section.label) {
        items.push({
          type: 'group' as const,
          label: !collapsed ? (
            <Text style={{ fontSize: 11, letterSpacing: 1, color: '#9CA3AF', fontWeight: 500 }}>
              {section.label}
            </Text>
          ) : null,
          children: visibleItems.map(buildItem),
        });
      } else {
        visibleItems.forEach((item) => items.push(buildItem(item)));
      }
    });

    return items;
  };

  const buildItem = (item: MenuItem): any => {
    const badge = item.badge ? badgeCounts[item.badge] : 0;
    const label = badge && badge > 0 ? (
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {item.label}
        <Badge count={badge} size="small" style={{ marginLeft: 8 }} />
      </span>
    ) : item.label;

    if (item.children) {
      return {
        key: item.key,
        icon: item.icon,
        label: item.label,
        children: item.children.filter(filterByPermission).map(buildItem),
      };
    }

    return { key: item.key, icon: item.icon, label };
  };

  const menuItems = buildMenuItems(sections);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      breakpoint="lg"
      theme="light"
      width={240}
      collapsedWidth={64}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        borderRight: '1px solid #E5E7EB',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo + Tenant */}
      <div style={{ padding: collapsed ? '16px 8px' : '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
        <Text strong style={{ fontSize: collapsed ? 18 : 20, letterSpacing: 1, color: '#1F2937' }}>
          {collapsed ? 'B' : 'Buzzr'}
        </Text>
        {!collapsed && (
          <Text style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
            {tenantName}
          </Text>
        )}
      </div>

      {/* Inline Search */}
      {!collapsed && (
        <div style={{ padding: '12px 16px 4px' }}>
          <Input
            placeholder="Cari..."
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            suffix={<Text type="secondary" style={{ fontSize: 11 }}>/</Text>}
            id="global-search-input"
            style={{ borderRadius: 8, background: '#F9FAFB' }}
            size="small"
            onClick={() => {
              const el = document.getElementById('global-search-input');
              el?.focus();
            }}
          />
        </div>
      )}

      {/* Menu */}
      <div style={{ flex: 1, overflow: 'auto', paddingTop: 8 }}>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems as any}
          onClick={({ key }) => {
            if (key === 'tour') {
              onRestartTour?.();
              return;
            }
            navigate(key);
          }}
          style={{ border: 'none' }}
        />
      </div>

      {/* User Card at Bottom */}
      <div style={{
        padding: collapsed ? '12px 8px' : '12px 16px',
        borderTop: '1px solid #F3F4F6',
      }}>
        {collapsed ? (
          <div style={{ textAlign: 'center' }}>
            <Avatar size={32} style={{ background: '#2563EB', cursor: 'pointer' }}>
              {userName.charAt(0)}
            </Avatar>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar size={32} style={{ background: '#2563EB', flexShrink: 0 }}>
              {userName.charAt(0)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 13, display: 'block', fontWeight: 500 }} ellipsis>
                {userName}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {userRole}
              </Text>
            </div>
            <Space size={4}>
              <Button type="text" size="small" icon={<LogoutOutlined />} onClick={onLogout} />
            </Space>
          </div>
        )}
      </div>
    </Sider>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/layout/AppSidebar.tsx
git commit -m "feat(web): rewrite sidebar with light theme, role-based menu, user card"
```

---

### Task 13: Update AppHeader — Simplified

**Files:**
- Modify: `apps/web/src/components/layout/AppHeader.tsx`

**Step 1: Simplify header (search moved to sidebar)**

```tsx
import React from 'react';
import { Layout, Space, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { NotificationBell } from '../feedback/NotificationBell';

const { Header } = Layout;

interface AppHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  notificationBellRef?: React.RefObject<HTMLElement>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  collapsed,
  onToggleCollapse,
  notificationBellRef,
}) => {
  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 99,
        height: 56,
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggleCollapse}
      />

      <Space size="middle">
        <span ref={notificationBellRef as React.RefObject<HTMLSpanElement>}>
          <NotificationBell />
        </span>
      </Space>
    </Header>
  );
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/layout/AppHeader.tsx
git commit -m "feat(web): simplify header after moving search to sidebar"
```

---

### Task 14: Update DashboardLayout

**Files:**
- Modify: `apps/web/src/layouts/DashboardLayout.tsx`

**Step 1: Update layout to pass new props to sidebar**

Update DashboardLayout to pass userName, userRole, tenantName, onLogout, and badgeCounts to the new sidebar. Remove GlobalSearch ref (search is now in sidebar). Remove user dropdown from header.

```tsx
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { AppSidebar } from '../components/layout/AppSidebar';
import { AppHeader } from '../components/layout/AppHeader';
import { RealtimeToast } from '../components/feedback/RealtimeToast';
import { OnboardingTour } from '../components/feedback/OnboardingTour';
import { KeyboardShortcuts } from '../components/feedback/KeyboardShortcuts';
import { useOnboarding } from '../hooks/useOnboarding';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useNotificationStore } from '../stores/notification.store';

const { Content } = Layout;

const ROLE_LABELS: Record<string, string> = {
  citizen: 'Warga', sweeper: 'Penyapu', tps_operator: 'Operator TPS',
  collector: 'Pengumpul', driver: 'Driver', tpst_operator: 'Operator TPST',
  dlh_admin: 'Admin DLH', super_admin: 'Super Admin',
};

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { tourOpen, completeTour, restartTour } = useOnboarding();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const sidebarRef = useRef<HTMLElement>(null);
  const dashboardRef = useRef<HTMLElement>(null);
  const notificationBellRef = useRef<HTMLElement>(null);

  const pendingGRef = useRef(false);

  const shortcuts = useMemo(
    () => [
      {
        key: '/',
        handler: () => {
          const el = document.getElementById('global-search-input');
          if (el) el.focus();
        },
        description: 'Fokus pencarian global',
      },
      {
        key: '?',
        shift: true,
        handler: () => setShortcutsOpen(true),
        description: 'Tampilkan shortcut',
      },
      {
        key: 'g',
        handler: () => {
          pendingGRef.current = true;
          setTimeout(() => { pendingGRef.current = false; }, 1000);
        },
        description: 'Go-to prefix',
      },
      { key: 'd', handler: () => { if (pendingGRef.current) { pendingGRef.current = false; navigate('/'); } }, description: 'Ke Dashboard' },
      { key: 't', handler: () => { if (pendingGRef.current) { pendingGRef.current = false; navigate('/tps'); } }, description: 'Ke TPS' },
      { key: 'c', handler: () => { if (pendingGRef.current) { pendingGRef.current = false; navigate('/complaints'); } }, description: 'Ke Laporan Warga' },
      { key: 'f', handler: () => { if (pendingGRef.current) { pendingGRef.current = false; navigate('/fleet'); } }, description: 'Ke Armada' },
      { key: 'p', handler: () => { if (pendingGRef.current) { pendingGRef.current = false; navigate('/payments'); } }, description: 'Ke Pembayaran' },
    ],
    [navigate],
  );

  useKeyboardShortcut(shortcuts);

  if (!isAuthenticated) return <Navigate to="/login" />;

  const siderWidth = collapsed ? 64 : 240;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <div ref={sidebarRef as React.RefObject<HTMLDivElement>}>
        <AppSidebar
          collapsed={collapsed}
          onCollapse={setCollapsed}
          onRestartTour={restartTour}
          userName={user?.name || 'Admin'}
          userRole={ROLE_LABELS[user?.role || ''] || user?.role || ''}
          tenantName="DLH Kota Bandung"
          onLogout={logout}
          badgeCounts={{ pendingComplaints: unreadCount }}
        />
      </div>

      <Layout style={{ marginLeft: siderWidth, transition: 'margin-left 0.2s ease' }}>
        <AppHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          notificationBellRef={notificationBellRef}
        />

        <RealtimeToast />

        <Content
          ref={dashboardRef as React.RefObject<HTMLDivElement>}
          style={{
            margin: 24,
            padding: 24,
            background: 'transparent',
            minHeight: 'calc(100vh - 56px - 48px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      <OnboardingTour
        open={tourOpen}
        onClose={completeTour}
        refs={{
          sidebar: sidebarRef,
          dashboard: dashboardRef,
          notificationBell: notificationBellRef,
        }}
      />

      <KeyboardShortcuts
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </Layout>
  );
};

export default DashboardLayout;
```

**Step 2: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 3: Commit**

```bash
git add apps/web/src/layouts/DashboardLayout.tsx
git commit -m "feat(web): update layout with new sidebar props and simplified header"
```

---

### Task 15: Update App Routes

**Files:**
- Modify: `apps/web/src/App.tsx`

**Step 1: Add new routes for Live Operations and Analytics**

Add placeholder routes for new pages. These pages will be implemented in later phases.

```tsx
// Add these lazy imports at top
const LiveOperationsPage = React.lazy(() => import('./pages/LiveOperationsPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
```

Add routes inside DashboardLayout:

```tsx
<Route path="/live" element={
  <React.Suspense fallback={<div />}>
    <LiveOperationsPage />
  </React.Suspense>
} />
<Route path="/analytics" element={
  <React.Suspense fallback={<div />}>
    <AnalyticsPage />
  </React.Suspense>
} />
```

**Step 2: Create placeholder pages**

Create `apps/web/src/pages/LiveOperationsPage.tsx`:

```tsx
import React from 'react';
import { PageHeader } from '../components/common';

const LiveOperationsPage: React.FC = () => (
  <div>
    <PageHeader
      title="Live Operations"
      description="Pantau operasional secara real-time"
      breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Live Operations' }]}
    />
  </div>
);

export default LiveOperationsPage;
```

Create `apps/web/src/pages/AnalyticsPage.tsx`:

```tsx
import React from 'react';
import { PageHeader } from '../components/common';

const AnalyticsPage: React.FC = () => (
  <div>
    <PageHeader
      title="Analytics"
      description="Laporan dan analitik operasional"
      breadcrumbs={[{ label: 'Dashboard', path: '/' }, { label: 'Analytics' }]}
    />
  </div>
);

export default AnalyticsPage;
```

**Step 3: Verify build**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

**Step 4: Commit**

```bash
git add apps/web/src/App.tsx apps/web/src/pages/LiveOperationsPage.tsx apps/web/src/pages/AnalyticsPage.tsx
git commit -m "feat(web): add routes and placeholder pages for Live Operations and Analytics"
```
