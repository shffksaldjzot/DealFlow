'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import FileUpload from '@/components/common/FileUpload';
import api, { extractData } from '@/lib/api';

export default function BusinessRegistration() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    businessNumber: '',
    representativeName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    businessLicenseFileId: '',
  });

  const handleSubmit = async () => {
    if (!form.name || !form.businessNumber || !form.businessLicenseFileId) {
      toast('업체명, 사업자번호, 사업자등록증은 필수입니다.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/organizations', {
        ...form,
        type: user?.role === 'organizer' ? 'organizer' : 'partner',
      });
      toast('업체 등록이 완료되었습니다. 승인 후 이용 가능합니다.', 'success');
      router.push('/pending-approval');
    } catch {
      toast('업체 등록에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">업체 등록</h1>
          <p className="text-sm text-gray-500 mt-1">사업자 정보를 입력해주세요</p>
        </div>

        <Card padding="lg">
          <div className="space-y-4">
            <Input
              label="업체명 *"
              placeholder="(주)딜플로우"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="사업자등록번호 *"
              placeholder="123-45-67890"
              value={form.businessNumber}
              onChange={(e) => setForm({ ...form, businessNumber: e.target.value })}
            />
            <Input
              label="대표자명"
              placeholder="홍길동"
              value={form.representativeName}
              onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
            />
            <Input
              label="연락처"
              placeholder="02-1234-5678"
              value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            />
            <Input
              label="이메일"
              type="email"
              placeholder="company@example.com"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />
            <Input
              label="주소"
              placeholder="서울시 강남구..."
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <FileUpload
              label="사업자등록증 *"
              accept=".pdf,.jpg,.jpeg,.png"
              purpose="business_license"
              onUploadComplete={(fileId) =>
                setForm({ ...form, businessLicenseFileId: fileId })
              }
              helperText="PDF, JPG, PNG 형식 / 최대 10MB"
            />
          </div>

          <Button
            fullWidth
            size="lg"
            className="mt-6"
            onClick={handleSubmit}
            loading={loading}
          >
            업체 등록 신청
          </Button>
        </Card>
      </div>
    </div>
  );
}
