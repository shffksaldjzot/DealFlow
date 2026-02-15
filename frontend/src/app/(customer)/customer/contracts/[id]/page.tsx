'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import { FileText, Download, Building2, Calendar, PenLine, ZoomIn, X } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Contract } from '@/types/contract';

export default function CustomerContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [templateImageUrl, setTemplateImageUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    api.get(`/customer/contracts/${id}`)
      .then((res) => {
        const data = extractData<Contract>(res);
        setContract(data);
        // Fetch template image
        if (data.template?.fileId) {
          api.get(`/files/${data.template.fileId}/download`, { responseType: 'blob' })
            .then((fileRes) => {
              const blob = fileRes.data as Blob;
              if (blob.size > 0) {
                setTemplateImageUrl(URL.createObjectURL(blob));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setLightboxOpen(false);
  }, []);

  useEffect(() => {
    if (lightboxOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, handleKeyDown]);

  if (loading) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref="/customer/contracts" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div>
        <PageHeader title="계약 상세" backHref="/customer/contracts" />
        <Card><p className="text-center text-gray-500 py-8">계약서를 찾을 수 없습니다</p></Card>
      </div>
    );
  }

  // Build field value map for overlay
  const fieldValueMap: Record<string, string> = {};
  contract.fieldValues?.forEach((fv: any) => {
    if (fv.field?.id) fieldValueMap[fv.field.id] = fv.value;
  });

  const signatureData = contract.signatures?.[0]?.signatureData;
  const signatureField = contract.template?.fields?.find(f => f.fieldType === 'signature');

  const renderContractImage = (isLightbox = false) => {
    if (!templateImageUrl || imgError) return null;
    const isPdf = contract.template?.fileType === 'pdf';

    if (isPdf) {
      return (
        <iframe
          src={templateImageUrl}
          className="w-full"
          style={{ minHeight: isLightbox ? '80vh' : '400px' }}
          title="계약서"
        />
      );
    }

    return (
      <div className="relative">
        <img
          src={templateImageUrl}
          alt="계약서"
          className="w-full"
          onError={() => setImgError(true)}
        />
        {/* Field value overlays */}
        <div className="absolute inset-0">
          {contract.template?.fields
            ?.filter(f => f.fieldType !== 'signature' && (f.positionX > 0 || f.positionY > 0))
            .map((field) => {
              const value = fieldValueMap[field.id];
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
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${value === 'true' ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}>
                      {value === 'true' && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                  ) : (
                    <span className={`text-gray-900 font-medium truncate ${isLightbox ? 'text-sm' : 'text-xs'}`}>
                      {value}
                    </span>
                  )}
                </div>
              );
            })}

          {/* Signature overlay */}
          {signatureData && signatureField && (signatureField.positionX > 0 || signatureField.positionY > 0) && (
            <div
              className="absolute"
              style={{
                left: `${signatureField.positionX}%`,
                top: `${signatureField.positionY}%`,
                width: `${signatureField.width}%`,
                height: `${signatureField.height}%`,
              }}
            >
              <img
                src={signatureData}
                alt="서명"
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="계약 상세" backHref="/customer/contracts" />

      {/* Status & Contract Number */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <Badge status={contract.status} />
          <span className="text-xs text-gray-400 font-mono">{contract.contractNumber}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          {contract.event?.name || '계약서'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {formatDateTime(contract.createdAt)}
        </p>
      </Card>

      {/* Contract Image Preview */}
      {templateImageUrl && !imgError && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">계약서 미리보기</h3>
            <button
              onClick={() => setLightboxOpen(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              크게 보기
            </button>
          </div>
          <div
            className="relative rounded-xl border border-gray-200 overflow-hidden cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          >
            {renderContractImage(false)}
          </div>
        </Card>
      )}

      {/* Signature (if not on template or no template image) */}
      {signatureData && (!signatureField || !templateImageUrl) && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">전자서명</h3>
          <div className="bg-gray-50 rounded-xl p-4 flex justify-center">
            <img src={signatureData} alt="서명" className="max-h-24 object-contain" />
          </div>
          {contract.signatures?.[0]?.signedAt && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              {formatDateTime(contract.signatures[0].signedAt)}
            </p>
          )}
        </Card>
      )}

      {/* Contract Info */}
      <Card className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">계약 정보</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">협력업체</p>
              <p className="text-sm font-medium text-gray-900">{contract.partner?.name || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-400">이벤트</p>
              <p className="text-sm font-medium text-gray-900">{contract.event?.name || '-'}</p>
            </div>
          </div>
          {contract.totalAmount && (
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">계약 금액</p>
                <p className="text-sm font-bold text-blue-600">{formatCurrency(contract.totalAmount)}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Filled Field Values */}
      {contract.fieldValues && contract.fieldValues.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">입력 내용</h3>
          <div className="space-y-2">
            {contract.fieldValues.map((fv: any) => (
              <div key={fv.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{fv.field?.label || '항목'}</span>
                <span className="text-sm font-medium text-gray-900">{fv.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Signatures info */}
      {contract.signatures && contract.signatures.length > 0 && (
        <Card className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">서명 정보</h3>
          {contract.signatures.map((sig: any) => (
            <div key={sig.id} className="flex items-center gap-3">
              <PenLine className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">전자서명 완료</p>
                <p className="text-xs text-gray-400">{formatDateTime(sig.signedAt)}</p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2 mt-6">
        {contract.signedPdfFileId && (
          <Button
            fullWidth
            size="lg"
            onClick={() => window.open(`/api/files/${contract.signedPdfFileId}/download`, '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            계약서 PDF 다운로드
          </Button>
        )}
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
