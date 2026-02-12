'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api, { extractData } from '@/lib/api';
import Button from '@/components/ui/Button';
import PageHeader from '@/components/layout/PageHeader';
import FieldEditor, { type FieldDef } from '@/components/contract/FieldEditor';
import { useToast } from '@/components/ui/Toast';
import { Save } from 'lucide-react';

export default function TemplateFieldEditorPage() {
  const { id: eventId, templateId } = useParams<{ id: string; templateId: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [template, setTemplate] = useState<any>(null);
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateImageUrl, setTemplateImageUrl] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tmpl = extractData<any>(await api.get(`/contract-templates/${templateId}`));
        setTemplate(tmpl);

        // Load existing fields
        const existingFields = extractData<FieldDef[]>(await api.get(`/contract-templates/${templateId}/fields`));
        setFields(existingFields);

        // Get template file URL
        if (tmpl.fileId) {
          setTemplateImageUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/files/${tmpl.fileId}/download`);
        }
      } catch {
        toast('템플릿을 불러오지 못했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [templateId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fieldsToSave = fields.map((f, i) => ({
        fieldType: f.fieldType,
        label: f.label,
        placeholder: f.placeholder || undefined,
        isRequired: f.isRequired,
        pageNumber: f.pageNumber,
        positionX: f.positionX,
        positionY: f.positionY,
        width: f.width,
        height: f.height,
        sortOrder: i,
        defaultValue: f.defaultValue || undefined,
        validationRule: f.validationRule || undefined,
      }));

      await api.post(`/contract-templates/${templateId}/fields`, { fields: fieldsToSave });
      toast('필드가 저장되었습니다.', 'success');
    } catch {
      toast('필드 저장에 실패했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="필드 편집" backHref={`/partner/events/${eventId}`} />
        <div className="h-96 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={template?.name || '필드 편집'}
        subtitle="필드를 추가하고 드래그하여 위치를 지정하세요"
        backHref={`/partner/events/${eventId}`}
        actions={
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4 mr-1" />
            저장
          </Button>
        }
      />

      <div className="flex-1 min-h-0 mt-4">
        <FieldEditor
          fields={fields}
          onChange={setFields}
          templateImageUrl={templateImageUrl}
        />
      </div>
    </div>
  );
}
