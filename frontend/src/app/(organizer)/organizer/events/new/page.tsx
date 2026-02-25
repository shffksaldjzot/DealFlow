'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/layout/PageHeader';

const THEME_COLORS = [
  { name: 'blue', label: '파랑', class: 'bg-blue-400' },
  { name: 'purple', label: '보라', class: 'bg-purple-400' },
  { name: 'green', label: '초록', class: 'bg-green-400' },
  { name: 'orange', label: '주황', class: 'bg-orange-400' },
  { name: 'red', label: '빨강', class: 'bg-red-400' },
  { name: 'pink', label: '분홍', class: 'bg-pink-400' },
  { name: 'teal', label: '청록', class: 'bg-teal-400' },
  { name: 'indigo', label: '남색', class: 'bg-indigo-400' },
];

export default function CreateEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    commissionRate: '0',
    themeColor: 'blue',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast('행사명, 시작일, 종료일은 필수입니다.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/events', {
        ...form,
        commissionRate: parseFloat(form.commissionRate) || 0,
        isPrivate: true,
      });
      toast('행사가 생성되었습니다!', 'success');
      router.push('/organizer/events');
    } catch (err: any) {
      const msg = err.response?.data?.message || '행사 생성에 실패했습니다.';
      toast(Array.isArray(msg) ? msg[0] : msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="행사 생성"
        subtitle="새로운 행사를 만들어보세요"
        backHref="/organizer/events"
      />

      <Card padding="lg" className="max-w-xl">
        <div className="space-y-4">
          <Input
            label="행사명 *"
            placeholder="2026 상반기 입주박람회"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="시작일 *"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="min-h-[44px]"
            />
            <Input
              label="종료일 *"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="min-h-[44px]"
            />
          </div>

          <Input
            label="행사 장소"
            placeholder="코엑스 전시장 A홀"
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">설명</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="행사에 대한 설명을 입력하세요"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <Input
            label="수수료율 (%)"
            type="number"
            placeholder="0"
            value={form.commissionRate}
            onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
            helperText="협력업체에 적용할 기본 수수료율"
          />

          {/* Theme Color Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">카드 색상</label>
            <div className="flex flex-wrap gap-2">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setForm({ ...form, themeColor: color.name })}
                  className={`w-10 h-10 rounded-xl ${color.class} transition-all ${
                    form.themeColor === color.name
                      ? 'ring-2 ring-offset-2 ring-gray-800 scale-110'
                      : 'hover:scale-105'
                  }`}
                  title={color.label}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">행사 목록에서 카드 배경 색상으로 표시됩니다</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 text-sm">
            <p className="font-medium text-blue-800 mb-1">비공개 행사</p>
            <p className="text-blue-600">
              행사는 비공개로 생성되며, 초대코드를 통해서만 협력업체가 참여할 수 있습니다.
              초대코드는 자동으로 생성됩니다.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            loading={loading}
          >
            행사 생성
          </Button>
        </div>
      </Card>
    </div>
  );
}
