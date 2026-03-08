import React from 'react';
import { Layout, Space, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { NotificationBell } from '../feedback/NotificationBell';

const { Header } = Layout;

interface AppHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  notificationBellRef?: React.RefObject<HTMLElement>;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  collapsed,
  onToggleCollapse,
  notificationBellRef,
}) => {
  return (
    <Header
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: 0,
        zIndex: 99,
        height: 56,
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggleCollapse}
      />

      <Space size="middle">
        <span ref={notificationBellRef as React.RefObject<HTMLSpanElement>}>
          <NotificationBell />
        </span>
      </Space>
    </Header>
  );
};
