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
import { getEventColor } from '@/lib/eventColors';
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
        backHref="/organizer"
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
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
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
        <>
          {/* Tile-style event cards (와이어프레임 3-2) */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {events.map((event) => {
              const daysLeft = Math.ceil(
                (new Date(event.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
              );
              const color = getEventColor(event.themeColor);
              return (
                <button
                  key={event.id}
                  onClick={() => router.push(`/organizer/events/${event.id}`)}
                  className={`relative ${color.bg} ${color.hover} rounded-xl p-4 text-left transition-all aspect-[3/2] flex flex-col justify-between`}
                >
                  <div>
                    <h3 className={`font-bold ${color.title} text-sm leading-tight line-clamp-2`}>
                      {event.name}
                    </h3>
                    {event.venue && (
                      <p className={`text-xs ${color.sub} mt-1 flex items-center gap-1`}>
                        <MapPin className="w-3 h-3" />
                        {event.venue}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge status={event.status} />
                    {daysLeft > 0 && event.status !== 'cancelled' && (
                      <span className={`text-xs font-bold ${color.badge}`}>D-{daysLeft}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* + 행사 생성 버튼 (와이어프레임 3-2) */}
          <button
            onClick={() => router.push('/organizer/events/new')}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl p-4 text-center text-lg font-bold transition-colors"
          >
            +
          </button>
        </>
      )}
    </div>
  );
}
