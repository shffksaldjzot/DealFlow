'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import { CheckCircle2, Download, FileText } from 'lucide-react';
import type { Contract } from '@/types/contract';

export default function ContractCompletePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    // Fetch the contract data to get signedPdfFileId
    api.get(`/contract-flow/${code}`)
      .then((res) => setContract(extractData<Contract>(res)))
      .catch(() => {});
  }, [code]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto p-4">
        {/* Progress */}
        <div className="flex items-center gap-2 text-xs font-medium mt-4 mb-8">
          <span className="text-success">1. 내용 확인 &#10003;</span>
          <div className="flex-1 h-0.5 bg-success-light0" />
          <span className="text-success">2. 서명 &#10003;</span>
          <div className="flex-1 h-0.5 bg-success-light0" />
          <span className="text-success">3. 완료 &#10003;</span>
        </div>

        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-full bg-success-light flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            계약이 완료되었습니다
          </h1>
          <p className="text-gray-500 mb-8">
            계약 내용은 알림톡과 이메일로 발송됩니다
          </p>

          <div className="space-y-3">
            {contract?.signedPdfFileId && (
              <Button
                fullWidth
                size="lg"
                onClick={() => window.open(`/api/files/${contract.signedPdfFileId}/download`, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                계약서 PDF 다운로드
              </Button>
            )}
            <Button
              fullWidth
              size="lg"
              variant={contract?.signedPdfFileId ? 'secondary' : 'primary'}
              onClick={() => router.push('/customer/contracts')}
            >
              <FileText className="w-4 h-4 mr-2" />
              내 계약 보기
            </Button>
            <Button
              fullWidth
              size="lg"
              variant="secondary"
              onClick={() => router.push('/')}
            >
              홈으로
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mt-6">
          <p className="text-sm font-medium text-blue-800 mb-1">안내사항</p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>- 서명된 계약서 PDF는 마이페이지에서 다운로드 가능합니다</li>
            <li>- 카카오 알림톡으로 계약 완료 안내가 발송됩니다</li>
            <li>- 계약 관련 문의는 협력업체에 연락해주세요</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
