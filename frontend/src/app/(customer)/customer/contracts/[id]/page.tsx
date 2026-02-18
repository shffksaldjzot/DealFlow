'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import ContractDetailView from '@/components/contract/ContractDetailView';
import { useToast } from '@/components/ui/Toast';
import { FileText, Building2, Calendar, PenLine, XCircle } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Contract } from '@/types/contract';

export default function CustomerContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [templateImageUrl, setTemplateImageUrl] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchContract = () => {
    api.get(`/customer/contracts/${id}`)
      .then((res) => {
        const data = extractData<Contract>(res);
        setContract(data);
        if (data.template?.fileId) {
          api.get(`/files/${data.template.fileId}/download`, { responseType: 'blob' })
            .then((fileRes) => {
              const blob = fileRes.data as Blob;
              if (blob.size > 0) setTemplateImageUrl(URL.createObjectURL(blob));
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContract(); }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`/customer/contracts/${id}/cancel`, { reason: cancelReason || undefined });
      toast('계약이 취소되었습니다.', 'success');
      setShowCancelModal(false);
      fetchContract();
    } catch {
      toast('취소에 실패했습니다.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = contract && (contract.status === 'pending' || contract.status === 'in_progress');

  if (loading) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref="/customer/contracts" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref="/customer/contracts" />
        <Card><p className="text-center text-gray-500 py-8">계약서를 찾을 수 없습니다</p></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="계약 상세" backHref="/customer/contracts" />

      {/* Status & Contract Number */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <Badge status={contract.status} />
          <span className="text-xs text-gray-400 font-mono">{contract.contractNumber}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          {contract.event?.name || '계약서'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {formatDateTime(contract.createdAt)}
        </p>
      </Card>

      {/* Contract Image + Download */}
      <ContractDetailView contract={contract} templateImageUrl={templateImageUrl} />

      {/* Contract Info */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">계약 정보</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">협력업체</p>
              <p className="text-sm font-medium text-gray-900">{contract.partner?.name || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">이벤트</p>
              <p className="text-sm font-medium text-gray-900">{contract.event?.name || '-'}</p>
            </div>
          </div>
          {contract.totalAmount && (
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">계약 금액</p>
                <p className="text-sm font-bold text-blue-600">{formatCurrency(contract.totalAmount)}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Filled Field Values */}
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

      {/* Signatures info */}
      {contract.signatures && contract.signatures.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">서명 정보</h3>
          {contract.signatures.map((sig: any) => (
            <div key={sig.id} className="flex items-center gap-3">
              <PenLine className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">전자서명 완료</p>
                <p className="text-xs text-gray-400">{formatDateTime(sig.signedAt)}</p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Cancel Button */}
      {canCancel && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button variant="danger" className="w-full" onClick={() => setShowCancelModal(true)}>
            <XCircle className="w-4 h-4 mr-1" /> 계약 취소
          </Button>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">계약 취소</h3>
            <p className="text-sm text-gray-500">이 계약을 취소하시겠습니까?</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">취소 사유 (선택)</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소 사유를 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setShowCancelModal(false); setCancelReason(''); }}>
                닫기
              </Button>
              <Button variant="danger" onClick={handleCancel} loading={cancelling}>
                계약 취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
