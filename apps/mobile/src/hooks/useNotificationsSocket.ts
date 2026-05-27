import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/auth.store';
import { API_URL } from '../services/api';

function originFromApiUrl(url: string): string {
  return url.replace(/\/api\/v1\/?$/, '');
}

export interface MobileNotification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string | null;
  data?: any;
  is_read?: boolean;
  created_at: string;
}

interface UseNotificationsSocketResult {
  connected: boolean;
  latest: MobileNotification | null;
}

/**
 * Subscribes the logged-in mobile user to their per-tenant per-user
 * notification room. Returns the latest event so screens can react
 * (badge counts, in-app toasts, refresh lists).
 *
 * Mount near the navigation root so the listener lives for the whole
 * authenticated session.
 */
export function useNotificationsSocket(): UseNotificationsSocketResult {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [connected, setConnected] = useState(false);
  const [latest, setLatest] = useState<MobileNotification | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setConnected(false);
      return;
    }

    let cancelled = false;
    let socket: Socket | null = null;

    (async () => {
      const tenantSlug = (await SecureStore.getItemAsync('tenantSlug')) || 'dlh-demo';
      const tenantSchema = tenantSlug.replace(/-/g, '_');
      if (cancelled) return;

      socket = io(`${originFromApiUrl(API_URL)}/notifications`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        setConnected(true);
        socket?.emit('notifications:subscribe', { tenantSchema, userId: user.id });
      });
      socket.on('disconnect', () => setConnected(false));
      socket.on('notification:new', (payload: MobileNotification) => {
        setLatest(payload);
      });
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  return { connected, latest };
}

/**
 * Companion: tracks the unread count by listening to incoming notifications
 * and decrementing on read events. Initial count must be hydrated from
 * GET /notifications/unread-count on mount (do that from the consumer).
 */
export function useUnreadBadge(latest: MobileNotification | null, initialCount = 0) {
  const [unread, setUnread] = useState(initialCount);

  useEffect(() => { setUnread(initialCount); }, [initialCount]);

  useEffect(() => {
    if (latest) setUnread((c) => c + 1);
  }, [latest]);

  const markRead = useCallback((count = 1) => {
    setUnread((c) => Math.max(0, c - count));
  }, []);

  const reset = useCallback(() => setUnread(0), []);

  return { unread, markRead, reset };
}
