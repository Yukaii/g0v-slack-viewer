import type { AppThemeId } from './themes';

export type Locale = 'zh-TW' | 'en' | 'ja';

const STARRED_KEY = 'g0v_slack_starred_channels';
const THEME_KEY = 'g0v_slack_theme';
const RECENT_KEY = 'g0v_slack_recent_channels';
const LOCALE_KEY = 'g0v_slack_locale';
const SIDEBAR_KEY = 'g0v_slack_sidebar_open';
const READ_STATE_KEY = 'g0v_slack_read_state';

/**
 * Per-channel read markers, keyed by channel ID and stored as the archive
 * timestamp (epoch milliseconds) of the newest message the user has read.
 * `null` means no read state has been saved yet, which lets the app seed a
 * baseline the first time it sees the workspace.
 */
export type ChannelReadState = Record<string, number>;

const DEFAULT_STARRED = [
  'C02G2SXKX', // #general
  'CGU1SLHNH', // #rand0m
  'C012AG0SC0H', // #self-intro
  'C0385B90D', // #jothon
  'C2PPMRQGP', // #cofacts
];

export function loadDesktopSidebarOpen(): boolean {
  try {
    const raw = localStorage.getItem(SIDEBAR_KEY);
    if (raw === '0' || raw === 'false') return false;
    return true;
  } catch {
    return true;
  }
}

export function saveDesktopSidebarOpen(open: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_KEY, open ? '1' : '0');
  } catch {
    // ignore
  }
}

export function loadLocale(): Locale {
  try {
    const raw = localStorage.getItem(LOCALE_KEY);
    if (raw === 'zh-TW' || raw === 'en' || raw === 'ja') return raw;
    return 'zh-TW';
  } catch {
    return 'zh-TW';
  }
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // ignore
  }
}

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

export function loadTheme(): AppThemeId {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (
      raw === 'g0v-light' ||
      raw === 'g0v-dark' ||
      raw === 'g0v-jothon' ||
      raw === 'slack-classic'
    ) {
      return raw;
    }
    if (raw === 'dark') return 'g0v-dark';
    if (raw === 'light') return 'g0v-light';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'g0v-dark'
      : 'g0v-light';
  } catch {
    return 'g0v-light';
  }
}

export function saveTheme(theme: AppThemeId): void {
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

export function loadReadState(): ChannelReadState | null {
  try {
    const raw = localStorage.getItem(READ_STATE_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const state: ChannelReadState = {};
    for (const [channelId, value] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        state[channelId] = value;
      }
    }
    return state;
  } catch {
    return null;
  }
}

export function saveReadState(state: ChannelReadState): void {
  try {
    localStorage.setItem(READ_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

/** Returns a new state when the read marker moves forward, otherwise null. */
export function markChannelRead(
  state: ChannelReadState,
  channelId: string,
  readAt: number
): ChannelReadState | null {
  if (!Number.isFinite(readAt) || readAt <= 0) return null;
  if ((state[channelId] ?? 0) >= readAt) return null;
  return { ...state, [channelId]: readAt };
}

export function isChannelUnread(
  lastPostedAt: number | null | undefined,
  readAt: number | undefined
): boolean {
  // Channels without a stored marker are treated as read, so a fresh visitor
  // does not see the whole workspace marked unread.
  if (!lastPostedAt || readAt === undefined) return false;
  return lastPostedAt > readAt;
}
