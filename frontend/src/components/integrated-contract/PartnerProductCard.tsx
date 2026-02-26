'use client';
import { Pencil, Trash2 } from 'lucide-react';
import { parsePopupContent, formatPrice } from '@/lib/ic-utils';
import type { IcApartmentType } from '@/types/integrated-contract';

interface PartnerProductCardProps {
  optionName: string;
  popupContent?: string;
  apartmentTypeId?: string;
  price?: number;
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
  apartmentTypeId,
  price,
  prices,
  cellValues,
  columns,
  apartmentTypes,
  onEdit,
  onDelete,
}: PartnerProductCardProps) {
  const { image } = popupContent ? parsePopupContent(popupContent) : { image: null };
  // Support comma-separated type IDs from prop
  const typeIds = apartmentTypeId ? apartmentTypeId.split(',').filter(Boolean) : [];
  // Also extract type names from amount columns that have prices
  const colTypeNames = columns
    .filter(col => col.columnType === 'amount' && col.apartmentTypeId && (prices[col.id] || prices[col.apartmentTypeId]))
    .map(col => apartmentTypes.find(t => t.id === col.apartmentTypeId)?.name)
    .filter(Boolean);
  const typeNames = typeIds.length > 0
    ? typeIds.map(id => apartmentTypes.find(t => t.id === id)?.name).filter(Boolean)
    : colTypeNames;

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
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-gray-800 truncate">{optionName}</h4>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {typeNames.map((name, i) => (
                  <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                    {name}
                  </span>
                ))}
                {(price != null && price > 0) && (
                  <span className="text-xs font-semibold text-gray-700">
                    {formatPrice(price)}
                  </span>
                )}
              </div>
              {/* Per-column prices and values */}
              {columns.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  {columns.map(col => {
                    const isAmount = col.columnType === 'amount';
                    if (isAmount) {
                      const p = prices[col.id] ?? prices[col.apartmentTypeId || ''];
                      if (!p || Number(p) === 0) return null;
                      return (
                        <span key={col.id} className="text-xs text-gray-500">
                          <span className="text-gray-400">{col.customName}:</span>{' '}
                          <span className="font-medium text-gray-700">{formatPrice(p)}</span>
                        </span>
                      );
                    } else {
                      const v = cellValues?.[col.id];
                      if (!v) return null;
                      return (
                        <span key={col.id} className="text-xs text-gray-500">
                          <span className="text-gray-400">{col.customName}:</span> {v}
                        </span>
                      );
                    }
                  })}
                </div>
              )}
            </div>
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
        </div>
      </div>
    </div>
  );
}
