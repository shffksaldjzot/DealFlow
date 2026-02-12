'use client';
import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw } from 'lucide-react';

export default function ContractSignPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const sigRef = useRef<SignatureCanvas>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearSignature = () => {
    sigRef.current?.clear();
  };

  const handleSubmit = async () => {
    if (sigRef.current?.isEmpty()) {
      toast('서명을 입력해주세요.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const signatureData = sigRef.current?.toDataURL('image/png') || '';

      await api.post(`/contract-flow/${code}/sign`, { signatureData });
      toast('서명이 완료되었습니다!', 'success');
      router.push(`/contract/${code}/complete`);
    } catch (err: any) {
      toast(err.response?.data?.message?.[0] || '서명에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-lg mx-auto">
          <p className="text-sm font-bold text-gray-900">전자서명</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Progress */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-green-600">1. 내용 확인 &#10003;</span>
          <div className="flex-1 h-0.5 bg-blue-500" />
          <span className="text-blue-600">2. 서명</span>
          <div className="flex-1 h-0.5 bg-gray-200" />
          <span className="text-gray-400">3. 완료</span>
        </div>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">서명을 입력해주세요</h3>
            <button
              onClick={clearSignature}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              다시 쓰기
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
            <SignatureCanvas
              ref={sigRef}
              canvasProps={{
                className: 'w-full',
                style: { width: '100%', height: '200px' },
              }}
              penColor="#1B64FF"
              dotSize={2}
              minWidth={1.5}
              maxWidth={3}
            />
          </div>

          <p className="text-xs text-gray-400 mt-2 text-center">
            위 영역에 손가락 또는 마우스로 서명하세요
          </p>
        </Card>

        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-700">
            본 전자서명은 전자서명법에 의거하여 법적 효력이 있으며,
            서명 시각, IP 주소 등이 함께 기록됩니다.
          </p>
        </div>

        <Button
          fullWidth
          size="xl"
          onClick={handleSubmit}
          loading={submitting}
        >
          서명 완료
        </Button>
      </div>
    </div>
  );
}
