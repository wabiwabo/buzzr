import React from 'react';
import { Layout, Menu, Typography, Badge, Input, Avatar, Space, Button } from 'antd';
import {
  SearchOutlined, LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMenuSections } from '../../config/menu';
import { usePermission } from '../../hooks/usePermission';
import { ProgressChecklist } from '../onboarding/ProgressChecklist';
import type { ChecklistItem } from '../onboarding/ProgressChecklist';
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
  checklistItems?: ChecklistItem[];
  checklistDismissed?: boolean;
  onChecklistDismiss?: () => void;
  onChecklistItemClick?: (key: string) => void;
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
  checklistItems,
  checklistDismissed = false,
  onChecklistDismiss,
  onChecklistItemClick,
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

      {/* Onboarding Checklist */}
      {checklistItems && !checklistDismissed && !collapsed && (
        <ProgressChecklist
          items={checklistItems}
          onDismiss={onChecklistDismiss || (() => {})}
          onItemClick={onChecklistItemClick}
        />
      )}

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
