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

export { API_URL };
export default api;
