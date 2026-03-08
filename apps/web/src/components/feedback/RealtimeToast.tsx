import React from 'react';
import { AlertTriangle, MapPin, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useSocket } from '../../hooks/useSocket';
import { useNotificationStore } from '../../stores/notification.store';

const typeConfig: Record<string, { icon: React.ReactNode; path: string }> = {
  complaint_new: { icon: <AlertTriangle className="h-4 w-4 text-info" />, path: '/complaints' },
  tps_full: { icon: <MapPin className="h-4 w-4 text-negative" />, path: '/tps' },
  payment_overdue: { icon: <DollarSign className="h-4 w-4 text-warning" />, path: '/payments' },
};

export const RealtimeToast: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification, fetchUnreadCount } = useNotificationStore();

  useSocket('notification', (data: any) => {
    const config = typeConfig[data.type] || { icon: <AlertTriangle className="h-4 w-4" />, path: '/' };

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

    toast(data.title || 'Notifikasi Baru', {
      description: data.message,
      duration: 8000,
      action: {
        label: 'Lihat',
        onClick: () => navigate(config.path),
      },
    });
  });

  return null;
};
