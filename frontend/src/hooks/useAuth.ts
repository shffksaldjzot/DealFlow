'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/user';

export function useAuth(requiredRole?: UserRole | UserRole[]) {
  const { user, isLoading, isAuthenticated, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      fetchMe();
    }
  }, [isAuthenticated, isLoading, fetchMe]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRole && user) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(user.role as UserRole)) {
        // Redirect to their home based on role
        const roleHome: Record<string, string> = {
          customer: '/customer',
          organizer: '/organizer',
          partner: '/partner',
          admin: '/admin',
        };
        router.push(roleHome[user.role] || '/login');
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  return { user, isLoading, isAuthenticated };
}
