'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { Calendar, FileText, Users, Plus, ChevronRight, Settings, ClipboardList, Clock } from 'lucide-react';
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

  const activeEvents = events.filter((e) => e.status === 'active');
  const draftEvents = events.filter((e) => e.status === 'draft');
  const totalPartners = events.reduce((acc, e) => acc + (e.partners?.length || 0), 0);
  const approvedPartners = events.reduce(
    (acc, e) => acc + (e.partners?.filter((p: any) => p.status === 'approved')?.length || 0),
    0,
  );

  // Extract pending partner requests across all events
  const pendingPartnerRequests = events.flatMap((event) =>
    (event.partners || [])
      .filter((p: any) => p.status === 'pending')
      .map((p: any) => ({
        eventId: event.id,
        eventName: event.name,
        partnerName: p.organization?.name || '업체명 미확인',
        appliedAt: p.createdAt,
      }))
  ).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

  const stats = [
    { label: '진행 중', value: String(activeEvents.length), icon: Calendar, color: 'text-green-600 bg-green-50' },
    { label: '준비 중', value: String(draftEvents.length), icon: FileText, color: 'text-yellow-600 bg-yellow-50' },
    { label: '전체 행사', value: String(events.length), icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
    { label: '승인 협력업체', value: `${approvedPartners}/${totalPartners}`, icon: Users, color: 'text-purple-600 bg-purple-50' },
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} hoverable onClick={() => router.push('/organizer/events')}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{loading ? '-' : s.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">빠른 작업</h3>
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Card hoverable onClick={() => router.push('/organizer/events/new')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">새 행사 만들기</p>
              <p className="text-xs text-gray-400">행사를 생성하세요</p>
            </div>
          </div>
        </Card>
        <Card hoverable onClick={() => router.push('/organizer/events')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">행사 관리</p>
              <p className="text-xs text-gray-400">행사를 관리하세요</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Partner Requests */}
      {!loading && pendingPartnerRequests.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-700">참가 대기 요청</h3>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              {pendingPartnerRequests.length}
            </span>
          </div>
          <div className="space-y-2 mb-8">
            {pendingPartnerRequests.map((req, i) => (
              <Card
                key={i}
                hoverable
                onClick={() => router.push(`/organizer/events/${req.eventId}/partners`)}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                      <p className="text-sm font-semibold text-gray-900 truncate">{req.partnerName}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 ml-6">
                      <span>{req.eventName}</span>
                      <span>{formatDate(req.appliedAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Recent Events with more detail */}
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
          {events.slice(0, 5).map((event) => {
            const partnerCount = event.partners?.length || 0;
            const approvedCount = event.partners?.filter((p: any) => p.status === 'approved')?.length || 0;
            return (
              <Card key={event.id} hoverable onClick={() => router.push(`/organizer/events/${event.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">{event.name}</p>
                      <Badge status={event.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{formatDate(event.startDate)} ~ {formatDate(event.endDate)}</span>
                      {partnerCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {approvedCount}/{partnerCount} 업체
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
