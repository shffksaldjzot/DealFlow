'use client';
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import Skeleton from '@/components/ui/Skeleton';

export default function CustomerLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth('customer');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <main className="max-w-lg mx-auto p-4">{children}</main>
      <BottomNav />
    </div>
  );
}
