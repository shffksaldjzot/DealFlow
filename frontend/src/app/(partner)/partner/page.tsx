'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { Calendar, FileText, QrCode, ChevronRight } from 'lucide-react';
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

  const stats = [
    { label: '참여 행사', value: String(events.length), icon: Calendar, color: 'text-blue-600 bg-blue-100', href: '/partner/events' },
    { label: '전체 계약', value: String(contracts.length), icon: FileText, color: 'text-green-600 bg-green-100', href: '/partner/events' },
    { label: '서명 완료', value: String(contracts.filter((c) => c.status === 'signed' || c.status === 'completed').length), icon: QrCode, color: 'text-purple-600 bg-purple-100', href: '/partner/events' },
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

      <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 계약</h3>
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
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
                <div>
                  <p className="text-xs text-gray-400 font-mono">{c.contractNumber}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{c.event?.name || '계약서'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge status={c.status} />
                    <span className="text-xs text-gray-400">{c.customer?.name || '미지정'}</span>
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
