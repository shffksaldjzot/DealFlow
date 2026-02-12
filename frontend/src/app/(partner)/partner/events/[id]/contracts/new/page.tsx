'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { CheckCircle2, QrCode, Copy, Check } from 'lucide-react';
import type { ContractTemplate, Contract } from '@/types/contract';

export default function NewContractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [templateId, setTemplateId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [copied, setCopied] = useState(false);
  const [shortCodeCopied, setShortCodeCopied] = useState(false);

  const [createdContract, setCreatedContract] = useState<Contract | null>(null);

  useEffect(() => {
    api.get('/contract-templates', { params: { eventId: id } })
      .then((res) => {
        const data = extractData<ContractTemplate[]>(res);
        setTemplates(data);
        if (data.length > 0) setTemplateId(data[0].id);
      })
      .catch(() => toast('템플릿을 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  }, [id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateId) {
      toast('템플릿을 선택해주세요.', 'error');
      return;
    }

    const rawAmount = totalAmount.replace(/,/g, '');
    if (!rawAmount || isNaN(Number(rawAmount)) || Number(rawAmount) <= 0) {
      toast('계약 금액을 올바르게 입력해주세요.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        eventId: id,
        templateId,
        totalAmount: Number(rawAmount),
      };
      if (customerName.trim()) {
        payload.customerName = customerName.trim();
      }

      const contract = extractData<Contract>(await api.post('/contracts', payload));
      setCreatedContract(contract);
      toast('계약이 생성되었습니다.', 'success');
    } catch {
      toast('계약 생성에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-white rounded-2xl animate-pulse" />
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Success state after contract creation
  if (createdContract) {
    return (
      <div>
        <PageHeader title="계약 생성 완료" backHref={`/partner/events/${id}`} />
        <Card>
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">계약이 생성되었습니다</h3>
            <p className="text-sm text-gray-500 mb-6">
              고객에게 QR 코드를 공유하거나 안내코드를 전달하세요.
            </p>

            <div className="w-full max-w-sm space-y-4">
              {/* Short Code - prominent display */}
              {createdContract.shortCode && (
                <div className="flex flex-col items-center p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-2">고객 안내용 코드</p>
                  <p className="text-3xl font-bold font-mono text-blue-900 tracking-widest mb-3">
                    {createdContract.shortCode}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdContract.shortCode!);
                      setShortCodeCopied(true);
                      setTimeout(() => setShortCodeCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {shortCodeCopied ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 코드 복사</>}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-500">계약번호</span>
                <span className="font-mono font-bold text-gray-900">
                  {createdContract.contractNumber}
                </span>
              </div>

              {createdContract.template?.name && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">템플릿</span>
                  <span className="font-medium text-gray-900">
                    {createdContract.template.name}
                  </span>
                </div>
              )}

              {createdContract.qrCode && (
                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-3">QR 코드</p>
                  <div className="p-3 bg-white rounded-xl border border-gray-100">
                    <QRCodeSVG
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/contract/${createdContract.qrCode}`}
                      size={180}
                      level="H"
                      includeMargin
                      fgColor="#1a1a1a"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/contract/${createdContract.qrCode}`;
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {copied ? <><Check className="w-3.5 h-3.5" /> 복사됨</> : <><Copy className="w-3.5 h-3.5" /> 링크 복사</>}
                  </button>
                </div>
              )}

              {createdContract.totalAmount && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">계약 금액</span>
                  <span className="font-bold text-gray-900">
                    {new Intl.NumberFormat('ko-KR', {
                      style: 'currency',
                      currency: 'KRW',
                    }).format(createdContract.totalAmount)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => router.push(`/partner/events/${id}`)}
              >
                행사로 돌아가기
              </Button>
              <Button onClick={() => {
                setCreatedContract(null);
                setTotalAmount('');
                setCustomerName('');
                setCopied(false);
                setShortCodeCopied(false);
              }}>
                새 계약 생성
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="새 계약 생성" backHref={`/partner/events/${id}`} />

      {templates.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">사용 가능한 템플릿이 없습니다.</p>
            <Button
              variant="outline"
              onClick={() => router.push(`/partner/events/${id}/templates/new`)}
            >
              템플릿 먼저 등록하기
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                계약서 템플릿 <span className="text-red-500">*</span>
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                고객명 <span className="text-xs text-gray-400">(선택)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="고객 이름을 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                계약 금액 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={totalAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setTotalAmount(raw ? Number(raw).toLocaleString('ko-KR') : '');
                }}
                placeholder="금액을 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button type="submit" loading={submitting} disabled={!totalAmount}>
                계약 생성
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
