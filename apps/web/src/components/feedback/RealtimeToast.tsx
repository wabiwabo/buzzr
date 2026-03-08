import React from 'react';
import { notification, Button } from 'antd';
import { AlertOutlined, EnvironmentOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { useNotificationStore } from '../../stores/notification.store';

const typeConfig: Record<string, { icon: React.ReactNode; path: string }> = {
  complaint_new: { icon: <AlertOutlined style={{ color: '#1677ff' }} />, path: '/complaints' },
  tps_full: { icon: <EnvironmentOutlined style={{ color: '#ff4d4f' }} />, path: '/tps' },
  payment_overdue: { icon: <DollarOutlined style={{ color: '#faad14' }} />, path: '/payments' },
};

export const RealtimeToast: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification, fetchUnreadCount } = useNotificationStore();
  const [api, contextHolder] = notification.useNotification();

  useSocket('notification', (data: any) => {
    const config = typeConfig[data.type] || { icon: <AlertOutlined />, path: '/' };

    addNotification({
      id: data.id || Date.now().toString(),
      type: data.type,
      title: data.title || 'Notifikasi Baru',
      message: data.message || '',
      read: false,
      created_at: new Date().toISOString(),
      metadata: data.metadata,
    });

    fetchUnreadCount();

    api.open({
      message: data.title || 'Notifikasi Baru',
      description: data.message,
      icon: config.icon,
      btn: (
        <Button type="link" size="small" onClick={() => navigate(config.path)}>
          Lihat
        </Button>
      ),
      duration: 8,
      placement: 'topRight',
    });
  });

  return <>{contextHolder}</>;
};
