'use client';
import { create } from 'zustand';
import api, { extractData } from '@/lib/api';

interface NotificationState {
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;
  decrement: (n?: number) => void;
  clearCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,

  fetchUnreadCount: async () => {
    try {
      const data = extractData<{ count: number }>(
        await api.get('/notifications/unread-count'),
      );
      set({ unreadCount: data.count });
    } catch {
      // ignore
    }
  },

  decrement: (n = 1) => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - n) })),

  clearCount: () => set({ unreadCount: 0 }),
}));
