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

interface ContractsSummary {
  total: number;
  byStatus: Record<string, number>;
  totalAmount: number;
  contracts: Contract[];
}

export default function EventContractsPage() {
  const { id } = useParams<{ id: string }>();
  const [summary, setSummary] = useState<ContractsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}/contracts`)
      .then((res) => setSummary(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const contracts = summary?.contracts || [];

  const columns = [
    { key: 'partner', header: '업체명', render: (c: Contract) => (c as any).partner?.name || '-' },
    { key: 'customer', header: '고객명', render: (c: Contract) => c.customerName || c.customer?.name || '-' },
    { key: 'totalAmount', header: '금액', render: (c: Contract) => c.totalAmount ? formatCurrency(c.totalAmount) : '-' },
    { key: 'status', header: '상태', render: (c: Contract) => <Badge status={c.status} /> },
    { key: 'createdAt', header: '생성일', render: (c: Contract) => formatDateTime(c.createdAt) },
    { key: 'contractNumber', header: '계약번호' },
  ];

  const statusCards = [
    { key: 'pending', label: '대기' },
    { key: 'in_progress', label: '진행중' },
    { key: 'completed', label: '완료' },
    { key: 'cancelled', label: '취소' },
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
        {statusCards.map((s) => (
          <Card key={s.key} padding="sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {loading ? '-' : (summary?.byStatus[s.key] || 0)}
              </p>
              <Badge status={s.key} />
            </div>
          </Card>
        ))}
      </div>

      {/* Total Amount */}
      {!loading && summary && (
        <Card padding="sm" className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">총 계약금액</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(summary.totalAmount)}
            </span>
          </div>
        </Card>
      )}

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
