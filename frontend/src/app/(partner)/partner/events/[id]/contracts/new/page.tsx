'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/Toast';
import { CheckCircle2, Copy, Check, ChevronRight, FileText, Edit3, User, QrCode } from 'lucide-react';
import type { ContractTemplate, ContractField, Contract } from '@/types/contract';

type Step = 'select' | 'editor' | 'info' | 'qr';

const STEP_LABELS: Record<Step, string> = {
  select: '템플릿 선택',
  editor: '계약서 편집',
  info: '고객 정보',
  qr: 'QR 코드',
};

const STEP_ICONS: Record<Step, typeof FileText> = {
  select: FileText,
  editor: Edit3,
  info: User,
  qr: QrCode,
};

const STEPS: Step[] = ['select', 'editor', 'info', 'qr'];

export default function NewContractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('select');
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Template selection
  const [templateId, setTemplateId] = useState('');
  const selectedTemplate = templates.find(t => t.id === templateId);

  // Step 2: Editor - template preview + fields
  const [fields, setFields] = useState<ContractField[]>([]);
  const [templateImageUrl, setTemplateImageUrl] = useState('');
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Step 3: Customer info
  const [customerName, setCustomerName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');

  // Step 4: QR result
  const [createdContract, setCreatedContract] = useState<Contract | null>(null);
  const [copied, setCopied] = useState(false);
  const [shortCodeCopied, setShortCodeCopied] = useState(false);

  // Load templates
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

  // Load fields when moving to editor step
  const loadTemplateFields = async () => {
    if (!templateId) return;
    setFieldsLoading(true);
    try {
      const tmplFields = extractData<ContractField[]>(
        await api.get(`/contract-templates/${templateId}/fields`)
      );
      setFields(tmplFields);

      const tmpl = templates.find(t => t.id === templateId);
      if (tmpl?.fileId) {
        try {
          const response = await api.get(`/files/${tmpl.fileId}/download`, { responseType: 'blob' });
          const blob = response.data as Blob;
          if (blob.size > 0 && blob.type?.startsWith('image/')) {
            setTemplateImageUrl(URL.createObjectURL(blob));
            setImageError(false);
          }
        } catch {
          // File not available - fallback UI will show
        }
      }
    } catch {
      toast('템플릿 필드를 불러오지 못했습니다.', 'error');
    } finally {
      setFieldsLoading(false);
    }
  };

  const goToEditor = () => {
    if (!templateId) {
      toast('템플릿을 선택해주세요.', 'error');
      return;
    }
    loadTemplateFields();
    setStep('editor');
  };

  const goToInfo = () => {
    setStep('info');
  };

  const handleSubmit = async () => {
    const rawAmount = totalAmount.replace(/,/g, '');
    if (!rawAmount || isNaN(Number(rawAmount)) || Number(rawAmount) <= 0) {
      toast('계약 금액을 올바르게 입력해주세요.', 'error');
      return;
    }
    if (!customerName.trim()) {
      toast('고객명을 입력해주세요.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        eventId: id,
        templateId,
        totalAmount: Number(rawAmount),
        customerName: customerName.trim(),
      };

      const contract = extractData<Contract>(await api.post('/contracts', payload));
      setCreatedContract(contract);
      setStep('qr');
      toast('계약이 생성되었습니다.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || '계약 생성에 실패했습니다.';
      toast(Array.isArray(msg) ? msg[0] : msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep('select');
    setCreatedContract(null);
    setTotalAmount('');
    setCustomerName('');
    setCopied(false);
    setShortCodeCopied(false);
    setFields([]);
    setTemplateImageUrl('');
    setImageError(false);
  };

  const currentStepIndex = STEPS.indexOf(step);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 bg-white rounded-2xl animate-pulse" />
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div>
        <PageHeader title="새 계약 생성" backHref={`/partner/events/${id}`} />
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
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="새 계약 생성"
        backHref={step === 'select' ? `/partner/events/${id}` : undefined}
        subtitle={STEP_LABELS[step]}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6 px-1">
        {STEPS.map((s, i) => {
          const Icon = STEP_ICONS[s];
          const isActive = i === currentStepIndex;
          const isCompleted = i < currentStepIndex;
          return (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive ? 'bg-blue-100 text-blue-700' :
                isCompleted ? 'bg-green-50 text-green-600' :
                'bg-gray-50 text-gray-400'
              }`}>
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
                <span className="sm:hidden">{i + 1}</span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className={`w-4 h-4 mx-1 shrink-0 ${isCompleted ? 'text-green-400' : 'text-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Template Selection */}
      {step === 'select' && (
        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                계약서 템플릿을 선택하세요
              </label>
              <div className="space-y-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplateId(t.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                      templateId === t.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      templateId === t.id ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <FileText className={`w-5 h-5 ${templateId === t.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${templateId === t.id ? 'text-blue-900' : 'text-gray-900'}`}>
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t.fileType?.toUpperCase()} / {t.fields?.length || 0}개 필드
                      </p>
                    </div>
                    {templateId === t.id && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => router.back()}>
                취소
              </Button>
              <Button onClick={goToEditor} disabled={!templateId}>
                다음: 계약서 확인
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Template Editor / Preview */}
      {step === 'editor' && (
        <div className="space-y-4">
          {fieldsLoading ? (
            <div className="h-96 bg-white rounded-2xl animate-pulse" />
          ) : (
            <>
              {/* Template Preview */}
              <Card>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {selectedTemplate?.name} - 계약서 미리보기
                </h3>
                <div className="relative bg-white border-2 border-gray-100 rounded-xl overflow-hidden">
                  {templateImageUrl && !imageError && selectedTemplate?.fileType !== 'pdf' ? (
                    <div className="relative">
                      <img
                        src={templateImageUrl}
                        alt="계약서 템플릿"
                        className="w-full"
                        onError={() => setImageError(true)}
                      />
                      {/* Overlay fields */}
                      <div className="absolute inset-0">
                        {fields
                          .filter(f => f.positionX > 0 || f.positionY > 0)
                          .map((field) => (
                            <div
                              key={field.id}
                              className="absolute border-2 border-blue-300/60 bg-blue-50/50 rounded flex items-center px-1 text-xs"
                              style={{
                                left: `${field.positionX}%`,
                                top: `${field.positionY}%`,
                                width: `${field.width}%`,
                                height: `${field.height}%`,
                                minHeight: '20px',
                              }}
                            >
                              <span className="truncate text-blue-700">{field.label}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : templateImageUrl && !imageError && selectedTemplate?.fileType === 'pdf' ? (
                    <iframe
                      src={templateImageUrl}
                      className="w-full"
                      style={{ minHeight: '500px', height: '60vh' }}
                      title="계약서 템플릿"
                    />
                  ) : (
                    <div className="flex items-center justify-center py-20 text-gray-300">
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">템플릿 미리보기</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Field Summary */}
              {fields.length > 0 && (
                <Card padding="sm">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">입력 필드 ({fields.length}개)</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {fields.map((f) => (
                      <span
                        key={f.id}
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs ${
                          f.isRequired ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {f.label}
                        {f.isRequired && <span className="text-red-400 ml-0.5">*</span>}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              <div className="flex justify-between gap-3">
                <Button variant="secondary" onClick={() => setStep('select')}>
                  이전
                </Button>
                <Button onClick={goToInfo}>
                  서명하기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Customer Info */}
      {step === 'info' && (
        <Card>
          <div className="space-y-6">
            <div className="text-center pb-4 border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">고객 정보 입력</h3>
              <p className="text-xs text-gray-400 mt-1">QR 코드 생성 전 고객 정보를 입력해주세요</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                고객명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="고객 이름을 입력하세요"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                계약 금액 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={totalAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setTotalAmount(raw ? Number(raw).toLocaleString('ko-KR') : '');
                  }}
                  placeholder="금액을 입력하세요"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">원</span>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">템플릿</span>
                <span className="font-medium text-gray-900">{selectedTemplate?.name}</span>
              </div>
              {customerName.trim() && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">고객명</span>
                  <span className="font-medium text-gray-900">{customerName.trim()}</span>
                </div>
              )}
              {totalAmount && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">계약금액</span>
                  <span className="font-bold text-gray-900">{totalAmount}원</span>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setStep('editor')}>
                이전
              </Button>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={!totalAmount || !customerName.trim()}
              >
                다음: QR 코드 생성
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: QR Code */}
      {step === 'qr' && createdContract && (
        <Card>
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">계약이 생성되었습니다</h3>
            <p className="text-sm text-gray-500 mb-6">
              고객에게 QR 코드를 보여주거나 안내코드를 전달하세요.
            </p>

            <div className="w-full max-w-sm space-y-4">
              {/* Short Code */}
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

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-500">고객명</span>
                <span className="font-medium text-gray-900">
                  {createdContract.customerName || customerName}
                </span>
              </div>

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

              <div className="bg-yellow-50 rounded-xl p-4 text-xs text-yellow-700">
                <p className="font-medium mb-1">고객 서명 프로세스</p>
                <p>고객이 QR 코드를 스캔하면 본인 단말기에서 계약서를 확인하고 서명 및 본인인증을 진행합니다.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                variant="outline"
                onClick={() => router.push(`/partner/events/${id}`)}
              >
                행사로 돌아가기
              </Button>
              <Button onClick={resetAll}>
                새 계약 생성
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
