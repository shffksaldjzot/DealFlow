'use client';
import { useState, useRef, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Trash2, GripVertical, Type, Hash, Calendar, Phone, Mail, PenLine, CheckSquare, LayoutTemplate } from 'lucide-react';

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
      { fieldType: 'checkbox', label: '동의함', isRequired: true, pageNumber: 1, positionX: 15, positionY: 65, width: 25, height: 5 },
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
      { fieldType: 'checkbox', label: '약관 동의', isRequired: true, pageNumber: 1, positionX: 10, positionY: 70, width: 25, height: 5 },
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
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

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
      width: type === 'signature' ? 30 : 25,
      height: type === 'signature' ? 10 : 5,
      sortOrder: fields.length,
    };
    onChange([...fields, newField]);
    setSelectedIdx(fields.length);
  };

  const removeField = (idx: number) => {
    const updated = fields.filter((_, i) => i !== idx);
    onChange(updated);
    setSelectedIdx(null);
  };

  const updateField = (idx: number, updates: Partial<FieldDef>) => {
    const updated = fields.map((f, i) => i === idx ? { ...f, ...updates } : f);
    onChange(updated);
  };

  const startDrag = useCallback((idx: number, startX: number, startY: number) => {
    setSelectedIdx(idx);
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

  const handleMouseDown = useCallback((idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(idx, e.clientX, e.clientY);
  }, [startDrag]);

  const handleTouchStart = useCallback((idx: number, e: React.TouchEvent) => {
    e.preventDefault();
    startDrag(idx, e.touches[0].clientX, e.touches[0].clientY);
  }, [startDrag]);

  const selected = selectedIdx !== null ? fields[selectedIdx] : null;

  return (
    <div className="flex gap-4 h-full">
      {/* Canvas Area */}
      <div className="flex-1">
        <div
          ref={canvasRef}
          className="relative bg-white border-2 border-dashed border-gray-200 rounded-xl overflow-hidden"
          style={{ aspectRatio: '210/297', maxHeight: '70vh' }}
        >
          {templateImageUrl && !imgError ? (
            <img
              src={templateImageUrl}
              alt="Template"
              className="absolute inset-0 w-full h-full object-contain"
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
            return (
              <div
                key={idx}
                className={`absolute border-2 rounded cursor-move transition-colors flex items-center gap-1 px-1 text-xs ${
                  selectedIdx === idx
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
              </div>
            );
          })}
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
                    setSelectedIdx(null);
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

        {/* Field List */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">필드 목록 ({fields.length})</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {fields.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">
                위에서 필드를 추가하세요
              </p>
            ) : (
              fields.map((field, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs ${
                    selectedIdx === idx ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedIdx(idx)}
                >
                  <GripVertical className="w-3 h-3 text-gray-300" />
                  <span className="flex-1 truncate">{field.label}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeField(idx); }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Field Properties */}
        {selected && selectedIdx !== null && (
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">필드 속성</p>
            <div className="space-y-3">
              <Input
                label="라벨"
                value={selected.label}
                onChange={(e) => updateField(selectedIdx, { label: e.target.value })}
              />
              <Input
                label="플레이스홀더"
                value={selected.placeholder || ''}
                onChange={(e) => updateField(selectedIdx, { placeholder: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={selected.isRequired}
                  onChange={(e) => updateField(selectedIdx, { isRequired: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="required" className="text-xs text-gray-600">필수 입력</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="X (%)"
                  type="number"
                  value={String(selected.positionX)}
                  onChange={(e) => updateField(selectedIdx, { positionX: Number(e.target.value) })}
                />
                <Input
                  label="Y (%)"
                  type="number"
                  value={String(selected.positionY)}
                  onChange={(e) => updateField(selectedIdx, { positionY: Number(e.target.value) })}
                />
                <Input
                  label="너비 (%)"
                  type="number"
                  value={String(selected.width)}
                  onChange={(e) => updateField(selectedIdx, { width: Number(e.target.value) })}
                />
                <Input
                  label="높이 (%)"
                  type="number"
                  value={String(selected.height)}
                  onChange={(e) => updateField(selectedIdx, { height: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
