'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Calendar } from 'lucide-react';
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
        backHref="/partner"
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-gray-800 shadow-sm'
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
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
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
        <div className="grid grid-cols-2 gap-3">
          {filteredEvents.map((ep) => {
            const isApproved = ep.status === 'approved';
            const daysLeft = Math.ceil(
              (new Date(ep.event.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
            );
            return (
              <button
                key={ep.id}
                onClick={() => isApproved ? router.push(`/partner/events/${ep.eventId}`) : undefined}
                className={`rounded-xl p-3 text-left transition-all flex flex-col justify-between min-h-[100px] ${
                  isApproved
                    ? 'bg-blue-100 hover:bg-blue-200'
                    : 'bg-gray-50 border border-gray-200 opacity-75'
                }`}
              >
                <h3 className={`font-bold text-sm leading-tight line-clamp-2 ${
                  isApproved ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  {ep.event.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                    isApproved ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {isApproved ? '진행중' : ep.status === 'pending' ? '대기' : ep.status === 'rejected' ? '거절' : '취소'}
                  </span>
                  {isApproved && daysLeft > 0 && (
                    <span className="text-[10px] font-bold text-blue-700">D-{daysLeft}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
