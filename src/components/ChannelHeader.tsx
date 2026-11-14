import React, { useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Hash,
  Info,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Star,
  Users,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { ChannelDetailResponse, ChannelSummary } from '../types';
import { formatCompactNumber, formatMonthPill } from '../utils/format';
import { RichContent } from './RichContent';

export type ChannelInfoTab = 'about' | 'members';

interface ChannelHeaderProps {
  summary?: ChannelSummary;
  detail: ChannelDetailResponse | null;
  loadedMonths?: string[];
  loading: boolean;
  isStarred: boolean;
  infoTab: ChannelInfoTab | null;
  desktopSidebarOpen?: boolean;
  onToggleDesktopSidebar?: () => void;
  onToggleStar: () => void;
  onToggleInfo: () => void;
  onToggleMembers: () => void;
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
  infoTab,
  desktopSidebarOpen = true,
  onToggleDesktopSidebar,
  onToggleStar,
  onToggleInfo,
  onToggleMembers,
  onSelectMonth,
  onOpenMobileSidebar,
  onOpenSwitcher,
  onNavigateChannel,
}) => {
  const { locale, t } = useI18n();
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
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 sm:gap-3 sm:px-4 sm:py-1.5">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="rounded-md p-1 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] lg:hidden"
            aria-label={t.channelHeader.openSidebar}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          {onToggleDesktopSidebar && (
            <button
              type="button"
              onClick={onToggleDesktopSidebar}
              title={
                desktopSidebarOpen
                  ? t.channelHeader.hideSidebar
                  : t.channelHeader.showSidebar
              }
              aria-label={
                desktopSidebarOpen
                  ? t.channelHeader.hideSidebar
                  : t.channelHeader.showSidebar
              }
              aria-pressed={desktopSidebarOpen}
              className="hidden rounded-md p-1 text-[var(--slack-text-muted)] transition hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)] lg:inline-flex"
            >
              {desktopSidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>
          )}

          <div className="flex min-w-0 items-center gap-1">
            <Hash className="h-4 w-4 shrink-0 text-[var(--slack-text-muted)] sm:h-4.5 sm:w-4.5" />
            <h1 className="truncate text-sm font-extrabold tracking-tight text-[var(--slack-text)] sm:text-base">
              {detail?.channelName || summary?.name || '...'}
            </h1>
            <button
              type="button"
              onClick={onToggleStar}
              title={
                isStarred
                  ? t.channelHeader.unstarChannel
                  : t.channelHeader.starChannel
              }
              className="rounded p-1 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)]"
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  isStarred
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-[var(--slack-text-muted)]'
                }`}
              />
            </button>
          </div>

          {summary?.topicHtml && (
            <div className="hidden min-w-0 border-l border-[var(--slack-border)] pl-2.5 text-xs text-[var(--slack-text-muted)] md:block">
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

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSwitcher}
            title={t.channelHeader.jumpOrSearch}
            className="inline-flex items-center justify-center rounded-md border border-[var(--slack-border)] p-1 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)] sm:hidden"
            aria-label={t.channelHeader.jumpOrSearch}
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          {summary && (
            <button
              type="button"
              onClick={onToggleMembers}
              title={t.channelHeader.viewMembers}
              aria-label={t.channelHeader.viewMembers}
              aria-pressed={infoTab === 'members'}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition sm:gap-1.5 ${
                infoTab === 'members'
                  ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/10 text-[var(--slack-link)]'
                  : 'border-[var(--slack-border)] text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>{formatCompactNumber(summary.memberCount)}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleInfo}
            title={t.channelHeader.channelDetails}
            aria-pressed={infoTab === 'about'}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition ${
              infoTab === 'about'
                ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/10 text-[var(--slack-link)]'
                : 'border-[var(--slack-border)] text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]'
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t.channelHeader.detailsShort}</span>
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
              aria-label={t.channelHeader.previousMonth}
              className="inline-flex items-center rounded border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-1 text-xs text-[var(--slack-text-muted)] disabled:opacity-35"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={!detail.nextMonth || loading}
              onClick={() => detail.nextMonth && onSelectMonth(detail.nextMonth)}
              aria-label={t.channelHeader.nextMonth}
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
                {t.channelHeader.latest}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile expandable Year / Month timeline */}
      {detail && detail.years.length > 0 && mobileTimelineOpen && (
        <div className="flex flex-col gap-1.5 border-t border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-3 py-2 sm:hidden">
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

          {activeYearEntry && (
            <div className="slack-scroll flex items-center gap-1 overflow-x-auto pb-0.5">
              {activeYearEntry.months.map((m) => {
                const isCurrent =
                  m.month === detail.activeMonth ||
                  loadedMonths.includes(m.month);
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
                    <span className="font-mono-code">
                      {formatMonthPill(m.month, locale)}
                    </span>
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

      {/* Compact single-row Desktop Year / Month timeline navigator */}
      {detail && detail.years.length > 0 && (
        <div className="hidden items-center justify-between gap-2 border-t border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-4 py-1 sm:flex">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <label className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--slack-text)]">
              <Calendar className="h-3 w-3 shrink-0 text-[var(--slack-accent)]" />
              <select
                aria-label={t.channelHeader.selectYear}
                disabled={loading}
                value={activeYear}
                onChange={(e) => {
                  const chosen = detail.years.find(
                    (y) => y.year === e.target.value
                  );
                  const defaultMonth =
                    chosen?.months[chosen.months.length - 1]?.month;
                  if (defaultMonth) onSelectMonth(defaultMonth);
                }}
                className="cursor-pointer bg-transparent text-xs font-semibold text-[var(--slack-text)] focus:outline-none"
              >
                {detail.years.map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year}
                  </option>
                ))}
              </select>
            </label>

            <span className="h-3.5 w-px shrink-0 bg-[var(--slack-border)]" />

            {activeYearEntry && (
              <div className="slack-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                {activeYearEntry.months.map((m) => {
                  const isCurrent =
                    m.month === detail.activeMonth ||
                    loadedMonths.includes(m.month);
                  return (
                    <button
                      key={m.month}
                      type="button"
                      disabled={loading}
                      onClick={() => onSelectMonth(m.month)}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition ${
                        isCurrent
                          ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/12 font-semibold text-[var(--slack-link)]'
                          : 'border-transparent bg-[var(--slack-main-bg)] text-[var(--slack-text-muted)] hover:border-[var(--slack-border)] hover:text-[var(--slack-text)]'
                      }`}
                    >
                      <span className="font-mono-code">
                        {formatMonthPill(m.month, locale)}
                      </span>
                      <span className="rounded-full bg-[var(--slack-badge-bg)] px-1 text-[10px] text-[var(--slack-text-muted)]">
                        {m.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
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
                  ? `${t.channelHeader.previousMonth}: ${detail.previousMonth}`
                  : t.channelHeader.oldestMonth
              }
              className="inline-flex items-center rounded border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-0.5 text-xs text-[var(--slack-text-muted)] hover:text-[var(--slack-text)] disabled:opacity-35"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={!detail.nextMonth || loading}
              onClick={() => detail.nextMonth && onSelectMonth(detail.nextMonth)}
              title={
                detail.nextMonth
                  ? `${t.channelHeader.nextMonth}: ${detail.nextMonth}`
                  : t.channelHeader.latestMonth
              }
              className="inline-flex items-center rounded border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-0.5 text-xs text-[var(--slack-text-muted)] hover:text-[var(--slack-text)] disabled:opacity-35"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            {latestMonth && detail.activeMonth !== latestMonth && (
              <button
                type="button"
                disabled={loading}
                onClick={() => onSelectMonth(latestMonth)}
                className="ml-0.5 rounded border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--slack-link)] hover:bg-[var(--slack-badge-bg)]"
              >
                {t.channelHeader.latest}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
