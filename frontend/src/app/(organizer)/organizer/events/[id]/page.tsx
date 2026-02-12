'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/layout/PageHeader';
import { Calendar, MapPin, Copy, Users, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import type { Event } from '@/types/event';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((res) => setEvent(extractData(res)))
      .catch(() => toast('행사를 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const copyInviteCode = () => {
    if (event?.inviteCode) {
      navigator.clipboard.writeText(event.inviteCode);
      toast('초대코드가 복사되었습니다.', 'success');
    }
  };

  const activateEvent = async () => {
    try {
      await api.patch(`/events/${id}/status`, { status: 'active' });
      setEvent((prev) => prev ? { ...prev, status: 'active' } : null);
      toast('행사가 활성화되었습니다.', 'success');
    } catch {
      toast('상태 변경에 실패했습니다.', 'error');
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-white rounded-2xl" />;
  if (!event) return null;

  return (
    <div>
      <PageHeader
        title={event.name}
        backHref="/organizer/events"
        actions={
          <div className="flex gap-2">
            {event.status === 'draft' && (
              <Button onClick={activateEvent}>행사 시작</Button>
            )}
          </div>
        }
      />

      {/* Event Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">기간</p>
              <p className="text-sm font-medium">{formatDate(event.startDate)} ~ {formatDate(event.endDate)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xs text-gray-500">장소</p>
              <p className="text-sm font-medium">{event.venue || '-'}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Copy className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">초대코드</p>
                <p className="text-sm font-bold font-mono tracking-wider">{event.inviteCode}</p>
              </div>
            </div>
            <button
              onClick={copyInviteCode}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              복사
            </button>
          </div>
        </Card>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          hoverable
          onClick={() => router.push(`/organizer/events/${id}/partners`)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">협력업체 관리</p>
              <p className="text-sm text-gray-500">참여 업체 승인/관리</p>
            </div>
          </div>
        </Card>
        <Card
          hoverable
          onClick={() => router.push(`/organizer/events/${id}/contracts`)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">계약 현황</p>
              <p className="text-sm text-gray-500">행사별 계약 확인</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Badge status={event.status} />
        <span className="text-sm text-gray-400 ml-2">
          수수료율: {event.commissionRate}%
        </span>
      </div>
    </div>
  );
}
