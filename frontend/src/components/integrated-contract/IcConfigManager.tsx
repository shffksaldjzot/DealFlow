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
import SheetEditor from '@/components/integrated-contract/SheetEditor';
import CustomerSheetView from '@/components/integrated-contract/CustomerSheetView';
import {
  Save, Plus, Trash2, ChevronDown, ChevronUp,
  Copy, Check, Link2, Building2, FileSpreadsheet,
  Eye, EyeOff, Pencil, ExternalLink, Loader2,
} from 'lucide-react';
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
      toast('행사제목이 추가되었습니다.', 'success');
    } catch {
      toast('행사제목 추가에 실패했습니다.', 'error');
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
      toast('행사제목이 수정되었습니다.', 'success');
    } catch {
      toast('행사제목 수정에 실패했습니다.', 'error');
    }
  };

  const deleteApartmentType = async (typeId: string) => {
    if (!config) return;
    try {
      await api.delete(`/ic/configs/${config.id}/apartment-types/${typeId}`);
      setApartmentTypes(prev => prev.filter(t => t.id !== typeId));
      toast('행사제목이 삭제되었습니다.', 'success');
    } catch {
      toast('행사제목 삭제에 실패했습니다.', 'error');
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

  const saveSheetColumns = async (sheetId: string, columns: any[]): Promise<any[]> => {
    if (!config) return [];
    const res = await api.put(`/ic/configs/${config.id}/sheets/${sheetId}/columns`, { columns });
    return res.data?.data || [];
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

  const saveSheetRows = async (sheetId: string, rows: any[]): Promise<any[]> => {
    if (!config) return [];
    const res = await api.put(`/ic/configs/${config.id}/sheets/${sheetId}/rows`, { rows });
    toast('시트가 저장되었습니다.', 'success');
    return res.data?.data || [];
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
        title="통합 계약 설정"
        backHref={backHref}
        actions={
          <div className="flex items-center gap-2">
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
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              삭제
            </Button>
          </div>
        }
      />

      {/* Public URL */}
      {publicUrl && (
        <Card className="mb-4">
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">고객 옵션 선택 링크</p>
              <p className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1.5 rounded-lg truncate">
                {publicUrl}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={copyPublicUrl}>
              {copied
                ? <><Check className="w-3.5 h-3.5 mr-1" /> 복사됨</>
                : <><Copy className="w-3.5 h-3.5 mr-1" /> 복사</>
              }
            </Button>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
            <Button size="sm" variant="outline" onClick={() => setPreviewModal(true)}>
              <Eye className="w-3.5 h-3.5 mr-1" />
              미리보기
            </Button>
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
            <h3 className="font-semibold text-gray-800">행사제목</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {apartmentTypes.length}개
            </span>
          </div>
          {sections.types ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {sections.types && (
          <div className="mt-4 space-y-3">
            {apartmentTypes.length === 0 ? (
              <p className="text-sm text-gray-400">등록된 행사제목이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {apartmentTypes.map((type) => (
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
                            {type.sortOrder + 1}
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
                placeholder="예: 래미안 옵션계약, 힐스테이트 인테리어"
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
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={sheet.commissionRate || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setSheets(prev => prev.map(s => s.id === sheet.id ? { ...s, commissionRate: val } : s));
                      }}
                      className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>

                  {/* Sheet Editor (expanded) */}
                  {expandedSheet === sheet.id && (
                    <div className="p-4 border-t border-gray-200">
                      <SheetEditor
                        apartmentTypes={apartmentTypes}
                        initialColumns={sheet.columns || []}
                        initialRows={sheet.rows || []}
                        onSaveColumns={(cols) => saveSheetColumns(sheet.id, cols)}
                        onSaveRows={(rows) => saveSheetRows(sheet.id, rows)}
                        onError={(msg) => toast(msg, 'error')}
                      />
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
