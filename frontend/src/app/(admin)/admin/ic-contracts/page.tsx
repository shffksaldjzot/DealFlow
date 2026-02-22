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
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContracts = () => {
    setLoading(true);
    const params: any = { page, limit: 20, search };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    api.get('/admin/ic-contracts', { params })
      .then((res) => {
        const result = extractData<PaginatedResult<IcContract> & { totalAmount?: number }>(res);
        setContracts(result.data);
        setTotal(result.meta.total);
        setTotalAmount((result as any).totalAmount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContracts(); }, [page, search, startDate, endDate]);

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

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="max-w-xs flex-1">
          <Input
            placeholder="계약번호 또는 고객명 검색"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* Total Amount */}
      {totalAmount > 0 && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">
            {startDate || endDate ? '기간 내 ' : ''}합계금액
          </span>
          <span className="text-lg font-bold text-blue-700">{formatCurrency(totalAmount)}</span>
        </div>
      )}

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
