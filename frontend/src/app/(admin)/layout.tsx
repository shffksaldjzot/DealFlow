'use client';
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth('admin');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar role="admin" />
        <main className="flex-1 px-4 py-5 lg:p-6 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
