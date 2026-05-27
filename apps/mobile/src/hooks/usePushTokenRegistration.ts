import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '../services/api';
import { useAuthStore } from '../stores/auth.store';

// Configure foreground behavior: show heads-up banner, play sound, badge bump.
// Set once at module load.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function getExpoPushToken(): Promise<string | null> {
  // Push requires a physical device; emulators/simulators get nothing useful.
  if (!Constants.isDevice && Platform.OS !== 'web') {
    // On Android emulators the SDK still returns a token; on iOS simulators it doesn't.
    // Try anyway — if it returns null we just bail.
  }

  // Cast needed: expo-notifications types extend PermissionResponse from 'expo',
  // but the local expo package doesn't re-export PermissionResponse, so TypeScript
  // loses the inherited fields. The runtime shape is correct.
  const existingPerms = (await Notifications.getPermissionsAsync()) as any;
  let granted: boolean = existingPerms.granted;
  if (!granted) {
    const requestedPerms = (await Notifications.requestPermissionsAsync()) as any;
    granted = requestedPerms.granted;
  }
  if (!granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1890ff',
    });
  }

  try {
    // projectId is required in production builds; in Expo Go it's auto-derived.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      (Constants.expoConfig as any)?.extra?.projectId ||
      undefined;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenData.data || null;
  } catch {
    return null;
  }
}

/**
 * Registers (and re-registers) the Expo push token for the logged-in user.
 * - Asks permission lazily on first authenticated render.
 * - Re-runs when the user id changes (e.g. account switch).
 * - On logout it does nothing here; auth.store.logout should POST null to
 *   clear the previous token (handled separately).
 *
 * Tracks the last sent token in a ref so we don't POST the same value on
 * every render cycle.
 */
export function usePushTokenRegistration() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lastSentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      lastSentRef.current = null;
      return;
    }

    let cancelled = false;
    (async () => {
      const token = await getExpoPushToken();
      if (cancelled || !token) return;
      if (lastSentRef.current === token) return;
      try {
        await api.post('/users/me/push-token', { token });
        lastSentRef.current = token;
      } catch {
        // Silent: real-time WS notifications still work without push.
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);
}
