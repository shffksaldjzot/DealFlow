'use client';
import { create } from 'zustand';
import api, { extractData } from '@/lib/api';
import type { User, UserRole, LoginResponse } from '@/types/user';

type AuthUser = Pick<User, 'id' | 'email' | 'name' | 'role'> & { phone?: string; address?: string; createdAt?: string };

interface AuthState {
  user: AuthUser | null;
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
  setUser: (user: AuthUser) => void;
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
    set({ user: data.user as AuthUser, isAuthenticated: true, isLoading: false });
  },

  signup: async (signupData) => {
    const data = extractData<LoginResponse>(
      await api.post('/auth/signup', signupData),
    );
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user as AuthUser, isAuthenticated: true, isLoading: false });
  },

  socialLogin: async (provider, accessToken, role) => {
    const data = extractData<LoginResponse>(
      await api.post('/auth/login/social', { provider, accessToken, role }),
    );
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user as AuthUser, isAuthenticated: true, isLoading: false });
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
      const data = extractData<any>(await api.get('/auth/me'));
      set({
        user: { id: data.id, email: data.email, name: data.name, role: data.role, phone: data.phone, address: data.address, createdAt: data.createdAt },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        // Network error (server cold start) - try to decode token for basic user info
        const token = localStorage.getItem('accessToken');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            set({
              user: { id: payload.sub, email: '', name: '', role: payload.role },
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch {}
        }
        set({ isLoading: false });
      }
    }
  },

  setUser: (user) => set({ user, isAuthenticated: true }),
}));
