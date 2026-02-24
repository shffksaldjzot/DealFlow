'use client';
import { Check } from 'lucide-react';
import PopupViewer from './PopupViewer';
import type { IcFlowPartner, IcFlowOption } from '@/types/integrated-contract';

interface SelectedOption {
  sheetId: string;
  rowId: string;
  columnId: string;
}

interface OptionsListProps {
  partners: IcFlowPartner[];
  selectedOptions: SelectedOption[];
  onToggle: (sheetId: string, rowId: string, columnId: string, unitPrice: number, optionName: string, categoryName: string, partnerName: string) => void;
}

export default function OptionsList({
  partners,
  selectedOptions,
  onToggle,
}: OptionsListProps) {
  const isSelected = (sheetId: string, rowId: string) =>
    selectedOptions.some((s) => s.sheetId === sheetId && s.rowId === rowId);

  return (
    <div className="space-y-6">
      {partners.map((partner) => (
        <div key={partner.partnerId}>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            {partner.partnerName}
          </h3>
          {partner.categories.map((cat) => (
            <div key={cat.sheetId} className="mb-4">
              <h4 className="text-base font-bold text-gray-800 mb-2">{cat.categoryName}</h4>
              <div className="space-y-2">
                {cat.options.map((opt) => {
                  const price = opt.unitPrice ?? 0;
                  const columnId = opt.columnId || '';
                  const selected = isSelected(cat.sheetId, opt.rowId);

                  return (
                    <button
                      key={opt.rowId}
                      onClick={() => onToggle(
                        cat.sheetId,
                        opt.rowId,
                        columnId,
                        price,
                        opt.optionName,
                        cat.categoryName,
                        partner.partnerName,
                      )}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className={`text-sm font-medium ${selected ? 'text-blue-700' : 'text-gray-800'}`}>
                            {opt.optionName}
                          </span>
                          {opt.popupContent && (
                            <PopupViewer content={opt.popupContent} optionName={opt.optionName} />
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${selected ? 'text-blue-600' : 'text-gray-700'}`}>
                        {price ? `${price.toLocaleString()}원` : '무료'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
