import type { Locale } from './storage';

export function formatDateDivider(
  dateStr: string,
  locale: Locale = 'zh-TW'
): string {
  // dateStr is YYYY-MM-DD
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return dateStr;
  const [year, month, day] = parts;
  const dt = new Date(year, month - 1, day);
  if (locale === 'zh-TW') {
    const weekday = dt.toLocaleDateString('zh-TW', { weekday: 'long' });
    return `${year}年${month}月${day}日 ${weekday}`;
  }
  const weekday = dt.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = dt.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday}, ${monthName} ${day}, ${year}`;
}

const EN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatMonthPill(
  ym: string,
  locale: Locale = 'zh-TW'
): string {
  const mNum = parseInt(ym.slice(5, 7), 10);
  if (Number.isNaN(mNum) || mNum < 1 || mNum > 12) return ym.slice(5);
  if (locale === 'zh-TW') return `${mNum}月`;
  return EN_MONTHS[mNum - 1];
}

export function formatShortTime(timeLabel: string): string {
  // HH:mm:ss -> HH:mm
  const parts = timeLabel.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeLabel;
}

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function parseArchiveChannelHref(
  href: string
): { channelId: string; month?: string; ts?: string } | null {
  const match = href.match(
    /\/index\/channel\/([^/#?]+)(?:\/(\d{4}-\d{2}))?(?:#ts-(.+))?$/
  );
  if (!match) return null;
  return {
    channelId: decodeURIComponent(match[1]),
    month: match[2],
    ts: match[3],
  };
}
