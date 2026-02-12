'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Plus, Calendar, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types/event';

export default function OrganizerEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events')
      .then((res) => setEvents(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        title="행사 관리"
        subtitle="생성한 행사를 관리하세요"
        actions={
          <Button onClick={() => router.push('/organizer/events/new')}>
            <Plus className="w-4 h-4 mr-1" />
            행사 생성
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="행사가 없습니다"
          description="첫 행사를 생성해보세요"
          action={
            <Button onClick={() => router.push('/organizer/events/new')}>
              행사 생성하기
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card
              key={event.id}
              hoverable
              onClick={() => router.push(`/organizer/events/${event.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{event.name}</h3>
                    <Badge status={event.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
                    </span>
                    {event.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.venue}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg font-mono">
                  {event.inviteCode}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
