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

export default function PartnerEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/event-partners/my-events')
      .then((res) => setEvents(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="참여 중인 행사가 없습니다"
          description="초대코드를 입력하여 행사에 참여하세요"
          action={
            <Button onClick={() => router.push('/partner/events/join')}>
              행사 참여하기
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {events.map((ep) => (
            <Card
              key={ep.id}
              hoverable
              onClick={() => {
                if (ep.status === 'approved') {
                  router.push(`/partner/events/${ep.eventId}`);
                }
              }}
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
                </div>
                {ep.status === 'approved' && (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
