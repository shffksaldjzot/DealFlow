'use client';
import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface PopupContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  disabled?: boolean;
}

export default function PopupContentEditor({
  content,
  onChange,
  disabled,
}: PopupContentEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(content);

  const handleOpen = () => {
    setDraft(content);
    setIsOpen(true);
  };

  const handleSave = () => {
    onChange(draft);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={disabled}
        className={`p-1 rounded-lg transition-colors ${
          content
            ? 'text-blue-500 hover:bg-blue-50'
            : 'text-gray-300 hover:bg-gray-50 hover:text-gray-500'
        }`}
        title="팝업 콘텐츠 편집"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">팝업 콘텐츠</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              고객이 [?] 아이콘을 클릭하면 표시되는 상세 설명입니다.
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="옵션에 대한 상세 설명을 입력하세요..."
              rows={6}
              disabled={disabled}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSave} disabled={disabled}>
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
