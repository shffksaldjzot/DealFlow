'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  const [formExpanded, setFormExpanded] = useState(false);

  // Filter out signature fields (handled separately)
  const overlayFields = fields
    .filter((f) => f.fieldType !== 'signature')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Fields with position data (show on image)
  const positionedFields = overlayFields.filter(
    (f) => f.positionX > 0 || f.positionY > 0,
  );

  // Fields without position data (show in form)
  const formFields = overlayFields.filter(
    (f) => !f.positionX && !f.positionY,
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

        {/* Positioned overlay fields on image */}
        {positionedFields.length > 0 && fileType !== 'pdf' && imgLoaded && (
          <div className="absolute inset-0">
            {positionedFields.map((field) => (
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
                  <label className="flex items-center gap-1.5 bg-white/90 rounded px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={fieldValues[field.id] === 'true'}
                      onChange={(e) =>
                        onFieldChange(field.id, e.target.checked ? 'true' : 'false')
                      }
                      className="w-5 h-5 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-xs text-gray-700 truncate">{field.label}</span>
                  </label>
                ) : (
                  <input
                    type={field.fieldType === 'date' ? 'date' : 'text'}
                    inputMode={field.fieldType === 'number' || field.fieldType === 'amount' ? 'numeric' : undefined}
                    placeholder={field.placeholder || field.label}
                    value={
                      (field.fieldType === 'number' || field.fieldType === 'amount') && fieldValues[field.id]
                        ? Number(fieldValues[field.id]).toLocaleString('ko-KR')
                        : fieldValues[field.id] || ''
                    }
                    onChange={(e) => {
                      if (field.fieldType === 'number' || field.fieldType === 'amount') {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        onFieldChange(field.id, raw);
                      } else {
                        onFieldChange(field.id, e.target.value);
                      }
                    }}
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form fields below the template (for fields without position or for PDFs) */}
      {(formFields.length > 0 || (fileType === 'pdf' && overlayFields.length > 0)) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setFormExpanded(v => !v)}
          >
            <h4 className="text-sm font-semibold text-gray-700">계약 정보 입력</h4>
            {formExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {formExpanded && <div className="space-y-4 mt-4">
          {(fileType === 'pdf' ? overlayFields : formFields).map((field) => (
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
                    {field.isRequired && <span className="text-error ml-1">*</span>}
                  </span>
                </label>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.isRequired && <span className="text-error ml-1">*</span>}
                  </label>
                  <input
                    type={field.fieldType === 'date' ? 'date' : 'text'}
                    inputMode={field.fieldType === 'number' || field.fieldType === 'amount' ? 'numeric' : undefined}
                    placeholder={field.placeholder || ''}
                    value={
                      (field.fieldType === 'number' || field.fieldType === 'amount') && fieldValues[field.id]
                        ? Number(fieldValues[field.id]).toLocaleString('ko-KR')
                        : fieldValues[field.id] || ''
                    }
                    onChange={(e) => {
                      if (field.fieldType === 'number' || field.fieldType === 'amount') {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        onFieldChange(field.id, raw);
                      } else {
                        onFieldChange(field.id, e.target.value);
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          ))}
          </div>}
        </div>
      )}
    </div>
  );
}
