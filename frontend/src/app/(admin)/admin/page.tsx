'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import PeriodSelector, { PeriodValue } from '@/components/ui/PeriodSelector';
import { Building2, Users, Calendar, FileText, AlertCircle, KeyRound } from 'lucide-react';
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
  passwordResetRequests: any[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodValue>({ from: null, to: null, label: '전체' });

  const fetchDashboard = useCallback((p: PeriodValue) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (p.from) params.set('from', p.from);
    if (p.to) params.set('to', p.to);
    const qs = params.toString();
    api.get(`/admin/dashboard${qs ? `?${qs}` : ''}`)
      .then((res) => setStats(extractData(res)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDashboard(period);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeriodChange = (p: PeriodValue) => {
    setPeriod(p);
    fetchDashboard(p);
  };

  const totalPending = (stats?.pendingOrganizations || 0) + (stats?.pendingPartners || 0);

  const cards = [
    {
      label: '사용자',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-100',
      href: '/admin/users',
    },
    {
      label: '업체',
      value: stats?.totalOrganizations || 0,
      icon: Building2,
      color: 'text-purple-600 bg-purple-100',
      href: '/admin/organizers',
    },
    {
      label: '행사',
      value: stats?.totalEvents || 0,
      sub: `진행 ${stats?.activeEvents || 0}`,
      icon: Calendar,
      color: 'text-success bg-success-light',
      href: '/admin/events',
    },
    {
      label: '계약',
      value: stats?.totalContracts || 0,
      sub: `오늘 ${stats?.signedContractsToday || 0}`,
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

      {/* Period Filter */}
      <div className="mb-4">
        <PeriodSelector value={period} onChange={handlePeriodChange} />
      </div>

      {/* Pending Approvals Alert */}
      {!loading && totalPending > 0 && (
        <div
          className="mb-4 p-3 sm:p-4 bg-error-light border border-error rounded-xl flex items-center gap-3 cursor-pointer hover:bg-error-light transition-colors"
          onClick={() => router.push('/admin/organizers')}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-error-light shrink-0">
            <AlertCircle className="w-5 h-5 text-error" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-error">
              승인 대기 {totalPending}건
            </p>
            <p className="text-xs text-error truncate">
              주관사 {stats?.pendingOrganizations || 0}, 협력업체 {stats?.pendingPartners || 0}
            </p>
          </div>
        </div>
      )}

      {/* Password Reset Requests */}
      {!loading && stats?.passwordResetRequests && stats.passwordResetRequests.length > 0 && (
        <div className="mb-4 p-3 sm:p-4 bg-warning-light border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 shrink-0">
              <KeyRound className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">
                비밀번호 초기화 {stats.passwordResetRequests.length}건
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {stats.passwordResetRequests.map((req: any) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 bg-white rounded-xl cursor-pointer hover:bg-amber-50 transition-colors"
                onClick={() => router.push(`/admin/users/${req.metadata?.targetUserId}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{req.metadata?.targetUserName}</p>
                  <p className="text-xs text-gray-500 truncate">{req.metadata?.targetUserEmail}</p>
                </div>
                <Button size="sm" variant="secondary">처리</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid - responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} hoverable onClick={() => router.push(c.href)}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
                  <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{c.label}</p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-800">{loading ? '-' : c.value}</p>
                  {c.sub && <p className="text-[11px] text-gray-400 truncate">{loading ? '' : c.sub}</p>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Contracts by Status */}
      {!loading && stats?.contractsByStatus && Object.keys(stats.contractsByStatus).length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">계약 상태</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.contractsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <Badge status={status} />
                <span className="text-sm font-bold text-gray-800">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent data - stack on mobile, side by side on desktop */}
      {!loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Users */}
          {stats.recentUsers && stats.recentUsers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">최근 가입</h3>
              <Card>
                <div className="divide-y divide-gray-100">
                  {stats.recentUsers.slice(0, 5).map((u: any) => {
                    const roleMap: Record<string, { label: string; color: string }> = {
                      admin: { label: '관리자', color: 'bg-purple-100 text-purple-800' },
                      organizer: { label: '주관사', color: 'bg-blue-100 text-blue-800' },
                      partner: { label: '업체', color: 'bg-success-light text-success' },
                      customer: { label: '고객', color: 'bg-gray-100 text-gray-600' },
                    };
                    const role = roleMap[u.role] || { label: u.role, color: 'bg-gray-100 text-gray-600' };
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${role.color}`}>
                            {role.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* Recent Contracts */}
          {stats.recentContracts && stats.recentContracts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">최근 계약</h3>
              <Card>
                <div className="divide-y divide-gray-100">
                  {stats.recentContracts.slice(0, 5).map((c: any) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
                      onClick={() => router.push(`/admin/contracts/${c.id}`)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.event?.name || '계약서'}</p>
                        <p className="text-xs text-gray-400 font-mono">{c.contractNumber}</p>
                      </div>
                      <div className="shrink-0 ml-2">
                        <Badge status={c.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
