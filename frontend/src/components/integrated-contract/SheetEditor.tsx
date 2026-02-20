'use client';
import { useState, useId } from 'react';
import { Plus, Trash2, GripVertical, Save, Type, DollarSign, Loader2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button from '@/components/ui/Button';
import PopupContentEditor from './PopupContentEditor';
import type { IcApartmentType, IcSheetColumn, IcSheetRow } from '@/types/integrated-contract';

export interface ColumnDraft {
  id?: string;
  apartmentTypeId?: string;
  customName?: string;
  columnType: 'text' | 'amount';
  sortOrder: number;
  _key: string;
}

export interface RowDraft {
  id?: string;
  optionName: string;
  popupContent?: string;
  sortOrder: number;
  prices: Record<string, number>;
  cellValues: Record<string, string>;
  _key: string;
}

interface SheetEditorProps {
  apartmentTypes: IcApartmentType[];
  initialColumns?: IcSheetColumn[];
  initialRows?: IcSheetRow[];
  onSaveColumns: (columns: Omit<ColumnDraft, '_key'>[]) => Promise<any[] | void>;
  onSaveRows: (rows: Omit<RowDraft, '_key'>[]) => Promise<any[] | void>;
  onError?: (message: string) => void;
  disabled?: boolean;
}

let _keyCounter = 0;
function nextKey() {
  return `k_${++_keyCounter}_${Date.now()}`;
}

// Format number with commas
function formatAmount(val: string | number): string {
  const num = typeof val === 'string' ? val.replace(/,/g, '') : String(val);
  if (!num || num === '0') return '';
  const parsed = parseInt(num, 10);
  if (isNaN(parsed)) return '';
  return parsed.toLocaleString('ko-KR');
}

// Parse comma-formatted string to number
function parseAmount(val: string): number {
  const cleaned = val.replace(/[^0-9-]/g, '');
  return cleaned === '' ? 0 : parseInt(cleaned, 10) || 0;
}

// Sortable row wrapper
function SortableRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (props: { listeners: any; attributes: any }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-100 hover:bg-gray-50/50">
      {children({ listeners, attributes })}
    </tr>
  );
}

// Sortable column header wrapper
function SortableColumnHeader({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (props: { listeners: any; attributes: any }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <th ref={setNodeRef} style={style} className="px-2 py-2 min-w-[120px]">
      {children({ listeners, attributes })}
    </th>
  );
}

export default function SheetEditor({
  apartmentTypes,
  initialColumns = [],
  initialRows = [],
  onSaveColumns,
  onSaveRows,
  onError,
  disabled,
}: SheetEditorProps) {
  // Sort initial data by sortOrder
  const sortedInitialCols = [...initialColumns].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedInitialRows = [...initialRows].sort((a, b) => a.sortOrder - b.sortOrder);

  const [columns, setColumns] = useState<ColumnDraft[]>(
    sortedInitialCols.length > 0
      ? sortedInitialCols.map((c) => ({
          id: c.id,
          apartmentTypeId: c.apartmentTypeId,
          customName: c.customName,
          columnType: c.columnType || 'amount',
          sortOrder: c.sortOrder,
          _key: c.id || nextKey(),
        }))
      : apartmentTypes.map((t, i) => ({
          apartmentTypeId: t.id,
          customName: t.name,
          columnType: 'amount' as const,
          sortOrder: i,
          _key: nextKey(),
        })),
  );

  const [rows, setRows] = useState<RowDraft[]>(
    sortedInitialRows.map((r) => ({
      id: r.id,
      optionName: r.optionName,
      popupContent: r.popupContent,
      sortOrder: r.sortOrder,
      prices: r.prices || {},
      cellValues: r.cellValues || {},
      _key: r.id || nextKey(),
    })),
  );

  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const dndId = useId();

  // Column operations
  const addColumn = (type: 'amount' | 'text') => {
    setColumns([...columns, {
      customName: '',
      columnType: type,
      sortOrder: columns.length,
      _key: nextKey(),
    }]);
  };

  const updateColumn = (index: number, field: keyof ColumnDraft, value: string) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], [field]: value || undefined };
    setColumns(updated);
  };

  const removeColumn = (index: number) => {
    const colKey = getColumnKey(columns[index]);
    setColumns(columns.filter((_, i) => i !== index));
    setRows(rows.map((r) => {
      const newPrices = { ...r.prices };
      const newCellValues = { ...r.cellValues };
      delete newPrices[colKey];
      delete newCellValues[colKey];
      return { ...r, prices: newPrices, cellValues: newCellValues };
    }));
  };

  // Row operations
  const addRow = () => {
    setRows([...rows, {
      optionName: '',
      sortOrder: rows.length,
      prices: {},
      cellValues: {},
      _key: nextKey(),
    }]);
  };

  const updateRowField = (rowIndex: number, field: string, value: string) => {
    const updated = [...rows];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value };
    setRows(updated);
  };

  const updateCellValue = (rowIndex: number, columnKey: string, value: string, colType: 'text' | 'amount') => {
    const updated = [...rows];
    if (colType === 'amount') {
      const prices = { ...updated[rowIndex].prices };
      const numVal = parseAmount(value);
      prices[columnKey] = numVal;
      updated[rowIndex] = { ...updated[rowIndex], prices };
      // Also sync cellValues with the raw numeric value
      const cellValues = { ...updated[rowIndex].cellValues };
      cellValues[columnKey] = String(numVal);
      updated[rowIndex] = { ...updated[rowIndex], cellValues };
    } else {
      const cellValues = { ...updated[rowIndex].cellValues };
      cellValues[columnKey] = value;
      updated[rowIndex] = { ...updated[rowIndex], cellValues };
    }
    setRows(updated);
  };

  const updateRowPopup = (rowIndex: number, content: string) => {
    const updated = [...rows];
    updated[rowIndex] = { ...updated[rowIndex], popupContent: content };
    setRows(updated);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  // Get stable column key
  const getColumnKey = (col: ColumnDraft): string => {
    return col.id || col._key;
  };

  // Get cell display value
  const getCellValue = (row: RowDraft, colKey: string, colType: 'text' | 'amount'): string => {
    if (colType === 'amount') {
      // Check prices first (canonical for amounts), then cellValues
      if (row.prices?.[colKey] !== undefined && row.prices[colKey] !== 0) {
        return String(row.prices[colKey]);
      }
      if (row.cellValues?.[colKey] !== undefined && row.cellValues[colKey] !== '' && row.cellValues[colKey] !== '0') {
        return row.cellValues[colKey];
      }
      return '';
    }
    if (row.cellValues?.[colKey] !== undefined) return row.cellValues[colKey];
    return '';
  };

  // Unified drag handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const colOldIndex = columns.findIndex((c) => c._key === active.id);
    if (colOldIndex !== -1) {
      const colNewIndex = columns.findIndex((c) => c._key === over.id);
      if (colNewIndex !== -1) {
        setColumns(arrayMove(columns, colOldIndex, colNewIndex).map((c, i) => ({ ...c, sortOrder: i })));
      }
      return;
    }

    const rowOldIndex = rows.findIndex((r) => r._key === active.id);
    if (rowOldIndex !== -1) {
      const rowNewIndex = rows.findIndex((r) => r._key === over.id);
      if (rowNewIndex !== -1) {
        setRows(arrayMove(rows, rowOldIndex, rowNewIndex).map((r, i) => ({ ...r, sortOrder: i })));
      }
    }
  };

  // Save with column ID remapping
  const handleSave = async () => {
    setSaving(true);
    try {
      // Remember old column keys by index
      const oldKeyByIndex = columns.map((col) => getColumnKey(col));

      const colsToSave = columns.map(({ _key, ...rest }, i) => ({ ...rest, sortOrder: i }));
      const savedCols = await onSaveColumns(colsToSave);

      // Build key remapping if new column IDs were returned
      const keyRemap = new Map<string, string>();
      if (Array.isArray(savedCols) && savedCols.length === columns.length) {
        // Sort saved columns by sortOrder to match index order
        const sorted = [...savedCols].sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        sorted.forEach((newCol: any, i: number) => {
          const oldKey = oldKeyByIndex[i];
          if (oldKey && newCol.id && oldKey !== newCol.id) {
            keyRemap.set(oldKey, newCol.id);
          }
        });
      }

      // Build set of valid new column IDs to clean stale references
      const validColIds = new Set<string>(
        Array.isArray(savedCols)
          ? savedCols.map((c: any) => c.id).filter(Boolean)
          : columns.map((c) => getColumnKey(c)),
      );

      // Remap row prices/cellValues keys to use new column IDs, dropping stale keys
      const rowsToSave = rows.map(({ _key, ...rest }, i) => {
        const remappedPrices: Record<string, number> = {};
        const remappedCellValues: Record<string, string> = {};

        for (const [key, val] of Object.entries(rest.prices || {})) {
          const newKey = keyRemap.get(key) || key;
          if (validColIds.has(newKey)) {
            remappedPrices[newKey] = val;
          }
        }
        for (const [key, val] of Object.entries(rest.cellValues || {})) {
          const newKey = keyRemap.get(key) || key;
          if (validColIds.has(newKey)) {
            remappedCellValues[newKey] = val;
          }
        }

        return {
          ...rest,
          sortOrder: i,
          prices: remappedPrices,
          cellValues: remappedCellValues,
        };
      });

      const savedRows = await onSaveRows(rowsToSave);

      // Update internal state with new IDs from backend to keep in sync
      if (Array.isArray(savedCols) && savedCols.length > 0) {
        const sortedCols = [...savedCols].sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setColumns(sortedCols.map((c: any) => ({
          id: c.id,
          apartmentTypeId: c.apartmentTypeId || undefined,
          customName: c.customName || undefined,
          columnType: c.columnType || 'amount',
          sortOrder: c.sortOrder,
          _key: c.id,
        })));
      }

      if (Array.isArray(savedRows) && savedRows.length > 0) {
        const sortedRows = [...savedRows].sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setRows(sortedRows.map((r: any) => ({
          id: r.id,
          optionName: r.optionName,
          popupContent: r.popupContent || undefined,
          sortOrder: r.sortOrder,
          prices: r.prices || {},
          cellValues: r.cellValues || {},
          _key: r.id,
        })));
      } else {
        // Fallback: update rows from local remapped data
        setRows(rowsToSave.map((r) => ({
          ...r,
          _key: r.id || nextKey(),
        })));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (onError) {
        onError(Array.isArray(msg) ? msg.join(', ') : msg || '저장에 실패했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative space-y-4">
      {/* Full-screen saving overlay */}
      {saving && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-base font-medium text-gray-800">저장 중...</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {!disabled && (
          <>
            <Button variant="outline" size="sm" onClick={() => addColumn('amount')}>
              <DollarSign className="w-4 h-4 mr-1" />
              금액 열
            </Button>
            <Button variant="outline" size="sm" onClick={() => addColumn('text')}>
              <Type className="w-4 h-4 mr-1" />
              텍스트 열
            </Button>
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="w-4 h-4 mr-1" />
              행 추가
            </Button>
            <div className="flex-1" />
            <Button size="sm" onClick={handleSave} loading={saving}>
              <Save className="w-4 h-4 mr-1" />
              저장
            </Button>
          </>
        )}
      </div>

      {/* Spreadsheet Table */}
      <DndContext
        id={dndId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="border border-gray-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {!disabled && <th className="px-1 py-2 w-8" />}
                <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[200px] sticky left-0 bg-gray-50 z-10">
                  옵션명
                </th>
                <th className="px-2 py-2 w-8 text-center text-gray-400">?</th>
                <SortableContext
                  items={columns.map((c) => c._key)}
                  strategy={horizontalListSortingStrategy}
                  disabled={disabled}
                >
                  {columns.map((col, ci) => (
                    <SortableColumnHeader key={col._key} id={col._key} disabled={disabled}>
                      {({ listeners, attributes }) => (
                        <div>
                          <div className="flex items-center gap-1">
                            {!disabled && (
                              <button {...listeners} {...attributes} className="cursor-grab p-0.5 text-gray-300 hover:text-gray-500">
                                <GripVertical className="w-3 h-3" />
                              </button>
                            )}
                            {disabled ? (
                              <span className="text-xs font-medium text-gray-600">
                                {col.customName || apartmentTypes.find((t) => t.id === col.apartmentTypeId)?.name || `열 ${ci + 1}`}
                              </span>
                            ) : (
                              <>
                                <select
                                  value={col.apartmentTypeId || ''}
                                  onChange={(e) => {
                                    updateColumn(ci, 'apartmentTypeId', e.target.value);
                                    const apt = apartmentTypes.find((t) => t.id === e.target.value);
                                    if (apt) updateColumn(ci, 'customName', apt.name);
                                  }}
                                  className="flex-1 text-xs border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">직접 입력</option>
                                  {apartmentTypes.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => removeColumn(ci)}
                                  className="p-0.5 text-gray-300 hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1">
                            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              col.columnType === 'text'
                                ? 'bg-gray-100 text-gray-500'
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {col.columnType === 'text' ? '텍스트' : '금액'}
                            </span>
                          </div>
                          {!disabled && !col.apartmentTypeId && (
                            <input
                              type="text"
                              value={col.customName || ''}
                              onChange={(e) => updateColumn(ci, 'customName', e.target.value)}
                              placeholder="열 이름"
                              className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      )}
                    </SortableColumnHeader>
                  ))}
                </SortableContext>
                {!disabled && <th className="px-2 py-2 w-8" />}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (disabled ? 3 : 4)} className="px-4 py-8 text-center text-gray-400">
                    행이 없습니다. &quot;행 추가&quot; 버튼을 눌러주세요.
                  </td>
                </tr>
              ) : (
                <SortableContext
                  items={rows.map((r) => r._key)}
                  strategy={verticalListSortingStrategy}
                  disabled={disabled}
                >
                  {rows.map((row, ri) => (
                    <SortableRow key={row._key} id={row._key} disabled={disabled}>
                      {({ listeners, attributes }) => (
                        <>
                          {!disabled && (
                            <td className="px-1 py-1.5 text-center">
                              <button {...listeners} {...attributes} className="cursor-grab p-1 text-gray-300 hover:text-gray-500">
                                <GripVertical className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                          <td className="px-3 py-1.5 sticky left-0 bg-white z-10">
                            {disabled ? (
                              <span className="text-gray-900">{row.optionName}</span>
                            ) : (
                              <input
                                type="text"
                                value={row.optionName}
                                onChange={(e) => updateRowField(ri, 'optionName', e.target.value)}
                                placeholder="옵션 이름"
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <PopupContentEditor
                              content={row.popupContent || ''}
                              onChange={(c) => updateRowPopup(ri, c)}
                              disabled={disabled}
                            />
                          </td>
                          {columns.map((col) => {
                            const colKey = getColumnKey(col);
                            const cellVal = getCellValue(row, colKey, col.columnType);
                            const isAmount = col.columnType === 'amount';
                            return (
                              <td key={col._key} className="px-2 py-1.5">
                                {disabled ? (
                                  <span className={`block ${isAmount ? 'text-right text-gray-700' : 'text-left text-gray-700'}`}>
                                    {isAmount
                                      ? (Number(cellVal) ? Number(cellVal).toLocaleString('ko-KR') : '-')
                                      : (cellVal || '-')}
                                  </span>
                                ) : isAmount ? (
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={cellVal ? formatAmount(cellVal) : ''}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/[^0-9]/g, '');
                                      updateCellValue(ri, colKey, raw, 'amount');
                                    }}
                                    placeholder="0"
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield]"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={cellVal || ''}
                                    onChange={(e) => updateCellValue(ri, colKey, e.target.value, 'text')}
                                    placeholder="입력"
                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                )}
                              </td>
                            );
                          })}
                          {!disabled && (
                            <td className="px-2 py-1.5">
                              <button
                                onClick={() => removeRow(ri)}
                                className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </>
                      )}
                    </SortableRow>
                  ))}
                </SortableContext>
              )}
            </tbody>
          </table>
        </div>
      </DndContext>

      {rows.length > 0 && columns.length > 0 && (
        <div className="text-xs text-gray-500">
          {columns.length}열 × {rows.length}행
        </div>
      )}
    </div>
  );
}
