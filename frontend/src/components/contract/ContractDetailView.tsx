'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { ZoomIn, X, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { API_BASE_URL } from '@/lib/api';
import type { Contract } from '@/types/contract';

interface ContractDetailViewProps {
  contract: Contract;
  templateImageUrl: string | null;
}

export default function ContractDetailView({ contract, templateImageUrl }: ContractDetailViewProps) {
  const [imgError, setImgError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [jpegExporting, setJpegExporting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Build field value map
  const fieldValueMap: Record<string, string> = {};
  contract.fieldValues?.forEach((fv) => {
    if (fv.field?.id) fieldValueMap[fv.field.id] = fv.value;
  });

  const signatureData = contract.signatures?.[0]?.signatureData;
  const signatureField = contract.template?.fields?.find(f => f.fieldType === 'signature');

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

  const handlePdfDownload = () => {
    if (contract.signedPdfFileId) {
      window.open(`${API_BASE_URL}/files/${contract.signedPdfFileId}/download`, '_blank');
    }
  };

  const handleJpegDownload = async () => {
    if (!overlayRef.current) return;
    setJpegExporting(true);
    try {
      const { toJpeg } = await import('html-to-image');
      const dataUrl = await toJpeg(overlayRef.current, { quality: 0.95, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `contract-${contract.contractNumber}.jpeg`;
      link.href = dataUrl;
      link.click();
    } catch {
      // Silently fail if export not available
    } finally {
      setJpegExporting(false);
    }
  };

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
      <div className="relative" ref={isLightbox ? undefined : overlayRef} style={{ aspectRatio: '210/297' }}>
        <img
          src={templateImageUrl}
          alt="계약서"
          className="absolute inset-0 w-full h-full object-fill"
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
                    <span
                      className="text-gray-900 font-medium truncate"
                      style={{ fontSize: 'clamp(8px, 1.5vw, 14px)' }}
                    >
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

  const isSigned = contract.status === 'signed' || contract.status === 'completed';

  return (
    <>
      {/* Contract Image Preview */}
      {templateImageUrl && !imgError && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
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
        </div>
      )}

      {/* Signature display (if not on template or no template image) */}
      {signatureData && (!signatureField || !templateImageUrl) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">전자서명</h3>
          <div className="bg-gray-50 rounded-xl p-4 flex justify-center">
            <img src={signatureData} alt="서명" className="max-h-24 object-contain" />
          </div>
        </div>
      )}

      {/* Download Buttons */}
      {(contract.signedPdfFileId || (templateImageUrl && !imgError && contract.template?.fileType !== 'pdf')) && (
        <div className="space-y-2 mb-4">
          {contract.signedPdfFileId && (
            <Button fullWidth size="lg" onClick={handlePdfDownload}>
              <Download className="w-4 h-4 mr-2" />
              계약서 PDF 다운로드
            </Button>
          )}
          {templateImageUrl && !imgError && contract.template?.fileType !== 'pdf' && (
            <Button fullWidth size="lg" variant="secondary" onClick={handleJpegDownload} loading={jpegExporting}>
              <Download className="w-4 h-4 mr-2" />
              계약서 이미지 다운로드
            </Button>
          )}
        </div>
      )}

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
    </>
  );
}
