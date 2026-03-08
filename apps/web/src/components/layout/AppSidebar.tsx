import React from 'react';
import { Layout, Menu, Badge, Typography } from 'antd';
import {
  DashboardOutlined, EnvironmentOutlined, CarOutlined,
  ScheduleOutlined, AlertOutlined, DollarOutlined,
  TeamOutlined, BarChartOutlined, SettingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;
const { Text } = Typography;

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  isSuperAdmin?: boolean;
  onRestartTour?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  onCollapse,
  isSuperAdmin = false,
  onRestartTour,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

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
          label: 'Laporan Warga',
        },
        {
          key: '/payments',
          icon: <DollarOutlined />,
          label: 'Pembayaran',
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
      key: 'help',
      icon: <QuestionCircleOutlined />,
      label: 'Bantuan',
      children: [
        { key: 'tour', label: 'Mulai Tour' },
      ],
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
          if (key === 'tour') {
            onRestartTour?.();
            return;
          }
          if (key === 'help') return;
          navigate(key);
        }}
      />
    </Sider>
  );
};
