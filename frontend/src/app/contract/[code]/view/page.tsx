'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import ContractOverlay from '@/components/contract/ContractOverlay';
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Start filling
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

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSaveAndSign = async () => {
    // Validate required fields
    const missing = fields
      .filter((f) => f.isRequired && f.fieldType !== 'signature' && !fieldValues[f.id])
      .map((f) => f.label);

    if (missing.length > 0) {
      toast(`필수 항목을 작성해주세요: ${missing.join(', ')}`, 'error');
      return;
    }

    if (!agreed) {
      toast('계약 내용에 동의해주세요.', 'error');
      return;
    }

    setSaving(true);
    try {
      // Save field values
      const fvArray = Object.entries(fieldValues).map(([fieldId, value]) => ({
        fieldId,
        value,
      }));
      await api.post(`/contract-flow/${code}/fill`, { fieldValues: fvArray });

      // Navigate to signature page
      router.push(`/contract/${code}/sign`);
    } catch {
      toast('저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const hasTemplateFile = contract?.template?.fileId;
  const [templateFileUrl, setTemplateFileUrl] = useState<string | null>(null);
  const [templateImgError, setTemplateImgError] = useState(false);

  useEffect(() => {
    if (!hasTemplateFile || !code) return;
    let revoked = false;
    api.get(`/contract-flow/${code}/template-file`, { responseType: 'blob' })
      .then((res) => {
        if (revoked) return;
        const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
        setTemplateFileUrl(URL.createObjectURL(blob));
        setTemplateImgError(false);
      })
      .catch(() => {});
    return () => {
      revoked = true;
    };
  }, [hasTemplateFile, code]);

  const renderFieldsForm = () => (
    <Card padding="lg">
      <h3 className="font-bold text-gray-900 mb-4">계약 정보 입력</h3>
      <div className="space-y-4">
        {fields
          .filter((f) => f.fieldType !== 'signature')
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((field) => (
            <div key={field.id}>
              {field.fieldType === 'checkbox' ? (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldValues[field.id] === 'true'}
                    onChange={(e) =>
                      handleFieldChange(field.id, e.target.checked ? 'true' : 'false')
                    }
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {field.label}
                    {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                  </span>
                </label>
              ) : (
                <Input
                  label={`${field.label}${field.isRequired ? ' *' : ''}`}
                  type={field.fieldType === 'amount' || field.fieldType === 'number' ? 'number' : field.fieldType === 'date' ? 'date' : 'text'}
                  placeholder={field.placeholder || ''}
                  value={fieldValues[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                />
              )}
            </div>
          ))}
      </div>
    </Card>
  );

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

        {/* Template file preview (read-only) + field form below */}
        {templateFileUrl && contract?.template?.fileType ? (
          <>
            {/* Template file preview */}
            <Card padding="lg">
              <h3 className="font-bold text-gray-900 mb-3">계약서 미리보기</h3>
              {contract.template.fileType === 'pdf' ? (
                <iframe
                  src={templateFileUrl}
                  className="w-full rounded-lg border border-gray-200"
                  style={{ height: '500px' }}
                  title="계약서 미리보기"
                />
              ) : !templateImgError ? (
                <img
                  src={templateFileUrl}
                  alt="계약서 미리보기"
                  className="w-full rounded-lg border border-gray-200"
                  onError={() => setTemplateImgError(true)}
                />
              ) : (
                <div className="flex items-center justify-center py-16 text-gray-300 border border-gray-200 rounded-lg">
                  <p className="text-sm">이미지를 불러올 수 없습니다</p>
                </div>
              )}
            </Card>

            {/* Overlay mode for field positioning */}
            <ContractOverlay
              fileUrl={templateFileUrl}
              fileType={contract.template.fileType}
              fields={fields}
              fieldValues={fieldValues}
              onFieldChange={handleFieldChange}
            />

            {/* Separate form for fields without overlay positions */}
            {fields.filter(
              (f) => f.fieldType !== 'signature' && (!f.positionX && !f.positionY),
            ).length > 0 && renderFieldsForm()}
          </>
        ) : (
          renderFieldsForm()
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
                계약 내용에 동의합니다
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
          loading={saving}
          disabled={!agreed}
        >
          서명하기
        </Button>
      </div>
    </div>
  );
}
