'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export default function RootPage() {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      const roleHome: Record<string, string> = {
        customer: '/customer',
        organizer: '/organizer',
        partner: '/partner',
        admin: '/admin',
      };
      router.replace(roleHome[user.role] || '/login');
    } else {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">DealFlow</h1>
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    </div>
  );
}
