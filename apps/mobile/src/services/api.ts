import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = __DEV__ ? 'http://192.168.1.100:3000/api/v1' : 'https://api.buzzr.id/api/v1';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  const tenantSlug = await SecureStore.getItemAsync('tenantSlug') || 'dlh-demo';
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Tenant-Slug'] = tenantSlug;
  return config;
});

export default api;
