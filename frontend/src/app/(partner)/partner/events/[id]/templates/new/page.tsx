'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/layout/PageHeader';
import FileUpload from '@/components/common/FileUpload';
import { useToast } from '@/components/ui/Toast';
import { Edit3 } from 'lucide-react';

export default function NewTemplatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [fileId, setFileId] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getFileType = (fName: string): 'pdf' | 'jpg' | 'png' => {
    const ext = fName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'png') return 'png';
    return 'jpg';
  };

  const handleUploadComplete = (uploadedFileId: string, uploadedFileName: string) => {
    setFileId(uploadedFileId);
    setFileName(uploadedFileName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast('템플릿 이름을 입력해주세요.', 'error');
      return;
    }

    if (!fileId) {
      toast('계약서 파일을 업로드해주세요.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        eventId: id,
        name: name.trim(),
        pageCount: 1,
        fileId,
        fileType: getFileType(fileName),
      };

      const template = extractData<{ id: string }>(await api.post('/contract-templates', payload));

      toast('템플릿이 등록되었습니다. 필드를 설정하세요.', 'success');
      // Redirect to field editor so user can set up fields immediately
      router.push(`/partner/events/${id}/templates/${template.id}`);
    } catch {
      toast('템플릿 등록에 실패했습니다.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="템플릿 등록" backHref={`/partner/events/${id}`} />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              템플릿 이름 <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 행사 참여 동의서"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* File Upload */}
          <div>
            <FileUpload
              label="계약서 파일"
              accept=".pdf,.jpg,.jpeg,.png"
              maxSizeMB={10}
              helperText="PDF, JPG, PNG 파일을 업로드해주세요."
              purpose="contract_template"
              onUploadComplete={handleUploadComplete}
            />
            {fileId && (
              <p className="text-xs text-success mt-1">
                파일 업로드 완료: {fileName}
              </p>
            )}
          </div>

          {/* Info about next step */}
          {fileId && (
            <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
              <Edit3 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                등록 후 텍스트박스, 체크박스, 서명 등의 필드를 템플릿 위에 배치할 수 있습니다.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              취소
            </Button>
            <Button type="submit" loading={submitting} disabled={!name.trim() || !fileId}>
              등록 후 필드 설정
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
