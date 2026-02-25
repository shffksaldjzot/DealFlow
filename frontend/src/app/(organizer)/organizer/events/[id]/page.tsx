'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types/event';
import type { IcConfig, IcApartmentType } from '@/types/integrated-contract';
import {
  Calendar, MapPin, Copy, Check, Users, FileText, Link2,
  Trash2, Settings, ClipboardList, Plus, X, Pencil,
  ChevronRight, BarChart3,
} from 'lucide-react';

const THEME_COLORS = [
  { name: 'blue', class: 'bg-blue-400' },
  { name: 'purple', class: 'bg-purple-400' },
  { name: 'green', class: 'bg-green-400' },
  { name: 'orange', class: 'bg-orange-400' },
  { name: 'red', class: 'bg-red-400' },
  { name: 'pink', class: 'bg-pink-400' },
  { name: 'teal', class: 'bg-teal-400' },
  { name: 'indigo', class: 'bg-indigo-400' },
];

const CARD_COLORS: Record<string, { bg: string; title: string; sub: string; border: string }> = {
  blue: { bg: 'bg-blue-100', title: 'text-blue-900', sub: 'text-blue-600', border: 'border-blue-200' },
  purple: { bg: 'bg-purple-100', title: 'text-purple-900', sub: 'text-purple-600', border: 'border-purple-200' },
  green: { bg: 'bg-green-100', title: 'text-green-900', sub: 'text-green-600', border: 'border-green-200' },
  orange: { bg: 'bg-orange-100', title: 'text-orange-900', sub: 'text-orange-600', border: 'border-orange-200' },
  red: { bg: 'bg-red-100', title: 'text-red-900', sub: 'text-red-600', border: 'border-red-200' },
  pink: { bg: 'bg-pink-100', title: 'text-pink-900', sub: 'text-pink-600', border: 'border-pink-200' },
  teal: { bg: 'bg-teal-100', title: 'text-teal-900', sub: 'text-teal-600', border: 'border-teal-200' },
  indigo: { bg: 'bg-indigo-100', title: 'text-indigo-900', sub: 'text-indigo-600', border: 'border-indigo-200' },
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showQr, setShowQr] = useState<'partner' | 'visit' | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [pendingPartnerCount, setPendingPartnerCount] = useState(0);

  // IC Config inline management
  const [config, setConfig] = useState<IcConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // Type management
  const [apartmentTypes, setApartmentTypes] = useState<IcApartmentType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingType, setEditingType] = useState<{ id: string; name: string } | null>(null);

  // Category management
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((res) => {
        const data = extractData<Event>(res);
        setEvent(data);
        const pending = (data as any).partners?.filter((p: any) => p.status === 'pending')?.length || 0;
        setPendingPartnerCount(pending);
      })
      .catch(() => toast('행사를 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  // Load IC Config
  const loadConfig = useCallback(async () => {
    try {
      const res = await api.get(`/ic/configs/event/${id}`);
      const cfg = extractData<IcConfig>(res);
      setConfig(cfg);
      setApartmentTypes(cfg.apartmentTypes || []);
      setCategories(cfg.categories || []);
    } catch {
      setConfig(null);
    } finally {
      setConfigLoading(false);
    }
  }, [id]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const createConfig = async () => {
    try {
      const res = await api.post('/ic/configs', {
        eventId: id,
        paymentStages: [
          { name: '계약금', ratio: 20 },
          { name: '중도금', ratio: 40 },
          { name: '잔금', ratio: 40 },
        ],
        legalTerms: '1. 계약일 기준 14일 이후에는 취소가 불가능합니다.\n2. 본 계약은 해당 옵션 공사에 대한 계약이며, 별도 계약 품목은 보장하지 않습니다.',
      });
      const cfg = res.data.data;
      setConfig(cfg);
      setApartmentTypes(cfg.apartmentTypes || []);
      setCategories(cfg.categories || []);
      toast('통합 계약 설정이 생성되었습니다.', 'success');
    } catch {
      toast('설정 생성에 실패했습니다.', 'error');
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const copyLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(label);
    toast('링크가 복사되었습니다.', 'success');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const activateEvent = async () => {
    try {
      await api.patch(`/events/${id}/status`, { status: 'active' });
      setEvent((prev) => prev ? { ...prev, status: 'active' } : null);
      toast('행사가 활성화되었습니다.', 'success');
    } catch {
      toast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await api.delete(`/events/${id}`);
      toast('행사가 삭제되었습니다.', 'success');
      router.push('/organizer/events');
    } catch {
      toast('행사 삭제에 실패했습니다.', 'error');
    }
  };

  // ── Type CRUD ──
  const addType = async () => {
    if (!config || !newTypeName.trim()) return;
    try {
      const res = await api.post(`/ic/configs/${config.id}/apartment-types`, {
        name: newTypeName.trim(),
        sortOrder: apartmentTypes.length,
      });
      setApartmentTypes((prev) => [...prev, res.data.data]);
      setNewTypeName('');
    } catch {
      toast('타입 추가에 실패했습니다.', 'error');
    }
  };

  const updateType = async () => {
    if (!config || !editingType) return;
    try {
      await api.patch(`/ic/configs/${config.id}/apartment-types/${editingType.id}`, {
        name: editingType.name,
      });
      setApartmentTypes((prev) => prev.map((t) => t.id === editingType.id ? { ...t, name: editingType.name } : t));
      setEditingType(null);
    } catch {
      toast('타입 수정에 실패했습니다.', 'error');
    }
  };

  const deleteType = async (typeId: string) => {
    if (!config) return;
    try {
      await api.delete(`/ic/configs/${config.id}/apartment-types/${typeId}`);
      setApartmentTypes((prev) => prev.filter((t) => t.id !== typeId));
    } catch {
      toast('타입 삭제에 실패했습니다.', 'error');
    }
  };

  // ── Category CRUD (JSON field on config) ──
  const addCategory = async () => {
    if (!config || !newCategory.trim()) return;
    const updated = [...categories, newCategory.trim()];
    try {
      await api.patch(`/ic/configs/${config.id}`, { categories: updated });
      setCategories(updated);
      setNewCategory('');
    } catch {
      toast('품목 추가에 실패했습니다.', 'error');
    }
  };

  const removeCategory = async (index: number) => {
    if (!config) return;
    const updated = categories.filter((_, i) => i !== index);
    try {
      await api.patch(`/ic/configs/${config.id}`, { categories: updated });
      setCategories(updated);
    } catch {
      toast('품목 삭제에 실패했습니다.', 'error');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-white rounded-xl" />;
  if (!event) return null;

  const partnerLink = `${origin}/events/${event.inviteCode}/join`;
  const visitLink = `${origin}/events/${event.inviteCode}/visit`;

  return (
    <div>
      <PageHeader
        title={event.name}
        backHref="/organizer/events"
        actions={
          <div className="flex gap-2">
            {event.status === 'draft' && (
              <Button onClick={activateEvent}>행사 시작</Button>
            )}
          </div>
        }
      />

      {/* 행사 개요 (동적 카드 색상) */}
      {(() => {
        const c = CARD_COLORS[event.themeColor || 'blue'] || CARD_COLORS.blue;
        return (
      <div className={`${c.bg} rounded-xl p-5 mb-6`}>
        <h2 className={`text-lg font-bold ${c.title} mb-3`}>행사 개요</h2>
        <div className="space-y-2">
          <div className={`flex items-center gap-2 text-sm ${c.title}`}>
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.startDate)} ~ {formatDate(event.endDate)}</span>
          </div>
          {event.venue && (
            <div className={`flex items-center gap-2 text-sm ${c.title}`}>
              <MapPin className="w-4 h-4" />
              <span>{event.venue}</span>
            </div>
          )}
          <div className={`flex items-center gap-2 text-sm ${c.title}`}>
            <Copy className="w-4 h-4" />
            <span className="font-mono font-bold tracking-wider">{event.inviteCode}</span>
          </div>
        </div>
        <div className={`mt-3 pt-3 border-t ${c.border} flex items-center gap-2`}>
          <Badge status={event.status} />
          <span className={`text-xs ${c.sub}`}>수수료율: {event.commissionRate}%</span>
        </div>

        {/* Theme Color Picker */}
        <div className={`mt-3 pt-3 border-t ${c.border}`}>
          <p className={`text-xs ${c.sub} mb-2`}>카드 색상</p>
          <div className="flex gap-1.5">
            {THEME_COLORS.map((color) => (
              <button
                key={color.name}
                onClick={async () => {
                  try {
                    await api.patch(`/events/${id}`, { themeColor: color.name });
                    setEvent((prev) => prev ? { ...prev, themeColor: color.name } : null);
                    toast('카드 색상이 변경되었습니다.', 'success');
                  } catch {
                    toast('색상 변경에 실패했습니다.', 'error');
                  }
                }}
                className={`w-7 h-7 rounded-lg ${color.class} transition-all ${
                  (event.themeColor || 'blue') === color.name
                    ? 'ring-2 ring-offset-1 ring-gray-800 scale-110'
                    : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
        );
      })()}

      {/* 초대코드 확인 버튼 */}
      <div className="mb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowQr('partner')}
          className="w-full"
        >
          <Link2 className="w-4 h-4 mr-1.5" />
          초대코드 확인
        </Button>
      </div>

      {/* 초대코드 팝업 */}
      {showQr && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">초대코드 · 공유 링크</h3>
              <button onClick={() => setShowQr(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 mb-1">초대코드</p>
              <p className="text-2xl font-bold font-mono tracking-wider text-blue-900">{event.inviteCode}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(event.inviteCode); toast('초대코드가 복사되었습니다.', 'success'); }}
                className="mt-2 text-xs bg-blue-200 hover:bg-blue-300 text-blue-800 px-3 py-1 rounded-lg font-medium transition-colors"
              >
                코드 복사
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">협력업체 초대 링크</p>
              <p className="text-xs text-gray-500 break-all font-mono bg-gray-50 p-2 rounded-lg">{partnerLink}</p>
              <Button size="sm" variant="secondary" onClick={() => copyLink(partnerLink, 'partner')} className="w-full">
                {copiedLink === 'partner' ? <><Check className="w-3.5 h-3.5 mr-1" /> 복사됨</> : <><Copy className="w-3.5 h-3.5 mr-1" /> 복사</>}
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">고객 방문예약 링크</p>
              <p className="text-xs text-gray-500 break-all font-mono bg-gray-50 p-2 rounded-lg">{visitLink}</p>
              <Button size="sm" variant="secondary" onClick={() => copyLink(visitLink, 'visit')} className="w-full">
                {copiedLink === 'visit' ? <><Check className="w-3.5 h-3.5 mr-1" /> 복사됨</> : <><Copy className="w-3.5 h-3.5 mr-1" /> 복사</>}
              </Button>
            </div>
            {/* QR codes for both links */}
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-600 text-center mb-2">협력업체 초대 QR</p>
                <div className="flex justify-center">
                  <QRCodeSVG value={partnerLink} size={130} level="H" includeMargin fgColor="#1a1a1a" />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-600 text-center mb-2">고객 방문예약 QR</p>
                <div className="flex justify-center">
                  <QRCodeSVG value={visitLink} size={130} level="H" includeMargin fgColor="#1B3460" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 통합 계약 설정 (와이어프레임 3-3) ─── */}
      {configLoading ? (
        <div className="animate-pulse h-32 bg-white rounded-xl mb-6" />
      ) : !config ? (
        <Card className="mb-6 text-center py-6">
          <p className="text-sm text-gray-500 mb-3">통합 계약 설정이 없습니다.</p>
          <Button onClick={createConfig}>
            <Plus className="w-4 h-4 mr-1" />
            통합 계약 설정 생성
          </Button>
        </Card>
      ) : (
        <>
          {/* 타입 설정하기 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">타입 설정하기</h3>
            <Card>
              <div className="flex flex-wrap gap-2 mb-3">
                {apartmentTypes.map((type) => (
                  <div key={type.id} className="group flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                    {editingType?.id === type.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingType.name}
                          onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                          className="w-24 px-1.5 py-0.5 border border-indigo-300 rounded text-xs bg-white focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateType();
                            if (e.key === 'Escape') setEditingType(null);
                          }}
                          autoFocus
                        />
                        <button onClick={updateType} className="text-indigo-600 hover:text-indigo-800">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingType(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span>{type.name}</span>
                        <button
                          onClick={() => setEditingType({ id: type.id, name: type.name })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5"
                        >
                          <Pencil className="w-3 h-3 text-indigo-400" />
                        </button>
                        <button
                          onClick={() => deleteType(type.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5 text-indigo-400 hover:text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {apartmentTypes.length === 0 && (
                  <span className="text-sm text-gray-400">등록된 타입이 없습니다</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="새 타입 이름 (예: 59A, 84B)"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => e.key === 'Enter' && addType()}
                />
                <Button size="sm" onClick={addType} disabled={!newTypeName.trim()}>
                  <Plus className="w-4 h-4 mr-1" /> 추가
                </Button>
              </div>
            </Card>
          </div>

          {/* 품목 설정하기 */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">품목 설정하기</h3>
            <Card>
              <div className="flex flex-wrap gap-2 mb-3">
                {categories.map((cat, idx) => (
                  <div key={idx} className="group flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <span>{cat}</span>
                    <button
                      onClick={() => removeCategory(idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 text-amber-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
                {categories.length === 0 && (
                  <span className="text-sm text-gray-400">등록된 품목 카테고리가 없습니다</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="새 품목 (예: 줄눈, 나노코팅, 중문)"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                />
                <Button size="sm" onClick={addCategory} disabled={!newCategory.trim()}>
                  <Plus className="w-4 h-4 mr-1" /> 추가
                </Button>
              </div>
            </Card>
          </div>

          {/* 상세 품목 설정하기 버튼 → 정산 페이지 */}
          <div className="mb-6 space-y-3">
            <Card
              hoverable
              onClick={() => router.push(`/organizer/events/${id}/settlement`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">상세 품목 설정 / 정산</p>
                  <p className="text-sm text-gray-500">품목 테이블 · 정산 현황</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
            <Card
              hoverable
              onClick={() => router.push(`/organizer/events/${id}/ic-config`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">결제단계 · 약관 설정</p>
                  <p className="text-sm text-gray-500">결제단계·약관·특이사항</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
            <Card
              hoverable
              onClick={() => router.push(`/organizer/events/${id}/ic-contracts`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">통합 계약 현황</p>
                  <p className="text-sm text-gray-500">고객 통합 계약 조회</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          </div>
        </>
      )}

      {/* 관리 메뉴 */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">관리</h3>
      <div className="grid grid-cols-2 gap-3">
        <Card
          hoverable
          onClick={() => router.push(`/organizer/events/${id}/partners`)}
        >
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
              {pendingPartnerCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingPartnerCount}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-800">협력업체</p>
              <p className="text-xs text-gray-500">승인/관리</p>
            </div>
          </div>
        </Card>
        <Card
          hoverable
          onClick={() => router.push(`/organizer/events/${id}/contracts`)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center">
              <FileText className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">개별계약</p>
              <p className="text-xs text-gray-500">현황 관리</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Section */}
      {event.status !== 'cancelled' && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Button variant="danger" onClick={() => setDeleteModal(true)}>
            <Trash2 className="w-4 h-4 mr-1" /> 행사 삭제
          </Button>
        </div>
      )}

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="행사 삭제 확인">
        <p className="text-sm text-gray-600 mb-4">
          정말로 <strong>{event.name}</strong> 행사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>취소</Button>
          <Button variant="danger" onClick={handleDeleteEvent}>삭제</Button>
        </div>
      </Modal>
    </div>
  );
}
