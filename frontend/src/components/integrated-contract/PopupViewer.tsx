'use client';
import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface PopupViewerProps {
  content: string;
  optionName: string;
}

function parseContent(content: string): { text: string; image: string | null } {
  const separator = '\n---IMAGE---\n';
  const idx = content.indexOf(separator);
  if (idx === -1) return { text: content, image: null };
  return { text: content.slice(0, idx), image: content.slice(idx + separator.length) };
}

export default function PopupViewer({ content, optionName }: PopupViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!content) return null;

  const { text, image } = parseContent(content);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
        className="p-0.5 text-blue-400 hover:text-blue-600 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-sm sm:mx-4 space-y-3 animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{optionName}</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            {text && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {text}
              </p>
            )}
            {image && (
              <img
                src={image}
                alt={optionName}
                className="w-full rounded-lg border border-gray-100"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
