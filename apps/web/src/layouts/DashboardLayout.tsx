import React, { useState } from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import {
  DashboardOutlined, EnvironmentOutlined, CarOutlined, ScheduleOutlined,
  AlertOutlined, DollarOutlined, TeamOutlined, BarChartOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/tps', icon: <EnvironmentOutlined />, label: 'TPS' },
  { key: '/fleet', icon: <CarOutlined />, label: 'Armada' },
  { key: '/schedules', icon: <ScheduleOutlined />, label: 'Jadwal' },
  { key: '/complaints', icon: <AlertOutlined />, label: 'Laporan' },
  { key: '/payments', icon: <DollarOutlined />, label: 'Pembayaran' },
  { key: '/users', icon: <TeamOutlined />, label: 'Pengguna' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Laporan Analitik' },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const { token: { colorBgContainer } } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: 32, margin: 16, color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 18 }}>
          {collapsed ? 'B' : 'Buzzr'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)} />
          <div>
            <span style={{ marginRight: 16 }}>{user?.name}</span>
            <Button type="text" icon={<LogoutOutlined />} onClick={() => { logout(); navigate('/login'); }}>
              Keluar
            </Button>
          </div>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: colorBgContainer, borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
