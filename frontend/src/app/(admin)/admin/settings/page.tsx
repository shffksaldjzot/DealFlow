'use client';
import { useState } from 'react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { useAuthStore } from '@/stores/authStore';
import { Lock, Mail, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

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

  const passwordMismatch = newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm;

  return (
    <div>
      <PageHeader title="마이페이지" subtitle="관리자 계정 정보를 관리합니다" backHref="/admin" />

      {/* Account Info */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-700">계정 정보</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">로그인 이메일</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{user?.email || '-'}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">로그인 이메일은 변경할 수 없습니다</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
              <span className="text-sm text-gray-600">{user?.name || '-'}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">역할</label>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                관리자
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Password Change */}
      <Card>
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
              <p className="text-xs text-error mt-1">비밀번호는 8자 이상이어야 합니다</p>
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
              <p className="text-xs text-error mt-1">비밀번호가 일치하지 않습니다</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !newPasswordConfirm || passwordMismatch}
          >
            {changingPassword ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
