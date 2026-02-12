'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/layout/PageHeader';
import QRCodeDisplay from '@/components/contract/QRCodeDisplay';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { XCircle, User, FileText, Clock } from 'lucide-react';
import type { Contract } from '@/types/contract';

export default function PartnerContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchContract = () => {
    api.get(`/contracts/${id}`)
      .then((res) => setContract(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContract(); }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`/contracts/${id}/cancel`, { reason: cancelReason });
      toast('계약이 취소되었습니다.', 'success');
      setCancelModal(false);
      fetchContract();
    } catch {
      toast('취소에 실패했습니다.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref="/partner/events" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref="/partner/events" />
        <Card><p className="text-center text-gray-500 py-8">계약서를 찾을 수 없습니다</p></Card>
      </div>
    );
  }

  const canCancel = contract.status !== 'completed' && contract.status !== 'cancelled';

  return (
    <div>
      <PageHeader
        title="계약 상세"
        backHref={`/partner/events/${contract.eventId}`}
        actions={
          canCancel ? (
            <Button variant="danger" size="sm" onClick={() => setCancelModal(true)}>
              <XCircle className="w-4 h-4 mr-1" /> 취소
            </Button>
          ) : undefined
        }
      />

      {/* Status */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-mono">{contract.contractNumber}</p>
            <Badge status={contract.status} />
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>{formatDateTime(contract.createdAt)}</p>
          </div>
        </div>
      </Card>

      {/* QR Code */}
      {(contract.status === 'pending' || contract.status === 'in_progress') && (
        <div className="mb-4">
          <QRCodeDisplay
            contractNumber={contract.contractNumber}
            qrCode={contract.qrCode}
            qrCodeUrl={contract.qrCodeUrl || ''}
          />
        </div>
      )}

      {/* Info */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">계약 정보</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">이벤트</p>
              <p className="text-sm font-medium">{contract.event?.name || '-'}</p>
            </div>
          </div>
          {contract.customer && (
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">고객</p>
                <p className="text-sm font-medium">{contract.customer.name} ({contract.customer.email})</p>
              </div>
            </div>
          )}
          {contract.totalAmount && (
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">금액</p>
                <p className="text-sm font-bold text-blue-600">{formatCurrency(contract.totalAmount)}</p>
              </div>
            </div>
          )}
          {contract.expiresAt && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">만료일</p>
                <p className="text-sm font-medium">{formatDateTime(contract.expiresAt)}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Field Values */}
      {contract.fieldValues && contract.fieldValues.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">입력 내용</h3>
          <div className="space-y-2">
            {contract.fieldValues.map((fv: any) => (
              <div key={fv.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{fv.field?.label || '항목'}</span>
                <span className="text-sm font-medium text-gray-900">{fv.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* History */}
      {contract.histories && contract.histories.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">이력</h3>
          <div className="space-y-2">
            {contract.histories.map((h: any) => (
              <div key={h.id} className="flex items-center gap-2 text-xs">
                <Badge status={h.toStatus} />
                <span className="text-gray-400">{formatDateTime(h.createdAt)}</span>
                {h.reason && <span className="text-gray-500">- {h.reason}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cancel Modal */}
      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="계약 취소">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">이 계약을 취소하시겠습니까?</p>
          <textarea
            placeholder="취소 사유를 입력하세요"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCancelModal(false)}>닫기</Button>
            <Button variant="danger" onClick={handleCancel} loading={cancelling}>취소하기</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
