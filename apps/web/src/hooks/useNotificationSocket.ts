import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';

interface ServerNotification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string | null;
  data?: any;
  is_read?: boolean;
  created_at: string;
}

/**
 * Subscribes the current user to their per-tenant per-user notification room
 * and pushes incoming `notification:new` events into the notification store +
 * shows a sonner toast so the new notification is visible even when the bell
 * popover is closed.
 *
 * Mount once at the layout root (DashboardLayout) — not per-page.
 */
export function useNotificationSocket() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const tenantSlug = localStorage.getItem('tenantSlug') || 'dlh-demo';
    const tenantSchema = tenantSlug.replace(/-/g, '_');

    // Vite dev proxies /socket.io to the API; in prod the same path is served
    // by nginx upstream. Both cases resolve to the API host without code change.
    const socket: Socket = io('/notifications', {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      socket.emit('notifications:subscribe', { tenantSchema, userId: user.id });
    });

    socket.on('notification:new', (payload: ServerNotification) => {
      // Translate server row shape to the store's Notification interface.
      const notif = {
        id: payload.id,
        type: payload.type || 'general',
        title: payload.title,
        message: payload.body || '',
        read: false,
        created_at: payload.created_at,
        metadata: payload.data,
      };
      addNotification(notif);
      toast.info(payload.title, {
        description: payload.body || undefined,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user?.id, addNotification]);
}
