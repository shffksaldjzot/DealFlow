'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import PeriodSelector, { PeriodValue } from '@/components/ui/PeriodSelector';
import { Calendar, FileText, QrCode, ChevronRight, Clock, CheckCircle, XCircle, Send, MapPin, Plus, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';

function filterByPeriod<T extends { createdAt?: string }>(items: T[], period: PeriodValue): T[] {
  if (!period.from && !period.to) return items;
  return items.filter((item) => {
    const d = item.createdAt ? new Date(item.createdAt) : null;
    if (!d) return true;
    if (period.from && d < new Date(period.from)) return false;
    if (period.to) { const to = new Date(period.to); to.setHours(23, 59, 59, 999); if (d > to) return false; }
    return true;
  });
}

export default function PartnerDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodValue>({ from: null, to: null, label: '전체' });

  useEffect(() => {
    Promise.all([
      api.get('/event-partners/my-events').then((res) => setEvents(extractData(res))).catch(() => {}),
      api.get('/contracts').then((res) => setContracts(extractData(res))).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => filterByPeriod(events, period), [events, period]);
  const filteredContracts = useMemo(() => filterByPeriod(contracts, period), [contracts, period]);

  const pendingEvents = filteredEvents.filter((e) => e.status === 'pending').length;
  const approvedEvents = filteredEvents.filter((e) => e.status === 'approved').length;
  const rejectedEvents = filteredEvents.filter((e) => e.status === 'rejected').length;
  const signedContracts = filteredContracts.filter((c) => c.status === 'signed' || c.status === 'completed').length;
  const activeEvents = filteredEvents.filter((e) => e.status === 'approved');

  const eventStats = [
    { label: '승인완료', value: approvedEvents, icon: CheckCircle, color: 'text-success bg-success-light' },
    { label: '승인대기', value: pendingEvents, icon: Clock, color: 'text-warning bg-warning-light' },
    { label: '거절', value: rejectedEvents, icon: XCircle, color: 'text-error bg-error-light' },
  ];

  const contractStats = [
    { label: '전체 계약', value: filteredContracts.length, icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: '서명 완료', value: signedContracts, icon: Send, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div>
      <PageHeader
        title="대시보드"
        subtitle="행사별 계약 현황을 관리하세요"
        actions={
          <Button onClick={() => router.push('/partner/events/join')}>
            <QrCode className="w-4 h-4 mr-1" />
            행사 참여
          </Button>
        }
      />

      {/* Period Filter */}
      <div className="mb-4">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Event Status */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">행사 현황</h3>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {eventStats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} hoverable onClick={() => router.push('/partner/events')}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-800">{loading ? '-' : s.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Contract Stats */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">계약 현황</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {contractStats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-800">{loading ? '-' : s.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Active Events */}
      {!loading && activeEvents.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">진행중인 행사</h3>
            {activeEvents.length > 3 && (
              <button
                onClick={() => router.push('/partner/events')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                더보기 →
              </button>
            )}
          </div>
          <div className="space-y-3 mb-6">
            {activeEvents.slice(0, 3).map((ep: any) => (
              <Card key={ep.id}>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-gray-800">{ep.event.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(ep.event.startDate)} ~ {formatDate(ep.event.endDate)}
                      </span>
                      {ep.event.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ep.event.venue}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
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
                      상세보기
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Recent Contracts */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 계약</h3>
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : contracts.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">아직 생성된 계약이 없습니다</p>
            <Button onClick={() => router.push('/partner/events/join')}>
              초대코드로 행사 참여
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.slice(0, 5).map((c: any) => (
            <Card key={c.id} hoverable onClick={() => router.push(`/partner/contracts/${c.id}`)}>
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800 truncate">{c.event?.name || '계약서'}</p>
                    <Badge status={c.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{c.customerName || c.customer?.name || '미지정'}</span>
                    {c.totalAmount != null && (
                      <span className="font-medium text-gray-500">
                        {Number(c.totalAmount).toLocaleString('ko-KR')}원
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
