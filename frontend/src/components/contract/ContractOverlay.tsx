'use client';
import { useState } from 'react';
import type { ContractField } from '@/types/contract';

interface ContractOverlayProps {
  fileUrl: string;
  fileType: 'pdf' | 'jpg' | 'png';
  fields: ContractField[];
  fieldValues: Record<string, string>;
  onFieldChange: (fieldId: string, value: string) => void;
}

export default function ContractOverlay({
  fileUrl,
  fileType,
  fields,
  fieldValues,
  onFieldChange,
}: ContractOverlayProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Filter out signature fields (handled separately)
  const overlayFields = fields
    .filter((f) => f.fieldType !== 'signature')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Check if we have positioned fields (positionX/Y > 0)
  const hasPositionedFields = overlayFields.some(
    (f) => f.positionX > 0 || f.positionY > 0,
  );

  return (
    <div className="space-y-4">
      {/* Template background with overlay fields */}
      <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
        {fileType === 'pdf' ? (
          <iframe
            src={fileUrl}
            className="w-full"
            style={{ minHeight: '600px', height: '80vh' }}
            title="계약서 템플릿"
          />
        ) : !imgError ? (
          <img
            src={fileUrl}
            alt="계약서 템플릿"
            className="w-full"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex items-center justify-center py-20 text-gray-300">
            <p className="text-sm">이미지를 불러올 수 없습니다</p>
          </div>
        )}

        {/* Positioned overlay fields (only if fields have position data) */}
        {hasPositionedFields && fileType !== 'pdf' && imgLoaded && (
          <div className="absolute inset-0">
            {overlayFields
              .filter((f) => f.positionX > 0 || f.positionY > 0)
              .map((field) => (
                <div
                  key={field.id}
                  className="absolute"
                  style={{
                    left: `${field.positionX}%`,
                    top: `${field.positionY}%`,
                    width: field.width ? `${field.width}%` : '20%',
                    height: field.height ? `${field.height}%` : 'auto',
                  }}
                >
                  {field.fieldType === 'checkbox' ? (
                    <input
                      type="checkbox"
                      checked={fieldValues[field.id] === 'true'}
                      onChange={(e) =>
                        onFieldChange(field.id, e.target.checked ? 'true' : 'false')
                      }
                      className="w-5 h-5 rounded border-gray-300 text-blue-600"
                    />
                  ) : (
                    <input
                      type={field.fieldType === 'date' ? 'date' : 'text'}
                      placeholder={field.placeholder || field.label}
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => onFieldChange(field.id, e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Form fields below the template (for fields without position or for PDFs) */}
      {overlayFields.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">계약 정보 입력</h4>
          {overlayFields
            .filter((f) => !hasPositionedFields || fileType === 'pdf' || (f.positionX === 0 && f.positionY === 0))
            .map((field) => (
              <div key={field.id}>
                {field.fieldType === 'checkbox' ? (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fieldValues[field.id] === 'true'}
                      onChange={(e) =>
                        onFieldChange(field.id, e.target.checked ? 'true' : 'false')
                      }
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {field.label}
                      {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </span>
                  </label>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type={
                        field.fieldType === 'amount' || field.fieldType === 'number'
                          ? 'number'
                          : field.fieldType === 'date'
                            ? 'date'
                            : 'text'
                      }
                      placeholder={field.placeholder || ''}
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => onFieldChange(field.id, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
