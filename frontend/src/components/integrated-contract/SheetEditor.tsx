'use client';
import { useState } from 'react';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import PopupContentEditor from './PopupContentEditor';
import type { IcApartmentType, IcSheetColumn, IcSheetRow } from '@/types/integrated-contract';

interface ColumnDraft {
  id?: string;
  apartmentTypeId?: string;
  customName?: string;
  sortOrder: number;
}

interface RowDraft {
  id?: string;
  optionName: string;
  popupContent?: string;
  sortOrder: number;
  prices: Record<string, number>;
}

interface SheetEditorProps {
  apartmentTypes: IcApartmentType[];
  initialColumns?: IcSheetColumn[];
  initialRows?: IcSheetRow[];
  onSaveColumns: (columns: ColumnDraft[]) => Promise<void>;
  onSaveRows: (rows: RowDraft[]) => Promise<void>;
  disabled?: boolean;
}

export default function SheetEditor({
  apartmentTypes,
  initialColumns = [],
  initialRows = [],
  onSaveColumns,
  onSaveRows,
  disabled,
}: SheetEditorProps) {
  const [columns, setColumns] = useState<ColumnDraft[]>(
    initialColumns.length > 0
      ? initialColumns.map((c) => ({
          id: c.id,
          apartmentTypeId: c.apartmentTypeId,
          customName: c.customName,
          sortOrder: c.sortOrder,
        }))
      : apartmentTypes.map((t, i) => ({
          apartmentTypeId: t.id,
          customName: t.name,
          sortOrder: i,
        })),
  );

  const [rows, setRows] = useState<RowDraft[]>(
    initialRows.map((r) => ({
      id: r.id,
      optionName: r.optionName,
      popupContent: r.popupContent,
      sortOrder: r.sortOrder,
      prices: r.prices || {},
    })),
  );

  const [saving, setSaving] = useState(false);

  // Column operations
  const addColumn = () => {
    setColumns([...columns, { customName: '', sortOrder: columns.length }]);
  };

  const updateColumn = (index: number, field: keyof ColumnDraft, value: string) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], [field]: value || undefined };
    setColumns(updated);
  };

  const removeColumn = (index: number) => {
    const colKey = getColumnKey(columns[index], index);
    setColumns(columns.filter((_, i) => i !== index));
    // Remove prices for this column from all rows
    setRows(rows.map((r) => {
      const newPrices = { ...r.prices };
      delete newPrices[colKey];
      return { ...r, prices: newPrices };
    }));
  };

  // Row operations
  const addRow = () => {
    setRows([...rows, { optionName: '', sortOrder: rows.length, prices: {} }]);
  };

  const updateRowField = (rowIndex: number, field: string, value: string) => {
    const updated = [...rows];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value };
    setRows(updated);
  };

  const updateRowPrice = (rowIndex: number, columnKey: string, value: string) => {
    const updated = [...rows];
    const prices = { ...updated[rowIndex].prices };
    const numVal = value === '' ? 0 : Number(value);
    prices[columnKey] = isNaN(numVal) ? 0 : numVal;
    updated[rowIndex] = { ...updated[rowIndex], prices };
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

  // Get stable column key for price mapping
  const getColumnKey = (col: ColumnDraft, index: number): string => {
    return col.id || `col_${index}`;
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveColumns(columns);
      await onSaveRows(rows);
    } finally {
      setSaving(false);
    }
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num ? num.toLocaleString('ko-KR') : '';
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {!disabled && (
          <>
            <Button variant="outline" size="sm" onClick={addColumn}>
              <Plus className="w-4 h-4 mr-1" />
              열 추가
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
      <div className="border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left font-medium text-gray-600 min-w-[200px] sticky left-0 bg-gray-50 z-10">
                옵션명
              </th>
              <th className="px-2 py-2 w-8 text-center text-gray-400">
                ?
              </th>
              {columns.map((col, ci) => (
                <th key={ci} className="px-2 py-2 min-w-[120px]">
                  <div className="flex items-center gap-1">
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
                  {!disabled && !col.apartmentTypeId && (
                    <input
                      type="text"
                      value={col.customName || ''}
                      onChange={(e) => updateColumn(ci, 'customName', e.target.value)}
                      placeholder="열 이름"
                      className="mt-1 w-full text-xs border border-gray-200 rounded-lg px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </th>
              ))}
              {!disabled && (
                <th className="px-2 py-2 w-8" />
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 3} className="px-4 py-8 text-center text-gray-400">
                  행이 없습니다. &quot;행 추가&quot; 버튼을 눌러주세요.
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr key={ri} className="border-b border-gray-100 hover:bg-gray-50/50">
                  {/* Option Name */}
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
                  {/* Popup */}
                  <td className="px-2 py-1.5 text-center">
                    <PopupContentEditor
                      content={row.popupContent || ''}
                      onChange={(c) => updateRowPopup(ri, c)}
                      disabled={disabled}
                    />
                  </td>
                  {/* Prices */}
                  {columns.map((col, ci) => {
                    const colKey = getColumnKey(col, ci);
                    const price = row.prices[colKey] || 0;
                    return (
                      <td key={ci} className="px-2 py-1.5">
                        {disabled ? (
                          <span className="text-right block text-gray-700">
                            {price ? price.toLocaleString('ko-KR') : '-'}
                          </span>
                        ) : (
                          <input
                            type="number"
                            value={price || ''}
                            onChange={(e) => updateRowPrice(ri, colKey, e.target.value)}
                            placeholder="0"
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        )}
                      </td>
                    );
                  })}
                  {/* Delete */}
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {rows.length > 0 && columns.length > 0 && (
        <div className="text-xs text-gray-500">
          {columns.length}열 × {rows.length}행
        </div>
      )}
    </div>
  );
}
