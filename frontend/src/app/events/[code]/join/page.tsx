'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Calendar, MapPin, Building2, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PublicEventInfo {
  name: string;
  description?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  organizerName: string;
  status: string;
}

export default function EventJoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [event, setEvent] = useState<PublicEventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetch(`/api/events/public/${code}`)
      .then((res) => res.json())
      .then((data) => setEvent(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    if (!isAuthenticated || !user) {
      router.push(`/login?redirect=/events/${code}/join`);
      return;
    }

    if (user.role !== 'partner') {
      toast('협력업체 계정으로만 참여할 수 있습니다.', 'error');
      return;
    }

    setJoining(true);
    try {
      await api.post('/event-partners/join', { inviteCode: code });
      toast('참여 신청이 완료되었습니다.', 'success');
      router.push('/partner/events');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast(typeof msg === 'string' ? msg : '참여 신청에 실패했습니다.', 'error');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 pt-8">
        <div className="h-48 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!event) {
    return (
      <Card>
        <div className="text-center py-12">
          <p className="text-gray-500">행사를 찾을 수 없습니다.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{event.name}</h2>
          {event.description && (
            <p className="text-sm text-gray-500 mt-2">{event.description}</p>
          )}
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Calendar className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">기간</p>
              <p className="text-sm font-medium">{formatDate(event.startDate)} ~ {formatDate(event.endDate)}</p>
            </div>
          </div>
          {event.venue && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-xs text-gray-500">장소</p>
                <p className="text-sm font-medium">{event.venue}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Building2 className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs text-gray-500">주관사</p>
              <p className="text-sm font-medium">{event.organizerName}</p>
            </div>
          </div>
        </div>

        {isAuthenticated && user ? (
          user.role === 'partner' ? (
            <Button fullWidth size="xl" onClick={handleJoin} loading={joining}>
              참여 신청하기
            </Button>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">협력업체 계정으로만 참여할 수 있습니다.</p>
              <p className="text-xs text-gray-400">현재 로그인: {user.email} ({user.role})</p>
            </div>
          )
        ) : (
          <Button fullWidth size="xl" onClick={() => router.push(`/login?redirect=/events/${code}/join`)}>
            로그인 후 참여하기
          </Button>
        )}
      </Card>
    </div>
  );
}
