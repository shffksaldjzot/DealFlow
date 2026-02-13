'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { FileText, Download, Building2, Calendar, PenLine } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Contract } from '@/types/contract';

export default function CustomerContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/customer/contracts/${id}`)
      .then((res) => setContract(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

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

      {/* Signatures */}
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

      {/* Actions */}
      <div className="space-y-2 mt-6">
        {contract.signedPdfFileId && (
          <Button
            fullWidth
            size="lg"
            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/files/${contract.signedPdfFileId}/download`, '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            계약서 PDF 다운로드
          </Button>
        )}
      </div>
    </div>
  );
}
