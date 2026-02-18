'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Table from '@/components/ui/Table';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { Calendar, MapPin, Percent, FileText, Plus, QrCode, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Event } from '@/types/event';
import type { Contract, ContractTemplate } from '@/types/contract';

export default function PartnerEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [event, setEvent] = useState<Event | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelContractId, setCancelContractId] = useState<string | null>(null);
  const [contractCancelReason, setContractCancelReason] = useState('');
  const [contractCancelling, setContractCancelling] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/events/${id}`).then((res) => setEvent(extractData(res))),
      api.get('/contract-templates', { params: { eventId: id } }).then((res) => setTemplates(extractData(res))),
      api.get('/contracts', { params: { eventId: id } }).then((res) => setContracts(extractData(res))),
    ])
      .catch(() => toast('데이터를 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const handleCancelContract = async () => {
    if (!cancelContractId || !contractCancelReason.trim()) {
      toast('취소 사유를 입력해주세요.', 'error');
      return;
    }
    setContractCancelling(true);
    try {
      await api.post(`/contracts/${cancelContractId}/cancel`, { reason: contractCancelReason });
      toast('계약이 파기되었습니다.', 'success');
      setCancelContractId(null);
      setContractCancelReason('');
      // Refresh contracts
      api.get('/contracts', { params: { eventId: id } }).then((res) => setContracts(extractData(res))).catch(() => {});
    } catch {
      toast('파기에 실패했습니다.', 'error');
    } finally {
      setContractCancelling(false);
    }
  };

  const handleCancelParticipation = async () => {
    setCancelling(true);
    try {
      await api.post(`/event-partners/${id}/cancel`, {
        reason: cancelReason || undefined,
      });
      toast('참여가 취소되었습니다.', 'success');
      router.push('/partner/events');
    } catch {
      toast('참여 취소에 실패했습니다.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!event) return null;

  const templateColumns = [
    {
      key: 'name',
      header: '템플릿명',
      render: (item: ContractTemplate) => (
        <span className="font-medium text-gray-900">{item.name}</span>
      ),
    },
    {
      key: 'fileType',
      header: '파일 형식',
      render: (item: ContractTemplate) => (
        <span className="text-gray-600 uppercase">{item.fileType}</span>
      ),
    },
    {
      key: 'pageCount',
      header: '페이지',
      render: (item: ContractTemplate) => (
        <span className="text-gray-600">{item.pageCount}p</span>
      ),
    },
    {
      key: 'createdAt',
      header: '생성일',
      render: (item: ContractTemplate) => (
        <span className="text-gray-500">{formatDate(item.createdAt)}</span>
      ),
    },
  ];

  const contractColumns = [
    {
      key: 'status',
      header: '상태',
      render: (item: Contract) => <Badge status={item.status} />,
    },
    {
      key: 'customer',
      header: '고객',
      render: (item: Contract) => (
        <span className="text-gray-600 truncate block min-w-0">
          {item.customerName || item.customer?.name || '미지정'}
        </span>
      ),
    },
    {
      key: 'totalAmount',
      header: '금액',
      render: (item: Contract) => (
        <span className="text-gray-600">
          {item.totalAmount ? formatCurrency(item.totalAmount) : '-'}
        </span>
      ),
    },
    {
      key: 'contractNumber',
      header: '계약번호',
      className: 'hidden sm:table-cell',
      render: (item: Contract) => (
        <span className="font-mono font-medium text-gray-900 text-xs">{item.contractNumber}</span>
      ),
    },
    {
      key: 'template',
      header: '템플릿',
      render: (item: Contract) => (
        <span className="text-gray-600 truncate block min-w-0">{item.template?.name || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: '생성일',
      className: 'hidden sm:table-cell',
      render: (item: Contract) => (
        <span className="text-gray-500">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: Contract) =>
        item.status !== 'completed' && item.status !== 'cancelled' ? (
          <button
            onClick={(e) => { e.stopPropagation(); setCancelContractId(item.id); }}
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="파기"
          >
            <XCircle className="w-4 h-4" />
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title={event.name}
        backHref="/partner/events"
        actions={
          <Button onClick={() => router.push(`/partner/events/${id}/contracts/new`)}>
            <Plus className="w-4 h-4 mr-1" />
            계약 생성
          </Button>
        }
      />

      {/* Event Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">기간</p>
              <p className="text-sm font-medium">
                {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">장소</p>
              <p className="text-sm font-medium">{event.venue || '-'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Percent className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-xs text-gray-500">수수료율</p>
              <p className="text-sm font-medium">{event.commissionRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-2">
        <Badge status={event.status} />
      </div>

      {/* Contract Templates Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            계약서 템플릿
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/partner/events/${id}/templates/new`)}
          >
            <Plus className="w-4 h-4 mr-1" />
            템플릿 추가
          </Button>
        </div>
        {templates.length === 0 ? (
          <Card>
            <EmptyState
              title="등록된 템플릿이 없습니다"
              description="계약서 템플릿을 먼저 등록하세요"
              action={
                <Button
                  size="sm"
                  onClick={() => router.push(`/partner/events/${id}/templates/new`)}
                >
                  템플릿 등록하기
                </Button>
              }
            />
          </Card>
        ) : (
          <Card padding="none">
            <Table
              columns={templateColumns}
              data={templates}
              onRowClick={(item) => router.push(`/partner/events/${id}/templates/${item.id}`)}
              emptyMessage="등록된 템플릿이 없습니다."
            />
          </Card>
        )}
      </div>

      {/* Contracts Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-gray-600" />
            계약 현황
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/partner/events/${id}/contracts/new`)}
          >
            <Plus className="w-4 h-4 mr-1" />
            새 계약
          </Button>
        </div>
        {contracts.length === 0 ? (
          <Card>
            <EmptyState
              title="생성된 계약이 없습니다"
              description="템플릿을 선택하여 새 계약을 생성하세요"
              action={
                <Button
                  size="sm"
                  onClick={() => router.push(`/partner/events/${id}/contracts/new`)}
                >
                  계약 생성하기
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            <Card padding="none">
              <div className="overflow-x-auto">
                <Table
                  columns={contractColumns}
                  data={contracts}
                  onRowClick={(item) => router.push(`/partner/events/${id}/contracts/${item.id}`)}
                  emptyMessage="생성된 계약이 없습니다."
                />
              </div>
            </Card>
            {/* Total Amount Sum */}
            <Card padding="sm" className="mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">합계 금액</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(contracts.reduce((sum, c) => sum + (c.totalAmount || 0), 0))}
                </span>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Cancel Participation - at the bottom */}
      <div className="mt-12 pt-6 border-t border-gray-100">
        <button
          onClick={() => setShowCancelDialog(true)}
          className="text-sm text-red-500 hover:text-red-700 underline"
        >
          참여 취소
        </button>
      </div>

      {/* Contract Cancel Dialog */}
      {cancelContractId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">계약 파기</h3>
            <p className="text-sm text-gray-500">이 계약을 파기하시겠습니까?</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">파기 사유</label>
              <textarea
                value={contractCancelReason}
                onChange={(e) => setContractCancelReason(e.target.value)}
                placeholder="파기 사유를 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => { setCancelContractId(null); setContractCancelReason(''); }}>
                닫기
              </Button>
              <Button variant="danger" onClick={handleCancelContract} loading={contractCancelling} disabled={!contractCancelReason.trim()}>
                파기하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">참여 취소</h3>
            <p className="text-sm text-gray-500">
              <strong>{event.name}</strong> 행사 참여를 취소하시겠습니까?
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
              <Button variant="secondary" onClick={() => { setShowCancelDialog(false); setCancelReason(''); }}>
                닫기
              </Button>
              <Button variant="danger" onClick={handleCancelParticipation} loading={cancelling}>
                참여 취소
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
