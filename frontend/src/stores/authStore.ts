'use client';
import { create } from 'zustand';
import api, { extractData } from '@/lib/api';
import type { User, UserRole, LoginResponse } from '@/types/user';

interface AuthState {
  user: Pick<User, 'id' | 'email' | 'name' | 'role'> | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role: UserRole;
  }) => Promise<void>;
  socialLogin: (provider: string, accessToken: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setUser: (user: Pick<User, 'id' | 'email' | 'name' | 'role'>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const data = extractData<LoginResponse>(
      await api.post('/auth/login/email', { email, password }),
    );
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  signup: async (signupData) => {
    const data = extractData<LoginResponse>(
      await api.post('/auth/signup', signupData),
    );
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  socialLogin: async (provider, accessToken, role) => {
    const data = extractData<LoginResponse>(
      await api.post('/auth/login/social', { provider, accessToken, role }),
    );
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  fetchMe: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const data = extractData<User>(await api.get('/auth/me'));
      set({
        user: { id: data.id, email: data.email, name: data.name, role: data.role },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}));
