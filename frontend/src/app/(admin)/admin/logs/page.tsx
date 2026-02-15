'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { formatDateTime } from '@/lib/utils';
import type { PaginatedResult } from '@/types/api';

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  userId?: string;
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
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    api.get('/admin/logs', { params: { page, limit: 20 } })
      .then((res) => {
        const result = extractData<PaginatedResult<ActivityLog>>(res);
        setLogs(result.data);
        setTotal(result.meta.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [page]);

  const totalPages = Math.ceil(total / 20);

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
    approve_organizer: 'bg-green-100 text-green-600',
    reject_organizer: 'bg-red-100 text-red-600',
    create_user: 'bg-blue-100 text-blue-600',
    update_user: 'bg-yellow-100 text-yellow-600',
    delete_user: 'bg-red-100 text-red-600',
    change_user_status: 'bg-orange-100 text-orange-600',
    create_event: 'bg-blue-100 text-blue-600',
    update_event: 'bg-purple-100 text-purple-600',
    update_event_status: 'bg-purple-100 text-purple-600',
    delete_event: 'bg-red-100 text-red-600',
    approve_partner: 'bg-green-100 text-green-600',
    reject_partner: 'bg-red-100 text-red-600',
    cancel_partner: 'bg-orange-100 text-orange-600',
    partner_join_request: 'bg-cyan-100 text-cyan-600',
    partner_cancel_participation: 'bg-orange-100 text-orange-600',
    create_contract: 'bg-blue-100 text-blue-600',
    contract_signed: 'bg-green-100 text-green-600',
    cancel_contract: 'bg-red-100 text-red-600',
    update_contract_status: 'bg-indigo-100 text-indigo-600',
    register_organization: 'bg-teal-100 text-teal-600',
    create_organization: 'bg-teal-100 text-teal-600',
    reset_password: 'bg-yellow-100 text-yellow-600',
    visit_reservation: 'bg-sky-100 text-sky-600',
    visit_cancel: 'bg-orange-100 text-orange-600',
  };

  return (
    <div>
      <PageHeader title="활동 로그" subtitle={`총 ${total}건`} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">활동 로그가 없습니다</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const link = getTargetLink(log);
            const colorClass = actionIcons[log.action] || 'bg-gray-100 text-gray-600';
            return (
              <Card key={log.id}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${colorClass.split(' ')[0]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{log.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
                      {link && (
                        <button
                          onClick={() => router.push(link)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          상세보기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
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
            variant="outline"
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
