'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { User, Mail, Phone, Shield, MapPin, Lock } from 'lucide-react';
import api from '@/lib/api';

function parsePhone(phone: string): { area: string; mid: string; last: string } {
  if (!phone) return { area: '010', mid: '', last: '' };
  const cleaned = phone.replace(/-/g, '');
  const areaCodes = ['010', '011', '016', '017', '018', '019'];
  for (const code of areaCodes) {
    if (cleaned.startsWith(code)) {
      const rest = cleaned.slice(code.length);
      return {
        area: code,
        mid: rest.slice(0, 4),
        last: rest.slice(4, 8),
      };
    }
  }
  if (cleaned.length >= 3) {
    return { area: cleaned.slice(0, 3), mid: cleaned.slice(3, 7), last: cleaned.slice(7, 11) };
  }
  return { area: '010', mid: '', last: '' };
}

function formatPhone(area: string, mid: string, last: string): string {
  if (!mid && !last) return '';
  return `${area}-${mid}-${last}`;
}

export default function CustomerProfile() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Phone 3-part
  const parsed = parsePhone(user?.phone || '');
  const [phoneArea, setPhoneArea] = useState(parsed.area);
  const [phoneMid, setPhoneMid] = useState(parsed.mid);
  const [phoneLast, setPhoneLast] = useState(parsed.last);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSave = async () => {
    const phone = formatPhone(phoneArea, phoneMid, phoneLast);
    setSaving(true);
    try {
      await api.patch('/auth/me', { name, phone, address });
      if (user) {
        setUser({ ...user, name, phone, address });
      }
      setSaved(true);
      toast('저장되었습니다.', 'success');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast('저장에 실패했습니다.', 'error');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast('비밀번호를 입력해주세요.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      toast('새 비밀번호는 8자 이상이어야 합니다.', 'error');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast('새 비밀번호가 일치하지 않습니다.', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      toast('비밀번호가 변경되었습니다.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err: any) {
      toast(err.response?.data?.message || '비밀번호 변경에 실패했습니다.', 'error');
    }
    setChangingPassword(false);
  };

  const roleLabels: Record<string, string> = {
    customer: '고객',
    organizer: '주관사',
    partner: '협력업체',
    admin: '관리자',
  };

  const passwordMismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm;
  const phone = formatPhone(phoneArea, phoneMid, phoneLast);

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
            <div className="flex items-center gap-1.5 overflow-hidden">
              <select
                value={phoneArea}
                onChange={(e) => setPhoneArea(e.target.value)}
                className="border border-gray-200 rounded-xl px-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-20 shrink-0"
              >
                {['010', '011', '016', '017', '018', '019'].map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <span className="text-gray-400 shrink-0">-</span>
              <input
                type="tel"
                maxLength={4}
                value={phoneMid}
                onChange={(e) => setPhoneMid(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="flex-1 min-w-0 border border-gray-200 rounded-xl px-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
              <span className="text-gray-400 shrink-0">-</span>
              <input
                type="tel"
                maxLength={4}
                value={phoneLast}
                onChange={(e) => setPhoneLast(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="flex-1 min-w-0 border border-gray-200 rounded-xl px-2 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">주소</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="주소를 입력하세요"
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

      {/* Password Change Card */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">비밀번호 변경</h3>
        </div>
        <div className="space-y-4">
          <Input
            label="현재 비밀번호"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="현재 비밀번호를 입력하세요"
          />
          <div>
            <Input
              label="새 비밀번호"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="8자 이상 입력하세요"
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-red-500 mt-1">비밀번호는 8자 이상이어야 합니다</p>
            )}
          </div>
          <div>
            <Input
              label="새 비밀번호 확인"
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
            />
            {passwordMismatch && (
              <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !newPasswordConfirm || passwordMismatch}
          >
            {changingPassword ? '변경 중...' : '비밀번호 변경'}
          </Button>
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
          {address && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">주소:</span>
              <span className="text-gray-900">{address}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
