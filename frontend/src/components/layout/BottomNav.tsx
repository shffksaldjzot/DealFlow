'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { Home, FileText, User, Bell, Calendar, QrCode, Building2 } from 'lucide-react';

type NavItem = { label: string; href: string; icon: typeof Home; badge?: number };

const navItemsByRole: Record<string, (unreadCount: number) => NavItem[]> = {
  // 고객: 홈 | 내계약 | 마이페이지 (3탭, 와이어프레임 1-1)
  customer: () => [
    { label: '홈', href: '/customer', icon: Home },
    { label: '내계약', href: '/customer/contracts', icon: FileText },
    { label: '마이페이지', href: '/customer/profile', icon: User },
  ],
  // 업체: 홈 | 마이페이지 (2탭 기본)
  partner: () => [
    { label: '홈', href: '/partner', icon: Home },
    { label: '행사', href: '/partner/events', icon: Calendar },
    { label: '마이페이지', href: '/partner/settings', icon: User },
  ],
  // 주관사: 행사 | 알림 | 설정
  organizer: (unreadCount) => [
    { label: '행사', href: '/organizer/events', icon: Calendar },
    { label: '알림', href: '/organizer/notifications', icon: Bell, badge: unreadCount },
    { label: '설정', href: '/organizer/settings', icon: Building2 },
  ],
};

export default function BottomNav({ role = 'customer' }: { role?: string }) {
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();

  const getItems = navItemsByRole[role] || navItemsByRole.customer;
  const items = getItems(unreadCount);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === `/${role}`
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 relative min-w-[44px] min-h-[44px] justify-center',
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
