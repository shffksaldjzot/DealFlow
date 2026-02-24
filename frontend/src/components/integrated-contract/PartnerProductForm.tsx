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
    prices: Record<string, number>;
    cellValues: Record<string, string>;
  }) => void;
  apartmentTypes: IcApartmentType[];
  columns: { id: string; customName?: string; columnType: string; apartmentTypeId?: string }[];
  initialData?: {
    optionName: string;
    popupContent?: string;
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
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [cellValues, setCellValues] = useState<Record<string, string>>({});

  // Selected type for simplified single-type+price entry
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setOptionName(initialData.optionName);
        setPopupContent(initialData.popupContent || '');
        setPrices(initialData.prices || {});
        setCellValues(initialData.cellValues || {});
        // Try to detect selected type from existing prices
        if (columns.length > 0 && apartmentTypes.length > 0) {
          for (const col of columns) {
            if (col.apartmentTypeId && (initialData.prices?.[col.id] || initialData.cellValues?.[col.id])) {
              setSelectedTypeId(col.apartmentTypeId);
              break;
            }
          }
        }
      } else {
        setOptionName('');
        setPopupContent('');
        setPrices({});
        setCellValues({});
        setSelectedTypeId(apartmentTypes.length > 0 ? apartmentTypes[0].id : '');
      }
    }
  }, [isOpen, initialData, columns, apartmentTypes]);

  if (!isOpen) return null;

  // Extract image from popupContent
  const imageMatch = popupContent.match(/---IMAGE---\n(https?:\/\/[^\n]+)/);
  const currentImage = imageMatch ? imageMatch[1] : null;

  const handleAmountChange = (colId: string, value: string) => {
    const raw = value.replace(/[^0-9]/g, '');
    const num = raw === '' ? 0 : parseInt(raw, 10) || 0;
    setPrices((prev) => ({ ...prev, [colId]: num }));
    setCellValues((prev) => ({ ...prev, [colId]: String(num) }));
  };

  const handleTextChange = (colId: string, value: string) => {
    setCellValues((prev) => ({ ...prev, [colId]: value }));
  };

  const handleSave = () => {
    if (!optionName.trim()) return;
    onSave({ optionName: optionName.trim(), popupContent, prices, cellValues });
    onClose();
  };

  // Whether to show simplified form (single type+price) vs full column form
  const showSimplifiedForm = apartmentTypes.length > 0 && columns.length > 0;

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
          {/* Image upload area (와이어프레임 2-3) */}
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

          {/* Type dropdown (와이어프레임 2-3) */}
          {showSimplifiedForm && apartmentTypes.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">타입</label>
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

          {/* Option Name (와이어프레임 2-3) */}
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

          {/* Description (popupContent text part) */}
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

          {/* Price per column (와이어프레임 2-3: 비용) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">비용</label>
            <div className="space-y-2">
              {columns.map((col) => {
                const label = col.customName || apartmentTypes.find(t => t.id === col.apartmentTypeId)?.name || '열';
                const isAmount = col.columnType === 'amount' || !col.columnType;
                return (
                  <div key={col.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0 truncate">{label}</span>
                    {isAmount ? (
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={prices[col.id] ? formatAmount(prices[col.id]) : ''}
                          onChange={(e) => handleAmountChange(col.id, e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">원</span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={cellValues[col.id] || ''}
                        onChange={(e) => handleTextChange(col.id, e.target.value)}
                        placeholder="입력"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                );
              })}
              {columns.length === 0 && (
                <p className="text-xs text-gray-400">타입이 설정되면 가격 입력란이 표시됩니다.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" fullWidth onClick={onClose}>
              취소
            </Button>
            <Button fullWidth onClick={handleSave} disabled={!optionName.trim()}>
              저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
