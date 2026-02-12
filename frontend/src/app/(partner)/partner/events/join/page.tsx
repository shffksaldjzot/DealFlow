'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/layout/PageHeader';
import { QrCode } from 'lucide-react';

export default function JoinEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      toast('초대코드를 입력해주세요.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/event-partners/join', { inviteCode: inviteCode.trim().toUpperCase() });
      toast('행사 참여 신청이 완료되었습니다. 주관사 승인을 기다려주세요.', 'success');
      router.push('/partner/events');
    } catch (err: any) {
      const msg = err.response?.data?.message?.[0] || '참여 신청에 실패했습니다.';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="행사 참여"
        subtitle="주관사에게 받은 초대코드로 행사에 참여하세요"
        backHref="/partner/events"
      />

      <Card padding="lg" className="max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">초대코드 입력</h3>
          <p className="text-sm text-gray-500">
            주관사에서 발급한 8자리 초대코드를 입력하세요
          </p>
        </div>

        <Input
          placeholder="초대코드 8자리"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          className="text-center text-2xl font-mono tracking-[0.3em] uppercase"
        />

        <Button
          fullWidth
          size="lg"
          className="mt-4"
          onClick={handleJoin}
          loading={loading}
          disabled={inviteCode.length < 6}
        >
          참여 신청
        </Button>

        <p className="text-xs text-gray-400 text-center mt-4">
          주관사가 승인하면 행사에 참여할 수 있습니다
        </p>
      </Card>
    </div>
  );
}
