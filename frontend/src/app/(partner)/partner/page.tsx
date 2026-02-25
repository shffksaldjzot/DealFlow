'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Calendar, FileText, QrCode, ChevronRight, Plus, Eye, MapPin } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function PartnerDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/event-partners/my-events').then((res) => setEvents(extractData(res))).catch(() => {}),
      api.get('/contracts').then((res) => setContracts(extractData(res))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const activeEvents = events.filter((e) => e.status === 'approved');
  const pendingEvents = events.filter((e) => e.status === 'pending');
  const signedContracts = contracts.filter((c) => c.status === 'signed' || c.status === 'completed').length;

  return (
    <div>
      {/* Join Event CTA */}
      <div
        onClick={() => router.push('/partner/events/join')}
        className="mb-5 bg-gradient-to-r from-[#1B3460] to-[#2E4A7A] rounded-2xl p-4 text-white cursor-pointer active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold">행사 참여</p>
            <p className="text-sm text-white/70">초대코드로 새 행사에 참여하세요</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/50" />
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success-light text-green-800 rounded-full text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          승인 {activeEvents.length}
        </span>
        {pendingEvents.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warning-light text-amber-800 rounded-full text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            대기 {pendingEvents.length}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
          <FileText className="w-3 h-3" />
          계약 {contracts.length} (완료 {signedContracts})
        </span>
      </div>

      {/* Active Events - Hero Section */}
      {!loading && activeEvents.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-800">진행중인 행사</h3>
            {activeEvents.length > 3 && (
              <button
                onClick={() => router.push('/partner/events')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                전체보기 &rarr;
              </button>
            )}
          </div>
          <div className="space-y-3">
            {activeEvents.slice(0, 3).map((ep: any) => (
              <Card key={ep.id} className="!p-0 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-gray-800 text-[15px]">{ep.event.name}</h4>
                    <Badge status="approved" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(ep.event.startDate)} ~ {formatDate(ep.event.endDate)}
                    </span>
                    {ep.event.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {ep.event.venue}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/partner/events/${ep.eventId}/contracts/new`)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      계약 생성
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push(`/partner/events/${ep.eventId}`)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      상세
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Events */}
      {!loading && pendingEvents.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">승인 대기 행사</h3>
          <div className="space-y-2">
            {pendingEvents.map((ep: any) => (
              <Card key={ep.id} hoverable onClick={() => router.push('/partner/events')}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm truncate">{ep.event.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(ep.event.startDate)}</p>
                  </div>
                  <Badge status="pending" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
        <Card>
          <div className="text-center py-10">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">참여 중인 행사가 없습니다</p>
            <p className="text-sm text-gray-400 mb-4">초대코드로 행사에 참여해보세요</p>
            <Button onClick={() => router.push('/partner/events/join')}>
              <QrCode className="w-4 h-4 mr-1" />
              행사 참여하기
            </Button>
          </div>
        </Card>
      )}

      {/* Recent Contracts (compact) */}
      {!loading && contracts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">최근 계약</h3>
          </div>
          <div className="space-y-2">
            {contracts.slice(0, 3).map((c: any) => (
              <Card key={c.id} hoverable onClick={() => router.push(`/partner/contracts/${c.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-800 text-sm truncate">{c.event?.name || '계약서'}</p>
                      <Badge status={c.status} />
                    </div>
                    <p className="text-xs text-gray-400">
                      {c.customerName || c.customer?.name || '미지정'}
                      {c.totalAmount != null && (
                        <span className="ml-2 font-medium text-gray-500">
                          {Number(c.totalAmount).toLocaleString('ko-KR')}원
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </div>
              </Card>
            ))}
            {contracts.length > 3 && (
              <button
                onClick={() => router.push('/partner/events')}
                className="w-full text-center text-xs text-blue-600 font-medium py-2"
              >
                전체 계약 보기 &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
