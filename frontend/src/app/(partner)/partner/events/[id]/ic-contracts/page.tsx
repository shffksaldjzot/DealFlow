'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import Table from '@/components/ui/Table';
import { useToast } from '@/components/ui/Toast';
import { FileText } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { IcContract } from '@/types/integrated-contract';

export default function PartnerIcContractsPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [contracts, setContracts] = useState<IcContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ic/contracts/partner/my')
      .then((res) => {
        const all = extractData<IcContract[]>(res);
        // Filter by event
        const filtered = all.filter((c) => c.config?.event?.id === eventId || c.config?.eventId === eventId);
        setContracts(filtered);
      })
      .catch(() => toast('데이터를 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  }, [eventId, toast]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const columns = [
    {
      key: 'status',
      header: '상태',
      render: (item: IcContract) => <Badge status={item.status} />,
    },
    {
      key: 'shortCode',
      header: '계약번호',
      render: (item: IcContract) => (
        <span className="font-mono font-medium text-gray-900 text-xs">{item.shortCode}</span>
      ),
    },
    {
      key: 'customer',
      header: '고객',
      render: (item: IcContract) => (
        <span className="text-gray-700">{item.customerName || item.customer?.name || '-'}</span>
      ),
    },
    {
      key: 'items',
      header: '내 품목수',
      render: (item: IcContract) => {
        // Count only this partner's items (we'll filter on detail page)
        const myItems = item.selectedItems?.length || 0;
        return <span className="text-gray-600">{myItems}개</span>;
      },
    },
    {
      key: 'totalAmount',
      header: '총액',
      render: (item: IcContract) => (
        <span className="font-medium text-gray-900">{formatCurrency(item.totalAmount)}</span>
      ),
    },
    {
      key: 'createdAt',
      header: '체결일',
      className: 'hidden sm:table-cell',
      render: (item: IcContract) => (
        <span className="text-gray-500">{formatDate(item.createdAt)}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="통합 계약 현황"
        subtitle="내 품목이 포함된 계약 목록"
        backHref={`/partner/events/${eventId}`}
      />

      {contracts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="w-12 h-12 text-gray-300" />}
            title="관련 통합 계약이 없습니다"
            description="고객이 옵션을 선택하여 계약하면 여기에 표시됩니다"
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={contracts}
              emptyMessage="계약이 없습니다."
              onRowClick={(item: IcContract) => router.push(`/partner/events/${eventId}/ic-contracts/${item.id}`)}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
