'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { Home, FileText, User, Bell } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();

  const items: Array<{ label: string; href: string; icon: typeof Home; badge?: number }> = [
    { label: '홈', href: '/customer', icon: Home },
    { label: '내 계약', href: '/customer/contracts', icon: FileText },
    { label: '알림', href: '/customer/notifications', icon: Bell, badge: unreadCount },
    { label: '프로필', href: '/customer/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-1 relative',
                isActive ? 'text-blue-600' : 'text-gray-400',
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {(item.badge ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {(item.badge ?? 0) > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
