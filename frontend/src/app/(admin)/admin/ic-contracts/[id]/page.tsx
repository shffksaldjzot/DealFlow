'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import IcContractPrintView from '@/components/integrated-contract/IcContractPrintView';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { IcContract } from '@/types/integrated-contract';

export default function AdminIcContractDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [contract, setContract] = useState<IcContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchContract = () => {
    setLoading(true);
    api.get(`/admin/ic-contracts/${id}`)
      .then((res) => setContract(extractData<IcContract>(res)))
      .catch(() => router.push('/admin/ic-contracts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContract(); }, [id]);

  const updateStatus = (status: string) => {
    if (!confirm(`상태를 "${status}"로 변경하시겠습니까?`)) return;
    setUpdating(true);
    api.patch(`/admin/ic-contracts/${id}/status`, { status })
      .then((res) => setContract(extractData<IcContract>(res)))
      .catch(() => alert('상태 변경에 실패했습니다.'))
      .finally(() => setUpdating(false));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!contract) return null;

  return (
    <>
    <div className="print-hidden">
      <PageHeader
        title={`통합 계약 ${contract.shortCode}`}
        subtitle={contract.customerName || '고객 미입력'}
        backHref="/admin/ic-contracts"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              인쇄
            </button>
            <button
              onClick={() => {
                const eventId = contract.config?.eventId || contract.config?.event?.id;
                if (eventId) router.push(`/admin/events/${eventId}/ic-config`);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              설정 보기
            </button>
            {contract.status === 'signed' && (
              <button
                disabled={updating}
                onClick={() => updateStatus('completed')}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                확인 (완료)
              </button>
            )}
            {contract.status !== 'cancelled' && (
              <button
                disabled={updating}
                onClick={() => updateStatus('cancelled')}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                취소
              </button>
            )}
          </div>
        }
      />

      {/* Contract Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-500 mb-4">계약 정보</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">계약번호</span>
            <p className="font-medium mt-0.5">{contract.shortCode}</p>
          </div>
          <div>
            <span className="text-gray-400">고객명</span>
            <p className="font-medium mt-0.5">{contract.customerName || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">연락처</span>
            <p className="font-medium mt-0.5">{contract.customerPhone || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">행사</span>
            <p className="font-medium mt-0.5">{contract.config?.event?.name || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">평형</span>
            <p className="font-medium mt-0.5">{contract.apartmentType?.name || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">상태</span>
            <div className="mt-0.5"><Badge status={contract.status} /></div>
          </div>
          <div>
            <span className="text-gray-400">총액</span>
            <p className="font-medium mt-0.5">{formatCurrency(contract.totalAmount)}</p>
          </div>
          <div>
            <span className="text-gray-400">체결일</span>
            <p className="font-medium mt-0.5">{contract.signedAt ? formatDateTime(contract.signedAt) : '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">생성일</span>
            <p className="font-medium mt-0.5">{formatDateTime(contract.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Selected Items */}
      {contract.selectedItems?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">선택 항목</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">파트너</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">카테고리</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">옵션</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">단가</th>
                </tr>
              </thead>
              <tbody>
                {contract.selectedItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="px-4 py-2">{item.partnerName}</td>
                    <td className="px-4 py-2">{item.categoryName}</td>
                    <td className="px-4 py-2">{item.optionName}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Schedule */}
      {contract.paymentSchedule?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">납부 일정</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">구분</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">비율</th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-600">금액</th>
                </tr>
              </thead>
              <tbody>
                {contract.paymentSchedule.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2 text-right">{item.ratio}%</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Signature */}
      {contract.signatureData && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">서명</h3>
          <img
            src={contract.signatureData}
            alt="고객 서명"
            className="max-w-xs border border-gray-200 rounded-lg"
          />
        </div>
      )}

      {/* Special Notes */}
      {contract.specialNotes && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">특이사항</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.specialNotes}</p>
        </div>
      )}
    </div>

    {/* Print View (hidden on screen, shown on print) */}
    <div className="hidden" style={{ display: 'none' }}>
      <div className="ic-print-container">
        <IcContractPrintView contract={contract} />
      </div>
    </div>
    </>
  );
}
