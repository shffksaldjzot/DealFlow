'use client';
import { Pencil, Trash2 } from 'lucide-react';
import { parsePopupContent, formatPrice } from '@/lib/ic-utils';
import type { IcApartmentType } from '@/types/integrated-contract';

interface PartnerProductCardProps {
  optionName: string;
  popupContent?: string;
  prices: Record<string, number>;
  cellValues?: Record<string, string>;
  columns: { id: string; customName?: string; columnType: string; apartmentTypeId?: string }[];
  apartmentTypes: IcApartmentType[];
  onEdit: () => void;
  onDelete: () => void;
}

export default function PartnerProductCard({
  optionName,
  popupContent,
  prices,
  cellValues,
  columns,
  apartmentTypes,
  onEdit,
  onDelete,
}: PartnerProductCardProps) {
  const { image } = popupContent ? parsePopupContent(popupContent) : { image: null };

  // Collect prices to display
  const priceEntries: { label: string; value: string }[] = [];
  for (const col of columns) {
    if (col.columnType === 'amount' || !col.columnType) {
      const label = col.customName || apartmentTypes.find(t => t.id === col.apartmentTypeId)?.name || '가격';
      const numVal = prices?.[col.id] || (cellValues?.[col.id] ? Number(String(cellValues[col.id]).replace(/,/g, '')) : 0);
      priceEntries.push({ label, value: formatPrice(numVal || 0) });
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
      <div className="flex">
        {/* Thumbnail */}
        {image && (
          <div className="w-20 h-20 flex-shrink-0 bg-gray-100">
            <img src={image} alt={optionName} className="w-full h-full object-cover" />
          </div>
        )}
        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-800 truncate">{optionName}</h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* Price tags */}
          {priceEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {priceEntries.map((entry) => (
                <span key={entry.label} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                  {entry.label}: {entry.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
