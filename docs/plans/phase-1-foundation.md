# Phase 1: Foundation — Theme, Dependencies & Common Components

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up the design system foundation and build all common reusable components.

---

### Task 1: Install Dependencies & Theme Config

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/theme/config.ts`
- Create: `apps/web/src/theme/styles.css`
- Modify: `apps/web/src/main.tsx`

**Step 1: Install new dependencies**

```bash
cd /opt/buzzr
pnpm add --filter=@buzzr/web react-leaflet leaflet @types/leaflet file-saver @types/file-saver xlsx socket.io-client
```

**Step 2: Create theme config**

Create `apps/web/src/theme/config.ts`:

```ts
import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorBgLayout: '#f0f2f5',
    colorBgContainer: '#ffffff',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    controlHeight: 36,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  },
  components: {
    Card: {
      paddingLG: 20,
    },
    Table: {
      headerBg: '#fafafa',
      headerSortActiveBg: '#f0f0f0',
      rowHoverBg: '#f5f8ff',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
    },
    Button: {
      primaryShadow: '0 2px 0 rgba(22, 119, 255, 0.1)',
    },
  },
};
```

**Step 3: Create global styles**

Create `apps/web/src/theme/styles.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-blur: blur(12px);
  --glass-border: 1px solid rgba(255, 255, 255, 0.18);
}

/* Enterprise card with subtle glass effect */
.glass-card {
  background: var(--glass-bg) !important;
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border) !important;
  transition: box-shadow var(--transition-normal), transform var(--transition-fast);
}
.glass-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

/* Smooth transitions on interactive elements */
.ant-btn, .ant-tag, .ant-badge, .ant-card, .ant-table-row {
  transition: all var(--transition-fast) !important;
}

/* Skeleton shimmer effect */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton-row {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  height: 20px;
  border-radius: 4px;
}

/* Clickable stat card */
.stat-card-clickable {
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-normal);
}
.stat-card-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

/* Status dot animation */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.status-dot-active {
  animation: pulse-dot 2s ease-in-out infinite;
}

/* Smart table toolbar */
.smart-table-toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) 0;
  flex-wrap: wrap;
}

/* Detail drawer */
.detail-drawer .ant-drawer-body {
  padding: 0;
}
.detail-drawer-section {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid #f0f0f0;
}

/* Page header */
.page-header {
  margin-bottom: var(--spacing-lg);
}
.page-header-description {
  color: rgba(0, 0, 0, 0.45);
  margin-top: var(--spacing-xs);
  font-size: 14px;
}

/* Filter chip tags */
.filter-chip {
  margin: 2px;
  border-radius: 16px;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}
```

**Step 4: Update main.tsx to use theme**

Modify `apps/web/src/main.tsx` — wrap ConfigProvider with themeConfig and import styles:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import idID from 'antd/locale/id_ID';
import App from './App';
import { themeConfig } from './theme/config';
import './theme/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={idID} theme={themeConfig}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
```

**Step 5: Commit**

```bash
git add apps/web/src/theme/ apps/web/src/main.tsx apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): add design system theme config and global styles"
```

---

### Task 2: PageHeader & InfoTooltip Components

**Files:**
- Create: `apps/web/src/components/common/PageHeader.tsx`
- Create: `apps/web/src/components/common/InfoTooltip.tsx`

**Step 1: Create PageHeader**

Create `apps/web/src/components/common/PageHeader.tsx`:

```tsx
import React from 'react';
import { Breadcrumb, Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  primaryAction,
  extra,
}) => {
  const navigate = useNavigate();

  const breadcrumbItems = breadcrumbs?.map((item) => ({
    title: item.path ? (
      <a onClick={() => navigate(item.path!)}>{item.label}</a>
    ) : (
      item.label
    ),
  }));

  return (
    <div className="page-header">
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <Breadcrumb items={breadcrumbItems} style={{ marginBottom: 8 }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{title}</Title>
          {description && (
            <Text className="page-header-description">{description}</Text>
          )}
        </div>
        <Space>
          {extra}
          {primaryAction && (
            <Button
              type="primary"
              icon={primaryAction.icon || <PlusOutlined />}
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};
```

**Step 2: Create InfoTooltip**

Create `apps/web/src/components/common/InfoTooltip.tsx`:

```tsx
import React from 'react';
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

interface InfoTooltipProps {
  text: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ text, placement = 'top' }) => (
  <Tooltip title={text} placement={placement}>
    <InfoCircleOutlined
      style={{ color: 'rgba(0,0,0,0.35)', marginLeft: 4, cursor: 'help', fontSize: 13 }}
    />
  </Tooltip>
);
```

**Step 3: Commit**

```bash
mkdir -p apps/web/src/components/common
git add apps/web/src/components/common/PageHeader.tsx apps/web/src/components/common/InfoTooltip.tsx
git commit -m "feat(web): add PageHeader and InfoTooltip components"
```

---

### Task 3: StatCard, StatusBadge & EmptyState Components

**Files:**
- Create: `apps/web/src/components/common/StatCard.tsx`
- Create: `apps/web/src/components/common/StatusBadge.tsx`
- Create: `apps/web/src/components/common/EmptyState.tsx`
- Create: `apps/web/src/components/common/ConfirmAction.tsx`

**Step 1: Create StatCard**

Create `apps/web/src/components/common/StatCard.tsx`:

```tsx
import React from 'react';
import { Card, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: { value: number; label?: string };
  navigateTo?: string;
  loading?: boolean;
  formatter?: (value: number | string) => string;
  valueStyle?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  navigateTo,
  loading = false,
  formatter,
  valueStyle,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (navigateTo) navigate(navigateTo);
  };

  const trendColor = trend
    ? trend.value > 0 ? '#52c41a' : trend.value < 0 ? '#ff4d4f' : 'rgba(0,0,0,0.45)'
    : undefined;

  const TrendIcon = trend
    ? trend.value > 0 ? ArrowUpOutlined : trend.value < 0 ? ArrowDownOutlined : null
    : null;

  return (
    <Card
      className={navigateTo ? 'glass-card stat-card-clickable' : 'glass-card'}
      onClick={handleClick}
      loading={loading}
      size="small"
      style={{ height: '100%' }}
    >
      <Statistic
        title={title}
        value={formatter ? formatter(value) : value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ fontSize: 28, fontWeight: 600, ...valueStyle }}
      />
      {trend && (
        <div style={{ marginTop: 4 }}>
          {TrendIcon && <TrendIcon style={{ color: trendColor, fontSize: 12, marginRight: 4 }} />}
          <Text style={{ color: trendColor, fontSize: 12 }}>
            {Math.abs(trend.value)}%
          </Text>
          {trend.label && (
            <Text style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginLeft: 4 }}>
              {trend.label}
            </Text>
          )}
        </div>
      )}
    </Card>
  );
};
```

**Step 2: Create StatusBadge**

Create `apps/web/src/components/common/StatusBadge.tsx`:

```tsx
import React from 'react';
import { Tag } from 'antd';

// Centralized status color definitions
const STATUS_COLORS: Record<string, string> = {
  // TPS
  active: 'green',
  full: 'red',
  maintenance: 'orange',
  // Complaint
  submitted: 'blue',
  verified: 'cyan',
  assigned: 'orange',
  in_progress: 'gold',
  resolved: 'green',
  rejected: 'red',
  // Payment
  pending: 'orange',
  paid: 'green',
  failed: 'red',
  expired: 'default',
  refunded: 'purple',
  // Vehicle
  available: 'green',
  in_use: 'blue',
  // Schedule
  completed: 'green',
  cancelled: 'red',
  // User
  inactive: 'red',
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, dot = false }) => {
  const color = STATUS_COLORS[status] || 'default';
  const displayLabel = label || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (dot) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span
          className={status === 'active' ? 'status-dot-active' : undefined}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: color === 'default' ? '#d9d9d9' : undefined,
            background: color !== 'default' ? `var(--ant-color-${color === 'green' ? 'success' : color === 'red' ? 'error' : color === 'orange' ? 'warning' : 'primary'})` : undefined,
          }}
        />
        <span>{displayLabel}</span>
      </span>
    );
  }

  return <Tag color={color}>{displayLabel}</Tag>;
};
```

**Step 3: Create EmptyState**

Create `apps/web/src/components/common/EmptyState.tsx`:

```tsx
import React from 'react';
import { Button, Empty, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, InboxOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'success';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const defaultIcons = {
  'no-data': <InboxOutlined style={{ fontSize: 48, color: 'rgba(0,0,0,0.25)' }} />,
  'no-results': <SearchOutlined style={{ fontSize: 48, color: 'rgba(0,0,0,0.25)' }} />,
  'success': null,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => (
  <Empty
    image={icon || defaultIcons[type] || Empty.PRESENTED_IMAGE_SIMPLE}
    imageStyle={{ height: 80 }}
    description={
      <div>
        <Text strong style={{ fontSize: 15 }}>{title}</Text>
        {description && (
          <div>
            <Text type="secondary" style={{ fontSize: 13 }}>{description}</Text>
          </div>
        )}
      </div>
    }
    style={{ padding: '48px 0' }}
  >
    {actionLabel && onAction && (
      <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Empty>
);
```

**Step 4: Create ConfirmAction**

Create `apps/web/src/components/common/ConfirmAction.tsx`:

```tsx
import React from 'react';
import { Popconfirm, Button } from 'antd';
import type { ButtonType } from 'antd/es/button';

interface ConfirmActionProps {
  title: string;
  description?: string;
  onConfirm: () => void;
  children?: React.ReactNode;
  buttonLabel?: string;
  buttonType?: ButtonType;
  danger?: boolean;
  loading?: boolean;
}

export const ConfirmAction: React.FC<ConfirmActionProps> = ({
  title,
  description,
  onConfirm,
  children,
  buttonLabel,
  buttonType = 'default',
  danger = false,
  loading = false,
}) => (
  <Popconfirm
    title={title}
    description={description}
    onConfirm={onConfirm}
    okText="Ya"
    cancelText="Batal"
    okButtonProps={{ danger }}
  >
    {children || (
      <Button type={buttonType} danger={danger} loading={loading} size="small">
        {buttonLabel}
      </Button>
    )}
  </Popconfirm>
);
```

**Step 5: Create barrel export**

Create `apps/web/src/components/common/index.ts`:

```ts
export { PageHeader } from './PageHeader';
export { StatCard } from './StatCard';
export { StatusBadge } from './StatusBadge';
export { EmptyState } from './EmptyState';
export { InfoTooltip } from './InfoTooltip';
export { ConfirmAction } from './ConfirmAction';
```

**Step 6: Commit**

```bash
git add apps/web/src/components/common/
git commit -m "feat(web): add StatCard, StatusBadge, EmptyState, ConfirmAction components"
```

---

### Task 4: Socket Service & Notification Store

**Files:**
- Create: `apps/web/src/services/socket.ts`
- Create: `apps/web/src/stores/notification.store.ts`
- Create: `apps/web/src/hooks/useSocket.ts`

**Step 1: Create socket service**

Create `apps/web/src/services/socket.ts`:

```ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const tenantSlug = localStorage.getItem('tenantSlug') || 'dlh-demo';
    socket = io('/tracking', {
      path: '/socket.io',
      auth: {
        token: localStorage.getItem('accessToken'),
      },
      query: {
        tenantSlug,
      },
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

**Step 2: Create useSocket hook**

Create `apps/web/src/hooks/useSocket.ts`:

```ts
import { useEffect, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket } from '../services/socket';
import type { Socket } from 'socket.io-client';

export function useSocket(
  event: string,
  handler: (data: any) => void,
): Socket {
  const savedHandler = useRef(handler);
  savedHandler.current = handler;

  useEffect(() => {
    connectSocket();
    const socket = getSocket();

    const listener = (data: any) => savedHandler.current(data);
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [event]);

  return getSocket();
}
```

**Step 3: Create notification store**

Create `apps/web/src/stores/notification.store.ts`:

```ts
import { create } from 'zustand';
import api from '../services/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/notifications');
      set({ notifications: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      set({ unreadCount: data.count ?? data.unreadCount ?? 0 });
    } catch {
      // silent
    }
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silent
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      // silent
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
```

**Step 4: Commit**

```bash
mkdir -p apps/web/src/hooks
git add apps/web/src/services/socket.ts apps/web/src/hooks/useSocket.ts apps/web/src/stores/notification.store.ts
git commit -m "feat(web): add socket service and notification store"
```
