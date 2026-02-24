'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bell, Check, CheckCheck, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { Notification } from '@/types/notification';
import { normalizeNotification } from '@/types/notification';

export default function CustomerNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then((res) => {
        const raw = extractData<any[]>(res);
        setNotifications(raw.map(normalizeNotification));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) await handleMarkRead(n.id);
    if (n.relatedType === 'contract' && n.relatedId) {
      router.push(`/customer/contracts/${n.relatedId}`);
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">알림</h2>
          <p className="text-sm text-gray-500 mt-1">
            {unread > 0 ? `읽지 않은 알림 ${unread}개` : '모든 알림을 확인했습니다'}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4 mr-1" /> 모두 읽음
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">알림이 없습니다</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer ${!n.isRead ? 'border-l-[3px] border-l-blue-500 bg-blue-50/30' : ''}`}
              hoverable
              onClick={() => handleNotificationClick(n)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                  </div>
                  <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.isRead ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                    className="p-2 rounded-lg hover:bg-gray-100 shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center transition-colors"
                    title="읽음 처리"
                  >
                    <Check className="w-4 h-4 text-gray-400" />
                  </button>
                ) : (n.relatedId && (
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
