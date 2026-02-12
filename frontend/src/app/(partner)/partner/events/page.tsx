'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { QrCode, Calendar, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface MyEvent {
  id: string;
  eventId: string;
  status: string;
  event: { id: string; name: string; startDate: string; endDate: string; venue?: string };
}

type TabKey = 'approved' | 'pending' | 'rejected' | 'cancelled' | 'all';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'approved', label: '진행중' },
  { key: 'pending', label: '참가요청' },
  { key: 'rejected', label: '거절' },
  { key: 'cancelled', label: '취소' },
  { key: 'all', label: '전체' },
];

export default function PartnerEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('approved');

  useEffect(() => {
    api.get('/event-partners/my-events')
      .then((res) => setEvents(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getCount = (tab: TabKey) => {
    if (tab === 'all') return events.length;
    return events.filter((e) => e.status === tab).length;
  };

  const filteredEvents = activeTab === 'all'
    ? events
    : events.filter((e) => e.status === activeTab);

  return (
    <div>
      <PageHeader
        title="참여 행사"
        actions={
          <Button onClick={() => router.push('/partner/events/join')}>
            <QrCode className="w-4 h-4 mr-1" />
            행사 참여
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {!loading && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {getCount(tab.key)}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title={activeTab === 'all' ? '참여 중인 행사가 없습니다' : `${tabs.find(t => t.key === activeTab)?.label} 행사가 없습니다`}
          description={activeTab === 'all' ? '초대코드를 입력하여 행사에 참여하세요' : undefined}
          action={
            activeTab === 'all' ? (
              <Button onClick={() => router.push('/partner/events/join')}>
                행사 참여하기
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((ep) => (
            <Card
              key={ep.id}
              hoverable={ep.status === 'approved'}
              onClick={() => {
                if (ep.status === 'approved') {
                  router.push(`/partner/events/${ep.eventId}`);
                }
              }}
              className={ep.status !== 'approved' ? 'opacity-75' : ''}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{ep.event.name}</h3>
                    <Badge status={ep.status} />
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(ep.event.startDate)} ~ {formatDate(ep.event.endDate)}
                  </p>
                  {ep.event.venue && (
                    <p className="text-xs text-gray-400 mt-0.5">{ep.event.venue}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {ep.status === 'approved' && (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
