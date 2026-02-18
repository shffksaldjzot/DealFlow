'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import Table from '@/components/ui/Table';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import { Pencil, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import type { Contract } from '@/types/contract';

type MainTab = 'contracts' | 'settlement' | 'summary';
type StatusFilter = 'all' | 'pending' | 'in_progress' | 'signed' | 'completed' | 'cancelled';

interface ContractCount {
  total: number;
  pending: number;
  inProgress: number;
  signed: number;
  completed: number;
  cancelled: number;
}

interface SettlementPartner {
  partnerId: string;
  partnerName: string;
  items: string | null;
  contractCount: ContractCount;
  totalAmount: number;
  settledAmount: number;
  commissionRate: number;
  commissionAmount: number;
  payoutAmount: number;
  contracts: Contract[];
}

interface SettlementData {
  partners: SettlementPartner[];
  totals: {
    contractCount: number;
    totalAmount: number;
    settledAmount: number;
    totalCommission: number;
    totalPayout: number;
  };
  eventCommissionRate: number;
}

const statusTabs: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '대기' },
  { key: 'in_progress', label: '진행' },
  { key: 'signed', label: '서명' },
  { key: 'completed', label: '완료' },
  { key: 'cancelled', label: '취소' },
];

export default function EventContractsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState<MainTab>('contracts');
  const [settlement, setSettlement] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);

  // Contracts tab state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [partnerFilter, setPartnerFilter] = useState('all');

  // Settlement tab state
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [editCommission, setEditCommission] = useState<{ partnerId: string; rate: string } | null>(null);
  const [savingCommission, setSavingCommission] = useState(false);

  const fetchSettlement = () => {
    setLoading(true);
    api.get(`/events/${id}/settlement`)
      .then((res) => setSettlement(extractData(res)))
      .catch(() => toast('데이터를 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettlement(); }, [id]);

  // All contracts flattened from settlement data
  const allContracts = useMemo(() => {
    if (!settlement) return [];
    return settlement.partners.flatMap((p) =>
      p.contracts.map((c) => ({ ...c, _partnerName: p.partnerName, _partnerItems: p.items }))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [settlement]);

  // Partner names for filter dropdown
  const partnerNames = useMemo(() => {
    if (!settlement) return [];
    return settlement.partners.map((p) => p.partnerName).sort();
  }, [settlement]);

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    let list = allContracts;
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
    }
    if (partnerFilter !== 'all') {
      list = list.filter((c) => (c as any)._partnerName === partnerFilter);
    }
    return list;
  }, [allContracts, statusFilter, partnerFilter]);

  const getStatusCount = (status: StatusFilter) => {
    if (status === 'all') return allContracts.length;
    return allContracts.filter((c) => c.status === status).length;
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

  const columns = [
    { key: 'partner', header: '업체명', render: (c: any) => c._partnerName || (c as any).partner?.name || '-' },
    { key: 'customer', header: '고객명', render: (c: Contract) => c.customerName || c.customer?.name || '-' },
    { key: 'totalAmount', header: '금액', render: (c: Contract) => c.totalAmount ? formatCurrency(c.totalAmount) : '-' },
    { key: 'status', header: '상태', render: (c: Contract) => <Badge status={c.status} /> },
    { key: 'createdAt', header: '생성일', render: (c: Contract) => formatDateTime(c.createdAt) },
    { key: 'contractNumber', header: '계약번호' },
  ];

  return (
    <div>
      <PageHeader
        title="계약 / 정산"
        subtitle="계약 현황과 정산을 한눈에 확인하세요"
        backHref={`/organizer/events/${id}`}
      />

      {/* Summary Cards - Always visible */}
      {!loading && settlement && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card padding="sm">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">총 계약건수</p>
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
              <p className="text-xs text-gray-500 mb-1">정산 대상</p>
              <p className="text-xl font-bold text-indigo-600">{formatCurrency(settlement.totals.settledAmount)}</p>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">총 수수료</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(settlement.totals.totalCommission)}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {([
          { key: 'contracts' as MainTab, label: '계약 목록' },
          { key: 'settlement' as MainTab, label: '업체별 정산' },
          { key: 'summary' as MainTab, label: '정산 요약' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              mainTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : !settlement ? (
        <EmptyState title="데이터를 불러올 수 없습니다" />
      ) : (
        <>
          {/* Tab 1: Contract List */}
          {mainTab === 'contracts' && (
            <div>
              {/* Status filter tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 overflow-x-auto">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      statusFilter === tab.key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                      statusFilter === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {getStatusCount(tab.key)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Partner filter dropdown */}
              {partnerNames.length > 1 && (
                <div className="mb-4">
                  <select
                    value={partnerFilter}
                    onChange={(e) => setPartnerFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">전체 업체</option>
                    {partnerNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              {filteredContracts.length === 0 ? (
                <EmptyState title="계약이 없습니다" />
              ) : (
                <Table
                  columns={columns}
                  data={filteredContracts}
                  onRowClick={(c) => router.push(`/organizer/events/${id}/contracts/${c.id}`)}
                />
              )}
            </div>
          )}

          {/* Tab 2: Partner Settlement */}
          {mainTab === 'settlement' && (
            <div>
              <p className="text-xs text-gray-400 mb-4">기본 수수료율: {settlement.eventCommissionRate}%</p>

              <div className="space-y-3">
                {settlement.partners.map((p) => {
                  const isExpanded = expandedPartner === p.partnerId;
                  const isCustomRate = p.commissionRate !== settlement.eventCommissionRate;
                  return (
                    <Card key={p.partnerId} padding="none">
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedPartner(isExpanded ? null : p.partnerId)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{p.partnerName}</h3>
                            <span className="text-xs text-gray-400">{p.contractCount.total}건</span>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                        {p.items && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {p.items.split(',').map((item, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700">
                                {item.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">총 매출</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(p.totalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">정산 대상</p>
                            <p className="font-semibold text-indigo-600">{formatCurrency(p.settledAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">수수료율</p>
                            <p className="font-semibold">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditCommission({ partnerId: p.partnerId, rate: String(p.commissionRate) }); }}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                {p.commissionRate}%
                                {isCustomRate && <span className="text-[10px] text-orange-500">(개별)</span>}
                                <Pencil className="w-3 h-3" />
                              </button>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">수수료액</p>
                            <p className="font-semibold text-green-600">{formatCurrency(p.commissionAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">지급액</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(p.payoutAmount)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Expanded: contract list */}
                      {isExpanded && p.contracts.length > 0 && (
                        <div className="border-t border-gray-100">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50 text-xs text-gray-500">
                                  <th className="text-left px-4 py-2">고객명</th>
                                  <th className="text-right px-4 py-2">금액</th>
                                  <th className="text-center px-4 py-2">상태</th>
                                  <th className="text-right px-4 py-2">계약번호</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.contracts.map((c) => (
                                  <tr
                                    key={c.id}
                                    className="border-t border-gray-50 hover:bg-blue-50 cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); router.push(`/organizer/events/${id}/contracts/${c.id}`); }}
                                  >
                                    <td className="px-4 py-2 text-gray-900">{c.customerName || c.customer?.name || '-'}</td>
                                    <td className="px-4 py-2 text-right text-gray-700">{c.totalAmount ? formatCurrency(c.totalAmount) : '-'}</td>
                                    <td className="px-4 py-2 text-center"><Badge status={c.status} /></td>
                                    <td className="px-4 py-2 text-right text-xs text-gray-500 font-mono">{c.contractNumber}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Totals Card */}
              <Card className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">합계 매출</p>
                    <p className="font-bold text-gray-900">{formatCurrency(settlement.totals.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">합계 정산 대상</p>
                    <p className="font-bold text-indigo-600">{formatCurrency(settlement.totals.settledAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">합계 수수료</p>
                    <p className="font-bold text-green-600">{formatCurrency(settlement.totals.totalCommission)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">합계 지급액</p>
                    <p className="font-bold text-gray-900">{formatCurrency(settlement.totals.totalPayout)}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Tab 3: Settlement Summary */}
          {mainTab === 'summary' && (
            <div>
              {/* Overall Summary Table */}
              <Card padding="none" className="mb-6">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">전체 정산 요약</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-3 text-gray-500 font-medium">총 매출</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(settlement.totals.totalAmount)}</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-3 text-gray-500 font-medium">정산 대상 (서명+완료)</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatCurrency(settlement.totals.settledAmount)}</td>
                      </tr>
                      <tr className="border-b border-gray-50">
                        <td className="px-4 py-3 text-gray-500 font-medium">총 수수료</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{formatCurrency(settlement.totals.totalCommission)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-gray-500 font-medium">업체 지급 합계</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(settlement.totals.totalPayout)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Settlement Ratio Visualization */}
              {settlement.totals.settledAmount > 0 && (
                <Card className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">정산 비율</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>수수료 ({settlement.totals.settledAmount > 0 ? Math.round(settlement.totals.totalCommission / settlement.totals.settledAmount * 100) : 0}%)</span>
                        <span>{formatCurrency(settlement.totals.totalCommission)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{ width: `${settlement.totals.settledAmount > 0 ? (settlement.totals.totalCommission / settlement.totals.settledAmount * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>업체 지급 ({settlement.totals.settledAmount > 0 ? Math.round(settlement.totals.totalPayout / settlement.totals.settledAmount * 100) : 0}%)</span>
                        <span>{formatCurrency(settlement.totals.totalPayout)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3">
                        <div
                          className="bg-blue-500 h-3 rounded-full transition-all"
                          style={{ width: `${settlement.totals.settledAmount > 0 ? (settlement.totals.totalPayout / settlement.totals.settledAmount * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Per-Partner Summary Table */}
              <Card padding="none">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">업체별 정산</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">업체명</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">품목</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">정산 대상</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">수수료율</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">수수료</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-700">지급액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlement.partners.map((p) => (
                        <tr key={p.partnerId} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{p.partnerName}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{p.items || '-'}</td>
                          <td className="px-4 py-3 text-right text-indigo-600 font-medium">{formatCurrency(p.settledAmount)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{p.commissionRate}%</td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(p.commissionAmount)}</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{formatCurrency(p.payoutAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-bold">
                        <td className="px-4 py-3 text-gray-700">합계</td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-right text-indigo-600">{formatCurrency(settlement.totals.settledAmount)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">-</td>
                        <td className="px-4 py-3 text-right text-green-700">{formatCurrency(settlement.totals.totalCommission)}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(settlement.totals.totalPayout)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </>
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
              <Button variant="secondary" onClick={() => setEditCommission(null)}>취소</Button>
              <Button onClick={handleSaveCommission} loading={savingCommission}>저장</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
