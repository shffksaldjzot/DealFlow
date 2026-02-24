'use client';
import { useState, useRef } from 'react';
import { HelpCircle, X, ImagePlus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface PopupContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  disabled?: boolean;
}

// Content format: text optionally followed by \n---IMAGE---\nbase64data
function parseContent(content: string): { text: string; image: string | null } {
  const separator = '\n---IMAGE---\n';
  const idx = content.indexOf(separator);
  if (idx === -1) return { text: content, image: null };
  return { text: content.slice(0, idx), image: content.slice(idx + separator.length) };
}

function buildContent(text: string, image: string | null): string {
  if (!image) return text;
  return `${text}\n---IMAGE---\n${image}`;
}

export default function PopupContentEditor({
  content,
  onChange,
  disabled,
}: PopupContentEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    const { text, image } = parseContent(content);
    setDraftText(text);
    setDraftImage(image);
    setIsOpen(true);
  };

  const handleSave = () => {
    onChange(buildContent(draftText, draftImage));
    setIsOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('이미지는 2MB 이하만 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraftImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">팝업 콘텐츠</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              고객이 [?] 아이콘을 클릭하면 표시되는 상세 설명입니다.
            </p>
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="옵션에 대한 상세 설명을 입력하세요..."
              rows={4}
              disabled={disabled}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50"
            />

            {/* Image Upload */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">이미지 (선택)</p>
              {draftImage ? (
                <div className="relative">
                  <img
                    src={draftImage}
                    alt="팝업 이미지"
                    className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => setDraftImage(null)}
                    disabled={disabled}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-error-light"
                  >
                    <Trash2 className="w-4 h-4 text-error" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors disabled:opacity-50"
                >
                  <ImagePlus className="w-5 h-5" />
                  이미지 추가 (2MB 이하)
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

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
