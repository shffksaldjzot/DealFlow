'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { Calendar, FileText, Users, Plus } from 'lucide-react';

export default function OrganizerDashboard() {
  const router = useRouter();

  const stats = [
    { label: '진행 중 행사', value: '0', icon: Calendar, color: 'text-blue-600 bg-blue-100' },
    { label: '전체 계약', value: '0', icon: FileText, color: 'text-green-600 bg-green-100' },
    { label: '참여 협력업체', value: '0', icon: Users, color: 'text-purple-600 bg-purple-100' },
  ];

  return (
    <div>
      <PageHeader
        title="대시보드"
        subtitle="행사와 계약 현황을 한눈에 확인하세요"
        actions={
          <Button onClick={() => router.push('/organizer/events/new')}>
            <Plus className="w-4 h-4 mr-1" />
            행사 생성
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{s.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">아직 생성된 행사가 없습니다</p>
          <Button onClick={() => router.push('/organizer/events/new')}>
            첫 행사 만들기
          </Button>
        </div>
      </Card>
    </div>
  );
}
