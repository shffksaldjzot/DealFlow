'use client';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { User, Mail, Phone, Shield } from 'lucide-react';
import api from '@/lib/api';

export default function CustomerProfile() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/me', { name, phone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const roleLabels: Record<string, string> = {
    customer: '고객',
    organizer: '주관사',
    partner: '협력업체',
    admin: '관리자',
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">프로필</h2>
        <p className="text-sm text-gray-500 mt-1">내 정보를 관리하세요</p>
      </div>

      {/* Profile Card */}
      <Card className="mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{user?.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {roleLabels[user?.role || 'customer']}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">이름</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">이메일</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">이메일은 변경할 수 없습니다</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">연락처</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : saved ? '저장 완료!' : '저장'}
          </Button>
          {saved && <span className="text-sm text-green-600">변경사항이 저장되었습니다</span>}
        </div>
      </Card>

      {/* Account Info */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">계정 정보</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">가입일:</span>
            <span className="text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">연락처:</span>
            <span className="text-gray-900">{phone || '미등록'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
