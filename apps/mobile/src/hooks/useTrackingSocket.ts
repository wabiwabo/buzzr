import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../services/api';

// API_URL ends with `/api/v1`; the Socket.IO namespace lives on the
// server root, so strip the prefix to get the bare origin.
function originFromApiUrl(url: string): string {
  return url.replace(/\/api\/v1\/?$/, '');
}

interface GpsUpdate {
  vehicleId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  speed: number;
}

interface UseTrackingSocketResult {
  connected: boolean;
  sendGps: (update: GpsUpdate) => boolean;
}

/**
 * Drivers use this to stream GPS updates to the API's `/tracking` namespace.
 * The hook joins the tenant's tracking room on connect so the server only
 * broadcasts back to clients in the same tenant.
 *
 * Returns `connected` so the UI can show a real-time indicator and
 * `sendGps` which falls back to returning false when the socket is
 * disconnected — the caller can fall back to REST or just drop the update.
 */
export function useTrackingSocket(): UseTrackingSocketResult {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let socket: Socket | null = null;

    (async () => {
      const tenantSlug =
        (await SecureStore.getItemAsync('tenantSlug')) || 'dlh-demo';
      const tenantSchema = tenantSlug.replace(/-/g, '_');
      if (cancelled) return;

      socket = io(`${originFromApiUrl(API_URL)}/tracking`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
      });

      socket.on('connect', () => {
        setConnected(true);
        socket?.emit('tracking:subscribe', { tenantSchema });
      });
      socket.on('disconnect', () => setConnected(false));

      socketRef.current = socket;
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendGps = useCallback((update: GpsUpdate): boolean => {
    const s = socketRef.current;
    if (!s || !s.connected) return false;
    SecureStore.getItemAsync('tenantSlug').then((slug) => {
      const tenantSchema = (slug || 'dlh-demo').replace(/-/g, '_');
      s.emit('gps:update', { tenantSchema, ...update });
    });
    return true;
  }, []);

  return { connected, sendGps };
}
