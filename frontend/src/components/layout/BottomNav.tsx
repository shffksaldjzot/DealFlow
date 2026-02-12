'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, FileText, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const items = [
    { label: '홈', href: '/customer', icon: Home },
    { label: '내 계약', href: '/customer/contracts', icon: FileText },
    { label: '프로필', href: '/customer/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 lg:hidden z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-1',
                isActive ? 'text-blue-600' : 'text-gray-400',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
