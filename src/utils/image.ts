const preloadedImages = new Set<string>();

/**
 * Warm the browser cache for a lightbox image before the user opens it.
 * Safe to call repeatedly; each URL is only requested once per session.
 */
export function preloadImage(url?: string): void {
  if (!url || preloadedImages.has(url)) return;
  preloadedImages.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}
