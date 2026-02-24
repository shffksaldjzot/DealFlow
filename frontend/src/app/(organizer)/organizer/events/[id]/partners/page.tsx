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
import { CheckCircle2, XCircle, Ban, Calendar, Phone, Mail, Tag } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type PartnerTabKey = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';

const partnerTabs: { key: PartnerTabKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '승인대기' },
  { key: 'approved', label: '승인됨' },
  { key: 'rejected', label: '거절' },
  { key: 'cancelled', label: '취소' },
];

export default function EventPartnersPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [partners, setPartners] = useState<EventPartner[]>([]);
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PartnerTabKey>('all');
  const [cancelTarget, setCancelTarget] = useState<EventPartner | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchPartners = () => {
    api.get(`/events/${id}/partners`)
      .then((res) => setPartners(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPartners();
    // Fetch event name
    api.get(`/events/${id}`)
      .then((res) => {
        const event = extractData<any>(res);
        setEventName(event.name || '');
      })
      .catch(() => {});
  }, [id]);

  const handleAction = async (partnerId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/events/${id}/partners/${partnerId}`, { status });
      toast(status === 'approved' ? '승인되었습니다.' : '거절되었습니다.', 'success');
      fetchPartners();
    } catch {
      toast('처리에 실패했습니다.', 'error');
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await api.patch(`/events/${id}/partners/${cancelTarget.partnerId}`, {
        status: 'cancelled',
        cancelReason: cancelReason || undefined,
      });
      toast('승인이 취소되었습니다.', 'success');
      setCancelTarget(null);
      setCancelReason('');
      fetchPartners();
    } catch {
      toast('처리에 실패했습니다.', 'error');
    }
  };

  const getCount = (tab: PartnerTabKey) => {
    if (tab === 'all') return partners.length;
    return partners.filter((p) => p.status === tab).length;
  };

  const filteredPartners = activeTab === 'all'
    ? partners
    : partners.filter((p) => p.status === activeTab);

  return (
    <div>
      <PageHeader
        title="협력업체 관리"
        subtitle={eventName ? `${eventName} - 참여 신청한 협력업체를 승인/거절하세요` : '참여 신청한 협력업체를 승인/거절하세요'}
        backHref={`/organizer/events/${id}`}
      />

      {/* Partner Status Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {partnerTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {!loading && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {getCount(tab.key)}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />)}
        </div>
      ) : filteredPartners.length === 0 ? (
        <EmptyState
          title="해당 상태의 업체가 없습니다"
          description={activeTab === 'all' ? '초대코드를 공유하여 협력업체를 초대하세요' : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filteredPartners.map((ep) => (
            <Card key={ep.id}>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800">{ep.partner?.name || '업체'}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge status={ep.status} />
                      {eventName && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          {eventName}
                        </span>
                      )}
                    </div>
                  </div>
                  {ep.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAction(ep.partnerId, 'approved')}>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> 승인
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleAction(ep.partnerId, 'rejected')}>
                        <XCircle className="w-4 h-4 mr-1" /> 거절
                      </Button>
                    </div>
                  )}
                  {ep.status === 'approved' && (
                    <Button size="sm" variant="secondary" onClick={() => setCancelTarget(ep)}>
                      <Ban className="w-4 h-4 mr-1" /> 승인 취소
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 신청일: {formatDate(ep.createdAt)}
                  </span>
                  {ep.approvedAt && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-success" /> 승인일: {formatDate(ep.approvedAt)}
                    </span>
                  )}
                  {ep.partner?.contactPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {ep.partner.contactPhone}
                    </span>
                  )}
                  {ep.partner?.contactEmail && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {ep.partner.contactEmail}
                    </span>
                  )}
                </div>
                {(ep as any).items && (
                  <div className="flex flex-wrap gap-1.5">
                    <Tag className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                    {(ep as any).items.split(',').map((item: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {item.trim()}
                      </span>
                    ))}
                  </div>
                )}
                {ep.cancelReason && (
                  <p className="text-xs text-error">취소 사유: {ep.cancelReason}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800">승인 취소</h3>
            <p className="text-sm text-gray-500">
              <strong>{cancelTarget.partner?.name}</strong>의 참여 승인을 취소하시겠습니까?
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">취소 사유 (선택)</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소 사유를 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setCancelTarget(null); setCancelReason(''); }}>
                닫기
              </Button>
              <Button variant="danger" onClick={handleCancel}>
                승인 취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
