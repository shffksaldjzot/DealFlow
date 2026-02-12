'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import type { EventPartner } from '@/types/event';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function EventPartnersPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [partners, setPartners] = useState<EventPartner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = () => {
    api.get(`/events/${id}/partners`)
      .then((res) => setPartners(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPartners(); }, [id]);

  const handleAction = async (partnerId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/events/${id}/partners/${partnerId}`, { status });
      toast(status === 'approved' ? '승인되었습니다.' : '거절되었습니다.', 'success');
      fetchPartners();
    } catch {
      toast('처리에 실패했습니다.', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="협력업체 관리"
        subtitle="참여 신청한 협력업체를 승인/거절하세요"
        backHref={`/organizer/events/${id}`}
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : partners.length === 0 ? (
        <EmptyState
          title="참여 신청한 업체가 없습니다"
          description="초대코드를 공유하여 협력업체를 초대하세요"
        />
      ) : (
        <div className="space-y-3">
          {partners.map((ep) => (
            <Card key={ep.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">{ep.partner?.name || '업체'}</h3>
                  <Badge status={ep.status} />
                </div>
                {ep.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(ep.partnerId, 'approved')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleAction(ep.partnerId, 'rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      거절
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
