'use client';
import { X, Plus, Check } from 'lucide-react';
import { parsePopupContent, formatPrice } from '@/lib/ic-utils';
import Button from '@/components/ui/Button';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  optionName: string;
  popupContent: string;
  price?: number | string;
  selected?: boolean;
  onSelect?: () => void;
}

export default function ProductDetailModal({
  isOpen,
  onClose,
  optionName,
  popupContent,
  price,
  selected,
  onSelect,
}: ProductDetailModalProps) {
  if (!isOpen) return null;

  const { text, image } = parsePopupContent(popupContent);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Image */}
        {image && (
          <div className="relative">
            <img src={image} alt={optionName} className="w-full max-h-64 object-cover" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-black/40 backdrop-blur rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Header */}
          {!image && (
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">{optionName}</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}
          {image && (
            <h3 className="text-lg font-bold text-gray-800">{optionName}</h3>
          )}

          {/* Price */}
          {price !== undefined && (
            <p className="text-xl font-bold text-blue-600">{formatPrice(price)}</p>
          )}

          {/* 시공범위 (와이어프레임 1-4) */}
          {text && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">시공범위</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {text}
              </p>
            </div>
          )}

          {/* Select button (와이어프레임 1-4: 추가하기/선택 해제) */}
          {onSelect && (
            <Button
              fullWidth
              size="lg"
              variant={selected ? 'outline' : 'primary'}
              onClick={() => { onSelect(); onClose(); }}
            >
              {selected ? (
                <span className="flex items-center gap-1.5">
                  <Check className="w-5 h-5" /> 선택 해제
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Plus className="w-5 h-5" /> 추가하기
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
