'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import Table from '@/components/ui/Table';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Contract } from '@/types/contract';

export default function EventContractsPage() {
  const { id } = useParams<{ id: string }>();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}/contracts`)
      .then((res) => setContracts(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const columns = [
    { key: 'contractNumber', header: '계약번호' },
    { key: 'customer', header: '고객', render: (c: Contract) => c.customer?.name || '-' },
    { key: 'status', header: '상태', render: (c: Contract) => <Badge status={c.status} /> },
    { key: 'totalAmount', header: '금액', render: (c: Contract) => c.totalAmount ? formatCurrency(c.totalAmount) : '-' },
    { key: 'createdAt', header: '생성일', render: (c: Contract) => formatDateTime(c.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title="계약 현황"
        subtitle="행사별 계약 현황을 확인하세요"
        backHref={`/organizer/events/${id}`}
      />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {['pending', 'in_progress', 'completed', 'cancelled'].map((s) => (
          <Card key={s} padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {contracts.filter((c) => c.status === s).length}
              </p>
              <Badge status={s} />
            </div>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="h-48 bg-white rounded-2xl animate-pulse" />
      ) : contracts.length === 0 ? (
        <EmptyState title="계약이 없습니다" />
      ) : (
        <Table columns={columns} data={contracts} />
      )}
    </div>
  );
}
