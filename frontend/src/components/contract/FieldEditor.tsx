'use client';
import { useState, useRef, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Trash2, GripVertical, Type, Hash, Calendar, Phone, Mail, PenLine, CheckSquare, LayoutTemplate, ZoomIn, ZoomOut, Copy, ArrowUp, ArrowDown, AlignLeft, AlignRight, AlignStartVertical, AlignEndVertical, AlignCenterHorizontal, AlignCenterVertical } from 'lucide-react';

export interface FieldDef {
  id?: string;
  fieldType: string;
  label: string;
  placeholder?: string;
  isRequired: boolean;
  pageNumber: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  sortOrder: number;
  defaultValue?: string;
  validationRule?: string;
}

const FIELD_TYPES = [
  { value: 'text', label: '텍스트', icon: Type },
  { value: 'number', label: '숫자', icon: Hash },
  { value: 'date', label: '날짜', icon: Calendar },
  { value: 'checkbox', label: '체크박스', icon: CheckSquare },
  { value: 'phone', label: '전화번호', icon: Phone },
  { value: 'email', label: '이메일', icon: Mail },
  { value: 'signature', label: '서명', icon: PenLine },
];

const FIELD_PRESETS: { name: string; description: string; fields: Omit<FieldDef, 'sortOrder'>[] }[] = [
  {
    name: '기본 계약서',
    description: '이름, 연락처, 날짜, 금액, 서명',
    fields: [
      { fieldType: 'text', label: '이름', placeholder: '성명을 입력하세요', isRequired: true, pageNumber: 1, positionX: 15, positionY: 10, width: 30, height: 5 },
      { fieldType: 'phone', label: '연락처', placeholder: '010-0000-0000', isRequired: true, pageNumber: 1, positionX: 15, positionY: 18, width: 30, height: 5 },
      { fieldType: 'date', label: '계약일', isRequired: true, pageNumber: 1, positionX: 55, positionY: 10, width: 25, height: 5 },
      { fieldType: 'number', label: '금액', placeholder: '계약 금액', isRequired: true, pageNumber: 1, positionX: 55, positionY: 18, width: 25, height: 5 },
      { fieldType: 'signature', label: '서명', isRequired: true, pageNumber: 1, positionX: 35, positionY: 80, width: 30, height: 12 },
    ],
  },
  {
    name: '간단 동의서',
    description: '이름, 동의 체크, 서명',
    fields: [
      { fieldType: 'text', label: '이름', placeholder: '성명', isRequired: true, pageNumber: 1, positionX: 15, positionY: 15, width: 30, height: 5 },
      { fieldType: 'checkbox', label: '동의함', isRequired: false, pageNumber: 1, positionX: 15, positionY: 65, width: 5, height: 5 },
      { fieldType: 'signature', label: '서명', isRequired: true, pageNumber: 1, positionX: 35, positionY: 80, width: 30, height: 12 },
    ],
  },
  {
    name: '상세 계약서',
    description: '이름, 연락처, 이메일, 주소, 날짜, 금액, 동의, 서명',
    fields: [
      { fieldType: 'text', label: '성명', placeholder: '성명', isRequired: true, pageNumber: 1, positionX: 10, positionY: 8, width: 25, height: 5 },
      { fieldType: 'phone', label: '연락처', placeholder: '010-0000-0000', isRequired: true, pageNumber: 1, positionX: 10, positionY: 16, width: 25, height: 5 },
      { fieldType: 'email', label: '이메일', placeholder: 'email@example.com', isRequired: false, pageNumber: 1, positionX: 10, positionY: 24, width: 25, height: 5 },
      { fieldType: 'text', label: '주소', placeholder: '주소 입력', isRequired: false, pageNumber: 1, positionX: 10, positionY: 32, width: 40, height: 5 },
      { fieldType: 'date', label: '계약일', isRequired: true, pageNumber: 1, positionX: 55, positionY: 8, width: 25, height: 5 },
      { fieldType: 'number', label: '계약금액', placeholder: '금액', isRequired: true, pageNumber: 1, positionX: 55, positionY: 16, width: 25, height: 5 },
      { fieldType: 'checkbox', label: '약관 동의', isRequired: false, pageNumber: 1, positionX: 10, positionY: 70, width: 5, height: 5 },
      { fieldType: 'signature', label: '서명', isRequired: true, pageNumber: 1, positionX: 35, positionY: 80, width: 30, height: 12 },
    ],
  },
];

interface FieldEditorProps {
  fields: FieldDef[];
  onChange: (fields: FieldDef[]) => void;
  templateImageUrl?: string;
}

export default function FieldEditor({ fields, onChange, templateImageUrl }: FieldEditorProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [dragging, setDragging] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectSingle = (idx: number) => setSelectedIndices(new Set([idx]));
  const clearSelection = () => setSelectedIndices(new Set());

  const toggleSelection = (idx: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const addField = (type: string) => {
    const typeInfo = FIELD_TYPES.find(t => t.value === type);
    const newField: FieldDef = {
      fieldType: type,
      label: typeInfo?.label || type,
      placeholder: '',
      isRequired: true,
      pageNumber: 1,
      positionX: 10 + (fields.length * 2) % 60,
      positionY: 10 + (fields.length * 5) % 60,
      width: type === 'signature' ? 25 : type === 'checkbox' ? 5 : 20,
      height: type === 'signature' ? 8 : type === 'checkbox' ? 5 : 4,
      sortOrder: fields.length,
    };
    onChange([...fields, newField]);
    selectSingle(fields.length);
  };

  const removeField = (idx: number) => {
    const updated = fields.filter((_, i) => i !== idx);
    onChange(updated);
    setSelectedIndices(prev => {
      const next = new Set<number>();
      prev.forEach(i => {
        if (i < idx) next.add(i);
        else if (i > idx) next.add(i - 1);
      });
      return next;
    });
  };

  const removeSelectedFields = () => {
    const indices = Array.from(selectedIndices).sort((a, b) => b - a);
    let updated = [...fields];
    for (const idx of indices) {
      updated = updated.filter((_, i) => i !== idx);
    }
    onChange(updated);
    clearSelection();
  };

  const updateField = (idx: number, updates: Partial<FieldDef>) => {
    const updated = fields.map((f, i) => i === idx ? { ...f, ...updates } : f);
    onChange(updated);
  };

  const duplicateField = (idx: number) => {
    const field = fields[idx];
    const newField: FieldDef = {
      ...field,
      id: undefined,
      positionX: Math.min(field.positionX + 3, 100 - field.width),
      positionY: Math.min(field.positionY + 3, 100 - field.height),
      sortOrder: fields.length,
      label: `${field.label} (복사)`,
    };
    onChange([...fields, newField]);
    selectSingle(fields.length);
  };

  const moveSelectedUp = () => {
    const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
    if (sorted[0] === 0) return; // Already at top
    const updated = [...fields];
    const newSelected = new Set<number>();
    for (const idx of sorted) {
      [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
      newSelected.add(idx - 1);
    }
    onChange(updated);
    setSelectedIndices(newSelected);
  };

  const moveSelectedDown = () => {
    const sorted = Array.from(selectedIndices).sort((a, b) => b - a);
    if (sorted[0] === fields.length - 1) return; // Already at bottom
    const updated = [...fields];
    const newSelected = new Set<number>();
    for (const idx of sorted) {
      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
      newSelected.add(idx + 1);
    }
    onChange(updated);
    setSelectedIndices(newSelected);
  };

  const alignSelected = (direction: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV') => {
    if (selectedIndices.size < 2) return;
    const indices = Array.from(selectedIndices);
    const selected = indices.map(i => fields[i]);
    const updated = [...fields];

    switch (direction) {
      case 'left': {
        const minX = Math.min(...selected.map(f => Number(f.positionX)));
        indices.forEach(i => { updated[i] = { ...updated[i], positionX: minX }; });
        break;
      }
      case 'right': {
        const maxRight = Math.max(...selected.map(f => Number(f.positionX) + Number(f.width)));
        indices.forEach(i => { updated[i] = { ...updated[i], positionX: maxRight - Number(updated[i].width) }; });
        break;
      }
      case 'top': {
        const minY = Math.min(...selected.map(f => Number(f.positionY)));
        indices.forEach(i => { updated[i] = { ...updated[i], positionY: minY }; });
        break;
      }
      case 'bottom': {
        const maxBottom = Math.max(...selected.map(f => Number(f.positionY) + Number(f.height)));
        indices.forEach(i => { updated[i] = { ...updated[i], positionY: maxBottom - Number(updated[i].height) }; });
        break;
      }
      case 'centerH': {
        const minX = Math.min(...selected.map(f => Number(f.positionX)));
        const maxRight = Math.max(...selected.map(f => Number(f.positionX) + Number(f.width)));
        const centerX = (minX + maxRight) / 2;
        indices.forEach(i => { updated[i] = { ...updated[i], positionX: centerX - Number(updated[i].width) / 2 }; });
        break;
      }
      case 'centerV': {
        const minY = Math.min(...selected.map(f => Number(f.positionY)));
        const maxBottom = Math.max(...selected.map(f => Number(f.positionY) + Number(f.height)));
        const centerY = (minY + maxBottom) / 2;
        indices.forEach(i => { updated[i] = { ...updated[i], positionY: centerY - Number(updated[i].height) / 2 }; });
        break;
      }
    }
    onChange(updated);
  };

  const startDrag = useCallback((idx: number, startX: number, startY: number) => {
    selectSingle(idx);
    setDragging(idx);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const field = fields[idx];
    const startPosX = field.positionX;
    const startPosY = field.positionY;

    const handleMove = (clientX: number, clientY: number) => {
      const dx = ((clientX - startX) / rect.width) * 100;
      const dy = ((clientY - startY) / rect.height) * 100;
      const newX = Math.max(0, Math.min(100 - field.width, startPosX + dx));
      const newY = Math.max(0, Math.min(100 - field.height, startPosY + dy));
      updateField(idx, { positionX: Math.round(newX * 10) / 10, positionY: Math.round(newY * 10) / 10 });
    };

    const handleMouseMove = (moveE: MouseEvent) => handleMove(moveE.clientX, moveE.clientY);
    const handleTouchMove = (moveE: TouchEvent) => {
      moveE.preventDefault();
      handleMove(moveE.touches[0].clientX, moveE.touches[0].clientY);
    };

    const handleEnd = () => {
      setDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }, [fields]);

  const startResize = useCallback((idx: number, startX: number, startY: number) => {
    selectSingle(idx);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const field = fields[idx];
    const startW = field.width;
    const startH = field.height;

    const handleMove = (clientX: number, clientY: number) => {
      const dw = ((clientX - startX) / rect.width) * 100;
      const dh = ((clientY - startY) / rect.height) * 100;
      const newW = Math.max(5, Math.min(100 - field.positionX, startW + dw));
      const newH = Math.max(2, Math.min(100 - field.positionY, startH + dh));
      updateField(idx, {
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10,
      });
    };

    const handleMouseMove = (moveE: MouseEvent) => handleMove(moveE.clientX, moveE.clientY);
    const handleTouchMove = (moveE: TouchEvent) => {
      moveE.preventDefault();
      handleMove(moveE.touches[0].clientX, moveE.touches[0].clientY);
    };

    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }, [fields]);

  const handleMouseDown = useCallback((idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey || e.altKey) {
      toggleSelection(idx);
      return;
    }
    startDrag(idx, e.clientX, e.clientY);
  }, [startDrag]);

  const handleTouchStart = useCallback((idx: number, e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startDrag(idx, e.touches[0].clientX, e.touches[0].clientY);
  }, [startDrag]);

  const singleSelectedIdx = selectedIndices.size === 1 ? Array.from(selectedIndices)[0] : null;
  const singleSelected = singleSelectedIdx !== null ? fields[singleSelectedIdx] : null;

  return (
    <div className="flex gap-4 h-full">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="축소"
          >
            <ZoomOut className="w-4 h-4 text-gray-600" />
          </button>
          <input
            type="range"
            min={50}
            max={200}
            value={Math.round(zoom * 100)}
            onChange={(e) => setZoom(Number(e.target.value) / 100)}
            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
          <button
            onClick={() => setZoom(z => Math.min(2.0, z + 0.1))}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="확대"
          >
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs text-gray-500 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="overflow-auto flex-1" style={{ maxHeight: '70vh' }}>
          <div
            ref={canvasRef}
            className="relative bg-white border-2 border-dashed border-gray-200 rounded-xl overflow-hidden origin-top-left"
            style={{ aspectRatio: '210/297', transform: `scale(${zoom})`, transformOrigin: 'top left', width: '100%' }}
            onMouseDown={() => clearSelection()}
          >
            {templateImageUrl && !imgError ? (
              <img
                src={templateImageUrl}
                alt="Template"
                className="absolute inset-0 w-full h-full object-fill"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                <div className="text-center">
                  <p className="text-sm">계약서 템플릿 미리보기</p>
                  <p className="text-xs mt-1">필드를 추가하고 드래그하여 배치하세요</p>
                </div>
              </div>
            )}

            {/* Field overlays */}
            {fields.map((field, idx) => {
              const Icon = FIELD_TYPES.find(t => t.value === field.fieldType)?.icon || Type;
              const isSelected = selectedIndices.has(idx);
              return (
                <div
                  key={idx}
                  className={`absolute border-2 rounded cursor-move transition-colors flex items-center text-left gap-1 px-1 text-xs ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/80 z-10'
                      : 'border-blue-300/60 bg-blue-50/50 hover:border-blue-400'
                  }`}
                  style={{
                    left: `${field.positionX}%`,
                    top: `${field.positionY}%`,
                    width: `${field.width}%`,
                    height: `${field.height}%`,
                    minHeight: '20px',
                  }}
                  onMouseDown={(e) => handleMouseDown(idx, e)}
                  onTouchStart={(e) => handleTouchStart(idx, e)}
                >
                  <Icon className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="truncate text-blue-700">{field.label}</span>
                  {/* Resize handle (bottom-right corner) */}
                  <div
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 cursor-se-resize rounded-tl-sm"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      startResize(idx, e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      startResize(idx, e.touches[0].clientX, e.touches[0].clientY);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 shrink-0 space-y-4 overflow-y-auto max-h-[80vh]">
        {/* Field Presets */}
        {fields.length === 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <LayoutTemplate className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-xs font-semibold text-blue-700">필드 템플릿</p>
            </div>
            <div className="space-y-1.5">
              {FIELD_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    const presetFields = preset.fields.map((f, i) => ({ ...f, sortOrder: i }));
                    onChange(presetFields);
                    clearSelection();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg bg-white border border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-900">{preset.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add Field Buttons */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">필드 추가</p>
          <div className="grid grid-cols-2 gap-1.5">
            {FIELD_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => addField(value)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-gray-500" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Field List with multi-select */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500">필드 목록 ({fields.length})</p>
            {selectedIndices.size > 0 && (
              <button
                onClick={clearSelection}
                className="text-[10px] text-gray-400 hover:text-gray-600"
              >
                선택 해제
              </button>
            )}
          </div>

          {/* Sort/Action bar when 2+ selected */}
          {selectedIndices.size >= 2 && (
            <div className="flex items-center gap-1 mb-2 p-1.5 bg-blue-50 rounded-lg">
              <span className="text-[10px] text-blue-600 font-medium mr-auto">{selectedIndices.size}개 선택</span>
              <button
                onClick={moveSelectedUp}
                className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                title="위로 이동"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={moveSelectedDown}
                className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                title="아래로 이동"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={removeSelectedFields}
                className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
                title="선택 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {fields.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">
                위에서 필드를 추가하세요
              </p>
            ) : (
              fields.map((field, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs ${
                      isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                    }`}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey || e.altKey) {
                        toggleSelection(idx);
                      } else {
                        selectSingle(idx);
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(idx)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3 h-3 rounded border-gray-300 text-blue-600 shrink-0"
                    />
                    <span className="flex-1 truncate">{field.label}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); duplicateField(idx); }}
                      className="text-gray-400 hover:text-blue-500"
                      title="복사"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeField(idx); }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Field Properties - Single selection */}
        {singleSelected && singleSelectedIdx !== null && (
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">필드 속성</p>
            <div className="space-y-3">
              <Input
                label="라벨"
                value={singleSelected.label}
                onChange={(e) => updateField(singleSelectedIdx, { label: e.target.value })}
              />
              <Input
                label="안내 문구"
                value={singleSelected.placeholder || ''}
                onChange={(e) => updateField(singleSelectedIdx, { placeholder: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={singleSelected.isRequired}
                  onChange={(e) => updateField(singleSelectedIdx, { isRequired: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="required" className="text-xs text-gray-600">필수 입력</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="X (%)"
                  type="number"
                  value={String(singleSelected.positionX)}
                  onChange={(e) => updateField(singleSelectedIdx, { positionX: Number(e.target.value) })}
                />
                <Input
                  label="Y (%)"
                  type="number"
                  value={String(singleSelected.positionY)}
                  onChange={(e) => updateField(singleSelectedIdx, { positionY: Number(e.target.value) })}
                />
                <Input
                  label="너비 (%)"
                  type="number"
                  value={String(singleSelected.width)}
                  onChange={(e) => updateField(singleSelectedIdx, { width: Number(e.target.value) })}
                />
                <Input
                  label="높이 (%)"
                  type="number"
                  value={String(singleSelected.height)}
                  onChange={(e) => updateField(singleSelectedIdx, { height: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Multi-selection panel */}
        {selectedIndices.size > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              {selectedIndices.size}개 선택됨
            </p>

            {/* Alignment buttons */}
            <p className="text-[10px] font-medium text-gray-400 mb-1.5">정렬</p>
            <div className="grid grid-cols-3 gap-1 mb-3">
              <button onClick={() => alignSelected('left')} className="flex items-center justify-center gap-1 p-1.5 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors text-gray-600 hover:text-blue-600" title="좌측 정렬">
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => alignSelected('centerH')} className="flex items-center justify-center gap-1 p-1.5 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors text-gray-600 hover:text-blue-600" title="가로 중앙 정렬">
                <AlignCenterHorizontal className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => alignSelected('right')} className="flex items-center justify-center gap-1 p-1.5 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors text-gray-600 hover:text-blue-600" title="우측 정렬">
                <AlignRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => alignSelected('top')} className="flex items-center justify-center gap-1 p-1.5 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors text-gray-600 hover:text-blue-600" title="상단 정렬">
                <AlignStartVertical className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => alignSelected('centerV')} className="flex items-center justify-center gap-1 p-1.5 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors text-gray-600 hover:text-blue-600" title="세로 중앙 정렬">
                <AlignCenterVertical className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => alignSelected('bottom')} className="flex items-center justify-center gap-1 p-1.5 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors text-gray-600 hover:text-blue-600" title="하단 정렬">
                <AlignEndVertical className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                fullWidth
                onClick={moveSelectedUp}
              >
                <ArrowUp className="w-3.5 h-3.5 mr-1" />
                위로 이동
              </Button>
              <Button
                size="sm"
                variant="outline"
                fullWidth
                onClick={moveSelectedDown}
              >
                <ArrowDown className="w-3.5 h-3.5 mr-1" />
                아래로 이동
              </Button>
              <Button
                size="sm"
                variant="danger"
                fullWidth
                onClick={removeSelectedFields}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                선택 삭제
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
