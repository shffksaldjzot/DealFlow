'use client';
import { useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface FloorPlanViewerProps {
  fileId?: string;
  typeName: string;
}

export default function FloorPlanViewer({ fileId, typeName }: FloorPlanViewerProps) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!fileId) {
    return (
      <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center">
        <p className="text-sm text-gray-400">평면도 이미지가 없습니다</p>
      </div>
    );
  }

  const imageUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/files/${fileId}`;

  return (
    <>
      <div className="relative group">
        <img
          src={imageUrl}
          alt={`${typeName} 평면도`}
          className="w-full rounded-xl object-contain bg-gray-50 max-h-64"
        />
        <button
          onClick={() => setFullscreen(true)}
          className="absolute top-2 right-2 p-2 bg-white/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        >
          <Maximize2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white/20 rounded-lg hover:bg-white/30"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={imageUrl}
            alt={`${typeName} 평면도`}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}
