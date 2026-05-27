# Phase 3: Layout Redesign — Sidebar, Header, Breadcrumb

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the main layout with grouped sidebar, notification bell, global search, and responsive behavior.

**Depends on:** Phase 1 complete.

---

### Task 9: AppSidebar Component

**Files:**
- Create: `apps/web/src/components/layout/AppSidebar.tsx`

**Step 1: Create AppSidebar with grouped menu sections**

Create `apps/web/src/components/layout/AppSidebar.tsx`:

```tsx
import React from 'react';
import { Layout, Menu, Badge, Typography } from 'antd';
import {
  DashboardOutlined, EnvironmentOutlined, CarOutlined,
  ScheduleOutlined, AlertOutlined, DollarOutlined,
  TeamOutlined, BarChartOutlined, SettingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationStore } from '../../stores/notification.store';

const { Sider } = Layout;
const { Text } = Typography;

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  isSuperAdmin?: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onCollapse,
  isSuperAdmin = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotificationStore();

  // Derive complaint/payment badge counts from unreadCount or separate state
  // For now, using placeholder. In production, fetch from separate endpoints.
  const complaintBadge = 0; // TODO: fetch from API
  const paymentBadge = 0;   // TODO: fetch from API

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      type: 'group' as const,
      label: !collapsed ? <Text type="secondary" style={{ fontSize: 11, letterSpacing: 1 }}>OPERASIONAL</Text> : null,
      children: [
        { key: '/tps', icon: <EnvironmentOutlined />, label: 'TPS' },
        { key: '/fleet', icon: <CarOutlined />, label: 'Armada' },
        { key: '/schedules', icon: <ScheduleOutlined />, label: 'Jadwal' },
      ],
    },
    {
      type: 'group' as const,
      label: !collapsed ? <Text type="secondary" style={{ fontSize: 11, letterSpacing: 1 }}>MONITORING</Text> : null,
      children: [
        {
          key: '/complaints',
          icon: <AlertOutlined />,
          label: (
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Laporan Warga
              {complaintBadge > 0 && <Badge count={complaintBadge} size="small" />}
            </span>
          ),
        },
        {
          key: '/payments',
          icon: <DollarOutlined />,
          label: (
            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Pembayaran
              {paymentBadge > 0 && <Badge count={paymentBadge} size="small" />}
            </span>
          ),
        },
      ],
    },
    {
      type: 'group' as const,
      label: !collapsed ? <Text type="secondary" style={{ fontSize: 11, letterSpacing: 1 }}>ADMINISTRASI</Text> : null,
      children: [
        { key: '/users', icon: <TeamOutlined />, label: 'Pengguna' },
        { key: '/reports', icon: <BarChartOutlined />, label: 'Laporan' },
        ...(isSuperAdmin
          ? [{ key: '/settings', icon: <SettingOutlined />, label: 'Pengaturan' }]
          : []),
      ],
    },
    { type: 'divider' as const },
    {
      key: '/help',
      icon: <QuestionCircleOutlined />,
      label: 'Bantuan',
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      breakpoint="lg"
      theme="dark"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          margin: '0 0 8px',
        }}
      >
        <Text
          strong
          style={{ color: '#fff', fontSize: collapsed ? 20 : 22, letterSpacing: 1 }}
        >
          {collapsed ? 'B' : 'Buzzr'}
        </Text>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems as any}
        onClick={({ key }) => {
          if (key === '/help') {
            // Trigger onboarding tour — handled by parent
            return;
          }
          navigate(key);
        }}
      />
    </Sider>
  );
};
```

**Step 2: Commit**

```bash
mkdir -p apps/web/src/components/layout
git add apps/web/src/components/layout/AppSidebar.tsx
git commit -m "feat(web): add AppSidebar with grouped menu sections and badges"
```

---

### Task 10: AppHeader with Global Search & Notification Bell

**Files:**
- Create: `apps/web/src/components/layout/GlobalSearch.tsx`
- Create: `apps/web/src/components/feedback/NotificationBell.tsx`
- Create: `apps/web/src/components/layout/AppHeader.tsx`

**Step 1: Create GlobalSearch**

Create `apps/web/src/components/layout/GlobalSearch.tsx`:

```tsx
import React, { useState, useCallback } from 'react';
import { Input, Dropdown, Typography, Space, Tag, Empty } from 'antd';
import {
  SearchOutlined, EnvironmentOutlined, CarOutlined,
  AlertOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Text } = Typography;

interface SearchResult {
  type: 'tps' | 'fleet' | 'complaint' | 'user';
  id: string;
  title: string;
  subtitle?: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; path: string }> = {
  tps: { icon: <EnvironmentOutlined />, color: 'green', path: '/tps' },
  fleet: { icon: <CarOutlined />, color: 'blue', path: '/fleet' },
  complaint: { icon: <AlertOutlined />, color: 'orange', path: '/complaints' },
  user: { icon: <TeamOutlined />, color: 'purple', path: '/users' },
};

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback(
    async (value: string) => {
      setQuery(value);
      if (value.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }

      // Search across multiple endpoints in parallel
      try {
        const [tpsRes, usersRes] = await Promise.allSettled([
          api.get('/tps', { params: {} }),
          api.get('/users', { params: {} }),
        ]);

        const all: SearchResult[] = [];
        const lower = value.toLowerCase();

        if (tpsRes.status === 'fulfilled') {
          const tpsList = Array.isArray(tpsRes.value.data) ? tpsRes.value.data : [];
          tpsList
            .filter((t: any) => t.name?.toLowerCase().includes(lower) || t.address?.toLowerCase().includes(lower))
            .slice(0, 3)
            .forEach((t: any) => all.push({ type: 'tps', id: t.id, title: t.name, subtitle: t.address }));
        }

        if (usersRes.status === 'fulfilled') {
          const usersList = Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
          usersList
            .filter((u: any) => u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower))
            .slice(0, 3)
            .forEach((u: any) => all.push({ type: 'user', id: u.id, title: u.name, subtitle: u.email || u.phone }));
        }

        setResults(all);
        setOpen(all.length > 0);
      } catch {
        setResults([]);
      }
    },
    [],
  );

  const menuItems = results.map((r) => {
    const config = typeConfig[r.type];
    return {
      key: r.id,
      label: (
        <Space>
          {config.icon}
          <div>
            <Text style={{ fontSize: 13 }}>{r.title}</Text>
            {r.subtitle && <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>{r.subtitle}</Text>}
          </div>
          <Tag color={config.color} style={{ marginLeft: 'auto', fontSize: 10 }}>{r.type.toUpperCase()}</Tag>
        </Space>
      ),
      onClick: () => {
        navigate(config.path);
        setOpen(false);
        setQuery('');
      },
    };
  });

  return (
    <Dropdown
      menu={{ items: menuItems }}
      open={open && results.length > 0}
      onOpenChange={setOpen}
    >
      <Input
        placeholder="Cari TPS, pengguna, laporan..."
        prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.3)' }} />}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        allowClear
        onClear={() => { setQuery(''); setResults([]); setOpen(false); }}
        style={{ width: 320, borderRadius: 20 }}
        id="global-search-input"
      />
    </Dropdown>
  );
};
```

**Step 2: Create NotificationBell**

Create `apps/web/src/components/feedback/NotificationBell.tsx`:

```tsx
import React, { useEffect } from 'react';
import { Badge, Button, Dropdown, Typography, List, Space } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../stores/notification.store';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/id';

dayjs.extend(relativeTime);
dayjs.locale('id');

const { Text } = Typography;

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const {
    notifications, unreadCount, loading,
    fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
    // Poll every 30s
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  const content = (
    <div style={{ width: 360, maxHeight: 480, overflow: 'auto' }}>
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
        <Text strong>Notifikasi</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" icon={<CheckOutlined />} onClick={markAllAsRead}>
            Tandai semua dibaca
          </Button>
        )}
      </div>

      {unread.length > 0 && (
        <>
          <div style={{ padding: '8px 16px 4px' }}>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              Baru
            </Text>
          </div>
          <List
            size="small"
            dataSource={unread.slice(0, 5)}
            renderItem={(item) => (
              <List.Item
                style={{ padding: '8px 16px', cursor: 'pointer', background: '#f5f8ff' }}
                onClick={() => markAsRead(item.id)}
              >
                <div>
                  <Text style={{ fontSize: 13 }}>{item.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(item.created_at).fromNow()}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        </>
      )}

      {read.length > 0 && (
        <>
          <div style={{ padding: '8px 16px 4px' }}>
            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              Sebelumnya
            </Text>
          </div>
          <List
            size="small"
            dataSource={read.slice(0, 5)}
            renderItem={(item) => (
              <List.Item style={{ padding: '8px 16px' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{item.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {dayjs(item.created_at).fromNow()}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        </>
      )}

      {notifications.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Text type="secondary">Tidak ada notifikasi</Text>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => content}
      trigger={['click']}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
      </Badge>
    </Dropdown>
  );
};
```

**Step 3: Create AppHeader**

Create `apps/web/src/components/layout/AppHeader.tsx`:

```tsx
import React from 'react';
import { Layout, Space, Button, Dropdown, Avatar, Typography } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from '../feedback/NotificationBell';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  userName: string;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  collapsed,
  onToggleCollapse,
  userName,
  onLogout,
}) => {
  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Profil' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Keluar', danger: true, onClick: onLogout },
  ];

  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 99,
        height: 56,
      }}
    >
      <Space size="middle">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
        />
        <GlobalSearch />
      </Space>

      <Space size="middle">
        <NotificationBell />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text style={{ fontSize: 13 }}>{userName}</Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};
```

**Step 4: Create barrel export**

Create `apps/web/src/components/layout/index.ts`:

```ts
export { AppSidebar } from './AppSidebar';
export { AppHeader } from './AppHeader';
export { GlobalSearch } from './GlobalSearch';
```

**Step 5: Commit**

```bash
git add apps/web/src/components/layout/ apps/web/src/components/feedback/NotificationBell.tsx
git commit -m "feat(web): add AppHeader with GlobalSearch and NotificationBell"
```

---

### Task 11: Rewrite DashboardLayout

**Files:**
- Modify: `apps/web/src/layouts/DashboardLayout.tsx`

**Step 1: Rewrite layout using new components**

Replace `apps/web/src/layouts/DashboardLayout.tsx` with:

```tsx
import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { AppSidebar } from '../components/layout/AppSidebar';
import { AppHeader } from '../components/layout/AppHeader';

const { Content } = Layout;

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" />;

  const siderWidth = collapsed ? 80 : 200;
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        isSuperAdmin={isSuperAdmin}
      />

      <Layout style={{ marginLeft: siderWidth, transition: 'margin-left 0.2s ease' }}>
        <AppHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          userName={user?.name || 'Admin'}
          onLogout={logout}
        />

        <Content
          style={{
            margin: 24,
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 56px - 48px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
```

**Step 2: Verify app renders**

```bash
cd /opt/buzzr && pnpm run build --filter=@buzzr/web
```

Expected: Build succeeds. If type errors, fix imports.

**Step 3: Commit**

```bash
git add apps/web/src/layouts/DashboardLayout.tsx
git commit -m "feat(web): rewrite DashboardLayout with AppSidebar, AppHeader, GlobalSearch"
```
