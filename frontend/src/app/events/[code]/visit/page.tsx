'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Calendar, MapPin, Building2, Ticket } from 'lucide-react';
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

export default function EventVisitPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [event, setEvent] = useState<PublicEventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [guestCount, setGuestCount] = useState('1');
  const [memo, setMemo] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/events/public/${code}`)
      .then((res) => res.json())
      .then((data) => setEvent(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      router.push(`/login?redirect=/events/${code}/visit`);
      return;
    }

    if (!visitDate) {
      toast('방문 날짜를 선택해주세요.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/event-visits', {
        inviteCode: code,
        visitDate,
        guestCount: Number(guestCount),
        memo: memo || undefined,
      });
      setSubmitted(true);
      toast('방문예약이 완료되었습니다.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast(typeof msg === 'string' ? msg : '예약에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 pt-8">
        <div className="h-48 bg-white rounded-xl animate-pulse" />
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

  if (submitted) {
    return (
      <div className="space-y-4 pt-4">
        <Card>
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-xl bg-success-light flex items-center justify-center mx-auto mb-3">
              <Ticket className="w-7 h-7 text-success" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">예약 완료</h2>
            <p className="text-sm text-gray-500 mb-6">
              {event.name} 방문예약이 완료되었습니다.
            </p>
            <Button onClick={() => router.push('/customer')}>
              홈으로 이동
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-success-light flex items-center justify-center mx-auto mb-3">
            <Ticket className="w-7 h-7 text-success" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{event.name}</h2>
          <p className="text-sm text-gray-500 mt-1">방문예약</p>
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
              <MapPin className="w-5 h-5 text-success" />
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
          user.role === 'customer' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="방문 날짜"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
              <Input
                label="방문 인원"
                type="number"
                min="1"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">메모 (선택)</label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="요청사항이나 메모를 입력하세요"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <Button fullWidth size="xl" type="submit" loading={submitting} disabled={!visitDate}>
                예약하기
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">고객 계정으로만 예약할 수 있습니다.</p>
              <p className="text-xs text-gray-400">현재 로그인: {user.email} ({user.role})</p>
            </div>
          )
        ) : (
          <Button fullWidth size="xl" onClick={() => router.push(`/login?redirect=/events/${code}/visit`)}>
            로그인 후 예약하기
          </Button>
        )}
      </Card>
    </div>
  );
}
