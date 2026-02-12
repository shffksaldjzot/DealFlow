'use client';
import { useEffect, useState } from 'react';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { Calendar, MapPin, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { EventVisit } from '@/types/event';

export default function ReservationsPage() {
  const { toast } = useToast();
  const [visits, setVisits] = useState<EventVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = () => {
    api.get('/event-visits/my')
      .then((res) => setVisits(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVisits(); }, []);

  const handleCancel = async (visitId: string) => {
    try {
      await api.post(`/event-visits/${visitId}/cancel`);
      toast('예약이 취소되었습니다.', 'success');
      fetchVisits();
    } catch {
      toast('취소에 실패했습니다.', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="방문 예약" subtitle="행사 방문 예약 내역" />

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : visits.length === 0 ? (
        <EmptyState
          title="예약 내역이 없습니다"
          description="행사 방문 예약 링크를 통해 예약하세요"
        />
      ) : (
        <div className="space-y-3">
          {visits.map((v) => (
            <Card key={v.id}>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{v.event?.name || '행사'}</h3>
                    <Badge status={v.status === 'reserved' ? 'approved' : 'cancelled'} />
                  </div>
                  {v.status === 'reserved' && (
                    <Button size="sm" variant="outline" onClick={() => handleCancel(v.id)}>
                      취소
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    방문일: {formatDate(v.visitDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {v.guestCount}명
                  </span>
                  {v.event?.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {v.event.venue}
                    </span>
                  )}
                </div>
                {v.memo && (
                  <p className="text-xs text-gray-400">메모: {v.memo}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
