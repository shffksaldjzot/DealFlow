'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import PaymentStageEditor from '@/components/integrated-contract/PaymentStageEditor';
import CustomerSheetView from '@/components/integrated-contract/CustomerSheetView';
import PartnerProductCard from '@/components/integrated-contract/PartnerProductCard';
import {
  Save, Plus, Trash2, ChevronDown, ChevronUp,
  Copy, Check, Link2, Building2, FileSpreadsheet,
  Eye, EyeOff, Pencil, ExternalLink, Loader2, QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type {
  IcConfig, IcApartmentType, IcPartnerSheet, PaymentStage, IcConfigStatus,
} from '@/types/integrated-contract';

interface IcConfigManagerProps {
  eventId: string;
  backHref: string;
}

export default function IcConfigManager({ eventId, backHref }: IcConfigManagerProps) {
  const { toast } = useToast();

  const [config, setConfig] = useState<IcConfig | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [paymentStages, setPaymentStages] = useState<PaymentStage[]>([]);
  const [legalTerms, setLegalTerms] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Apartment types
  const [apartmentTypes, setApartmentTypes] = useState<IcApartmentType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingType, setEditingType] = useState<{ id: string; name: string } | null>(null);

  // Participants (for missing sheets detection)
  const [participants, setParticipants] = useState<any[]>([]);

  // Partner sheets
  const [sheets, setSheets] = useState<IcPartnerSheet[]>([]);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
  const [deleteSheetTarget, setDeleteSheetTarget] = useState<IcPartnerSheet | null>(null);

  // New sheet form
  const [showNewSheet, setShowNewSheet] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [creatingSheet, setCreatingSheet] = useState(false);

  // Delete config
  const [deleteConfigModal, setDeleteConfigModal] = useState(false);
  const [deletingConfig, setDeletingConfig] = useState(false);

  // Customer preview
  const [previewModal, setPreviewModal] = useState(false);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Row edit/delete state
  const [editingRow, setEditingRow] = useState<{ sheet: any; row: any } | null>(null);
  const [editRowForm, setEditRowForm] = useState<{ optionName: string; prices: Record<string, number>; cellValues: Record<string, string> }>({ optionName: '', prices: {}, cellValues: {} });
  const [savingRow, setSavingRow] = useState(false);

  // Sections collapsed state
  const [sections, setSections] = useState({
    types: true,
    stages: true,
    terms: false,
    sheets: true,
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Load Data ──
  const loadData = useCallback(async () => {
    try {
      const [configRes, eventRes] = await Promise.all([
        api.get(`/ic/configs/event/${eventId}`).catch(() => null),
        api.get(`/events/${eventId}`).catch(() => null),
      ]);

      const eventData = eventRes?.data?.data;
      setEvent(eventData);

      // Fetch participants
      const participantsRes = await api.get(`/events/${eventId}/participants`).catch(() => null);
      setParticipants(participantsRes?.data?.data || []);

      const cfg = configRes?.data?.data;
      if (cfg) {
        setConfig(cfg);
        setPaymentStages(cfg.paymentStages || []);
        setLegalTerms(cfg.legalTerms || '');
        setSpecialNotes(cfg.specialNotes || '');
        setApartmentTypes(cfg.apartmentTypes || []);

        const sheetsRes = await api.get(`/ic/configs/${cfg.id}/sheets`).catch(() => null);
        setSheets(sheetsRes?.data?.data || []);
      }
    } catch {
      toast('데이터를 불러올 수 없습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Create Config ──
  const createConfig = async () => {
    try {
      const defaultPaymentStages = [
        { name: '계약금', ratio: 20 },
        { name: '중도금', ratio: 40 },
        { name: '잔금', ratio: 40 },
      ];
      const defaultLegalTerms = `1. 계약일 기준 14일 이후에는 취소가 불가능합니다.\n2. 본 계약은 해당 옵션 공사에 대한 계약이며, 별도 계약 품목은 보장하지 않습니다.\n3. 공사 일정은 입주 일정에 따라 변경될 수 있습니다.\n4. 계약 후 옵션 변경은 공사 착수 전까지만 가능합니다.`;
      const res = await api.post('/ic/configs', {
        eventId,
        paymentStages: defaultPaymentStages,
        legalTerms: defaultLegalTerms,
      });
      const cfg = res.data.data;
      setConfig(cfg);
      setPaymentStages(cfg.paymentStages || []);
      setLegalTerms(cfg.legalTerms || '');
      setSpecialNotes(cfg.specialNotes || '');
      setApartmentTypes(cfg.apartmentTypes || []);
      toast('통합 계약 설정이 생성되었습니다.', 'success');
    } catch {
      toast('설정 생성에 실패했습니다.', 'error');
    }
  };

  // ── Save Config ──
  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await api.patch(`/ic/configs/${config.id}`, {
        paymentStages,
        legalTerms,
        specialNotes,
      });
      setConfig(res.data.data);
      toast('설정이 저장되었습니다.', 'success');
    } catch {
      toast('저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Status Change ──
  const changeStatus = async (status: IcConfigStatus) => {
    if (!config) return;
    try {
      const res = await api.patch(`/ic/configs/${config.id}`, { status });
      setConfig(res.data.data);
      toast(`상태가 "${status}"로 변경되었습니다.`, 'success');
    } catch {
      toast('상태 변경에 실패했습니다.', 'error');
    }
  };

  // ── Delete Config ──
  const deleteConfig = async () => {
    if (!config) return;
    setDeletingConfig(true);
    try {
      await api.delete(`/ic/configs/${config.id}`);
      setConfig(null);
      setDeleteConfigModal(false);
      toast('통합 계약 설정이 삭제되었습니다.', 'success');
    } catch {
      toast('설정 삭제에 실패했습니다.', 'error');
    } finally {
      setDeletingConfig(false);
    }
  };

  // ── Apartment Type CRUD ──
  const addApartmentType = async () => {
    if (!config || !newTypeName.trim()) return;
    try {
      const res = await api.post(`/ic/configs/${config.id}/apartment-types`, {
        name: newTypeName.trim(),
        sortOrder: apartmentTypes.length,
      });
      setApartmentTypes(prev => [...prev, res.data.data]);
      setNewTypeName('');
      toast('타입이 추가되었습니다.', 'success');
    } catch {
      toast('타입 추가에 실패했습니다.', 'error');
    }
  };

  const updateApartmentType = async () => {
    if (!config || !editingType) return;
    try {
      await api.patch(`/ic/configs/${config.id}/apartment-types/${editingType.id}`, {
        name: editingType.name,
      });
      setApartmentTypes(prev =>
        prev.map(t => t.id === editingType.id ? { ...t, name: editingType.name } : t),
      );
      setEditingType(null);
      toast('타입이 수정되었습니다.', 'success');
    } catch {
      toast('타입 수정에 실패했습니다.', 'error');
    }
  };

  const deleteApartmentType = async (typeId: string) => {
    if (!config) return;
    try {
      await api.delete(`/ic/configs/${config.id}/apartment-types/${typeId}`);
      setApartmentTypes(prev => prev.filter(t => t.id !== typeId));
      toast('타입이 삭제되었습니다.', 'success');
    } catch {
      toast('타입 삭제에 실패했습니다.', 'error');
    }
  };

  // ── Sheet CRUD ──
  const createSheet = async () => {
    if (!config || !newSheetName.trim()) return;
    setCreatingSheet(true);
    try {
      const res = await api.post('/ic/sheets', {
        configId: config.id,
        categoryName: newSheetName.trim(),
      });
      setSheets(prev => [...prev, res.data.data]);
      setNewSheetName('');
      setShowNewSheet(false);
      toast('시트가 생성되었습니다.', 'success');
    } catch {
      toast('시트 생성에 실패했습니다.', 'error');
    } finally {
      setCreatingSheet(false);
    }
  };

  const updateSheetStatus = async (sheetId: string, status: string) => {
    if (!config) return;
    try {
      await api.patch(`/ic/configs/${config.id}/sheets/${sheetId}`, { status });
      setSheets(prev =>
        prev.map(s => s.id === sheetId ? { ...s, status: status as any } : s),
      );
      toast('시트 상태가 변경되었습니다.', 'success');
    } catch {
      toast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const deleteSheet = async () => {
    if (!deleteSheetTarget || !config) return;
    try {
      await api.patch(`/ic/configs/${config.id}/sheets/${deleteSheetTarget.id}`, { status: 'inactive' });
      setSheets(prev => prev.filter(s => s.id !== deleteSheetTarget.id));
      setDeleteSheetTarget(null);
      if (expandedSheet === deleteSheetTarget.id) setExpandedSheet(null);
      toast('시트가 삭제되었습니다.', 'success');
    } catch {
      toast('시트 삭제에 실패했습니다.', 'error');
    }
  };

  const [savingCommissions, setSavingCommissions] = useState(false);

  const saveAllCommissions = async () => {
    if (!config || sheets.length === 0) return;
    setSavingCommissions(true);
    try {
      await Promise.all(
        sheets.map(sheet =>
          api.patch(`/ic/configs/${config.id}/sheets/${sheet.id}/commission`, {
            commissionRate: sheet.commissionRate || 0,
          })
        )
      );
      toast('모든 수수료율이 저장되었습니다.', 'success');
    } catch {
      toast('수수료율 저장에 실패했습니다.', 'error');
    } finally {
      setSavingCommissions(false);
    }
  };

  // ── Row Edit/Delete ──
  const handleEditRow = (sheet: any, row: any) => {
    setEditingRow({ sheet, row });
    setEditRowForm({
      optionName: row.optionName || '',
      prices: { ...(row.prices || {}) },
      cellValues: { ...(row.cellValues || {}) },
    });
  };

  const handleSaveEditedRow = async () => {
    if (!editingRow || !config) return;
    setSavingRow(true);
    try {
      const { sheet, row } = editingRow;
      const updatedRows = (sheet.rows || []).map((r: any) =>
        r.id === row.id
          ? { ...r, optionName: editRowForm.optionName, prices: editRowForm.prices, cellValues: editRowForm.cellValues }
          : r
      );
      const res = await api.put(`/ic/configs/${config.id}/sheets/${sheet.id}/rows`, {
        rows: updatedRows.map((r: any, idx: number) => ({
          optionName: r.optionName,
          prices: r.prices || {},
          cellValues: r.cellValues || {},
          sortOrder: r.sortOrder ?? idx,
          popupContent: r.popupContent || undefined,
        })),
      });
      const savedRows = res.data?.data || updatedRows;
      setSheets(prev => prev.map(s =>
        s.id === sheet.id ? { ...s, rows: savedRows } : s
      ));
      setEditingRow(null);
      toast('품목이 수정되었습니다.', 'success');
    } catch {
      toast('수정에 실패했습니다.', 'error');
    } finally {
      setSavingRow(false);
    }
  };

  const handleDeleteRow = async (sheet: any, row: any) => {
    if (!config) return;
    if (!window.confirm(`"${row.optionName}" 품목을 삭제하시겠습니까?`)) return;
    const remainingRows = (sheet.rows || []).filter((r: any) => r.id !== row.id);
    try {
      const res = await api.put(`/ic/configs/${config.id}/sheets/${sheet.id}/rows`, {
        rows: remainingRows.map((r: any, idx: number) => ({
          optionName: r.optionName,
          prices: r.prices || {},
          cellValues: r.cellValues || {},
          sortOrder: r.sortOrder ?? idx,
          popupContent: r.popupContent || undefined,
        })),
      });
      const savedRows = res.data?.data || remainingRows;
      setSheets(prev => prev.map(s =>
        s.id === sheet.id ? { ...s, rows: savedRows } : s
      ));
      toast('품목이 삭제되었습니다.', 'success');
    } catch {
      toast('삭제에 실패했습니다.', 'error');
    }
  };

  // ── Copy public URL ──
  const publicUrl = event?.inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.inviteCode}/options`
    : '';

  const copyPublicUrl = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast('링크가 복사되었습니다.', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading / No Config ──
  if (loading) {
    return (
      <div>
        <PageHeader title="통합 계약 설정" backHref={backHref} />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-24 bg-white rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div>
        <PageHeader title="통합 계약 설정" backHref={backHref} />
        <Card className="text-center py-12">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">이 행사에 통합 계약 설정이 없습니다.</p>
          <Button onClick={createConfig}>
            <Plus className="w-4 h-4 mr-2" />
            통합 계약 설정 생성
          </Button>
        </Card>
      </div>
    );
  }

  const statusActions: Record<IcConfigStatus, { label: string; next: IcConfigStatus; variant: 'primary' | 'outline' | 'danger' }[]> = {
    draft: [{ label: '활성화', next: 'active', variant: 'primary' }],
    active: [{ label: '마감', next: 'closed', variant: 'danger' }],
    closed: [{ label: '다시 활성화', next: 'active', variant: 'outline' }],
  };

  return (
    <div className="overflow-x-hidden">
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
        title="통합 계약 설정"
        backHref={backHref}
        actions={
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge status={config.status} />
            {statusActions[config.status]?.map((action) => (
              <Button
                key={action.next}
                size="sm"
                variant={action.variant as any}
                onClick={() => changeStatus(action.next)}
              >
                {action.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="danger"
              onClick={() => setDeleteConfigModal(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        }
      />

      {/* Public URL & QR */}
      {event?.inviteCode && (
        <Card className="mb-4">
          {/* 방문 QR코드 */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5" /> 고객 방문 QR코드
            </p>
            <p className="text-[11px] text-gray-400 mb-2">
              고객이 스캔하면 방문 등록 → 홈 화면에서 옵션 선택으로 이어집니다
            </p>
            <div className="flex justify-center bg-gray-50 rounded-lg p-3">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.inviteCode}/visit`}
                size={160}
                level="H"
                includeMargin
                fgColor="#1B3460"
              />
            </div>
          </div>

          {/* 옵션 직접 링크 */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <p className="text-xs text-gray-500">고객 옵션 선택 링크</p>
            </div>
            <p className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1.5 rounded-lg truncate mb-2 break-all">
              {publicUrl}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={copyPublicUrl}>
                {copied
                  ? <><Check className="w-3.5 h-3.5 mr-1" /> 복사됨</>
                  : <><Copy className="w-3.5 h-3.5 mr-1" /> 복사</>
                }
              </Button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> 열기
                </Button>
              </a>
              <Button size="sm" variant="outline" onClick={() => setPreviewModal(true)}>
                <Eye className="w-3.5 h-3.5 mr-1" />
                미리보기
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Section: 아파트 타입 ── */}
      <Card className="mb-4">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => toggleSection('types')}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-800">타입</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {apartmentTypes.length}개
            </span>
          </div>
          {sections.types ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {sections.types && (
          <div className="mt-4 space-y-3">
            {apartmentTypes.length === 0 ? (
              <p className="text-sm text-gray-400">등록된 타입이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {apartmentTypes.map((type, idx) => (
                  <div
                    key={type.id}
                    className="border border-gray-200 rounded-lg p-3 flex items-center justify-between"
                  >
                    {editingType?.id === type.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingType.name}
                          onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                          className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyDown={(e) => e.key === 'Enter' && updateApartmentType()}
                        />
                        <Button size="sm" onClick={updateApartmentType}>저장</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingType(null)}>취소</Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-800">{type.name}</span>
                          {type.floorPlanFileId && (
                            <span className="text-[10px] bg-success-light text-success px-1.5 py-0.5 rounded-full">평면도</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingType({ id: type.id, name: type.name })}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteApartmentType(type.id)}
                            className="p-1.5 rounded-lg hover:bg-error-light text-gray-400 hover:text-error"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="예: 59A, 84B, 펜트하우스"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && addApartmentType()}
              />
              <Button size="sm" onClick={addApartmentType} disabled={!newTypeName.trim()}>
                <Plus className="w-4 h-4 mr-1" />
                추가
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Section: 결제 단계 ── */}
      <Card className="mb-4">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => toggleSection('stages')}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-gray-800">결제 단계</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {paymentStages.length === 0 ? '일시불' : `${paymentStages.length}단계`}
            </span>
          </div>
          {sections.stages ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {sections.stages && (
          <div className="mt-4">
            <PaymentStageEditor
              stages={paymentStages}
              onChange={setPaymentStages}
            />
          </div>
        )}
      </Card>

      {/* ── Section: 약관 / 특약 ── */}
      <Card className="mb-4">
        <button
          className="w-full flex items-center justify-between"
          onClick={() => toggleSection('terms')}
        >
          <h3 className="font-semibold text-gray-800">약관 · 특약사항</h3>
          {sections.terms ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {sections.terms && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">약관</label>
              <textarea
                value={legalTerms}
                onChange={(e) => setLegalTerms(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="고객이 계약 시 동의할 약관 내용을 입력하세요."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">특약사항</label>
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="추가 특약사항이 있으면 입력하세요."
              />
            </div>
          </div>
        )}
      </Card>

      {/* Save Button */}
      <Button fullWidth size="lg" onClick={saveConfig} loading={saving} className="mb-6">
        <Save className="w-5 h-5 mr-2" />
        설정 저장
      </Button>

      {/* ── Section: 품목 테이블 (업체별 그룹) ── */}
      {sheets.length > 0 && (
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-800">품목 설정하기</h3>
          </div>
          {sheets.flatMap(s => s.rows || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">등록된 품목이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {sheets.filter(s => (s.rows || []).length > 0).map((sheet) => (
                <div key={sheet.id}>
                  {/* Partner group header */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-bold text-gray-800">{sheet.partner?.name || '업체'}</span>
                      <span className="text-xs text-gray-400">({sheet.categoryName})</span>
                    </div>
                    <button
                      onClick={() => setExpandedSheet(expandedSheet === sheet.id ? null : sheet.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      상세보기
                    </button>
                  </div>
                  {/* Table header */}
                  <div className="border-b border-gray-200 pb-1.5 mb-1 px-1">
                    <div className="grid grid-cols-[1fr_60px_90px] gap-2 text-[11px] font-semibold text-gray-500">
                      <span>품목</span>
                      <span className="text-center">계약건</span>
                      <span className="text-right">계약금액</span>
                    </div>
                  </div>
                  {/* Rows */}
                  {(sheet.rows || []).map((row: any) => (
                    <div
                      key={`${sheet.id}-${row.id}`}
                      className="grid grid-cols-[1fr_60px_90px] gap-2 items-center py-2 border-b border-gray-50 px-1 text-sm"
                    >
                      <span className="text-gray-800 truncate">{row.optionName}</span>
                      <span className="text-gray-500 text-xs text-center">0건</span>
                      <span className="text-gray-700 text-xs text-right font-medium">
                        {(() => {
                          const priceVals = Object.values(row.prices || {}).filter((v: any) => Number(v) > 0).map(Number);
                          if (priceVals.length > 0) {
                            const min = Math.min(...priceVals);
                            const max = Math.max(...priceVals);
                            return min === max
                              ? `${min.toLocaleString('ko-KR')}원`
                              : `${min.toLocaleString('ko-KR')}~${max.toLocaleString('ko-KR')}원`;
                          }
                          return row.price ? `${Number(row.price).toLocaleString('ko-KR')}원` : '—';
                        })()}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Section: 협력업체 시트 관리 ── */}
      <Card>
        <button
          className="w-full flex items-center justify-between"
          onClick={() => toggleSection('sheets')}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-800">협력업체 시트</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {sheets.length}개
            </span>
          </div>
          {sections.sheets ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {sections.sheets && (
          <div className="mt-4 space-y-3">
            {/* Missing sheet partners */}
            {(() => {
              const sheetPartnerIds = new Set(sheets.map(s => s.partner?.id).filter(Boolean));
              const approvedPartners = participants.filter(
                (p: any) => p.status === 'approved' && p.organization?.type === 'partner'
              );
              const missingPartners = approvedPartners.filter(
                (p: any) => !sheetPartnerIds.has(p.organizationId)
              );
              if (missingPartners.length === 0) return null;
              return (
                <div className="bg-warning-light border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-warning mb-1">시트 미제출 업체 ({missingPartners.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingPartners.map((p: any) => (
                      <span key={p.id} className="text-xs bg-yellow-100 text-warning px-2 py-0.5 rounded-full">
                        {p.organization?.name || '업체'}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* New Sheet Form */}
            {showNewSheet ? (
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-4 bg-blue-50/30">
                <p className="text-sm font-medium text-gray-700 mb-3">새 시트 만들기</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSheetName}
                    onChange={(e) => setNewSheetName(e.target.value)}
                    placeholder="카테고리명 (예: 마감재, 가전, 가구)"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && createSheet()}
                    autoFocus
                  />
                  <Button size="sm" onClick={createSheet} disabled={!newSheetName.trim()} loading={creatingSheet}>
                    <Check className="w-4 h-4 mr-1" />
                    생성
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowNewSheet(false); setNewSheetName(''); }}>
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewSheet(true)}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                새 시트 추가
              </button>
            )}

            {sheets.length === 0 && !showNewSheet ? (
              <p className="text-sm text-gray-400 text-center py-4">
                등록된 시트가 없습니다.
              </p>
            ) : (
              sheets.map((sheet) => (
                <div key={sheet.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Sheet Header */}
                  <div className="px-4 py-3 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{sheet.categoryName}</span>
                          <Badge status={sheet.status} />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {sheet.partner?.name || '업체'} · 열 {sheet.columns?.length || 0}개 · 행 {sheet.rows?.length || 0}개
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {sheet.status === 'draft' && (
                        <Button size="sm" variant="outline" onClick={() => updateSheetStatus(sheet.id, 'active')}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> 활성화
                        </Button>
                      )}
                      {sheet.status === 'active' && (
                        <Button size="sm" variant="outline" onClick={() => updateSheetStatus(sheet.id, 'inactive')}>
                          <EyeOff className="w-3.5 h-3.5 mr-1" /> 비활성
                        </Button>
                      )}
                      {sheet.status === 'inactive' && (
                        <Button size="sm" variant="outline" onClick={() => updateSheetStatus(sheet.id, 'active')}>
                          <Eye className="w-3.5 h-3.5 mr-1" /> 재활성
                        </Button>
                      )}
                      <button
                        onClick={() => setDeleteSheetTarget(sheet)}
                        className="p-2 rounded-lg hover:bg-error-light text-gray-400 hover:text-error"
                        title="시트 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedSheet(expandedSheet === sheet.id ? null : sheet.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                      >
                        {expandedSheet === sheet.id
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Commission Rate */}
                  <div className="px-4 py-2 border-t border-gray-200 bg-white flex items-center gap-3">
                    <span className="text-xs text-gray-500 whitespace-nowrap">수수료율</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={sheet.commissionRate ? String(sheet.commissionRate) : ''}
                      onChange={(e) => {
                        let raw = e.target.value.replace(/[^0-9.]/g, '');
                        // Remove leading zeros (but keep "0." for decimals)
                        raw = raw.replace(/^0+(\d)/, '$1');
                        const val = parseFloat(raw);
                        setSheets(prev => prev.map(s => s.id === sheet.id ? { ...s, commissionRate: isNaN(val) ? 0 : Math.min(val, 100) } : s));
                      }}
                      placeholder="0"
                      className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>

                  {/* Sheet Products (expanded) */}
                  {expandedSheet === sheet.id && (
                    <div className="p-4 border-t border-gray-200 space-y-2">
                      {(sheet.rows || []).length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">등록된 품목이 없습니다.</p>
                      ) : (
                        (sheet.rows || []).map((row: any) => (
                          <PartnerProductCard
                            key={row.id}
                            optionName={row.optionName}
                            popupContent={row.popupContent}
                            prices={row.prices || {}}
                            cellValues={row.cellValues}
                            columns={(sheet.columns || []).map((c: any) => ({
                              id: c.id,
                              customName: c.customName || c.apartmentType?.name,
                              columnType: c.columnType || 'amount',
                              apartmentTypeId: c.apartmentTypeId,
                            }))}
                            apartmentTypes={apartmentTypes}
                            onEdit={() => handleEditRow(sheet, row)}
                            onDelete={() => handleDeleteRow(sheet, row)}
                          />
                        ))
                      )}
                      <p className="text-xs text-gray-400 text-center pt-2">
                        {(sheet.columns || []).length}열 · {(sheet.rows || []).length}행
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
            {/* Batch commission save button */}
            {sheets.length > 0 && (
              <Button
                fullWidth
                size="lg"
                variant="outline"
                onClick={saveAllCommissions}
                loading={savingCommissions}
                className="mt-2"
              >
                <Save className="w-4 h-4 mr-2" />
                수수료율 일괄 저장
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Delete Sheet Confirmation Modal */}
      <Modal
        isOpen={!!deleteSheetTarget}
        onClose={() => setDeleteSheetTarget(null)}
        title="시트 삭제 확인"
      >
        <p className="text-sm text-gray-600 mb-4">
          <strong>&ldquo;{deleteSheetTarget?.categoryName}&rdquo;</strong> 시트를 삭제하시겠습니까?
          시트의 모든 데이터가 비활성화됩니다.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setDeleteSheetTarget(null)}>취소</Button>
          <Button variant="danger" onClick={deleteSheet}>
            <Trash2 className="w-4 h-4 mr-1" />
            삭제
          </Button>
        </div>
      </Modal>

      {/* Customer Preview Modal */}
      <Modal
        isOpen={previewModal}
        onClose={() => setPreviewModal(false)}
        title="고객 미리보기"
        size="lg"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {sheets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">등록된 시트가 없습니다.</p>
          ) : (
            <CustomerSheetView
              partners={sheets
                .filter(s => s.status !== 'inactive')
                .reduce<any[]>((acc, sheet) => {
                  const partnerId = sheet.partner?.id || 'unknown';
                  let partner = acc.find((p: any) => p.partnerId === partnerId);
                  if (!partner) {
                    partner = {
                      partnerId,
                      partnerName: sheet.partner?.name || '업체',
                      categories: [],
                    };
                    acc.push(partner);
                  }
                  partner.categories.push({
                    sheetId: sheet.id,
                    categoryName: sheet.categoryName,
                    columns: (sheet.columns || []).map((col: any) => ({
                      id: col.id,
                      customName: col.customName || col.apartmentType?.name || '열',
                      columnType: col.columnType || 'amount',
                      apartmentTypeId: col.apartmentTypeId,
                    })),
                    options: (sheet.rows || []).map((row: any) => ({
                      rowId: row.id,
                      optionName: row.optionName,
                      popupContent: row.popupContent,
                      cellValues: row.cellValues || {},
                      prices: row.prices || {},
                    })),
                  });
                  return acc;
                }, [])}
              selectedRows={[]}
              onToggleRow={() => {}}
            />
          )}
        </div>
      </Modal>

      {/* Row Edit Modal */}
      <Modal
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        title="품목 수정"
      >
        {editingRow && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">품목명</label>
              <input
                type="text"
                value={editRowForm.optionName}
                onChange={(e) => setEditRowForm(prev => ({ ...prev, optionName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {(() => {
              const cols = editingRow.sheet.columns || [];
              const hasColumns = cols.length > 0;
              const items = hasColumns
                ? cols.map((col: any) => ({
                    key: (col.columnType || 'amount') === 'amount' ? (col.apartmentTypeId || col.id) : col.id,
                    name: col.customName || col.apartmentType?.name || '열',
                    isAmount: (col.columnType || 'amount') === 'amount',
                    colId: col.id,
                  }))
                : apartmentTypes.map((t) => ({
                    key: t.id,
                    name: t.name,
                    isAmount: true,
                    colId: t.id,
                  }));
              if (items.length === 0) return null;
              return (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">타입별 금액</label>
                  <div className="space-y-2">
                    {items.map((item: any) => {
                      const value = item.isAmount
                        ? (editRowForm.prices[item.key] ?? '')
                        : (editRowForm.cellValues[item.key] ?? '');
                      return (
                        <div key={item.colId} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-24 shrink-0 truncate">{item.name}</span>
                          {item.isAmount ? (
                            <input
                              type="text"
                              inputMode="numeric"
                              value={value ? Number(value).toLocaleString('ko-KR') : ''}
                              onChange={(e) => {
                                const num = Number(e.target.value.replace(/[^0-9]/g, ''));
                                setEditRowForm(prev => ({
                                  ...prev,
                                  prices: { ...prev.prices, [item.key]: num || 0 },
                                }));
                              }}
                              placeholder="0"
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => setEditRowForm(prev => ({
                                ...prev,
                                cellValues: { ...prev.cellValues, [item.key]: e.target.value },
                              }))}
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                          {item.isAmount && <span className="text-xs text-gray-400">원</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setEditingRow(null)}>취소</Button>
              <Button onClick={handleSaveEditedRow} loading={savingRow} disabled={!editRowForm.optionName.trim()}>
                <Save className="w-4 h-4 mr-1" />
                저장
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Config Confirmation Modal */}
      <Modal
        isOpen={deleteConfigModal}
        onClose={() => setDeleteConfigModal(false)}
        title="통합 계약 설정 삭제"
      >
        <p className="text-sm text-gray-600 mb-4">
          통합 계약 설정을 삭제하시겠습니까? 모든 아파트 타입, 결제단계, 시트 데이터가 함께 삭제됩니다.
          이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setDeleteConfigModal(false)}>취소</Button>
          <Button variant="danger" onClick={deleteConfig} loading={deletingConfig}>
            <Trash2 className="w-4 h-4 mr-1" />
            삭제
          </Button>
        </div>
      </Modal>
    </div>
  );
}
