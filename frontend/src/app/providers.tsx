'use client';
import { ReactNode, useEffect } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';

function AuthInitializer({ children }: { children: ReactNode }) {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthInitializer>{children}</AuthInitializer>
    </ToastProvider>
  );
}
