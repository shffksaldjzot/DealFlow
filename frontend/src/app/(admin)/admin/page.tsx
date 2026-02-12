'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import { Building2, Users, Calendar, FileText, PenTool, Clock } from 'lucide-react';
import api, { extractData } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface DashboardStats {
  totalOrganizations: number;
  pendingOrganizations: number;
  pendingPartners: number;
  totalUsers: number;
  totalEvents: number;
  activeEvents: number;
  totalContracts: number;
  signedContractsToday: number;
  contractsByStatus: Record<string, number>;
  recentUsers: any[];
  recentContracts: any[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setStats(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: '주관사',
      value: stats?.totalOrganizations || 0,
      sub: `주관사 승인 대기: ${stats?.pendingOrganizations || 0}`,
      icon: Building2,
      color: 'text-purple-600 bg-purple-100',
      href: '/admin/organizers',
    },
    {
      label: '전체 사용자',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
      href: '/admin/users',
    },
    {
      label: '전체 행사',
      value: stats?.totalEvents || 0,
      sub: `진행 중: ${stats?.activeEvents || 0}`,
      icon: Calendar,
      color: 'text-green-600 bg-green-100',
      href: '/admin/events',
    },
    {
      label: '전체 계약',
      value: stats?.totalContracts || 0,
      sub: `오늘 서명: ${stats?.signedContractsToday || 0}`,
      icon: FileText,
      color: 'text-orange-600 bg-orange-100',
      href: '/admin/contracts',
    },
  ];

  const statusLabels: Record<string, string> = {
    pending: '대기',
    in_progress: '작성중',
    signed: '서명완료',
    completed: '완료',
    cancelled: '취소',
  };

  return (
    <div>
      <PageHeader title="관리자 대시보드" subtitle="전체 시스템 현황" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} hoverable onClick={() => router.push(c.href)}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{loading ? '-' : c.value}</p>
                  {c.sub && <p className="text-xs text-gray-400">{loading ? '' : c.sub}</p>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Additional Info Cards */}
      {!loading && stats && (
        <>
          {/* Contracts by Status */}
          {stats.contractsByStatus && Object.keys(stats.contractsByStatus).length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">상태별 계약 분포</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(stats.contractsByStatus).map(([status, count]) => (
                  <Card key={status}>
                    <div className="text-center">
                      <Badge status={status} />
                      <p className="text-xl font-bold text-gray-900 mt-1">{count}</p>
                      <p className="text-xs text-gray-400">{statusLabels[status] || status}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent Users */}
            {stats.recentUsers && stats.recentUsers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 가입 사용자</h3>
                <Card>
                  <div className="divide-y divide-gray-50">
                    {stats.recentUsers.map((u: any) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                        <div className="text-right">
                          <Badge status={u.role === 'admin' ? 'completed' : u.role === 'organizer' ? 'active' : u.role === 'partner' ? 'approved' : 'pending'} />
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(u.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Recent Contracts */}
            {stats.recentContracts && stats.recentContracts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">최근 계약</h3>
                <Card>
                  <div className="divide-y divide-gray-50">
                    {stats.recentContracts.map((c: any) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
                        onClick={() => router.push(`/admin/contracts/${c.id}`)}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{c.event?.name || '계약서'}</p>
                          <p className="text-xs text-gray-400 font-mono">{c.contractNumber}</p>
                        </div>
                        <div className="text-right">
                          <Badge status={c.status} />
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(c.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
