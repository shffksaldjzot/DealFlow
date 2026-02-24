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
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">{optionName}</h3>
              <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="p-1.5 hover:bg-gray-100 rounded-lg">
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
                className="w-full rounded-xl border border-gray-200"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
