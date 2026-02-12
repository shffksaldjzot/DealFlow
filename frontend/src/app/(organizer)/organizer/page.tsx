'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { Calendar, FileText, Users, Plus, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types/event';

export default function OrganizerDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events')
      .then((res) => setEvents(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeEvents = events.filter((e) => e.status === 'active').length;
  const totalPartners = events.reduce((acc, e) => acc + (e.partners?.length || 0), 0);

  const stats = [
    { label: '진행 중 행사', value: String(activeEvents), icon: Calendar, color: 'text-blue-600 bg-blue-100', href: '/organizer/events' },
    { label: '전체 행사', value: String(events.length), icon: FileText, color: 'text-green-600 bg-green-100', href: '/organizer/events' },
    { label: '참여 협력업체', value: String(totalPartners), icon: Users, color: 'text-purple-600 bg-purple-100', href: '/organizer/events' },
  ];

  return (
    <div>
      <PageHeader
        title="대시보드"
        subtitle="행사와 계약 현황을 한눈에 확인하세요"
        actions={
          <Button onClick={() => router.push('/organizer/events/new')}>
            <Plus className="w-4 h-4 mr-1" />
            행사 생성
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} hoverable onClick={() => router.push(s.href)}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '-' : s.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Events */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 행사</h3>
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">아직 생성된 행사가 없습니다</p>
            <Button onClick={() => router.push('/organizer/events/new')}>
              첫 행사 만들기
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.slice(0, 5).map((event) => (
            <Card key={event.id} hoverable onClick={() => router.push(`/organizer/events/${event.id}`)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{event.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge status={event.status} />
                    <span className="text-xs text-gray-400">
                      {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
