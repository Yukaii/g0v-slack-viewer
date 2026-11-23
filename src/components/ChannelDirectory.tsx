import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Hash,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Star,
  Users,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { ArchiveStats, ChannelSummary } from '../types';
import { formatCompactNumber } from '../utils/format';
import { RichContent } from './RichContent';

type SortKey = 'members' | 'messages' | 'recent' | 'name';

interface ChannelDirectoryProps {
  channels: ChannelSummary[];
  channelsLoading?: boolean;
  stats: ArchiveStats | null;
  statsLoading?: boolean;
  starredIds: string[];
  unreadIds?: ReadonlySet<string>;
  desktopSidebarOpen?: boolean;
  onToggleDesktopSidebar?: () => void;
  onSelectChannel: (channelId: string) => void;
  onToggleStar: (channelId: string) => void;
  onOpenMobileSidebar: () => void;
}

const DIRECTORY_SKELETON_ROWS = [
  { name: '7.5rem', desc1: '68%', desc2: '42%' },
  { name: '10rem', desc1: '82%' },
  { name: '6rem', desc1: '58%', desc2: '34%' },
  { name: '9rem', desc1: '75%' },
  { name: '8rem', desc1: '64%', desc2: '48%' },
  { name: '11rem', desc1: '72%' },
  { name: '6.5rem', desc1: '80%', desc2: '36%' },
  { name: '8.5rem', desc1: '60%' },
  { name: '7rem', desc1: '74%', desc2: '44%' },
  { name: '9.5rem', desc1: '66%' },
];

export const ChannelDirectory: React.FC<ChannelDirectoryProps> = ({
  channels,
  channelsLoading = false,
  stats,
  statsLoading = false,
  starredIds,
  unreadIds,
  desktopSidebarOpen = true,
  onToggleDesktopSidebar,
  onSelectChannel,
  onToggleStar,
  onOpenMobileSidebar,
}) => {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('members');

  const starredSet = useMemo(() => new Set(starredIds), [starredIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#/, '');
    const list = q
      ? channels.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.topicText.toLowerCase().includes(q) ||
            c.descriptionText.toLowerCase().includes(q)
        )
      : [...channels];

    list.sort((a, b) => {
      if (sortBy === 'members') return b.memberCount - a.memberCount;
      if (sortBy === 'messages') return b.messageCount - a.messageCount;
      if (sortBy === 'recent')
        return (b.lastPostedAt || 0) - (a.lastPostedAt || 0);
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [channels, query, sortBy]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--slack-main-bg)]">
      {/* Header */}
      <div className="border-b border-[var(--slack-border)] px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="rounded-md p-1 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] lg:hidden"
              aria-label={t.channelHeader.openSidebar}
            >
              <Menu className="h-5 w-5" />
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
                  <PanelLeftClose className="h-4.5 w-4.5" />
                ) : (
                  <PanelLeftOpen className="h-4.5 w-4.5" />
                )}
              </button>
            )}
            <div>
              <h1 className="text-base font-extrabold text-[var(--slack-text)] sm:text-lg">
                {t.channelDirectory.title}
              </h1>
              <div className="flex min-h-4 items-center text-xs text-[var(--slack-text-muted)]">
                {(channelsLoading && channels.length === 0) ||
                (statsLoading && !stats) ? (
                  <span
                    aria-hidden="true"
                    className="skeleton-block h-3 w-52 rounded sm:w-72"
                  />
                ) : stats ? (
                  <p>
                    {t.channelDirectory.summary(
                      channels.length.toLocaleString(),
                      stats.messages.toLocaleString(),
                      stats.users.toLocaleString()
                    )}
                  </p>
                ) : (
                  <p>{t.sidebar.browseAll(channels.length)}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:flex-initial">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--slack-text-muted)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.channelDirectory.searchPlaceholder}
                className="w-full rounded-lg border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] py-1.5 pr-8 pl-8 text-sm text-[var(--slack-text)] placeholder:text-[var(--slack-text-muted)] focus:border-[var(--slack-accent)] focus:outline-none sm:w-72"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-[var(--slack-text-muted)] hover:text-[var(--slack-text)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-2 py-1 text-xs">
              <ArrowDownUp className="h-3.5 w-3.5 text-[var(--slack-text-muted)]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="bg-transparent font-medium text-[var(--slack-text)] focus:outline-none"
              >
                <option value="members">{t.channelDirectory.sortMembers}</option>
                <option value="messages">{t.channelDirectory.sortMessages}</option>
                <option value="recent">{t.channelDirectory.sortRecent}</option>
                <option value="name">{t.channelDirectory.sortName}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Channel List */}
      <div className="slack-scroll min-h-0 flex-1 overflow-y-auto divide-y divide-[var(--slack-border)]">
        {channelsLoading && channels.length === 0 ? (
          <div
            role="status"
            aria-busy="true"
            aria-label={t.app.loading}
            className="divide-y divide-[var(--slack-border)]"
          >
            <span className="sr-only">{t.app.loading}</span>
            {DIRECTORY_SKELETON_ROWS.map((row, idx) => (
              <div
                key={idx}
                aria-hidden="true"
                className="flex items-start justify-between gap-4 px-3 py-3 sm:px-5 sm:py-3.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1">
                      <Hash className="h-4 w-4 text-[var(--slack-text-muted)] opacity-35" />
                      <span
                        className="skeleton-block-strong h-4 rounded"
                        style={{ width: row.name }}
                      />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3 text-[var(--slack-text-muted)] opacity-35" />
                      <span className="skeleton-block h-3 w-9 rounded" />
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-[var(--slack-text-muted)] opacity-35" />
                      <span className="skeleton-block h-3 w-10 rounded" />
                    </span>
                    <span className="skeleton-block hidden h-3 w-24 rounded sm:inline-block" />
                  </div>
                  <div className="mt-2 max-w-2xl space-y-1.5">
                    <div
                      className="skeleton-block h-3 rounded"
                      style={{ width: row.desc1 }}
                    />
                    {row.desc2 && (
                      <div
                        className="skeleton-block h-3 rounded"
                        style={{ width: row.desc2 }}
                      />
                    )}
                  </div>
                </div>
                <span className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border border-[var(--slack-border)] text-[var(--slack-text-muted)] opacity-35">
                  <Star className="h-4 w-4" />
                </span>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filtered.map((ch) => {
          const isStarred = starredSet.has(ch.id);
          const isUnread = Boolean(unreadIds?.has(ch.id));
          return (
            <div
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className="group flex cursor-pointer items-start justify-between gap-4 px-3 py-3 sm:px-5 sm:py-3.5 transition-colors hover:bg-[var(--slack-surface-hover)]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <span className="inline-flex items-center gap-1 text-[15px] font-bold text-[var(--slack-text)] group-hover:text-[var(--slack-link)]">
                    <Hash className="h-4 w-4 text-[var(--slack-text-muted)]" />
                    {ch.name}
                  </span>
                  {isUnread && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--slack-accent)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--slack-link)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--slack-accent)]" />
                      {t.unreadLabel}
                    </span>
                  )}
                  {ch.isArchived && (
                    <span className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--slack-text-muted)]">
                      {t.channelDirectory.archived}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--slack-text-muted)]">
                    <Users className="h-3 w-3" />
                    {ch.memberCount.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--slack-text-muted)]">
                    <MessageSquare className="h-3 w-3" />
                    {formatCompactNumber(ch.messageCount)}
                  </span>
                  {ch.lastPostedLabel && (
                    <span className="hidden text-xs text-[var(--slack-text-muted)] sm:inline">
                      · {t.channelDirectory.lastPost(ch.lastPostedLabel.split(' ')[0])}
                    </span>
                  )}
                </div>

                {(ch.descriptionHtml || ch.topicHtml) && (
                  <div
                    className="mt-1 line-clamp-2 text-xs text-[var(--slack-text-muted)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RichContent
                      html={ch.descriptionHtml || ch.topicHtml}
                      className="!text-xs"
                      onNavigateChannel={(cid) => onSelectChannel(cid)}
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(ch.id);
                }}
                title={
                  isStarred
                    ? t.channelHeader.unstarChannel
                    : t.channelHeader.starChannel
                }
                className="shrink-0 rounded-md border border-[var(--slack-border)] p-1.5 text-[var(--slack-text-muted)] hover:bg-[var(--slack-main-bg)]"
              >
                <Star
                  className={`h-4 w-4 ${
                    isStarred ? 'fill-amber-400 text-amber-400' : ''
                  }`}
                />
              </button>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="px-6 py-16 text-center text-sm text-[var(--slack-text-muted)]">
            {t.channelDirectory.noMatches(query)}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};
