'use client';
import { useState, useEffect } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import PopupContentEditor from './PopupContentEditor';
import type { IcApartmentType } from '@/types/integrated-contract';

interface PartnerProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    optionName: string;
    popupContent: string;
    apartmentTypeId: string;
    price: number;
    prices: Record<string, number>;
    cellValues: Record<string, string>;
  }) => void;
  apartmentTypes: IcApartmentType[];
  columns: { id: string; customName?: string; columnType: string; apartmentTypeId?: string }[];
  initialData?: {
    optionName: string;
    popupContent?: string;
    apartmentTypeId?: string;
    price?: number;
    prices: Record<string, number>;
    cellValues?: Record<string, string>;
  };
  title?: string;
}

function formatAmount(val: string | number): string {
  const num = typeof val === 'string' ? val.replace(/,/g, '') : String(val);
  if (!num || num === '0') return '';
  const parsed = parseInt(num, 10);
  if (isNaN(parsed)) return '';
  return parsed.toLocaleString('ko-KR');
}

export default function PartnerProductForm({
  isOpen,
  onClose,
  onSave,
  apartmentTypes,
  columns,
  initialData,
  title = '품목 추가',
}: PartnerProductFormProps) {
  const [optionName, setOptionName] = useState('');
  const [popupContent, setPopupContent] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [cellValues, setCellValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setOptionName(initialData.optionName);
        setPopupContent(initialData.popupContent || '');
        setSelectedTypeId(initialData.apartmentTypeId || '');
        setPrice(initialData.price || 0);
        setPrices(initialData.prices || {});
        setCellValues(initialData.cellValues || {});
      } else {
        setOptionName('');
        setPopupContent('');
        setSelectedTypeId(apartmentTypes.length > 0 ? apartmentTypes[0].id : '');
        setPrice(0);
        setPrices({});
        setCellValues({});
      }
    }
  }, [isOpen, initialData, apartmentTypes]);

  if (!isOpen) return null;

  const imageMatch = popupContent.match(/---IMAGE---\n(https?:\/\/[^\n]+)/);
  const currentImage = imageMatch ? imageMatch[1] : null;

  const handlePriceChange = (value: string) => {
    const raw = value.replace(/[^0-9]/g, '');
    setPrice(raw === '' ? 0 : parseInt(raw, 10) || 0);
  };

  const handleSave = () => {
    if (!optionName.trim()) return;
    onSave({
      optionName: optionName.trim(),
      popupContent,
      apartmentTypeId: selectedTypeId,
      price,
      prices,
      cellValues,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Image upload area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">이미지</label>
            {currentImage ? (
              <div className="relative rounded-xl overflow-hidden bg-gray-100 h-40">
                <img src={currentImage} alt="품목" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <PopupContentEditor
                    content={popupContent}
                    onChange={setPopupContent}
                  />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl h-32 flex flex-col items-center justify-center gap-2 text-gray-400">
                <ImageIcon className="w-8 h-8" />
                <PopupContentEditor
                  content={popupContent}
                  onChange={setPopupContent}
                />
              </div>
            )}
          </div>

          {/* Type dropdown - always show when types exist */}
          {apartmentTypes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                타입 <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">타입을 선택하세요</option>
                {apartmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Option Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              상세 품목 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={optionName}
              onChange={(e) => setOptionName(e.target.value)}
              placeholder="품목 이름을 입력하세요"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">상세 설명</label>
            <textarea
              value={popupContent.replace(/---IMAGE---\n[^\n]*/g, '').trim()}
              onChange={(e) => {
                const imgPart = imageMatch ? `---IMAGE---\n${imageMatch[1]}\n` : '';
                setPopupContent(imgPart + e.target.value);
              }}
              placeholder="품목에 대한 상세 설명을 입력하세요"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Single price input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">가격</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={price ? formatAmount(price) : ''}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={onClose}>
              취소
            </Button>
            <Button
              fullWidth
              onClick={handleSave}
              disabled={!optionName.trim() || (apartmentTypes.length > 0 && !selectedTypeId)}
            >
              저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
