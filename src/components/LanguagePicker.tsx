import React, { useEffect, useRef, useState } from 'react';
import { Check, Languages } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { Locale } from '../utils/storage';

const LOCALE_OPTIONS: Array<{
  id: Locale;
  label: string;
  subtitle: string;
}> = [
  { id: 'zh-TW', label: '正體中文', subtitle: 'zh-TW' },
  { id: 'en', label: 'English', subtitle: 'en' },
  { id: 'ja', label: '日本語', subtitle: 'ja' },
];

export const LanguagePicker: React.FC = () => {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', onDocClick);
    return () => window.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={t.switchLangTitle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-xs font-medium text-white/90 transition hover:bg-white/20"
      >
        <Languages className="h-3.5 w-3.5 opacity-85" />
        <span>{t.langShort}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-1.5 text-[var(--slack-text)] shadow-2xl"
        >
          {LOCALE_OPTIONS.map((opt) => {
            const active = opt.id === locale;
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setLocale(opt.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                  active
                    ? 'bg-[var(--slack-accent)]/10 text-[var(--slack-link)]'
                    : 'hover:bg-[var(--slack-surface-hover)]'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold">
                    {opt.label}
                  </div>
                  <div className="truncate text-[11px] text-[var(--slack-text-muted)]">
                    {opt.subtitle}
                  </div>
                </div>
                {active && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
