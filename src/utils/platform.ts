export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const plat =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent;
  return /mac|iphone|ipad|ipod/i.test(plat);
}

export function getCommandShortcutLabel(): string {
  return isMacPlatform() ? '⌘K' : 'Ctrl+K';
}
