'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime, formatCurrency } from '@/lib/utils';

export default function AdminContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchContract = () => {
    setLoading(true);
    api.get(`/admin/contracts/${id}`)
      .then((res) => setContract(extractData(res)))
      .catch(() => toast('계약을 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContract(); }, [id]);

  const handleStatusChange = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      await api.patch(`/admin/contracts/${id}`, { status: newStatus, reason: statusReason });
      toast('계약 상태가 변경되었습니다.', 'success');
      setStatusModal(false);
      setStatusReason('');
      fetchContract();
    } catch {
      toast('상태 변경에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: 'pending', label: '대기' },
    { value: 'in_progress', label: '작성중' },
    { value: 'signed', label: '서명완료' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref="/admin/contracts" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref="/admin/contracts" />
        <Card><p className="text-center text-gray-500 py-8">계약을 찾을 수 없습니다</p></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`계약 ${contract.contractNumber}`}
        backHref="/admin/contracts"
        actions={
          <Button size="sm" variant="outline" onClick={() => { setNewStatus(contract.status); setStatusModal(true); }}>
            상태 변경
          </Button>
        }
      />

      {/* Basic Info */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">계약 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">계약번호</p>
            <p className="text-sm font-mono font-bold">{contract.contractNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">상태</p>
            <Badge status={contract.status} />
          </div>
          <div>
            <p className="text-xs text-gray-400">행사</p>
            <p className="text-sm font-medium cursor-pointer text-blue-600 hover:underline" onClick={() => router.push(`/admin/events/${contract.eventId}`)}>
              {contract.event?.name || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">협력업체</p>
            <p className="text-sm font-medium">{contract.partner?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">고객</p>
            <p className="text-sm font-medium">
              {contract.customer ? `${contract.customer.name} (${contract.customer.email})` : contract.customerName || '미지정'}
            </p>
          </div>
          {contract.totalAmount && (
            <div>
              <p className="text-xs text-gray-400">금액</p>
              <p className="text-sm font-bold text-blue-600">{formatCurrency(contract.totalAmount)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">생성일</p>
            <p className="text-sm">{formatDateTime(contract.createdAt)}</p>
          </div>
          {contract.signedAt && (
            <div>
              <p className="text-xs text-gray-400">서명일</p>
              <p className="text-sm">{formatDateTime(contract.signedAt)}</p>
            </div>
          )}
          {contract.cancelReason && (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-400">취소 사유</p>
              <p className="text-sm text-red-600">{contract.cancelReason}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Field Values */}
      {contract.fieldValues && contract.fieldValues.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">입력 필드값</h3>
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

      {/* Signatures */}
      {contract.signatures && contract.signatures.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">서명 정보</h3>
          <div className="space-y-2">
            {contract.signatures.map((sig: any) => (
              <div key={sig.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs text-gray-400">서명 해시</p>
                  <p className="text-xs font-mono text-gray-600 truncate max-w-xs">{sig.signatureHash}</p>
                </div>
                <p className="text-xs text-gray-400">{formatDateTime(sig.signedAt)}</p>
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
              <div key={h.id} className="flex items-center gap-2 text-xs py-1">
                <Badge status={h.toStatus} />
                <span className="text-gray-400">{formatDateTime(h.createdAt)}</span>
                {h.reason && <span className="text-gray-500">- {h.reason}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Status Change Modal */}
      <Modal isOpen={statusModal} onClose={() => setStatusModal(false)} title="계약 상태 변경">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">새 상태</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">사유 (선택)</label>
            <textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="상태 변경 사유를 입력하세요"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStatusModal(false)}>취소</Button>
            <Button onClick={handleStatusChange} loading={saving}>변경</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
