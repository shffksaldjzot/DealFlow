'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Trash2, Type, Hash, Calendar, Phone, Mail, PenLine, CheckSquare, LayoutTemplate, ZoomIn, ZoomOut, Copy, ArrowUp, ArrowDown, AlignLeft, AlignRight, AlignCenterHorizontal, AlignCenterVertical, Undo2 } from 'lucide-react';

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

const MAX_UNDO = 50;

export default function FieldEditor({ fields, onChange, templateImageUrl }: FieldEditorProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [dragging, setDragging] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  // Undo history
  const undoStack = useRef<FieldDef[][]>([]);
  const isUndoing = useRef(false);

  // Marquee state via ref (avoids stale closures)
  const [marqueeRect, setMarqueeRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const pushUndo = useCallback((snapshot: FieldDef[]) => {
    if (isUndoing.current) return;
    undoStack.current.push(JSON.parse(JSON.stringify(snapshot)));
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
  }, []);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    isUndoing.current = true;
    onChange(prev);
    isUndoing.current = false;
  }, [onChange]);

  // Wrap onChange to auto-push undo
  const changeFields = useCallback((newFields: FieldDef[]) => {
    pushUndo(fieldsRef.current);
    onChange(newFields);
  }, [onChange, pushUndo]);

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

  // Keyboard: arrow keys (0.1% step), Ctrl+Z undo, Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;

      // Ctrl+Z undo (works always)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      if (selectedIndices.size === 0) return;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const step = e.shiftKey ? 1 : 0.1;
      let dx = 0, dy = 0;
      switch (e.key) {
        case 'ArrowLeft': dx = -step; break;
        case 'ArrowRight': dx = step; break;
        case 'ArrowUp': dy = -step; break;
        case 'ArrowDown': dy = step; break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          removeSelectedFields();
          return;
        default: return;
      }
      e.preventDefault();
      pushUndo(fieldsRef.current);
      const updated = [...fieldsRef.current];
      selectedIndices.forEach(i => {
        const f = updated[i];
        updated[i] = {
          ...f,
          positionX: Math.round(Math.max(0, Math.min(100 - Number(f.width), Number(f.positionX) + dx)) * 10) / 10,
          positionY: Math.round(Math.max(0, Math.min(100 - Number(f.height), Number(f.positionY) + dy)) * 10) / 10,
        };
      });
      onChange(updated);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndices, onChange, undo, pushUndo]);

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
    changeFields([...fields, newField]);
    selectSingle(fields.length);
  };

  const removeField = (idx: number) => {
    changeFields(fields.filter((_, i) => i !== idx));
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
    let updated = [...fieldsRef.current];
    for (const idx of indices) {
      updated = updated.filter((_, i) => i !== idx);
    }
    changeFields(updated);
    clearSelection();
  };

  const updateField = (idx: number, updates: Partial<FieldDef>) => {
    const updated = fields.map((f, i) => i === idx ? { ...f, ...updates } : f);
    changeFields(updated);
  };

  const duplicateField = (idx: number) => {
    const field = fields[idx];
    const newField: FieldDef = {
      ...field,
      id: undefined,
      positionX: Math.min(Number(field.positionX) + 3, 100 - Number(field.width)),
      positionY: Math.min(Number(field.positionY) + 3, 100 - Number(field.height)),
      sortOrder: fields.length,
      label: field.label,
    };
    changeFields([...fields, newField]);
    selectSingle(fields.length);
  };

  const moveSelectedUp = () => {
    const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
    if (sorted[0] === 0) return;
    const updated = [...fields];
    const newSelected = new Set<number>();
    for (const idx of sorted) {
      [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
      newSelected.add(idx - 1);
    }
    changeFields(updated);
    setSelectedIndices(newSelected);
  };

  const moveSelectedDown = () => {
    const sorted = Array.from(selectedIndices).sort((a, b) => b - a);
    if (sorted[0] === fields.length - 1) return;
    const updated = [...fields];
    const newSelected = new Set<number>();
    for (const idx of sorted) {
      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
      newSelected.add(idx + 1);
    }
    changeFields(updated);
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
        indices.forEach(i => { updated[i] = { ...updated[i], positionX: Math.round((centerX - Number(updated[i].width) / 2) * 10) / 10 }; });
        break;
      }
      case 'centerV': {
        const minY = Math.min(...selected.map(f => Number(f.positionY)));
        const maxBottom = Math.max(...selected.map(f => Number(f.positionY) + Number(f.height)));
        const centerY = (minY + maxBottom) / 2;
        indices.forEach(i => { updated[i] = { ...updated[i], positionY: Math.round((centerY - Number(updated[i].height) / 2) * 10) / 10 }; });
        break;
      }
    }
    changeFields(updated);
  };

  // Distribute spacing evenly
  const distributeSelected = (axis: 'horizontal' | 'vertical') => {
    if (selectedIndices.size < 3) return;
    const indices = Array.from(selectedIndices);
    const updated = [...fields];

    if (axis === 'horizontal') {
      const sorted = indices.sort((a, b) => Number(fields[a].positionX) - Number(fields[b].positionX));
      const first = Number(fields[sorted[0]].positionX);
      const last = Number(fields[sorted[sorted.length - 1]].positionX);
      const totalSpan = last - first;
      const step = totalSpan / (sorted.length - 1);
      sorted.forEach((i, idx) => {
        updated[i] = { ...updated[i], positionX: Math.round((first + step * idx) * 10) / 10 };
      });
    } else {
      const sorted = indices.sort((a, b) => Number(fields[a].positionY) - Number(fields[b].positionY));
      const first = Number(fields[sorted[0]].positionY);
      const last = Number(fields[sorted[sorted.length - 1]].positionY);
      const totalSpan = last - first;
      const step = totalSpan / (sorted.length - 1);
      sorted.forEach((i, idx) => {
        updated[i] = { ...updated[i], positionY: Math.round((first + step * idx) * 10) / 10 };
      });
    }
    changeFields(updated);
  };

  const startDrag = useCallback((idx: number, startX: number, startY: number, isMulti: boolean) => {
    if (!isMulti) selectSingle(idx);
    setDragging(idx);
    pushUndo(fieldsRef.current);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const dragIndices = isMulti ? Array.from(selectedIndices) : [idx];
    const startPositions = dragIndices.map(i => ({
      idx: i,
      x: Number(fieldsRef.current[i].positionX),
      y: Number(fieldsRef.current[i].positionY),
    }));

    const handleMove = (clientX: number, clientY: number) => {
      const dx = ((clientX - startX) / rect.width) * 100;
      const dy = ((clientY - startY) / rect.height) * 100;
      const updated = [...fieldsRef.current];
      startPositions.forEach(({ idx: i, x, y }) => {
        const f = updated[i];
        updated[i] = {
          ...f,
          positionX: Math.round(Math.max(0, Math.min(100 - Number(f.width), x + dx)) * 10) / 10,
          positionY: Math.round(Math.max(0, Math.min(100 - Number(f.height), y + dy)) * 10) / 10,
        };
      });
      onChange(updated); // Direct onChange, undo already pushed at start
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
  }, [fields, selectedIndices, onChange, pushUndo]);

  const startResize = useCallback((idx: number, startX: number, startY: number) => {
    selectSingle(idx);
    pushUndo(fieldsRef.current);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const field = fields[idx];
    const startW = Number(field.width);
    const startH = Number(field.height);

    const handleMove = (clientX: number, clientY: number) => {
      const dw = ((clientX - startX) / rect.width) * 100;
      const dh = ((clientY - startY) / rect.height) * 100;
      const newW = Math.max(5, Math.min(100 - Number(field.positionX), startW + dw));
      const newH = Math.max(2, Math.min(100 - Number(field.positionY), startH + dh));
      const updated = fieldsRef.current.map((f, i) => i === idx ? { ...f, width: Math.round(newW * 10) / 10, height: Math.round(newH * 10) / 10 } : f);
      onChange(updated);
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
  }, [fields, onChange, pushUndo]);

  const handleFieldMouseDown = useCallback((idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey || e.altKey) {
      toggleSelection(idx);
      return;
    }
    const isMulti = selectedIndices.has(idx) && selectedIndices.size > 1;
    startDrag(idx, e.clientX, e.clientY, isMulti);
  }, [startDrag, selectedIndices]);

  const handleFieldTouchStart = useCallback((idx: number, e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isMulti = selectedIndices.has(idx) && selectedIndices.size > 1;
    startDrag(idx, e.touches[0].clientX, e.touches[0].clientY, isMulti);
  }, [startDrag, selectedIndices]);

  // Marquee selection - using direct DOM events for reliability
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const x1 = ((startX - rect.left) / rect.width) * 100;
    const y1 = ((startY - rect.top) / rect.height) * 100;

    clearSelection();
    let moved = false;

    const handleMove = (moveE: MouseEvent) => {
      moved = true;
      const x2 = ((moveE.clientX - rect.left) / rect.width) * 100;
      const y2 = ((moveE.clientY - rect.top) / rect.height) * 100;
      setMarqueeRect({
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      });
    };

    const handleUp = (upE: MouseEvent) => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);

      if (moved) {
        const x2 = ((upE.clientX - rect.left) / rect.width) * 100;
        const y2 = ((upE.clientY - rect.top) / rect.height) * 100;
        const left = Math.min(x1, x2);
        const right = Math.max(x1, x2);
        const top = Math.min(y1, y2);
        const bottom = Math.max(y1, y2);

        if (right - left > 1 || bottom - top > 1) {
          const selected = new Set<number>();
          fieldsRef.current.forEach((f, i) => {
            const fx = Number(f.positionX);
            const fy = Number(f.positionY);
            const fw = Number(f.width);
            const fh = Number(f.height);
            if (fx < right && fx + fw > left && fy < bottom && fy + fh > top) {
              selected.add(i);
            }
          });
          if (selected.size > 0) setSelectedIndices(selected);
        }
      }
      setMarqueeRect(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, []);

  const singleSelectedIdx = selectedIndices.size === 1 ? Array.from(selectedIndices)[0] : null;
  const singleSelected = singleSelectedIdx !== null ? fields[singleSelectedIdx] : null;

  const btnClass = "flex flex-col items-center gap-0.5 p-1.5 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors text-gray-600 hover:text-blue-600";

  return (
    <div className="flex gap-4 h-full" tabIndex={-1}>
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={undo}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="실행 취소 (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4 text-gray-600" />
          </button>
          <div className="w-px h-5 bg-gray-200" />
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
            className="w-24 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
          <button
            onClick={() => setZoom(z => Math.min(2.0, z + 0.1))}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="확대"
          >
            <ZoomIn className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs text-gray-500 min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
          {selectedIndices.size > 0 && (
            <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {selectedIndices.size}개 선택 | ←→↑↓ 0.1% | Shift 1%
            </span>
          )}
        </div>

        <div className="overflow-auto flex-1" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          <div
            ref={canvasRef}
            className="relative bg-white border-2 border-dashed border-gray-200 rounded-xl origin-top-left select-none"
            style={{ aspectRatio: '210/297', transform: `scale(${zoom})`, transformOrigin: 'top left', width: '100%' }}
            onMouseDown={handleCanvasMouseDown}
          >
            {templateImageUrl && !imgError ? (
              <img
                src={templateImageUrl}
                alt="Template"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                onError={() => setImgError(true)}
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300 pointer-events-none">
                <div className="text-center">
                  <p className="text-sm">계약서 템플릿 미리보기</p>
                  <p className="text-xs mt-1">필드를 추가하고 드래그하여 배치하세요</p>
                  <p className="text-xs mt-1">빈 공간 드래그로 여러 필드 선택</p>
                </div>
              </div>
            )}

            {/* Marquee selection overlay */}
            {marqueeRect && (marqueeRect.width > 1 || marqueeRect.height > 1) && (
              <div
                className="absolute border-2 border-blue-400 bg-blue-200/30 pointer-events-none z-20"
                style={{
                  left: `${marqueeRect.left}%`,
                  top: `${marqueeRect.top}%`,
                  width: `${marqueeRect.width}%`,
                  height: `${marqueeRect.height}%`,
                }}
              />
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
                  onMouseDown={(e) => handleFieldMouseDown(idx, e)}
                  onTouchStart={(e) => handleFieldTouchStart(idx, e)}
                >
                  <Icon className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="truncate text-blue-700">{field.label}</span>
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
      <div className="w-64 shrink-0 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
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
                    changeFields(presetFields);
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

        {/* Field List */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500">필드 목록 ({fields.length})</p>
            {selectedIndices.size > 0 && (
              <button onClick={clearSelection} className="text-[10px] text-gray-400 hover:text-gray-600">선택 해제</button>
            )}
          </div>

          {selectedIndices.size >= 2 && (
            <div className="flex items-center gap-1 mb-2 p-1.5 bg-blue-50 rounded-lg">
              <span className="text-[10px] text-blue-600 font-medium mr-auto">{selectedIndices.size}개 선택</span>
              <button onClick={moveSelectedUp} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="위로"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={moveSelectedDown} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="아래로"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button onClick={removeSelectedFields} className="p-1 rounded hover:bg-red-100 text-red-500" title="삭제"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {fields.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">위에서 필드를 추가하세요</p>
            ) : (
              fields.map((field, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                    onClick={(e) => { (e.ctrlKey || e.metaKey || e.altKey) ? toggleSelection(idx) : selectSingle(idx); }}
                  >
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(idx)} onClick={(e) => e.stopPropagation()} className="w-3 h-3 rounded border-gray-300 text-blue-600 shrink-0" />
                    <span className="flex-1 truncate">{field.label}</span>
                    <button onClick={(e) => { e.stopPropagation(); duplicateField(idx); }} className="text-gray-400 hover:text-blue-500" title="복사"><Copy className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); removeField(idx); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Single selection properties */}
        {singleSelected && singleSelectedIdx !== null && (
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">필드 속성</p>
            <div className="space-y-3">
              <Input label="라벨" value={singleSelected.label} onChange={(e) => updateField(singleSelectedIdx, { label: e.target.value })} />
              <Input label="안내 문구" value={singleSelected.placeholder || ''} onChange={(e) => updateField(singleSelectedIdx, { placeholder: e.target.value })} />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="required" checked={singleSelected.isRequired} onChange={(e) => updateField(singleSelectedIdx, { isRequired: e.target.checked })} className="rounded border-gray-300" />
                <label htmlFor="required" className="text-xs text-gray-600">필수 입력</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input label="X (%)" type="number" value={String(singleSelected.positionX)} onChange={(e) => updateField(singleSelectedIdx, { positionX: Number(e.target.value) })} />
                <Input label="Y (%)" type="number" value={String(singleSelected.positionY)} onChange={(e) => updateField(singleSelectedIdx, { positionY: Number(e.target.value) })} />
                <Input label="너비 (%)" type="number" value={String(singleSelected.width)} onChange={(e) => updateField(singleSelectedIdx, { width: Number(e.target.value) })} />
                <Input label="높이 (%)" type="number" value={String(singleSelected.height)} onChange={(e) => updateField(singleSelectedIdx, { height: Number(e.target.value) })} />
              </div>
            </div>
          </div>
        )}

        {/* Multi-selection panel */}
        {selectedIndices.size > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">{selectedIndices.size}개 선택됨</p>

            {/* Horizontal alignment */}
            <p className="text-[10px] font-medium text-gray-400 mb-1">가로 정렬</p>
            <div className="grid grid-cols-3 gap-1 mb-2">
              <button onClick={() => alignSelected('left')} className={btnClass} title="좌측 정렬">
                <AlignLeft className="w-3.5 h-3.5" /><span className="text-[9px]">좌측</span>
              </button>
              <button onClick={() => alignSelected('centerH')} className={btnClass} title="가로 중앙">
                <AlignCenterHorizontal className="w-3.5 h-3.5" /><span className="text-[9px]">중앙</span>
              </button>
              <button onClick={() => alignSelected('right')} className={btnClass} title="우측 정렬">
                <AlignRight className="w-3.5 h-3.5" /><span className="text-[9px]">우측</span>
              </button>
            </div>

            {/* Vertical alignment */}
            <p className="text-[10px] font-medium text-gray-400 mb-1">세로 정렬</p>
            <div className="grid grid-cols-3 gap-1 mb-2">
              <button onClick={() => alignSelected('top')} className={btnClass} title="상단 정렬">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="4" x2="20" y2="4" /><rect x="7" y="4" width="3" height="12" rx="1" fill="currentColor" opacity="0.3" /><rect x="14" y="4" width="3" height="7" rx="1" fill="currentColor" opacity="0.3" /></svg>
                <span className="text-[9px]">상단</span>
              </button>
              <button onClick={() => alignSelected('centerV')} className={btnClass} title="세로 중앙">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="12" x2="20" y2="12" strokeDasharray="2 2" /><rect x="7" y="4" width="3" height="16" rx="1" fill="currentColor" opacity="0.3" /><rect x="14" y="7" width="3" height="10" rx="1" fill="currentColor" opacity="0.3" /></svg>
                <span className="text-[9px]">중앙</span>
              </button>
              <button onClick={() => alignSelected('bottom')} className={btnClass} title="하단 정렬">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="20" x2="20" y2="20" /><rect x="7" y="8" width="3" height="12" rx="1" fill="currentColor" opacity="0.3" /><rect x="14" y="13" width="3" height="7" rx="1" fill="currentColor" opacity="0.3" /></svg>
                <span className="text-[9px]">하단</span>
              </button>
            </div>

            {/* Distribute spacing (3+ selected) */}
            {selectedIndices.size >= 3 && (
              <>
                <p className="text-[10px] font-medium text-gray-400 mb-1">균등 분배</p>
                <div className="grid grid-cols-2 gap-1 mb-3">
                  <button onClick={() => distributeSelected('horizontal')} className={btnClass} title="가로 균등 분배">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="3" height="12" rx="1" fill="currentColor" opacity="0.3" /><rect x="10.5" y="6" width="3" height="12" rx="1" fill="currentColor" opacity="0.3" /><rect x="18" y="6" width="3" height="12" rx="1" fill="currentColor" opacity="0.3" /><line x1="4.5" y1="4" x2="4.5" y2="2" /><line x1="12" y1="4" x2="12" y2="2" /><line x1="19.5" y1="4" x2="19.5" y2="2" /></svg>
                    <span className="text-[9px]">가로</span>
                  </button>
                  <button onClick={() => distributeSelected('vertical')} className={btnClass} title="세로 균등 분배">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="3" width="12" height="3" rx="1" fill="currentColor" opacity="0.3" /><rect x="6" y="10.5" width="12" height="3" rx="1" fill="currentColor" opacity="0.3" /><rect x="6" y="18" width="12" height="3" rx="1" fill="currentColor" opacity="0.3" /></svg>
                    <span className="text-[9px]">세로</span>
                  </button>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Button size="sm" variant="outline" fullWidth onClick={moveSelectedUp}><ArrowUp className="w-3.5 h-3.5 mr-1" />위로 이동</Button>
              <Button size="sm" variant="outline" fullWidth onClick={moveSelectedDown}><ArrowDown className="w-3.5 h-3.5 mr-1" />아래로 이동</Button>
              <Button size="sm" variant="danger" fullWidth onClick={removeSelectedFields}><Trash2 className="w-3.5 h-3.5 mr-1" />선택 삭제</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
