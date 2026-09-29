import { create } from 'zustand';
import { apiClient } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasAdmin: boolean | null;
  checkSetupStatus: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasAdmin: null,

  checkSetupStatus: async () => {
    try {
      const res = await apiClient.get<{ hasAdmin: boolean }>('/auth/setup-status');
      set({ hasAdmin: res.hasAdmin });
      return res.hasAdmin;
    } catch {
      set({ hasAdmin: true });
      return true;
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await apiClient.get<{ user: User }>('/auth/me');
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials) => {
    const res = await apiClient.post<{ user: User; accessToken: string }>('/auth/login', credentials);
    set({ user: res.user, isAuthenticated: true });
  },

  register: async (credentials) => {
    const res = await apiClient.post<{ user: User; accessToken: string }>('/auth/register', credentials);
    set({ user: res.user, isAuthenticated: true, hasAdmin: true });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Continue clearing client state regardless
    }
    set({ user: null, isAuthenticated: false });
  }
}));
