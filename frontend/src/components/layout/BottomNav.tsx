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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-1.5 relative min-w-[44px] min-h-[44px] justify-center',
                isActive ? 'text-blue-600' : 'text-gray-400',
              )}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {(item.badge ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-error text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {(item.badge ?? 0) > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[11px]', isActive ? 'font-semibold' : 'font-medium')}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
