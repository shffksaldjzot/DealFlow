'use client';
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Skeleton from '@/components/ui/Skeleton';

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth('organizer');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar role="organizer" />
        <main className="flex-1 p-6 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
