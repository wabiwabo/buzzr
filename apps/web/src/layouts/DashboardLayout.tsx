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
