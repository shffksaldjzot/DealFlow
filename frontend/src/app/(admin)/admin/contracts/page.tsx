'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Contract } from '@/types/contract';
import type { PaginatedResult } from '@/types/api';

interface AdminContract extends Contract {
  partner?: { id: string; name: string };
}

export default function AdminContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<AdminContract[]>([]);
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

    api.get('/admin/contracts', { params })
      .then((res) => {
        const result = extractData<PaginatedResult<AdminContract> & { totalAmount?: number }>(res);
        setContracts(result.data);
        setTotal(result.meta.total);
        setTotalAmount((result as any).totalAmount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContracts(); }, [page, search, startDate, endDate]);

  const columns = [
    { key: 'contractNumber', header: '계약번호' },
    { key: 'event', header: '행사명', render: (c: AdminContract) => c.event?.name || '-' },
    { key: 'partner', header: '파트너', render: (c: AdminContract) => c.partner?.name || '-' },
    { key: 'customer', header: '고객', render: (c: AdminContract) => c.customer?.name || '-' },
    { key: 'status', header: '상태', render: (c: AdminContract) => <Badge status={c.status} /> },
    { key: 'totalAmount', header: '금액', render: (c: AdminContract) => c.totalAmount != null ? formatCurrency(c.totalAmount) : '-' },
    { key: 'createdAt', header: '생성일', render: (c: AdminContract) => formatDateTime(c.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="계약 관리" subtitle={`총 ${total}건`} />

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="max-w-xs flex-1">
          <Input
            placeholder="계약번호 검색"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 text-sm">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <Table
          columns={columns}
          data={contracts}
          emptyMessage="계약이 없습니다."
          onRowClick={(c: AdminContract) => router.push(`/admin/contracts/${c.id}`)}
        />
      )}
    </div>
  );
}
