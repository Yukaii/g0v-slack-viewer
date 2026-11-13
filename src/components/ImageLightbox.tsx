import React, { useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';
import type { MessageFile } from '../types';
import { formatFileSize } from '../utils/format';

interface ImageLightboxProps {
  file: MessageFile | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  file,
  onClose,
}) => {
  useEffect(() => {
    if (!file) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  const src = file.fullUrl || file.thumbUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-[92vw] flex-col overflow-hidden rounded-xl border border-white/15 bg-[#1a1d21] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{file.title}</div>
            {(file.filetype || file.size) && (
              <div className="text-xs text-white/60">
                {[file.filetype?.toUpperCase(), formatFileSize(file.size)]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center overflow-auto p-4">
          <img
            src={src}
            alt={file.title}
            className="max-h-[76vh] max-w-full rounded object-contain"
          />
        </div>
      </div>
    </div>
  );
};
