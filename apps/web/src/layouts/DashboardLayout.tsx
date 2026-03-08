import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { AppSidebar } from '../components/layout/AppSidebar';
import { AppHeader } from '../components/layout/AppHeader';
import { RealtimeToast } from '../components/feedback/RealtimeToast';
import { OnboardingTour } from '../components/feedback/OnboardingTour';
import { KeyboardShortcuts } from '../components/feedback/KeyboardShortcuts';
import { WelcomeFlow } from '../components/onboarding';
import { useOnboarding } from '../hooks/useOnboarding';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { useChecklist } from '../hooks/useChecklist';
import { useNotificationStore } from '../stores/notification.store';

const WELCOME_DONE_KEY = 'buzzr_welcome_done';

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
  const { items: checklistItems, dismissed: checklistDismissed, markComplete, dismiss: dismissChecklist } = useChecklist();
  const navigate = useNavigate();
  const location = useLocation();

  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem(WELCOME_DONE_KEY) !== 'true';
  });

  // Auto-mark checklist items based on navigation
  useEffect(() => {
    const pathToKey: Record<string, string> = {
      '/': 'view_dashboard',
      '/tps': 'view_tps',
      '/complaints': 'view_complaints',
      '/fleet': 'view_fleet',
      '/schedules': 'view_schedules',
      '/analytics': 'view_analytics',
    };
    const key = pathToKey[location.pathname];
    if (key) markComplete(key);
  }, [location.pathname, markComplete]);

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

  if (showWelcome) {
    return (
      <WelcomeFlow
        userName={user?.name || 'Admin'}
        onComplete={() => {
          setShowWelcome(false);
          localStorage.setItem(WELCOME_DONE_KEY, 'true');
        }}
      />
    );
  }

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
          checklistItems={checklistItems}
          checklistDismissed={checklistDismissed}
          onChecklistDismiss={dismissChecklist}
          onChecklistItemClick={markComplete}
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
