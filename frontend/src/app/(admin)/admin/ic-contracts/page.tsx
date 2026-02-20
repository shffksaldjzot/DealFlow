'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { IcContract } from '@/types/integrated-contract';
import type { PaginatedResult } from '@/types/api';

export default function AdminIcContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<IcContract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContracts = () => {
    setLoading(true);
    api.get('/admin/ic-contracts', { params: { page, limit: 20, search } })
      .then((res) => {
        const result = extractData<PaginatedResult<IcContract>>(res);
        setContracts(result.data);
        setTotal(result.meta.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContracts(); }, [page, search]);

  const columns = [
    { key: 'shortCode', header: '계약번호' },
    { key: 'customerName', header: '고객명', render: (c: IcContract) => c.customerName || '-' },
    { key: 'event', header: '행사명', render: (c: IcContract) => c.config?.event?.name || '-' },
    { key: 'totalAmount', header: '총액', render: (c: IcContract) => formatCurrency(c.totalAmount) },
    { key: 'status', header: '상태', render: (c: IcContract) => <Badge status={c.status} /> },
    { key: 'signedAt', header: '체결일', render: (c: IcContract) => c.signedAt ? formatDateTime(c.signedAt) : '-' },
  ];

  return (
    <div>
      <PageHeader title="통합 계약" subtitle={`총 ${total}건`} />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="계약번호 또는 고객명 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={contracts}
            emptyMessage="통합 계약이 없습니다."
            onRowClick={(c: IcContract) => router.push(`/admin/ic-contracts/${c.id}`)}
          />
          {total > 20 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                이전
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                {page} / {Math.ceil(total / 20)}
              </span>
              <button
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
