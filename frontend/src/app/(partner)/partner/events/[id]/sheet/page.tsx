'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import PartnerProductCard from '@/components/integrated-contract/PartnerProductCard';
import PartnerProductForm from '@/components/integrated-contract/PartnerProductForm';
import { useToast } from '@/components/ui/Toast';
import { Eye, FileSpreadsheet, Plus, Trash2, Save, Loader2, ChevronDown } from 'lucide-react';
import type { IcConfig, IcPartnerSheet, IcSheetColumn, IcSheetRow } from '@/types/integrated-contract';

let _keyCounter = 0;
function nextKey() {
  return `k_${++_keyCounter}_${Date.now()}`;
}

export default function PartnerSheetPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [config, setConfig] = useState<IcConfig | null>(null);
  const [sheet, setSheet] = useState<IcPartnerSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const autoCreated = useRef(false);

  // Local state for editing
  const [columns, setColumns] = useState<IcSheetColumn[]>([]);
  const [rows, setRows] = useState<(IcSheetRow & { _key: string })[]>([]);

  // Category dropdown
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Two-step flow: category must be saved before editing detailed items
  const [categoryConfirmed, setCategoryConfirmed] = useState(false);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const configData = await api.get(`/ic/configs/event/${eventId}`).then((res) => extractData<IcConfig>(res));
      setConfig(configData);
      const sheetsData = await api.get('/ic/sheets/my', { params: { configId: configData.id } }).then((res) => extractData<IcPartnerSheet[]>(res));

      if (sheetsData.length > 0) {
        setSheet(sheetsData[0]);
        setColumns(sheetsData[0].columns || []);
        setRows((sheetsData[0].rows || []).map((r) => ({ ...r, _key: r.id || nextKey() })));
        setSelectedCategory(sheetsData[0].categoryName || '');
        // If sheet already has rows, category was confirmed before
        if ((sheetsData[0].rows || []).length > 0) {
          setCategoryConfirmed(true);
        }
      } else if (!autoCreated.current) {
        autoCreated.current = true;
        try {
          const defaultCat = (configData.categories && configData.categories.length > 0)
            ? configData.categories[0]
            : '품목';
          const created = await api.post('/ic/sheets', {
            configId: configData.id,
            categoryName: defaultCat,
          }).then((res) => extractData<IcPartnerSheet>(res));
          setSheet(created);
          setColumns(created.columns || []);
          setRows((created.rows || []).map((r) => ({ ...r, _key: r.id || nextKey() })));
          setSelectedCategory(created.categoryName || defaultCat);
          setCategoryConfirmed(false);
        } catch {
          toast('시트 자동 생성에 실패했습니다.', 'error');
        }
      }
    } catch {
      setConfig(null);
      setSheet(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  /* Step 1: Save category selection (claim the category) */
  const handleSaveCategory = async () => {
    if (!sheet || !selectedCategory) return;
    setSaving(true);
    try {
      await api.patch(`/ic/sheets/${sheet.id}`, { categoryName: selectedCategory });
      toast('품목이 저장되었습니다. 상세 품목을 편집할 수 있습니다.', 'success');
      setCategoryConfirmed(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast(Array.isArray(msg) ? msg.join(', ') : msg || '품목 저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  /* Step 2: Save detailed items */
  const handleSave = async () => {
    if (!sheet) return;
    setSaving(true);
    try {
      if (selectedCategory && selectedCategory !== sheet.categoryName) {
        await api.patch(`/ic/sheets/${sheet.id}`, { categoryName: selectedCategory });
      }

      const colsToSave = columns.map((col, i) => ({
        ...(col.id ? { id: col.id } : {}),
        apartmentTypeId: col.apartmentTypeId,
        customName: col.customName,
        columnType: col.columnType || 'amount',
        sortOrder: i,
      }));
      const savedColsRaw = await api.put(`/ic/sheets/${sheet.id}/columns`, { columns: colsToSave });
      const savedCols: any[] = savedColsRaw.data?.data || [];

      const keyRemap = new Map<string, string>();
      if (savedCols.length === columns.length) {
        const sorted = [...savedCols].sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        sorted.forEach((newCol: any, i: number) => {
          const oldKey = columns[i]?.id;
          if (oldKey && newCol.id && oldKey !== newCol.id) {
            keyRemap.set(oldKey, newCol.id);
          }
        });
      }

      const validColIds = new Set<string>(savedCols.map((c: any) => c.id).filter(Boolean));

      // Only send fields allowed by the DTO (exclude sheetId, createdAt, updatedAt; id only if valid UUID)
      const rowsToSave = rows.map((row, i) => {
        const remappedPrices: Record<string, number> = {};
        const remappedCellValues: Record<string, string> = {};
        for (const [key, val] of Object.entries(row.prices || {})) {
          const newKey = keyRemap.get(key) || key;
          if (validColIds.has(newKey)) remappedPrices[newKey] = val;
        }
        for (const [key, val] of Object.entries(row.cellValues || {})) {
          const newKey = keyRemap.get(key) || key;
          if (validColIds.has(newKey)) remappedCellValues[newKey] = val;
        }
        return {
          ...(row.id ? { id: row.id } : {}),
          apartmentTypeId: row.apartmentTypeId,
          optionName: row.optionName,
          price: row.price || 0,
          popupContent: row.popupContent,
          sortOrder: i,
          prices: remappedPrices,
          cellValues: remappedCellValues,
        };
      });

      const savedRowsRaw = await api.put(`/ic/sheets/${sheet.id}/rows`, { rows: rowsToSave });
      const savedRows: any[] = savedRowsRaw.data?.data || [];

      if (savedCols.length > 0) {
        const sortedCols = [...savedCols].sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setColumns(sortedCols);
      }
      if (savedRows.length > 0) {
        const sortedRows = [...savedRows].sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setRows(sortedRows.map((r: any) => ({ ...r, _key: r.id || nextKey() })));
      }

      toast('저장되었습니다.', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast(Array.isArray(msg) ? msg.join(', ') : msg || '저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProduct = (data: { optionName: string; popupContent: string; apartmentTypeId: string; price: number; prices: Record<string, number>; cellValues: Record<string, string> }) => {
    setRows((prev) => [...prev, {
      id: '',
      sheetId: sheet?.id || '',
      apartmentTypeId: data.apartmentTypeId || undefined,
      optionName: data.optionName,
      price: data.price,
      popupContent: data.popupContent || undefined,
      sortOrder: prev.length,
      prices: data.prices,
      cellValues: data.cellValues,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _key: nextKey(),
    }]);
  };

  const handleEditProduct = (index: number, data: { optionName: string; popupContent: string; apartmentTypeId: string; price: number; prices: Record<string, number>; cellValues: Record<string, string> }) => {
    setRows((prev) => prev.map((r, i) => i === index ? {
      ...r,
      apartmentTypeId: data.apartmentTypeId || undefined,
      optionName: data.optionName,
      price: data.price,
      popupContent: data.popupContent || undefined,
      prices: data.prices,
      cellValues: data.cellValues,
      updatedAt: new Date().toISOString(),
    } : r));
  };

  const handleDeleteProduct = () => {
    if (deleteTarget === null) return;
    setRows((prev) => prev.filter((_, i) => i !== deleteTarget));
    setDeleteTarget(null);
  };

  const handleUpdateSheetStatus = async (status: string) => {
    if (!sheet) return;
    try {
      await api.patch(`/ic/sheets/${sheet.id}`, { status });
      toast(status === 'active' ? '시트가 활성화되었습니다.' : '시트 상태가 변경되었습니다.', 'success');
      await loadData();
    } catch {
      toast('상태 변경에 실패했습니다.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!config) {
    return (
      <div>
        <PageHeader title="상세 품목 관리" backHref={`/partner/events/${eventId}`} />
        <Card>
          <EmptyState
            title="통합 계약 설정이 없습니다"
            description="주관사가 통합 계약 설정을 먼저 생성해야 합니다."
          />
        </Card>
      </div>
    );
  }

  const configCategories = config.categories || [];
  const editingRow = editingRowIndex !== null ? rows[editingRowIndex] : null;

  return (
    <div>
      {/* Full-screen saving overlay */}
      {saving && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-xl px-8 py-6 shadow-2xl flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-base font-medium text-gray-800">저장 중...</span>
          </div>
        </div>
      )}

      <PageHeader
        title="상세 품목 관리"
        subtitle={sheet ? sheet.categoryName : '품목 시트를 편집하세요'}
        backHref={`/partner/events/${eventId}`}
        actions={
          categoryConfirmed ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/partner/events/${eventId}/sheet/preview`)}
            >
              <Eye className="w-4 h-4 mr-1" />
              미리보기
            </Button>
          ) : undefined
        }
      />

      {sheet ? (
        <div className="space-y-4">
          {!categoryConfirmed ? (
            /* ─── Step 1: 품목 선택 ─── */
            <>
              <Card>
                <h3 className="font-bold text-gray-800 mb-2">품목 선택</h3>
                <p className="text-xs text-gray-500 mb-4">
                  품목당 1개 업체만 선택 가능합니다. 저장하면 해당 품목이 선점됩니다.
                </p>

                {configCategories.length > 0 ? (
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-500 mb-1">품목 카테고리</label>
                    <button
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 transition-colors"
                    >
                      <span className={selectedCategory ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                        {selectedCategory || '품목을 선택하세요'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {configCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat);
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                              selectedCategory === cat ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">설정된 카테고리가 없습니다.</p>
                )}
              </Card>

              <Button fullWidth size="lg" onClick={handleSaveCategory} loading={saving} disabled={!selectedCategory}>
                <Save className="w-5 h-5 mr-2" />
                품목 저장
              </Button>
            </>
          ) : (
            /* ─── Step 2: 상세 품목 편집 ─── */
            <>
              {/* Selected category header */}
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-800">품목</h3>
                    <Badge status={sheet.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    {sheet.status === 'draft' && (
                      <Button variant="secondary" size="sm" onClick={() => handleUpdateSheetStatus('active')}>
                        활성화
                      </Button>
                    )}
                    {sheet.status === 'active' && (
                      <Button variant="secondary" size="sm" onClick={() => handleUpdateSheetStatus('inactive')}>
                        비활성화
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  선택된 품목: <span className="font-semibold text-gray-800">{selectedCategory}</span>
                </div>
              </Card>

              {/* Product list - vertical layout (no horizontal scroll) */}
              {rows.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">상세 품목을 등록해주세요</p>
                  <p className="text-xs text-gray-400">아래 버튼을 눌러 품목을 추가하세요</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rows.map((row, index) => (
                    <PartnerProductCard
                      key={row._key}
                      optionName={row.optionName}
                      popupContent={row.popupContent}
                      apartmentTypeId={row.apartmentTypeId}
                      price={row.price}
                      prices={row.prices || {}}
                      cellValues={row.cellValues}
                      columns={columns.map((c) => ({
                        id: c.id,
                        customName: c.customName,
                        columnType: c.columnType,
                        apartmentTypeId: c.apartmentTypeId,
                      }))}
                      apartmentTypes={config.apartmentTypes || []}
                      onEdit={() => { setEditingRowIndex(index); setFormOpen(true); }}
                      onDelete={() => setDeleteTarget(index)}
                    />
                  ))}
                </div>
              )}

              {/* Add product button */}
              <button
                onClick={() => { setEditingRowIndex(null); setFormOpen(true); }}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">상세 품목 추가</span>
              </button>

              {/* Save button */}
              <Button fullWidth size="lg" onClick={handleSave} loading={saving}>
                <Save className="w-5 h-5 mr-2" />
                저장
              </Button>
            </>
          )}
        </div>
      ) : (
        <Card>
          <EmptyState
            title="시트를 불러오는 중..."
            description="잠시만 기다려 주세요"
            icon={<FileSpreadsheet className="w-12 h-12 text-gray-300" />}
          />
        </Card>
      )}

      {/* Product Form Modal */}
      <PartnerProductForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingRowIndex(null); }}
        onSave={(data) => {
          if (editingRowIndex !== null) {
            handleEditProduct(editingRowIndex, data);
          } else {
            handleAddProduct(data);
          }
        }}
        apartmentTypes={config.apartmentTypes || []}
        columns={columns.map((c) => ({
          id: c.id,
          customName: c.customName,
          columnType: c.columnType,
          apartmentTypeId: c.apartmentTypeId,
        }))}
        initialData={editingRow ? {
          optionName: editingRow.optionName,
          popupContent: editingRow.popupContent,
          apartmentTypeId: editingRow.apartmentTypeId,
          price: editingRow.price,
          prices: editingRow.prices || {},
          cellValues: editingRow.cellValues,
        } : undefined}
        title={editingRowIndex !== null ? '품목 수정' : '품목 추가'}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="품목 삭제"
      >
        <p className="text-sm text-gray-600 mb-4">
          <strong>&ldquo;{deleteTarget !== null ? rows[deleteTarget]?.optionName : ''}&rdquo;</strong> 품목을 삭제하시겠습니까?
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
          <Button variant="danger" onClick={handleDeleteProduct}>
            <Trash2 className="w-4 h-4 mr-1" />
            삭제
          </Button>
        </div>
      </Modal>
    </div>
  );
}
