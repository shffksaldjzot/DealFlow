'use client';
import { Check } from 'lucide-react';
import type { IcContract, IcContractFlow } from '@/types/integrated-contract';
import { formatDateTime } from '@/lib/utils';

interface ContractPreviewProps {
  contract: IcContract;
  flow?: IcContractFlow | null;
}

export default function ContractPreview({ contract, flow }: ContractPreviewProps) {
  const totalAmount = Number(contract.totalAmount) || 0;

  // Build set of selected rowIds for quick lookup
  const selectedRowIds = new Set(contract.selectedItems.map(si => si.rowId));

  // Build map of selected items for price lookup
  const selectedMap = new Map(contract.selectedItems.map(si => [si.rowId, si]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b border-gray-200 pb-4">
        <h2 className="text-lg font-bold text-gray-800">통합 계약서</h2>
        <p className="text-sm text-gray-500 mt-1">계약번호: {contract.shortCode}</p>
      </div>

      {/* Customer Info */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-500">계약자 정보</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-400">이름</span>
            <p className="font-medium text-gray-800">{contract.customerName || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">연락처</span>
            <p className="font-medium text-gray-800">{contract.customerPhone || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">동호수</span>
            <p className="font-medium text-gray-800">{contract.unitNumber || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">타입</span>
            <p className="font-medium text-gray-800">{contract.apartmentType?.name || '-'}</p>
          </div>
          <div>
            <span className="text-gray-400">서명일</span>
            <p className="font-medium text-gray-800">
              {contract.signedAt ? formatDateTime(contract.signedAt) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Items - Full list with checkmarks */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500">계약 사항</h3>

        {flow ? (
          // Full flow available: show all options with checkmarks
          flow.partners.map((partner) =>
            partner.categories.map((cat) => {
              // Find the column that matches the contract's apartment type
              const typeCol = contract.apartmentType?.id
                ? cat.columns.find((c: any) => c.apartmentTypeId === contract.apartmentType?.id)
                : null;

              const parsePrice = (val: any): number => {
                if (val === undefined || val === null || val === '') return 0;
                if (typeof val === 'number') return val;
                return Number(String(val).replace(/,/g, '')) || 0;
              };

              return (
                <div key={cat.sheetId}>
                  <div className="mb-2">
                    <p className="text-sm font-bold text-gray-800">{partner.partnerItems || cat.categoryName}</p>
                    <p className="text-[11px] text-gray-400">{partner.partnerName}</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {cat.options.map((opt: any, idx: number) => {
                      const isSelected = selectedRowIds.has(opt.rowId);
                      const selectedItem = selectedMap.get(opt.rowId);

                      // Get price: from selectedItem if selected, otherwise from flow data
                      let price = 0;
                      if (isSelected && selectedItem) {
                        price = Number(selectedItem.unitPrice) || 0;
                      } else if (typeCol) {
                        price = parsePrice(opt.cellValues?.[typeCol.id]) || parsePrice(opt.prices?.[typeCol.id]);
                      }
                      // Fallback: try any amount column
                      if (price === 0) {
                        const amtCols = cat.columns.filter((c: any) => c.columnType === 'amount' || !c.columnType);
                        for (const col of amtCols) {
                          const p = parsePrice(opt.cellValues?.[col.id]) || parsePrice(opt.prices?.[col.id]);
                          if (p > 0) { price = p; break; }
                        }
                      }

                      return (
                        <div
                          key={opt.rowId}
                          className={`flex items-center justify-between px-3 py-2.5 ${
                            idx > 0 ? 'border-t border-gray-200' : ''
                          } bg-white`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-gray-400' : 'border-gray-200'
                            }`}>
                              {isSelected && <span className="text-gray-800 text-xs font-bold">✓</span>}
                            </div>
                            <span className={`text-sm ${isSelected ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
                              {opt.optionName}
                            </span>
                          </div>
                          <span className={`text-sm ${isSelected ? 'font-medium text-gray-800' : 'text-gray-400'}`}>
                            {price > 0 ? `${price.toLocaleString()}원` : '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )
        ) : (
          // Fallback: show only selected items (grouped)
          (() => {
            const grouped = contract.selectedItems.reduce<Record<string, typeof contract.selectedItems>>(
              (acc, item) => {
                const key = `${item.categoryName}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
              },
              {},
            );
            return Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="text-sm font-bold text-gray-800 mb-1">{group}</p>
                <p className="text-[11px] text-gray-400 mb-2">{items[0]?.partnerName}</p>
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border border-gray-400 flex items-center justify-center">
                        <span className="text-gray-800 text-[10px] font-bold">✓</span>
                      </div>
                      <span className="text-sm text-gray-700">{item.optionName}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {Number(item.unitPrice).toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
            ));
          })()
        )}
      </div>

      {/* Total & Payment Schedule */}
      <div className="border-t-2 border-gray-900 pt-3">
        <div className="flex justify-between mb-3">
          <span className="font-bold text-gray-800">총 계약금액</span>
          <span className="text-lg font-bold text-blue-600">
            {totalAmount.toLocaleString()}원
          </span>
        </div>

        {contract.paymentSchedule && contract.paymentSchedule.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
            {contract.paymentSchedule.map((stage, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{stage.name} ({stage.ratio}%)</span>
                <span className="font-medium">{Number(stage.amount).toLocaleString()}원</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legal Terms (약관) */}
      {contract.config?.legalTerms?.trim() && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-bold text-gray-500 mb-2">약관</h3>
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto">
            {contract.config.legalTerms}
          </div>
          {contract.legalAgreed && (
            <p className="text-xs text-success mt-1.5 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 약관에 동의함
            </p>
          )}
        </div>
      )}

      {/* Special Terms from config (특약사항) */}
      {contract.config?.specialNotes?.trim() && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-bold text-gray-500 mb-2">특약사항</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.config.specialNotes}</p>
        </div>
      )}

      {/* Special Notes from contract (특이사항/비고) */}
      {contract.specialNotes?.trim() && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-bold text-gray-500 mb-2">특이사항 (비고)</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.specialNotes}</p>
        </div>
      )}

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
