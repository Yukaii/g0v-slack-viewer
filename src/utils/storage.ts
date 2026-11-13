const STARRED_KEY = 'g0v_slack_starred_channels';
const THEME_KEY = 'g0v_slack_theme';
const RECENT_KEY = 'g0v_slack_recent_channels';

const DEFAULT_STARRED = [
  'C02G2SXKX', // #general
  'CGU1SLHNH', // #rand0m
  'C012AG0SC0H', // #self-intro
  'C0385B90D', // #jothon
  'C2PPMRQGP', // #cofacts
];

export function loadStarredChannels(): string[] {
  try {
    const raw = localStorage.getItem(STARRED_KEY);
    if (!raw) return DEFAULT_STARRED;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_STARRED;
  } catch {
    return DEFAULT_STARRED;
  }
}

export function saveStarredChannels(ids: string[]): void {
  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage quota errors
  }
}

export function loadTheme(): 'light' | 'dark' {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'dark' || raw === 'light') return raw;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function loadRecentChannels(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRecentChannel(id: string): string[] {
  const existing = loadRecentChannels().filter((c) => c !== id);
  const next = [id, ...existing].slice(0, 12);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
