'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/layout/PageHeader';
import { formatDateTime } from '@/lib/utils';
import type { PaginatedResult } from '@/types/api';

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  userId?: string;
  userName?: string;
  targetType?: string;
  targetId?: string;
  metadata?: any;
  createdAt: string;
}

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const limit = 50;

  const fetchLogs = () => {
    setLoading(true);
    api.get('/admin/logs', { params: { page, limit, search } })
      .then((res) => {
        const result = extractData<PaginatedResult<ActivityLog>>(res);
        setLogs(result.data);
        setTotal(result.meta.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [page, search]);

  const totalPages = Math.ceil(total / limit);

  const getTargetLink = (log: ActivityLog): string | null => {
    if (!log.targetType || !log.targetId) return null;
    const routes: Record<string, string> = {
      user: `/admin/users/${log.targetId}`,
      organization: `/admin/organizers`,
      event: `/admin/events/${log.targetId}`,
      contract: `/admin/contracts/${log.targetId}`,
    };
    return routes[log.targetType] || null;
  };

  const actionIcons: Record<string, string> = {
    approve_organizer: 'bg-success',
    reject_organizer: 'bg-error',
    create_user: 'bg-blue-400',
    update_user: 'bg-yellow-400',
    delete_user: 'bg-error',
    change_user_status: 'bg-orange-400',
    create_event: 'bg-blue-400',
    update_event: 'bg-purple-400',
    update_event_status: 'bg-purple-400',
    delete_event: 'bg-error',
    approve_partner: 'bg-success',
    reject_partner: 'bg-error',
    cancel_partner: 'bg-orange-400',
    partner_join_request: 'bg-cyan-400',
    partner_cancel_participation: 'bg-orange-400',
    create_contract: 'bg-blue-400',
    contract_signed: 'bg-success',
    cancel_contract: 'bg-error',
    update_contract_status: 'bg-indigo-400',
    register_organization: 'bg-teal-400',
    create_organization: 'bg-teal-400',
    reset_password: 'bg-yellow-400',
    visit_reservation: 'bg-sky-400',
    visit_cancel: 'bg-orange-400',
  };

  return (
    <div>
      <PageHeader title="활동 로그" subtitle={`총 ${total}건`} backHref="/admin" />

      {/* Search */}
      <div className="mb-4 max-w-sm">
        <Input
          placeholder="설명 또는 사용자명 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? (
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">
            {search ? '검색 결과가 없습니다' : '활동 로그가 없습니다'}
          </p>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {logs.map((log) => {
            const link = getTargetLink(log);
            const dotColor = actionIcons[log.action] || 'bg-gray-400';
            return (
              <div key={log.id} className="flex items-center gap-3 px-4 py-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                <p className="text-sm text-gray-800 flex-1 min-w-0 truncate">{log.description}</p>
                {log.userName && (
                  <span className="text-xs text-blue-600 font-medium whitespace-nowrap">{log.userName}</span>
                )}
                <span className="text-xs text-gray-400 whitespace-nowrap">{formatDateTime(log.createdAt)}</span>
                {link && (
                  <button
                    onClick={() => router.push(link)}
                    className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                  >
                    보기
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            이전
          </Button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
