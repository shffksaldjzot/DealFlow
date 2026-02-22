'use client';
import { Check } from 'lucide-react';
import PopupViewer from './PopupViewer';
import type { IcFlowPartner, IcFlowOption, IcFlowCategory } from '@/types/integrated-contract';

interface SelectedRow {
  sheetId: string;
  rowId: string;
}

interface CustomerSheetViewProps {
  partners: IcFlowPartner[];
  selectedRows: SelectedRow[];
  onToggleRow: (sheetId: string, rowId: string, optionName: string, categoryName: string, partnerName: string) => void;
}

export default function CustomerSheetView({
  partners,
  selectedRows,
  onToggleRow,
}: CustomerSheetViewProps) {
  const isSelected = (sheetId: string, rowId: string) =>
    selectedRows.some((s) => s.sheetId === sheetId && s.rowId === rowId);

  return (
    <div className="space-y-6">
      {partners.map((partner) => (
        <div key={partner.partnerId}>
          <div className="mb-3">
            <span className="text-xs text-gray-400">{partner.partnerName}</span>
            {(partner as any).partnerItems && (
              <span className="text-xs text-gray-300 ml-1">· {(partner as any).partnerItems}</span>
            )}
          </div>
          {partner.categories.map((cat) => (
            <div key={cat.sheetId} className="mb-4">
              <h4 className="text-base font-bold text-gray-900 mb-2">
                {cat.categoryName}
              </h4>

              {/* Spreadsheet table */}
              <div className="relative border border-gray-200 rounded-xl overflow-x-auto -mx-1 px-1">
                <table className="w-full text-sm min-w-0">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-2 py-2 w-8" />
                      <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[120px] sticky left-0 bg-gray-50 z-10">
                        옵션
                      </th>
                      <th className="px-1 py-2 w-6" />
                      {cat.columns.map((col) => (
                        <th key={col.id} className="px-2 py-2 text-center min-w-[60px]">
                          <span className="text-xs font-medium text-gray-600">
                            {col.customName || `열`}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cat.options.map((opt) => {
                      const selected = isSelected(cat.sheetId, opt.rowId);
                      return (
                        <tr
                          key={opt.rowId}
                          onClick={() => onToggleRow(
                            cat.sheetId,
                            opt.rowId,
                            opt.optionName,
                            cat.categoryName,
                            partner.partnerName,
                          )}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${
                            selected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Check circle */}
                          <td className="px-2 py-2 text-center">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mx-auto ${
                              selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                            }`}>
                              {selected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </td>
                          {/* Option name */}
                          <td className={`px-3 py-2 sticky left-0 z-10 ${selected ? 'bg-blue-50' : 'bg-white'}`}>
                            <span className={`text-sm font-medium ${selected ? 'text-blue-700' : 'text-gray-900'}`}>
                              {opt.optionName}
                            </span>
                          </td>
                          {/* Popup */}
                          <td className="px-1 py-2 text-center">
                            {opt.popupContent && (
                              <PopupViewer content={opt.popupContent} optionName={opt.optionName} />
                            )}
                          </td>
                          {/* Values per column */}
                          {cat.columns.map((col) => {
                            const isAmount = col.columnType === 'amount';
                            const cellVal = opt.cellValues?.[col.id];
                            const priceVal = opt.prices?.[col.id];
                            const displayVal = cellVal !== undefined
                              ? cellVal
                              : (priceVal !== undefined ? String(priceVal) : '');

                            return (
                              <td key={col.id} className={`px-2 py-2 ${isAmount ? 'text-right' : 'text-center'}`}>
                                <span className={`text-sm ${selected ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                                  {isAmount
                                    ? (Number(displayVal) ? `${Number(displayVal).toLocaleString()}원` : '-')
                                    : (displayVal || '-')}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {cat.options.length === 0 && (
                      <tr>
                        <td colSpan={cat.columns.length + 3} className="px-4 py-6 text-center text-gray-400 text-sm">
                          등록된 옵션이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
