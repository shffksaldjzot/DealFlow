'use client';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { Calendar, FileText, QrCode } from 'lucide-react';

export default function PartnerDashboard() {
  const router = useRouter();

  const stats = [
    { label: '참여 행사', value: '0', icon: Calendar, color: 'text-blue-600 bg-blue-100' },
    { label: '전체 계약', value: '0', icon: FileText, color: 'text-green-600 bg-green-100' },
    { label: '발급 QR', value: '0', icon: QrCode, color: 'text-purple-600 bg-purple-100' },
  ];

  return (
    <div>
      <PageHeader
        title="대시보드"
        subtitle="행사별 계약 현황을 관리하세요"
        actions={
          <Button onClick={() => router.push('/partner/events/join')}>
            <QrCode className="w-4 h-4 mr-1" />
            행사 참여
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
          <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">참여 중인 행사가 없습니다</p>
          <Button onClick={() => router.push('/partner/events/join')}>
            초대코드로 행사 참여
          </Button>
        </div>
      </Card>
    </div>
  );
}
