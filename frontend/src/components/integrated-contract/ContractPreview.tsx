'use client';
import type { IcContract } from '@/types/integrated-contract';
import { formatDateTime } from '@/lib/utils';

interface ContractPreviewProps {
  contract: IcContract;
}

export default function ContractPreview({ contract }: ContractPreviewProps) {
  // Group selected items by category
  const grouped = contract.selectedItems.reduce<Record<string, typeof contract.selectedItems>>(
    (acc, item) => {
      const key = `${item.partnerName} - ${item.categoryName}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-4">
        <h2 className="text-lg font-bold text-gray-900">통합 계약서</h2>
        <p className="text-sm text-gray-500 mt-1">계약번호: {contract.shortCode}</p>
      </div>

      {/* Customer Info */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-500">계약자 정보</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-400">이름</span>
            <p className="font-medium text-gray-900">{contract.customerName || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">연락처</span>
            <p className="font-medium text-gray-900">{contract.customerPhone || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">타입</span>
            <p className="font-medium text-gray-900">{contract.apartmentType?.name || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">서명일</span>
            <p className="font-medium text-gray-900">
              {contract.signedAt ? formatDateTime(contract.signedAt) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Items */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-500">선택 내역</h3>
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group}>
            <p className="text-xs text-gray-400 mb-1">{group}</p>
            {items.map((item, i) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-sm text-gray-700">{item.optionName}</span>
                <span className="text-sm font-medium text-gray-900">
                  {item.unitPrice.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Total & Payment Schedule */}
      <div className="border-t-2 border-gray-900 pt-3">
        <div className="flex justify-between mb-3">
          <span className="font-bold text-gray-900">총 계약금액</span>
          <span className="text-lg font-bold text-blue-600">
            {contract.totalAmount.toLocaleString()}원
          </span>
        </div>

        {contract.paymentSchedule && contract.paymentSchedule.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            {contract.paymentSchedule.map((stage, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{stage.name} ({stage.ratio}%)</span>
                <span className="font-medium">{stage.amount.toLocaleString()}원</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signature */}
      {contract.signatureData && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-bold text-gray-500 mb-2">서명</h3>
          <img
            src={contract.signatureData}
            alt="서명"
            className="h-20 border border-gray-200 rounded-lg bg-white"
          />
        </div>
      )}
    </div>
  );
}
