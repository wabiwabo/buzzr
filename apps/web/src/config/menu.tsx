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
      { key: '/live', icon: <RadarChartOutlined />, label: 'Live Operations', permission: 'report:view' },
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
      { key: '/fleet', icon: <CarOutlined />, label: 'Armada & Driver', permission: 'fleet:create' },
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
