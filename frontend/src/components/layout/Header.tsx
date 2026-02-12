'use client';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { LogOut, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const roleLabels: Record<string, string> = {
    customer: '고객',
    organizer: '주관사',
    partner: '협력업체',
    admin: '관리자',
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <h1
          className="text-xl font-bold text-blue-600 cursor-pointer"
          onClick={() => router.push('/')}
        >
          DealFlow
        </h1>
        {user && (
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {roleLabels[user.role]}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
