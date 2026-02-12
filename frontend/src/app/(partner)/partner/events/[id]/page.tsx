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
import { Calendar, MapPin, Percent, FileText, Plus, QrCode } from 'lucide-react';
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

  useEffect(() => {
    Promise.all([
      api.get(`/events/${id}`).then((res) => setEvent(extractData(res))),
      api.get('/contract-templates', { params: { eventId: id } }).then((res) => setTemplates(extractData(res))),
      api.get('/contracts', { params: { eventId: id } }).then((res) => setContracts(extractData(res))),
    ])
      .catch(() => toast('데이터를 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  }, [id, toast]);

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
      key: 'contractNumber',
      header: '계약번호',
      render: (item: Contract) => (
        <span className="font-mono font-medium text-gray-900">{item.contractNumber}</span>
      ),
    },
    {
      key: 'template',
      header: '템플릿',
      render: (item: Contract) => (
        <span className="text-gray-600">{item.template?.name || '-'}</span>
      ),
    },
    {
      key: 'customer',
      header: '고객',
      render: (item: Contract) => (
        <span className="text-gray-600">{item.customer?.name || '미지정'}</span>
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
      key: 'status',
      header: '상태',
      render: (item: Contract) => <Badge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: '생성일',
      render: (item: Contract) => (
        <span className="text-gray-500">{formatDate(item.createdAt)}</span>
      ),
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
            <Table columns={templateColumns} data={templates} emptyMessage="등록된 템플릿이 없습니다." />
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
          <Card padding="none">
            <Table
              columns={contractColumns}
              data={contracts}
              onRowClick={(item) => router.push(`/partner/events/${id}/contracts/${item.id}`)}
              emptyMessage="생성된 계약이 없습니다."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
