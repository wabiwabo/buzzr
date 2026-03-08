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
  notificationBellRef?: React.RefObject<HTMLElement>;
  globalSearchRef?: React.RefObject<HTMLElement>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  collapsed,
  onToggleCollapse,
  userName,
  onLogout,
  notificationBellRef,
  globalSearchRef,
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
        <span ref={globalSearchRef as React.RefObject<HTMLSpanElement>}>
          <GlobalSearch />
        </span>
      </Space>

      <Space size="middle">
        <span ref={notificationBellRef as React.RefObject<HTMLSpanElement>}>
          <NotificationBell />
        </span>
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
