'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useRouter } from 'next/navigation';
import { LogOut, User, Bell, Check, ChevronRight } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { Notification } from '@/types/notification';
import { normalizeNotification } from '@/types/notification';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { unreadCount, fetchUnreadCount, decrement, clearCount } = useNotificationStore();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleLabels: Record<string, string> = {
    customer: '고객',
    organizer: '주관사',
    partner: '협력업체',
    admin: '관리자',
  };

  const roleColors: Record<string, string> = {
    customer: 'bg-blue-100 text-blue-700',
    organizer: 'bg-[#FFF7ED] text-[#C2410C]',
    partner: 'bg-[#ECFDF5] text-[#059669]',
    admin: 'bg-[#EDE9FE] text-[#6D28D9]',
  };

  const rolePaths: Record<string, string> = {
    customer: '/customer',
    organizer: '/organizer',
    partner: '/partner',
    admin: '/admin',
  };

  // Fetch unread count via shared store
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showDropdown && isAuthenticated) {
      api.get('/notifications')
        .then((res) => {
          const raw = extractData<any[]>(res);
          setNotifications(raw.map(normalizeNotification));
        })
        .catch(() => {});
    }
  }, [showDropdown, isAuthenticated]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = async (notifId: string) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, isRead: true } : n));
      decrement();
    } catch {}
  };

  const getNotificationLink = (n: Notification): string | null => {
    const role = user?.role;
    const basePath = role ? rolePaths[role] : '';
    if (n.relatedType === 'event' && n.relatedId) {
      return `${basePath}/events/${n.relatedId}`;
    }
    if (n.relatedType === 'contract' && n.relatedId) {
      if (role === 'customer') return `${basePath}/contracts/${n.relatedId}`;
      if (role === 'partner') return `${basePath}/events`;
      if (role === 'organizer') return `${basePath}/events`;
    }
    return basePath ? `${basePath}/notifications` : null;
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) await handleMarkRead(n.id);
    const link = getNotificationLink(n);
    if (link) {
      setShowDropdown(false);
      router.push(link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      clearCount();
    } catch {}
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-2.5">
        <h1
          className="text-lg font-bold text-blue-600 cursor-pointer tracking-tight"
          onClick={() => router.push(user ? rolePaths[user.role] || '/' : '/')}
        >
          DealFlow
        </h1>
        {user && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
            {roleLabels[user.role]}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4.5 h-4.5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-14 sm:top-12 sm:w-80 bg-white rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] border border-gray-200 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-800">알림</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    모두 읽음
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">알림이 없습니다</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-200 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push(user ? `${rolePaths[user.role]}/notifications` : '/');
                    }}
                    className="text-xs text-blue-600 font-semibold hover:underline w-full text-center"
                  >
                    전체 보기
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
          <button
            onClick={() => {
              if (!user) return;
              const profilePaths: Record<string, string> = {
                customer: '/customer/profile',
                partner: '/partner/settings',
                organizer: '/organizer/settings',
                admin: '/admin',
              };
              router.push(profilePaths[user.role] || '/');
            }}
            className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors cursor-pointer"
            title="마이페이지"
          >
            <span className="text-xs font-bold text-blue-700">
              {user?.name?.charAt(0) || <User className="w-4 h-4 text-blue-600" />}
            </span>
          </button>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
