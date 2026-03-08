import { create } from 'zustand';
import api from '../services/api';
import * as SecureStore from 'expo-secure-store';

interface User { id: string; name: string; phone?: string; email?: string; role: string; }

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithOtp: (phone: string, code: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  requestOtp: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  requestOtp: async (phone: string) => {
    await api.post('/auth/otp/request', { phone });
  },

  loginWithOtp: async (phone: string, code: string) => {
    const { data } = await api.post('/auth/otp/verify', { phone, code });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
  },

  loginWithPassword: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      try {
        const { data } = await api.get('/users/me');
        set({ user: data, isAuthenticated: true, isLoading: false });
      } catch {
        set({ isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
