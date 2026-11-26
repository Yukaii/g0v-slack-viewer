import React, { useEffect, useState } from 'react';
import { ExternalLink, Loader2, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
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
  const { t } = useI18n();
  const imageSrc = file?.previewUrl || file?.fullUrl || file?.thumbUrl || '';
  const fullSrc = file?.fullUrl || imageSrc;
  const placeholderSrc =
    file?.thumbUrl && file.thumbUrl !== imageSrc ? file.thumbUrl : '';
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const loaded = imageSrc !== '' && loadedSrc === imageSrc;

  useEffect(() => {
    if (!file) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [file, onClose]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 pt-[calc(1rem+var(--pwa-top-inset))] pb-[calc(1rem+var(--safe-bottom))] backdrop-blur-xs"
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
              href={fullSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t.lightbox.openOriginal}
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label={t.lightbox.closePreview}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="relative grid min-h-[160px] min-w-[160px] place-items-center overflow-auto p-4">
          {placeholderSrc && (
            <img
              src={placeholderSrc}
              alt=""
              aria-hidden="true"
              className={`col-start-1 row-start-1 max-h-[76vh] max-w-full rounded object-contain transition-opacity duration-150 ${
                loaded ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )}
          <img
            src={imageSrc}
            alt={file.title}
            decoding="async"
            onLoad={() => setLoadedSrc(imageSrc)}
            onError={() => setLoadedSrc(imageSrc)}
            className={`col-start-1 row-start-1 max-h-[76vh] max-w-full rounded object-contain transition-opacity duration-150 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {!loaded && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white/70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
