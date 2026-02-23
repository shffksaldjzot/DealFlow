'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import ContractDetailView from '@/components/contract/ContractDetailView';
import ContractPrintView from '@/components/contract/ContractPrintView';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { Building2, User, FileText, Calendar, Printer } from 'lucide-react';
import type { Contract } from '@/types/contract';

export default function OrganizerContractDetailPage() {
  const { id, contractId } = useParams<{ id: string; contractId: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [templateImageUrl, setTemplateImageUrl] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/events/${id}/contracts/${contractId}`)
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
  }, [id, contractId]);

  if (loading) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref={`/organizer/events/${id}/contracts`} />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref={`/organizer/events/${id}/contracts`} />
        <Card><p className="text-center text-gray-500 py-8">계약서를 찾을 수 없습니다</p></Card>
      </div>
    );
  }

  return (
    <>
    <div className="print-hidden">
      <PageHeader
        title="계약 상세"
        backHref={`/organizer/events/${id}/contracts`}
        actions={
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Printer className="w-4 h-4 inline mr-1" />인쇄
          </button>
        }
      />

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
          {(contract.customer || contract.customerName) && (
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">고객</p>
                <p className="text-sm font-medium text-gray-900">
                  {contract.customer ? `${contract.customer.name} (${contract.customer.email})` : contract.customerName}
                </p>
              </div>
            </div>
          )}
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
    </div>

    {/* Print View */}
    <div className="hidden" style={{ display: 'none' }}>
      <div className="contract-print-container">
        <ContractPrintView contract={contract} />
      </div>
    </div>
    </>
  );
}
