import React, { useEffect, useRef, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { APP_THEMES, getThemeMeta, type AppThemeId } from '../utils/themes';

interface ThemePickerProps {
  theme: AppThemeId;
  onSelectTheme: (id: AppThemeId) => void;
}

export const ThemePicker: React.FC<ThemePickerProps> = ({
  theme,
  onSelectTheme,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = getThemeMeta(theme);

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
        title={`Theme: ${current.name}`}
        className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs font-medium text-white/90 transition hover:bg-white/20"
      >
        <span
          className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40"
          style={{ backgroundColor: current.swatchAccent }}
        />
        <Palette className="h-3.5 w-3.5 opacity-80" />
        <span className="hidden lg:inline">{current.name}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-1.5 text-[var(--slack-text)] shadow-2xl">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-[var(--slack-text-muted)] uppercase">
            g0v Themes
          </div>
          {APP_THEMES.map((item) => {
            const active = item.id === theme;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTheme(item.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${
                  active
                    ? 'bg-[var(--slack-accent)]/10 text-[var(--slack-link)]'
                    : 'hover:bg-[var(--slack-surface-hover)]'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 overflow-hidden rounded-md border border-black/15 shadow-2xs">
                    <span
                      className="h-full w-1/2"
                      style={{ backgroundColor: item.swatchSidebar }}
                    />
                    <span
                      className="flex h-full w-1/2 items-end justify-end p-0.5"
                      style={{ backgroundColor: item.swatchBg }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.swatchAccent }}
                      />
                    </span>
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold">
                      {item.name}
                    </div>
                    <div className="truncate text-[11px] text-[var(--slack-text-muted)]">
                      {item.subtitle}
                    </div>
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
