'use client';
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/layout/PageHeader';
import { Building2, Users, Calendar, FileText } from 'lucide-react';
import api, { extractData } from '@/lib/api';

interface DashboardStats {
  totalOrganizers: number;
  pendingOrganizers: number;
  totalUsers: number;
  totalEvents: number;
  totalContracts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setStats(extractData(res)))
      .catch(() => {});
  }, []);

  const cards = [
    { label: '주관사', value: stats?.totalOrganizers || 0, sub: `승인 대기: ${stats?.pendingOrganizers || 0}`, icon: Building2, color: 'text-purple-600 bg-purple-100', href: '/admin/organizers' },
    { label: '전체 사용자', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600 bg-blue-100', href: '/admin/users' },
    { label: '전체 행사', value: stats?.totalEvents || 0, icon: Calendar, color: 'text-green-600 bg-green-100', href: '/admin/events' },
    { label: '전체 계약', value: stats?.totalContracts || 0, icon: FileText, color: 'text-orange-600 bg-orange-100', href: '/admin/contracts' },
  ];

  return (
    <div>
      <PageHeader title="관리자 대시보드" subtitle="전체 시스템 현황" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Card key={i} hoverable>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                  {c.sub && <p className="text-xs text-gray-400">{c.sub}</p>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
