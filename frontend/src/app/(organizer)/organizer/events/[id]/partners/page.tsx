'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import type { EventPartner } from '@/types/event';
import { CheckCircle2, XCircle, Ban, Calendar, Phone, Mail, Calculator, Pencil } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

type PageTab = 'partners' | 'settlement';
type PartnerTabKey = 'all' | 'pending' | 'approved' | 'rejected' | 'cancelled';

interface SettlementPartner {
  partnerId: string;
  partnerName: string;
  contractCount: number;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
}

interface SettlementData {
  partners: SettlementPartner[];
  totals: {
    contractCount: number;
    totalAmount: number;
    totalCommission: number;
  };
  eventCommissionRate: number;
}

const partnerTabs: { key: PartnerTabKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '승인대기' },
  { key: 'approved', label: '승인됨' },
  { key: 'rejected', label: '거절' },
  { key: 'cancelled', label: '취소' },
];

export default function EventPartnersPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [pageTab, setPageTab] = useState<PageTab>('partners');
  const [partners, setPartners] = useState<EventPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PartnerTabKey>('all');
  const [cancelTarget, setCancelTarget] = useState<EventPartner | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Settlement state
  const [settlement, setSettlement] = useState<SettlementData | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [editCommission, setEditCommission] = useState<{ partnerId: string; rate: string } | null>(null);
  const [savingCommission, setSavingCommission] = useState(false);

  const fetchPartners = () => {
    api.get(`/events/${id}/partners`)
      .then((res) => setPartners(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchSettlement = () => {
    setSettlementLoading(true);
    api.get(`/events/${id}/settlement`)
      .then((res) => setSettlement(extractData(res)))
      .catch(() => toast('정산 데이터를 불러올 수 없습니다.', 'error'))
      .finally(() => setSettlementLoading(false));
  };

  useEffect(() => { fetchPartners(); }, [id]);

  useEffect(() => {
    if (pageTab === 'settlement' && !settlement) {
      fetchSettlement();
    }
  }, [pageTab]);

  const handleAction = async (partnerId: string, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/events/${id}/partners/${partnerId}`, { status });
      toast(status === 'approved' ? '승인되었습니다.' : '거절되었습니다.', 'success');
      fetchPartners();
    } catch {
      toast('처리에 실패했습니다.', 'error');
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await api.patch(`/events/${id}/partners/${cancelTarget.partnerId}`, {
        status: 'cancelled',
        cancelReason: cancelReason || undefined,
      });
      toast('승인이 취소되었습니다.', 'success');
      setCancelTarget(null);
      setCancelReason('');
      fetchPartners();
    } catch {
      toast('처리에 실패했습니다.', 'error');
    }
  };

  const handleSaveCommission = async () => {
    if (!editCommission) return;
    const rate = parseFloat(editCommission.rate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast('수수료율은 0~100 사이의 숫자를 입력하세요.', 'error');
      return;
    }
    setSavingCommission(true);
    try {
      await api.patch(`/events/${id}/partners/${editCommission.partnerId}/commission`, { commissionRate: rate });
      toast('수수료율이 변경되었습니다.', 'success');
      setEditCommission(null);
      fetchSettlement();
    } catch {
      toast('수수료율 변경에 실패했습니다.', 'error');
    } finally {
      setSavingCommission(false);
    }
  };

  const getCount = (tab: PartnerTabKey) => {
    if (tab === 'all') return partners.length;
    return partners.filter((p) => p.status === tab).length;
  };

  const filteredPartners = activeTab === 'all'
    ? partners
    : partners.filter((p) => p.status === activeTab);

  return (
    <div>
      <PageHeader
        title="협력업체 관리"
        subtitle="참여 신청한 협력업체를 승인/거절하세요"
        backHref={`/organizer/events/${id}`}
      />

      {/* Page Tabs: 업체관리 / 정산 */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setPageTab('partners')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            pageTab === 'partners' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          업체 관리
        </button>
        <button
          onClick={() => setPageTab('settlement')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
            pageTab === 'settlement' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calculator className="w-4 h-4" /> 정산
        </button>
      </div>

      {pageTab === 'partners' ? (
        <>
          {/* Partner Status Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
            {partnerTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {!loading && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {getCount(tab.key)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
            </div>
          ) : filteredPartners.length === 0 ? (
            <EmptyState
              title="해당 상태의 업체가 없습니다"
              description={activeTab === 'all' ? '초대코드를 공유하여 협력업체를 초대하세요' : undefined}
            />
          ) : (
            <div className="space-y-3">
              {filteredPartners.map((ep) => (
                <Card key={ep.id}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{ep.partner?.name || '업체'}</h3>
                        <Badge status={ep.status} />
                      </div>
                      {ep.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAction(ep.partnerId, 'approved')}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> 승인
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleAction(ep.partnerId, 'rejected')}>
                            <XCircle className="w-4 h-4 mr-1" /> 거절
                          </Button>
                        </div>
                      )}
                      {ep.status === 'approved' && (
                        <Button size="sm" variant="outline" onClick={() => setCancelTarget(ep)}>
                          <Ban className="w-4 h-4 mr-1" /> 승인 취소
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> 신청일: {formatDate(ep.createdAt)}
                      </span>
                      {ep.approvedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" /> 승인일: {formatDate(ep.approvedAt)}
                        </span>
                      )}
                      {ep.partner?.contactPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {ep.partner.contactPhone}
                        </span>
                      )}
                      {ep.partner?.contactEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {ep.partner.contactEmail}
                        </span>
                      )}
                    </div>
                    {ep.cancelReason && (
                      <p className="text-xs text-red-500">취소 사유: {ep.cancelReason}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Settlement Tab */
        settlementLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : !settlement ? (
          <EmptyState title="정산 데이터를 불러올 수 없습니다" />
        ) : (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card padding="sm">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">총 계약</p>
                  <p className="text-xl font-bold text-gray-900">{settlement.totals.contractCount}건</p>
                </div>
              </Card>
              <Card padding="sm">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">총 매출</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(settlement.totals.totalAmount)}</p>
                </div>
              </Card>
              <Card padding="sm">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">총 수수료</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(settlement.totals.totalCommission)}</p>
                </div>
              </Card>
            </div>

            <p className="text-xs text-gray-400 mb-3">기본 수수료율: {settlement.eventCommissionRate}%</p>

            {/* Partner Settlement Table */}
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">업체명</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">계약건수</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">총 매출</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">수수료율</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">수수료액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlement.partners.map((p) => (
                      <tr key={p.partnerId} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.partnerName}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{p.contractCount}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatCurrency(p.totalAmount)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setEditCommission({ partnerId: p.partnerId, rate: String(p.commissionRate) })}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                          >
                            {p.commissionRate}%
                            <Pencil className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(p.commissionAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-4 py-3 text-gray-700">합계</td>
                      <td className="px-4 py-3 text-right text-gray-700">{settlement.totals.contractCount}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(settlement.totals.totalAmount)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">-</td>
                      <td className="px-4 py-3 text-right text-green-700">{formatCurrency(settlement.totals.totalCommission)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          </div>
        )
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">승인 취소</h3>
            <p className="text-sm text-gray-500">
              <strong>{cancelTarget.partner?.name}</strong>의 참여 승인을 취소하시겠습니까?
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">취소 사유 (선택)</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소 사유를 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setCancelTarget(null); setCancelReason(''); }}>
                닫기
              </Button>
              <Button variant="danger" onClick={handleCancel}>
                승인 취소
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Edit Dialog */}
      {editCommission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">수수료율 변경</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">수수료율 (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={editCommission.rate}
                onChange={(e) => setEditCommission({ ...editCommission, rate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setEditCommission(null)}>
                취소
              </Button>
              <Button onClick={handleSaveCommission} loading={savingCommission}>
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
