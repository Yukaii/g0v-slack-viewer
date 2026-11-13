import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hash,
  Info,
  Menu,
  Search,
  Star,
  Users,
} from 'lucide-react';
import type { ChannelDetailResponse, ChannelSummary } from '../types';
import { formatCompactNumber } from '../utils/format';
import { RichContent } from './RichContent';

interface ChannelHeaderProps {
  summary?: ChannelSummary;
  detail: ChannelDetailResponse | null;
  loadedMonths?: string[];
  loading: boolean;
  isStarred: boolean;
  showInfo: boolean;
  onToggleStar: () => void;
  onToggleInfo: () => void;
  onSelectMonth: (month: string) => void;
  onOpenMobileSidebar: () => void;
  onOpenSwitcher: () => void;
  onNavigateChannel: (channelId: string, month?: string, ts?: string) => void;
}

export const ChannelHeader: React.FC<ChannelHeaderProps> = ({
  summary,
  detail,
  loadedMonths = [],
  loading,
  isStarred,
  showInfo,
  onToggleStar,
  onToggleInfo,
  onSelectMonth,
  onOpenMobileSidebar,
  onOpenSwitcher,
  onNavigateChannel,
}) => {
  const [mobileTimelineOpen, setMobileTimelineOpen] = useState(false);
  const activeYear = detail?.activeMonth?.slice(0, 4) || '';
  const activeYearEntry = useMemo(
    () => detail?.years.find((y) => y.year === activeYear),
    [detail, activeYear]
  );

  const latestMonth = useMemo(() => {
    if (!detail?.years.length) return '';
    const lastYear = detail.years[detail.years.length - 1];
    return lastYear.months[lastYear.months.length - 1]?.month || '';
  }, [detail]);

  return (
    <header className="shrink-0 border-b border-[var(--slack-border)] bg-[var(--slack-main-bg)]">
      {/* Main header row */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 sm:gap-3 sm:px-5 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="rounded-md p-1.5 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-center gap-1.5">
            <Hash className="h-5 w-5 shrink-0 text-[var(--slack-text-muted)]" />
            <h1 className="truncate text-base font-extrabold tracking-tight text-[var(--slack-text)] sm:text-lg">
              {detail?.channelName || summary?.name || '...'}
            </h1>
            <button
              type="button"
              onClick={onToggleStar}
              title={isStarred ? 'Unstar channel' : 'Star channel'}
              className="rounded p-1 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)]"
            >
              <Star
                className={`h-4 w-4 ${
                  isStarred
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-[var(--slack-text-muted)]'
                }`}
              />
            </button>
          </div>

          {summary?.topicHtml && (
            <div className="hidden min-w-0 border-l border-[var(--slack-border)] pl-3 text-xs text-[var(--slack-text-muted)] md:block">
              <div className="line-clamp-1">
                <RichContent
                  html={summary.topicHtml}
                  className="!text-xs"
                  onNavigateChannel={onNavigateChannel}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenSwitcher}
            title="Jump to channel or search"
            className="inline-flex items-center justify-center rounded-md border border-[var(--slack-border)] p-1.5 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)] sm:hidden"
            aria-label="Jump to channel or search"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          {summary && (
            <div className="hidden items-center gap-1.5 rounded-md border border-[var(--slack-border)] px-2.5 py-1 text-xs font-medium text-[var(--slack-text-muted)] sm:inline-flex">
              <Users className="h-3.5 w-3.5" />
              <span>{formatCompactNumber(summary.memberCount)}</span>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleInfo}
            title="Channel details"
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition sm:px-2.5 ${
              showInfo
                ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/10 text-[var(--slack-link)]'
                : 'border-[var(--slack-border)] text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Details</span>
          </button>
        </div>
      </div>

      {/* Compact Mobile Timeline Toggle Row */}
      {detail && detail.years.length > 0 && (
        <div className="flex items-center justify-between gap-2 border-t border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-2.5 py-1 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileTimelineOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2.5 py-1 text-xs font-medium text-[var(--slack-text)]"
          >
            <Calendar className="h-3.5 w-3.5 text-[var(--slack-accent)]" />
            <span className="font-mono-code">
              {loadedMonths.length > 1
                ? `${loadedMonths[0]}–${loadedMonths[loadedMonths.length - 1]}`
                : detail.activeMonth}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-[var(--slack-text-muted)] transition-transform ${
                mobileTimelineOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!detail.previousMonth || loading}
              onClick={() =>
                detail.previousMonth && onSelectMonth(detail.previousMonth)
              }
              aria-label="Previous month"
              className="inline-flex items-center rounded border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-1 text-xs text-[var(--slack-text-muted)] disabled:opacity-35"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={!detail.nextMonth || loading}
              onClick={() => detail.nextMonth && onSelectMonth(detail.nextMonth)}
              aria-label="Next month"
              className="inline-flex items-center rounded border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-1 text-xs text-[var(--slack-text-muted)] disabled:opacity-35"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            {latestMonth && detail.activeMonth !== latestMonth && (
              <button
                type="button"
                disabled={loading}
                onClick={() => onSelectMonth(latestMonth)}
                className="rounded border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--slack-link)]"
              >
                Latest
              </button>
            )}
          </div>
        </div>
      )}

      {/* Year / Month timeline navigator */}
      {detail && detail.years.length > 0 && (
        <div className={`${mobileTimelineOpen ? 'flex' : 'hidden sm:flex'} flex-col gap-1.5 border-t border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-3 py-2 sm:px-5`}>
          {/* Years row + prev/next controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="slack-scroll flex items-center gap-1 overflow-x-auto pb-0.5">
              <Calendar className="mr-1 h-3.5 w-3.5 shrink-0 text-[var(--slack-text-muted)]" />
              {detail.years.map((y) => {
                const isSelected = y.year === activeYear;
                const defaultMonth = y.months[y.months.length - 1]?.month;
                return (
                  <button
                    key={y.year}
                    type="button"
                    disabled={loading}
                    onClick={() => defaultMonth && onSelectMonth(defaultMonth)}
                    className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-[var(--slack-accent)] text-white'
                        : 'text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]'
                    }`}
                  >
                    {y.year}
                  </button>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                disabled={!detail.previousMonth || loading}
                onClick={() =>
                  detail.previousMonth && onSelectMonth(detail.previousMonth)
                }
                title={
                  detail.previousMonth
                    ? `Previous: ${detail.previousMonth}`
                    : 'Oldest month'
                }
                className="inline-flex items-center rounded border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-1 text-xs text-[var(--slack-text-muted)] hover:text-[var(--slack-text)] disabled:opacity-35"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={!detail.nextMonth || loading}
                onClick={() => detail.nextMonth && onSelectMonth(detail.nextMonth)}
                title={
                  detail.nextMonth
                    ? `Next: ${detail.nextMonth}`
                    : 'Latest month'
                }
                className="inline-flex items-center rounded border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-1 text-xs text-[var(--slack-text-muted)] hover:text-[var(--slack-text)] disabled:opacity-35"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              {latestMonth && detail.activeMonth !== latestMonth && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onSelectMonth(latestMonth)}
                  className="ml-1 rounded border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--slack-link)] hover:bg-[var(--slack-badge-bg)]"
                >
                  Latest
                </button>
              )}
            </div>
          </div>

          {/* Months row for active year */}
          {activeYearEntry && (
            <div className="slack-scroll flex items-center gap-1 overflow-x-auto pb-0.5">
              {activeYearEntry.months.map((m) => {
                const isCurrent = m.month === detail.activeMonth || loadedMonths.includes(m.month);
                return (
                  <button
                    key={m.month}
                    type="button"
                    disabled={loading}
                    onClick={() => onSelectMonth(m.month)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition ${
                      isCurrent
                        ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/12 font-semibold text-[var(--slack-link)]'
                        : 'border-transparent bg-[var(--slack-main-bg)] text-[var(--slack-text-muted)] hover:border-[var(--slack-border)] hover:text-[var(--slack-text)]'
                    }`}
                  >
                    <span className="font-mono-code">{m.month.slice(5)}月</span>
                    <span className="rounded-full bg-[var(--slack-badge-bg)] px-1.5 text-[10px] text-[var(--slack-text-muted)]">
                      {m.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
