'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ZoomIn, X } from 'lucide-react';
import type { Contract, ContractField } from '@/types/contract';

export default function ContractViewPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [fields, setFields] = useState<ContractField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [templateFileUrl, setTemplateFileUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.post(`/contract-flow/${code}/start`);
        const c = extractData<Contract>(res);
        setContract(c);
        setFields(c.template?.fields || []);

        // Pre-fill existing values
        const existing: Record<string, string> = {};
        (c as any).fieldValues?.forEach((fv: any) => {
          existing[fv.fieldId] = fv.value;
        });
        setFieldValues(existing);
      } catch (err: any) {
        toast(err.response?.data?.message?.[0] || '계약서를 불러올 수 없습니다.', 'error');
        router.push(`/contract/${code}`);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [code, router, toast]);

  const hasTemplateFile = contract?.template?.fileId;

  useEffect(() => {
    if (!hasTemplateFile || !code) return;
    let revoked = false;
    api.get(`/contract-flow/${code}/template-file`, { responseType: 'blob' })
      .then((res) => {
        if (revoked) return;
        const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
        setTemplateFileUrl(URL.createObjectURL(blob));
        setImgError(false);
      })
      .catch(() => {});
    return () => {
      revoked = true;
    };
  }, [hasTemplateFile, code]);

  const handleSaveAndSign = () => {
    if (!agreed) {
      toast('계약 내용에 동의해주세요.', 'error');
      return;
    }
    router.push(`/contract/${code}/sign`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const isPdf = contract?.template?.fileType === 'pdf';

  // Render contract image as read-only with field values overlaid
  const renderContractImage = (isLightbox = false) => {
    if (!templateFileUrl || imgError) return null;

    if (isPdf) {
      return (
        <iframe
          src={templateFileUrl}
          className="w-full"
          style={{ minHeight: isLightbox ? '80vh' : '500px', height: '60vh' }}
          title="계약서"
        />
      );
    }

    return (
      <div className="relative">
        <img
          src={templateFileUrl}
          alt="계약서"
          className="w-full"
          onError={() => setImgError(true)}
        />
        {/* Read-only field value overlays */}
        <div className="absolute inset-0">
          {fields
            .filter(f => f.fieldType !== 'signature' && (f.positionX > 0 || f.positionY > 0))
            .map((field) => {
              const value = fieldValues[field.id];
              if (!value) return null;
              return (
                <div
                  key={field.id}
                  className="absolute flex items-center"
                  style={{
                    left: `${field.positionX}%`,
                    top: `${field.positionY}%`,
                    width: `${field.width}%`,
                    height: `${field.height}%`,
                  }}
                >
                  {field.fieldType === 'checkbox' ? (
                    <span className="text-gray-900" style={{ fontSize: 'clamp(10px, 1.2vw, 16px)' }}>
                      {value === 'true' ? '☑' : '☐'}
                    </span>
                  ) : (
                    <span className={`text-gray-900 font-medium truncate ${isLightbox ? 'text-sm' : 'text-xs'}`}>
                      {(field.fieldType === 'number' || field.fieldType === 'amount') && !isNaN(Number(value))
                        ? Number(value).toLocaleString('ko-KR')
                        : value}
                    </span>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  // Fields without position (show as read-only list for PDF or non-positioned fields)
  const nonPositionedFields = fields
    .filter(f => f.fieldType !== 'signature' && !f.positionX && !f.positionY)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const positionedFieldsWithValues = fields
    .filter(f => f.fieldType !== 'signature' && (f.positionX > 0 || f.positionY > 0) && fieldValues[f.id])
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // For PDFs, show all field values as a list
  const fieldListToShow = isPdf
    ? fields.filter(f => f.fieldType !== 'signature' && fieldValues[f.id]).sort((a, b) => a.sortOrder - b.sortOrder)
    : nonPositionedFields.filter(f => fieldValues[f.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">계약번호</p>
            <p className="text-sm font-bold font-mono">{contract?.contractNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">행사</p>
            <p className="text-sm font-medium">{contract?.event?.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Progress */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="text-blue-600">1. 내용 확인</span>
          <div className="flex-1 h-0.5 bg-gray-200" />
          <span className="text-gray-400">2. 서명</span>
          <div className="flex-1 h-0.5 bg-gray-200" />
          <span className="text-gray-400">3. 완료</span>
        </div>

        {/* Contract Image (read-only) */}
        {templateFileUrl && !imgError && (
          <Card padding="lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">계약서 확인</h3>
              {!isPdf && (
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  크게 보기
                </button>
              )}
            </div>
            <div
              className="rounded-xl border border-gray-200 overflow-hidden cursor-pointer"
              onClick={() => !isPdf && setLightboxOpen(true)}
            >
              {renderContractImage(false)}
            </div>
          </Card>
        )}

        {/* Read-only field values list (for PDFs or non-positioned fields) */}
        {fieldListToShow.length > 0 && (
          <Card padding="lg">
            <h3 className="font-bold text-gray-900 mb-4">계약 정보</h3>
            <div className="space-y-3">
              {fieldListToShow.map((field) => {
                const value = fieldValues[field.id];
                return (
                  <div key={field.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-500">{field.label}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {field.fieldType === 'checkbox'
                        ? (value === 'true' ? '✓' : '-')
                        : (field.fieldType === 'number' || field.fieldType === 'amount') && !isNaN(Number(value))
                          ? Number(value).toLocaleString('ko-KR')
                          : value}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Agreement */}
        <Card padding="lg">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                계약 내용에 동의합니다 <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                위 계약 내용을 확인하였으며, 이에 동의합니다.
              </p>
            </div>
          </label>
        </Card>

        {/* Submit */}
        <Button
          fullWidth
          size="xl"
          onClick={handleSaveAndSign}
          disabled={!agreed}
        >
          서명하기
        </Button>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div
            className="max-w-4xl max-h-[90vh] overflow-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {renderContractImage(true)}
          </div>
        </div>
      )}
    </div>
  );
}
