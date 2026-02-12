'use client';
import { useEffect, useState } from 'react';
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
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchContracts = () => {
    setLoading(true);
    api.get('/admin/contracts', { params: { page, limit: 20, search } })
      .then((res) => {
        const result = extractData<PaginatedResult<AdminContract>>(res);
        setContracts(result.data);
        setTotal(result.meta.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchContracts(); }, [page, search]);

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

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="계약번호 검색"
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
        <Table columns={columns} data={contracts} emptyMessage="계약이 없습니다." />
      )}
    </div>
  );
}
