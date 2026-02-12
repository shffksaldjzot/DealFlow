'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Building2,
  Settings,
  QrCode,
  FolderOpen,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  role: 'organizer' | 'partner' | 'admin' | 'customer';
}

const navItems: Record<string, NavItem[]> = {
  organizer: [
    { label: '대시보드', href: '/organizer', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: '행사 관리', href: '/organizer/events', icon: <Calendar className="w-5 h-5" /> },
    { label: '조직 설정', href: '/organizer/settings', icon: <Settings className="w-5 h-5" /> },
  ],
  partner: [
    { label: '대시보드', href: '/partner', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: '참여 행사', href: '/partner/events', icon: <Calendar className="w-5 h-5" /> },
    { label: '행사 참여', href: '/partner/events/join', icon: <QrCode className="w-5 h-5" /> },
    { label: '조직 설정', href: '/partner/settings', icon: <Settings className="w-5 h-5" /> },
  ],
  admin: [
    { label: '대시보드', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: '주관사 관리', href: '/admin/organizers', icon: <Building2 className="w-5 h-5" /> },
    { label: '사용자 관리', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: '행사 관리', href: '/admin/events', icon: <Calendar className="w-5 h-5" /> },
    { label: '계약 관리', href: '/admin/contracts', icon: <FileText className="w-5 h-5" /> },
  ],
  customer: [
    { label: '홈', href: '/customer', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: '내 계약', href: '/customer/contracts', icon: <FileText className="w-5 h-5" /> },
    { label: '프로필', href: '/customer/profile', icon: <Settings className="w-5 h-5" /> },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = navItems[role] || [];

  return (
    <aside className="w-60 h-[calc(100vh-64px)] bg-white border-r border-gray-100 py-4 hidden lg:block sticky top-16">
      <nav className="px-3 space-y-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${role}` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
