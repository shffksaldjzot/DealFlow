'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import api, { extractData } from '@/lib/api';
import { useNotificationStore } from '@/stores/notificationStore';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Building2,
  Settings,
  QrCode,
  Menu,
  X,
  ClipboardList,
  UserCheck,
  Bell,
  FileSpreadsheet,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badgeKey?: string;
}

interface SidebarProps {
  role: 'organizer' | 'partner' | 'admin' | 'customer';
}

const navItems: Record<string, NavItem[]> = {
  organizer: [
    { label: '행사 관리', href: '/organizer/events', icon: <Calendar className="w-5 h-5" /> },
    { label: '알림', href: '/organizer/notifications', icon: <Bell className="w-5 h-5" />, badgeKey: 'unreadNotifications' },
    { label: '마이페이지', href: '/organizer/settings', icon: <Building2 className="w-5 h-5" /> },
  ],
  partner: [
    { label: '대시보드', href: '/partner', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: '참여 행사', href: '/partner/events', icon: <Calendar className="w-5 h-5" /> },
    { label: '행사 참여', href: '/partner/events/join', icon: <QrCode className="w-5 h-5" /> },
    { label: '알림', href: '/partner/notifications', icon: <Bell className="w-5 h-5" />, badgeKey: 'unreadNotifications' },
    { label: '마이페이지', href: '/partner/settings', icon: <Building2 className="w-5 h-5" /> },
  ],
  admin: [
    { label: '대시보드', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: '가입 승인/관리', href: '/admin/organizers', icon: <UserCheck className="w-5 h-5" />, badgeKey: 'pendingApprovals' },
    { label: '사용자 관리', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: '행사 관리', href: '/admin/events', icon: <Calendar className="w-5 h-5" /> },
    { label: '개별계약 관리', href: '/admin/contracts', icon: <FileText className="w-5 h-5" /> },
    { label: '통합 계약', href: '/admin/ic-contracts', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { label: '알림', href: '/admin/notifications', icon: <Bell className="w-5 h-5" />, badgeKey: 'unreadNotifications' },
    { label: '활동 로그', href: '/admin/logs', icon: <ClipboardList className="w-5 h-5" /> },
  ],
  customer: [
    { label: '홈', href: '/customer', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: '내 계약', href: '/customer/contracts', icon: <FileText className="w-5 h-5" /> },
    { label: '통합 계약', href: '/customer/integrated-contracts', icon: <ClipboardList className="w-5 h-5" /> },
    { label: '알림', href: '/customer/notifications', icon: <Bell className="w-5 h-5" />, badgeKey: 'unreadNotifications' },
    { label: '프로필', href: '/customer/profile', icon: <Settings className="w-5 h-5" /> },
  ],
};

function NavList({ items, role, badges, onNavigate }: { items: NavItem[]; role: string; badges?: Record<string, number>; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="px-3 space-y-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== `/${role}` && pathname.startsWith(item.href));
        const badgeCount = item.badgeKey && badges ? badges[item.badgeKey] : 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800',
            )}
          >
            <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {badgeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-error rounded-full">
                {badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ role }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localBadges, setLocalBadges] = useState<Record<string, number>>({});
  const { unreadCount } = useNotificationStore();
  const items = navItems[role] || [];

  // Merge notification store count into badges
  const badges = { ...localBadges, unreadNotifications: unreadCount };

  useEffect(() => {
    if (role === 'admin') {
      api.get('/admin/dashboard')
        .then((res) => {
          const data = extractData<any>(res);
          const pending = (data.pendingOrganizations || 0) + (data.pendingPartners || 0);
          setLocalBadges((prev) => ({ ...prev, pendingApprovals: pending }));
        })
        .catch(() => {});
    }
  }, [role]);

  return (
    <>
      {/* Mobile: BottomNav is used instead for partner/organizer/customer */}
      {/* Admin still uses the mobile sidebar toggle */}
      {role === 'admin' && (
        <>
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden fixed bottom-4 left-4 z-30 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {mobileOpen && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
              <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl py-4">
                <div className="flex items-center justify-between px-4 mb-4">
                  <span className="text-lg font-bold text-blue-600">DealFlow</span>
                  <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <NavList items={items} role={role} badges={badges} onNavigate={() => setMobileOpen(false)} />
              </aside>
            </div>
          )}
        </>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-60 h-[calc(100vh-64px)] bg-white border-r border-gray-200 py-4 hidden lg:block sticky top-16">
        <NavList items={items} role={role} badges={badges} />
      </aside>
    </>
  );
}
