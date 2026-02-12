'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { CheckCircle2, QrCode } from 'lucide-react';
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
  const [expiresAt, setExpiresAt] = useState('');

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

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        eventId: id,
        templateId,
      };
      if (totalAmount) payload.totalAmount = Number(totalAmount);
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();

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
              고객에게 QR 코드를 공유하여 계약을 진행하세요.
            </p>

            <div className="w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-500">계약번호</span>
                <span className="font-mono font-bold text-gray-900">
                  {createdContract.contractNumber}
                </span>
              </div>

              {createdContract.qrCodeUrl && (
                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl">
                  <QrCode className="w-6 h-6 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 mb-3">QR 코드</p>
                  <img
                    src={createdContract.qrCodeUrl}
                    alt="Contract QR Code"
                    className="w-48 h-48 border border-gray-200 rounded-lg"
                  />
                </div>
              )}

              {createdContract.qrCode && !createdContract.qrCodeUrl && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">QR 코드</span>
                  <span className="font-mono text-sm text-gray-900 break-all">
                    {createdContract.qrCode}
                  </span>
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
                setExpiresAt('');
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

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                계약 금액 (선택)
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="금액을 입력하세요"
                min="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">비워두면 금액 없이 계약이 생성됩니다.</p>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                만료일 (선택)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">비워두면 만료일 없이 계약이 생성됩니다.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                취소
              </Button>
              <Button type="submit" loading={submitting}>
                계약 생성
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
