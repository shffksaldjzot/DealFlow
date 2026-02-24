'use client';
import { useState } from 'react';
import ProductCard from './ProductCard';
import ProductDetailModal from './ProductDetailModal';
import { Info } from 'lucide-react';
import type { IcFlowPartner, IcFlowOption } from '@/types/integrated-contract';

interface SelectedRow {
  sheetId: string;
  rowId: string;
}

interface CustomerSheetViewProps {
  partners: IcFlowPartner[];
  selectedRows: SelectedRow[];
  onToggleRow: (sheetId: string, rowId: string, optionName: string, categoryName: string, partnerName: string) => void;
  selectedTypeId?: string;
}

export default function CustomerSheetView({
  partners,
  selectedRows,
  onToggleRow,
  selectedTypeId,
}: CustomerSheetViewProps) {
  const [detailModal, setDetailModal] = useState<{
    optionName: string;
    popupContent: string;
    price?: number;
    sheetId: string;
    rowId: string;
    categoryName: string;
    partnerName: string;
  } | null>(null);

  const isSelected = (sheetId: string, rowId: string) =>
    selectedRows.some((s) => s.sheetId === sheetId && s.rowId === rowId);

  // Build flat list of categories with partner info
  const allCategories: {
    id: string;
    name: string;
    partnerName: string;
    partnerId: string;
    options: IcFlowOption[];
    columns: any[];
  }[] = [];

  partners.forEach((partner) => {
    partner.categories.forEach((cat) => {
      allCategories.push({
        id: cat.sheetId,
        name: cat.categoryName,
        partnerName: partner.partnerName,
        partnerId: partner.partnerId,
        options: cat.options,
        columns: cat.columns,
      });
    });
  });

  // Get price for an option given the selected apartment type
  const getOptionPrice = (opt: IcFlowOption, columns: any[]): number | undefined => {
    if (!selectedTypeId) return undefined;
    const col = columns.find((c: any) => c.apartmentTypeId === selectedTypeId);
    if (col) {
      const cellVal = opt.cellValues?.[col.id];
      if (cellVal !== undefined && cellVal !== '' && cellVal !== '0') {
        const num = Number(String(cellVal).replace(/,/g, ''));
        if (num > 0) return num;
      }
      const priceVal = opt.prices?.[col.id];
      if (priceVal && priceVal > 0) return priceVal;
    }
    // Fallback: first amount column with a value
    for (const c of columns) {
      if (c.columnType === 'amount' || !c.columnType) {
        const p = opt.prices?.[c.id];
        if (p && p > 0) return p;
        const cv = opt.cellValues?.[c.id];
        if (cv) {
          const num = Number(String(cv).replace(/,/g, ''));
          if (num > 0) return num;
        }
      }
    }
    return undefined;
  };

  return (
    <div className="space-y-6">
      {/* Render all categories as sections (와이어프레임 1-3) */}
      {allCategories.map((cat) => (
        <div key={cat.id}>
          {/* Section header with category name + info icon */}
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-base font-bold text-gray-800">{cat.name}</h4>
            <button className="text-gray-400 hover:text-gray-600">
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Horizontal scroll product cards (와이어프레임 1-3) */}
          {cat.options.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {cat.options.map((opt) => {
                const price = getOptionPrice(opt, cat.columns);
                const selected = isSelected(cat.id, opt.rowId);
                return (
                  <ProductCard
                    key={opt.rowId}
                    optionName={opt.optionName}
                    price={price}
                    popupContent={opt.popupContent}
                    selected={selected}
                    onSelect={() => onToggleRow(cat.id, opt.rowId, opt.optionName, cat.name, cat.partnerName)}
                    onDetail={opt.popupContent ? () => setDetailModal({
                      optionName: opt.optionName,
                      popupContent: opt.popupContent!,
                      price,
                      sheetId: cat.id,
                      rowId: opt.rowId,
                      categoryName: cat.name,
                      partnerName: cat.partnerName,
                    }) : undefined}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">
              등록된 옵션이 없습니다.
            </div>
          )}
        </div>
      ))}

      {allCategories.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          등록된 품목이 없습니다.
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <ProductDetailModal
          isOpen={true}
          onClose={() => setDetailModal(null)}
          optionName={detailModal.optionName}
          popupContent={detailModal.popupContent}
          price={detailModal.price}
          selected={isSelected(detailModal.sheetId, detailModal.rowId)}
          onSelect={() => {
            onToggleRow(
              detailModal.sheetId,
              detailModal.rowId,
              detailModal.optionName,
              detailModal.categoryName,
              detailModal.partnerName,
            );
          }}
        />
      )}
    </div>
  );
}
