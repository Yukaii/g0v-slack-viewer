import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useI18n } from '../i18n/I18nContext';

const UPDATE_INTERVAL_MS = 30 * 60 * 1000; // Check every 30 minutes
const VISIBILITY_THROTTLE_MS = 5 * 60 * 1000; // Min 5 min between focus/visibility checks

export const PwaUpdateBanner: React.FC = () => {
  const { t } = useI18n();
  const [updating, setUpdating] = useState(false);
  const swUrlRef = useRef<string | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const lastCheckAtRef = useRef(0);

  const checkForUpdate = useCallback(async (force = false) => {
    const registration = registrationRef.current;
    const swUrl = swUrlRef.current;
    if (!registration || !swUrl) return;
    if (registration.installing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    const now = Date.now();
    if (!force && now - lastCheckAtRef.current < VISIBILITY_THROTTLE_MS) {
      return;
    }
    lastCheckAtRef.current = now;

    try {
      const resp = await fetch(swUrl, {
        cache: 'no-store',
        headers: {
          cache: 'no-store',
          'cache-control': 'no-cache',
        },
      });
      if (resp.status === 200) {
        await registration.update();
      }
    } catch {
      // Ignore transient network failures while checking for SW updates
    }
  }, []);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      swUrlRef.current = swUrl;
      registrationRef.current = registration ?? null;
      lastCheckAtRef.current = Date.now();
    },
    onRegisterError(error) {
      console.warn('Service worker registration failed:', error);
    },
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void checkForUpdate(true);
    }, UPDATE_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdate(false);
      }
    };

    const onOnline = () => {
      void checkForUpdate(false);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('online', onOnline);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('online', onOnline);
    };
  }, [checkForUpdate]);

  const handleUpdate = useCallback(async () => {
    if (updating) return;
    setUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch (err) {
      console.warn('Failed to apply service worker update:', err);
      setUpdating(false);
    }
  }, [updateServiceWorker, updating]);

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-[calc(1rem+var(--safe-bottom))] left-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-3.5 py-2.5 text-[var(--slack-text)] shadow-xl sm:left-auto sm:mx-0"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--slack-accent)]/15 text-[var(--slack-accent)]">
        <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold leading-4">
          {t.pwa.updateAvailableTitle}
        </div>
        <div className="mt-0.5 text-[11px] leading-4 text-[var(--slack-text-muted)]">
          {t.pwa.updateAvailableDesc}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={handleUpdate}
          disabled={updating}
          className="inline-flex items-center gap-1 rounded-lg bg-[var(--slack-accent)] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {updating && <Loader2 className="h-3 w-3 animate-spin" />}
          <span>{updating ? t.pwa.updating : t.pwa.updateNow}</span>
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          disabled={updating}
          title={t.pwa.later}
          aria-label={t.pwa.later}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[var(--slack-text-muted)] transition hover:bg-[var(--slack-surface-hover)] hover:text-[var(--slack-text)] disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
