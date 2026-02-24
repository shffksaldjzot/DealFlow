'use client';
import { useState, useRef, DragEvent } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import api, { extractData } from '@/lib/api';

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
  onUploadComplete?: (fileId: string, fileName: string, file?: File) => void;
  purpose?: string;
}

export default function FileUpload({
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMB = 10,
  label,
  helperText,
  onUploadComplete,
  purpose = 'other',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', purpose);

      const result = extractData<{ id: string; originalName: string }>(
        await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      );

      setUploadedFile({ id: result.id, name: result.originalName });
      onUploadComplete?.(result.id, result.originalName, file);
    } catch {
      setError('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      {uploadedFile ? (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
          <File className="w-5 h-5 text-blue-600 shrink-0" />
          <span className="text-sm text-blue-800 truncate flex-1">
            {uploadedFile.name}
          </span>
          <button onClick={removeFile} className="p-1 hover:bg-blue-100 rounded">
            <X className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all',
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50',
            uploading && 'pointer-events-none opacity-60',
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <Upload className={cn('w-8 h-8 mb-2', isDragging ? 'text-blue-500' : 'text-gray-400')} />
          {uploading ? (
            <p className="text-sm text-gray-500">업로드 중...</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                파일을 드래그하거나 클릭하여 선택
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {accept.replace(/\./g, '').toUpperCase()} / 최대 {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}
      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-400">{helperText}</p>
      )}
    </div>
  );
}
