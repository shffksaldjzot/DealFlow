'use client';
import { useEffect, useState } from 'react';
import api, { extractData } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import Table from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import { formatDateTime } from '@/lib/utils';
import type { Event } from '@/types/event';
import type { PaginatedResult } from '@/types/api';

interface AdminEvent extends Event {
  _count?: { partners: number };
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEvents = () => {
    setLoading(true);
    api.get('/admin/events', { params: { page, limit: 20, search } })
      .then((res) => {
        const result = extractData<PaginatedResult<AdminEvent>>(res);
        setEvents(result.data);
        setTotal(result.meta.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, [page, search]);

  const columns = [
    { key: 'name', header: '행사명' },
    { key: 'organizer', header: '주관사', render: (e: AdminEvent) => e.organizer?.name || '-' },
    { key: 'status', header: '상태', render: (e: AdminEvent) => <Badge status={e.status} /> },
    { key: 'startDate', header: '시작일', render: (e: AdminEvent) => formatDateTime(e.startDate) },
    { key: 'endDate', header: '종료일', render: (e: AdminEvent) => formatDateTime(e.endDate) },
    { key: 'partners', header: '파트너 수', render: (e: AdminEvent) => e._count?.partners ?? '-' },
  ];

  return (
    <div>
      <PageHeader title="이벤트 관리" subtitle={`총 ${total}개 행사`} />

      <div className="mb-4 max-w-sm">
        <Input
          placeholder="행사명 검색"
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
        <Table columns={columns} data={events} emptyMessage="행사가 없습니다." />
      )}
    </div>
  );
}
