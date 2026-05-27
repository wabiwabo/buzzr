import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

function resolveDevApiUrl(): string {
  // 1. Explicit override via env (EXPO_PUBLIC_API_URL is exposed to the JS bundle by Expo SDK 49+)
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  // 2. Derive from the Expo dev server host so the app talks to the same machine
  // that's serving the JS bundle. Works for LAN, tunnel, and localhost (web/simulator).
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants.manifest as any)?.debuggerHost ||
    (Constants.manifest2 as any)?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000/api/v1`;
  }

  // 3. Last-resort fallback (iOS simulator and web reach the host via localhost)
  return 'http://localhost:3000/api/v1';
}

const API_URL = __DEV__
  ? resolveDevApiUrl()
  : process.env.EXPO_PUBLIC_API_URL || 'https://api.buzzr.id/api/v1';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  const tenantSlug = (await SecureStore.getItemAsync('tenantSlug')) || 'dlh-demo';
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Tenant-Slug'] = tenantSlug;
  return config;
});

// Refresh-on-401 interceptor.
// On a 401, attempt to exchange the stored refresh token for a new access
// token, then replay the original request once. Concurrent 401s coalesce
// onto the same in-flight refresh so we don't burn refresh tokens.
let refreshInFlight: Promise<string | null> | null = null;
let onAuthFailure: (() => void) | null = null;

export function setOnAuthFailure(handler: (() => void) | null) {
  onAuthFailure = handler;
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  if (!refreshToken) return null;
  try {
    // Use a bare axios call so this request doesn't loop through our interceptors.
    const { data } = await axios.post(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status !== 401 ||
      !original ||
      original._retried ||
      original.url?.includes('/auth/')
    ) {
      return Promise.reject(error);
    }

    original._retried = true;

    if (!refreshInFlight) {
      refreshInFlight = performRefresh().finally(() => {
        refreshInFlight = null;
      });
    }
    const newAccess = await refreshInFlight;

    if (!newAccess) {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      onAuthFailure?.();
      return Promise.reject(error);
    }

    original.headers = original.headers || {};
    original.headers.Authorization = `Bearer ${newAccess}`;
    return api(original);
  },
);

export { API_URL };
export default api;
