import React from 'react';
import {
  LayoutDashboard, Radar, BarChart3,
  MapPin, Car, CalendarDays,
  AlertTriangle, DollarSign, Landmark, Wallet,
  Users, Globe, FileText,
  Settings, LayoutGrid,
} from 'lucide-react';

export interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  permission?: string;
  badge?: string;
  children?: MenuItem[];
}

export interface MenuSection {
  key: string;
  label: string | null;
  items: MenuItem[];
}

const iconClass = 'h-4 w-4';

export const getMenuSections = (isSuperAdmin: boolean): MenuSection[] => [
  {
    key: 'main',
    label: null,
    items: [
      { key: '/', icon: <LayoutDashboard className={iconClass} />, label: 'Dashboard' },
      { key: '/live', icon: <Radar className={iconClass} />, label: 'Live Operations', permission: 'report:view' },
      { key: '/analytics', icon: <BarChart3 className={iconClass} />, label: 'Analytics', permission: 'analytics:view' },
    ],
  },
  {
    key: 'operations',
    label: 'OPERASIONAL',
    items: [
      { key: '/tps', icon: <MapPin className={iconClass} />, label: 'TPS', permission: 'tps:view' },
      {
        key: '/collection',
        icon: <CalendarDays className={iconClass} />,
        label: 'Pengangkutan',
        children: [
          { key: '/schedules', icon: <CalendarDays className={iconClass} />, label: 'Jadwal' },
          { key: '/transfers', icon: <LayoutGrid className={iconClass} />, label: 'Transfer' },
        ],
      },
      { key: '/fleet', icon: <Car className={iconClass} />, label: 'Armada & Driver', permission: 'fleet:create' },
      { key: '/complaints', icon: <AlertTriangle className={iconClass} />, label: 'Laporan Warga', badge: 'pendingComplaints' },
    ],
  },
  {
    key: 'finance',
    label: 'KEUANGAN',
    items: [
      { key: '/payments', icon: <DollarSign className={iconClass} />, label: 'Retribusi', permission: 'payment:view_all' },
      { key: '/bank-sampah', icon: <Landmark className={iconClass} />, label: 'Bank Sampah', permission: 'payment:view_all' },
      { key: '/payouts', icon: <Wallet className={iconClass} />, label: 'Pencairan', permission: 'payment:view_all' },
    ],
  },
  {
    key: 'admin',
    label: 'ADMINISTRASI',
    items: [
      { key: '/users', icon: <Users className={iconClass} />, label: 'Pengguna', permission: 'user:create' },
      { key: '/areas', icon: <Globe className={iconClass} />, label: 'Wilayah', permission: 'area:create' },
      { key: '/audit', icon: <FileText className={iconClass} />, label: 'Audit Log', permission: 'audit:view' },
      ...(isSuperAdmin
        ? [{ key: '/settings', icon: <Settings className={iconClass} />, label: 'Pengaturan', permission: 'settings:manage' }]
        : []),
    ],
  },
];
