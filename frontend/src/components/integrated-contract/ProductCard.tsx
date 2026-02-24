'use client';
import { Check, Info, Plus } from 'lucide-react';
import { parsePopupContent, formatPrice } from '@/lib/ic-utils';

interface ProductCardProps {
  optionName: string;
  price?: number | string;
  popupContent?: string;
  selected?: boolean;
  onSelect?: () => void;
  onDetail?: () => void;
}

export default function ProductCard({
  optionName,
  price,
  popupContent,
  selected,
  onSelect,
  onDetail,
}: ProductCardProps) {
  const { image } = popupContent ? parsePopupContent(popupContent) : { image: null };

  return (
    <div
      className={`flex-shrink-0 w-[140px] rounded-xl border-2 overflow-hidden transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      {/* Thumbnail */}
      <div
        className="relative h-24 bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={onDetail || onSelect}
      >
        {image ? (
          <img src={image} alt={optionName} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-300 text-xs">No Image</div>
        )}
        {/* Selection badge */}
        {selected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {/* Info button */}
        {popupContent && onDetail && (
          <button
            onClick={(e) => { e.stopPropagation(); onDetail(); }}
            className="absolute top-1.5 left-1.5 w-6 h-6 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white"
          >
            <Info className="w-3.5 h-3.5 text-gray-500" />
          </button>
        )}
      </div>
      {/* Content */}
      <div className="p-2.5">
        <p className={`text-xs font-medium line-clamp-2 leading-tight ${selected ? 'text-blue-700' : 'text-gray-800'}`}>
          {optionName}
        </p>
        {price !== undefined && (
          <p className={`text-xs mt-1 font-semibold ${selected ? 'text-blue-600' : 'text-gray-600'}`}>
            {formatPrice(price)}
          </p>
        )}
        {/* 추가하기 / 선택됨 버튼 (와이어프레임 1-3) */}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
          className={`w-full mt-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selected
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          {selected ? (
            <span className="flex items-center justify-center gap-1">
              <Check className="w-3 h-3" /> 선택됨
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <Plus className="w-3 h-3" /> 추가하기
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
