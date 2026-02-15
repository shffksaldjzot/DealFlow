'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import FileUpload from '@/components/common/FileUpload';
import api, { extractData } from '@/lib/api';
import { Eye, MapPin } from 'lucide-react';

declare global {
  interface Window {
    daum: any;
  }
}

export default function BusinessRegistration() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    bizNum1: '',
    bizNum2: '',
    bizNum3: '',
    representativeName: '',
    phone1: '',
    phone2: '',
    phone3: '',
    contactEmail: '',
    address: '',
    addressDetail: '',
    businessLicenseFileId: '',
  });

  // Pre-fill email from signup
  useEffect(() => {
    if (user?.email) {
      setForm((prev) => ({ ...prev, contactEmail: user.email }));
    }
  }, [user]);

  // Load Daum address script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.daum) {
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const openAddressSearch = () => {
    if (!window.daum?.Postcode) {
      toast('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.', 'error');
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const addr = data.roadAddress || data.jibunAddress;
        setForm((prev) => ({ ...prev, address: `(${data.zonecode}) ${addr}` }));
      },
    }).open();
  };

  const handleSubmit = async () => {
    const businessNumber = `${form.bizNum1}-${form.bizNum2}-${form.bizNum3}`;
    const contactPhone = form.phone1 && form.phone2 && form.phone3
      ? `${form.phone1}-${form.phone2}-${form.phone3}`
      : '';
    const fullAddress = form.addressDetail
      ? `${form.address} ${form.addressDetail}`
      : form.address;

    if (!form.name || !form.bizNum1 || !form.bizNum2 || !form.bizNum3 || !form.businessLicenseFileId) {
      toast('업체명, 사업자번호, 사업자등록증은 필수입니다.', 'error');
      return;
    }
    if (form.bizNum1.length !== 3 || form.bizNum2.length !== 2 || form.bizNum3.length !== 5) {
      toast('사업자등록번호를 올바르게 입력해주세요. (3-2-5자리)', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/organizations', {
        name: form.name,
        businessNumber,
        representativeName: form.representativeName,
        contactPhone,
        contactEmail: form.contactEmail,
        address: fullAddress,
        businessLicenseFileId: form.businessLicenseFileId,
        type: user?.role === 'organizer' ? 'organizer' : 'partner',
      });
      toast('업체 등록이 완료되었습니다. DealFlow 승인 후 이용 가능합니다.', 'success');
      router.push('/pending-approval');
    } catch {
      toast('업체 등록에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBizNumChange = (field: 'bizNum1' | 'bizNum2' | 'bizNum3', value: string, maxLen: number, nextRef?: string) => {
    const digits = value.replace(/\D/g, '').slice(0, maxLen);
    setForm((prev) => ({ ...prev, [field]: digits }));
    if (digits.length === maxLen && nextRef) {
      document.getElementById(nextRef)?.focus();
    }
  };

  const handlePhoneChange = (field: 'phone1' | 'phone2' | 'phone3', value: string, maxLen: number, nextRef?: string) => {
    const digits = value.replace(/\D/g, '').slice(0, maxLen);
    setForm((prev) => ({ ...prev, [field]: digits }));
    if (digits.length === maxLen && nextRef) {
      document.getElementById(nextRef)?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">업체 등록</h1>
          <p className="text-sm text-gray-500 mt-1">사업자 정보를 입력해주세요</p>
        </div>

        <Card padding="lg" className="overflow-hidden">
          <div className="space-y-4 overflow-hidden">
            <Input
              label="업체명 *"
              placeholder="(주)딜플로우"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            {/* 사업자등록번호 - 3-2-5 분리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                사업자등록번호 *
              </label>
              <div className="grid grid-cols-[3fr_auto_2fr_auto_5fr] items-center gap-1">
                <input
                  id="biz1"
                  type="text"
                  inputMode="numeric"
                  placeholder="000"
                  value={form.bizNum1}
                  onChange={(e) => handleBizNumChange('bizNum1', e.target.value, 3, 'biz2')}
                  className="w-full min-w-0 px-1 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={3}
                />
                <span className="text-gray-400 font-bold">-</span>
                <input
                  id="biz2"
                  type="text"
                  inputMode="numeric"
                  placeholder="00"
                  value={form.bizNum2}
                  onChange={(e) => handleBizNumChange('bizNum2', e.target.value, 2, 'biz3')}
                  className="w-full min-w-0 px-1 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={2}
                />
                <span className="text-gray-400 font-bold">-</span>
                <input
                  id="biz3"
                  type="text"
                  inputMode="numeric"
                  placeholder="00000"
                  value={form.bizNum3}
                  onChange={(e) => handleBizNumChange('bizNum3', e.target.value, 5)}
                  className="w-full min-w-0 px-1 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={5}
                />
              </div>
            </div>

            <Input
              label="대표자명"
              placeholder="홍길동"
              value={form.representativeName}
              onChange={(e) => setForm({ ...form, representativeName: e.target.value })}
            />

            {/* 연락처 - 3-4-4 분리 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                연락처
              </label>
              <div className="grid grid-cols-[3fr_auto_4fr_auto_4fr] items-center gap-1">
                <input
                  id="ph1"
                  type="text"
                  inputMode="numeric"
                  placeholder="010"
                  value={form.phone1}
                  onChange={(e) => handlePhoneChange('phone1', e.target.value, 3, 'ph2')}
                  className="w-full min-w-0 px-1 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={3}
                />
                <span className="text-gray-400 font-bold">-</span>
                <input
                  id="ph2"
                  type="text"
                  inputMode="numeric"
                  placeholder="0000"
                  value={form.phone2}
                  onChange={(e) => handlePhoneChange('phone2', e.target.value, 4, 'ph3')}
                  className="w-full min-w-0 px-1 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={4}
                />
                <span className="text-gray-400 font-bold">-</span>
                <input
                  id="ph3"
                  type="text"
                  inputMode="numeric"
                  placeholder="0000"
                  value={form.phone3}
                  onChange={(e) => handlePhoneChange('phone3', e.target.value, 4)}
                  className="w-full min-w-0 px-1 py-2.5 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={4}
                />
              </div>
            </div>

            <Input
              label="이메일"
              type="email"
              placeholder="company@example.com"
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            />

            {/* 주소 - 다음 우편번호 API */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                주소
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  readOnly
                  placeholder="주소 검색을 클릭하세요"
                  value={form.address}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none cursor-pointer"
                  onClick={openAddressSearch}
                />
                <button
                  type="button"
                  onClick={openAddressSearch}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors shrink-0"
                >
                  <MapPin className="w-4 h-4" />
                  검색
                </button>
              </div>
              <input
                type="text"
                placeholder="상세 주소 입력"
                value={form.addressDetail}
                onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 사업자등록증 업로드 + 미리보기 */}
            <FileUpload
              label="사업자등록증 *"
              accept=".pdf,.jpg,.jpeg,.png"
              purpose="business_license"
              onUploadComplete={(fileId, fileName, file) => {
                setForm({ ...form, businessLicenseFileId: fileId });
                // Use local blob URL for immediate preview
                if (file && file.type.startsWith('image/')) {
                  setPreviewUrl(URL.createObjectURL(file));
                } else {
                  setPreviewUrl(null);
                }
              }}
              helperText="PDF, JPG, PNG 형식 / 최대 10MB"
            />
            {previewUrl && (
              <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border-b border-gray-200">
                  <Eye className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-500 font-medium">미리보기</span>
                </div>
                <img
                  src={previewUrl}
                  alt="사업자등록증 미리보기"
                  className="w-full max-h-48 object-contain p-2"
                />
              </div>
            )}
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

          <p className="text-xs text-gray-400 text-center mt-3">
            등록 후 DealFlow에서 승인 처리합니다
          </p>
        </Card>
      </div>
    </div>
  );
}
