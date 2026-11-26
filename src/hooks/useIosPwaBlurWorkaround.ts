import { useEffect } from 'react';

function isIosOrIpadOs(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  // iPadOS 13+ reports MacIntel with multi-touch support
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  return Boolean((window.navigator as { standalone?: boolean }).standalone);
}

function isEditableElementFocused(): boolean {
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  );
}

/**
 * Mitigates the iOS/iPadOS 26–27 standalone PWA portrait top-of-screen blur bug
 * (e.g. MacRumors #2489325):
 *
 * 1. Marks `html.ios-standalone` so CSS renders a real fixed opaque top-edge cap
 *    (`>= 10px`) that WebKit's scroll-edge sampler can anchor to, plus safe-area
 *    header clearance.
 * 2. Because our shell uses a non-scrolling `h-dvh overflow-hidden` root, iOS 27's
 *    initial portrait blur stays stuck unless the root document scroll view
 *    receives a scroll update. We perform a visually-pinned 1px root scroll nudge
 *    (`scrollTo(0, 1)` -> next frame `scrollTo(0, 0)`) on launch, resume, and
 *    portrait orientation changes while keeping `#root` locked in place.
 */
export function useIosPwaBlurWorkaround(): void {
  useEffect(() => {
    if (!isIosOrIpadOs()) return;

    const root = document.documentElement;
    const standaloneQuery = window.matchMedia?.('(display-mode: standalone)');
    const portraitQuery = window.matchMedia?.('(orientation: portrait)');

    let activeRaf1 = 0;
    let activeRaf2 = 0;
    const timers: number[] = [];

    const clearPendingNudge = () => {
      if (activeRaf1) {
        window.cancelAnimationFrame(activeRaf1);
        activeRaf1 = 0;
      }
      if (activeRaf2) {
        window.cancelAnimationFrame(activeRaf2);
        activeRaf2 = 0;
      }
      root.classList.remove('ios-pwa-scroll-nudge');
    };

    const runScrollNudge = () => {
      if (!isStandaloneMode()) return;
      if (window.innerHeight < window.innerWidth) return;
      if (isEditableElementFocused()) return;

      clearPendingNudge();
      root.classList.add('ios-pwa-scroll-nudge');

      // Force synchronous style/layout flush so WebKit registers the 2px root scroll range
      void root.offsetHeight;
      window.scrollTo(0, 1);

      activeRaf1 = window.requestAnimationFrame(() => {
        activeRaf1 = 0;
        window.scrollTo(0, 0);
        activeRaf2 = window.requestAnimationFrame(() => {
          activeRaf2 = 0;
          root.classList.remove('ios-pwa-scroll-nudge');
        });
      });
    };

    const scheduleNudgePasses = () => {
      if (!isStandaloneMode()) return;
      // Pass 1: right after paint
      const t1 = window.setTimeout(runScrollNudge, 40);
      // Pass 2: after iOS standalone launch/resume transition finishes
      const t2 = window.setTimeout(runScrollNudge, 300);
      timers.push(t1, t2);
    };

    const syncStandaloneClass = () => {
      const standalone = isStandaloneMode();
      root.classList.toggle('ios-standalone', standalone);
      if (standalone) {
        scheduleNudgePasses();
      } else {
        clearPendingNudge();
      }
    };

    syncStandaloneClass();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleNudgePasses();
      }
    };

    const onPageShow = () => {
      scheduleNudgePasses();
    };

    const onPortraitChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        scheduleNudgePasses();
      }
    };

    const onOrientationChange = () => {
      scheduleNudgePasses();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('orientationchange', onOrientationChange);
    standaloneQuery?.addEventListener('change', syncStandaloneClass);
    portraitQuery?.addEventListener('change', onPortraitChange);

    return () => {
      for (const id of timers) window.clearTimeout(id);
      clearPendingNudge();
      root.classList.remove('ios-standalone');
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('orientationchange', onOrientationChange);
      standaloneQuery?.removeEventListener('change', syncStandaloneClass);
      portraitQuery?.removeEventListener('change', onPortraitChange);
    };
  }, []);
}
