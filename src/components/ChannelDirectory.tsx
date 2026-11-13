import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Hash,
  Menu,
  MessageSquare,
  Search,
  Star,
  Users,
  X,
} from 'lucide-react';
import type { ArchiveStats, ChannelSummary } from '../types';
import { formatCompactNumber } from '../utils/format';
import { RichContent } from './RichContent';

type SortKey = 'members' | 'messages' | 'recent' | 'name';

interface ChannelDirectoryProps {
  channels: ChannelSummary[];
  stats: ArchiveStats | null;
  starredIds: string[];
  onSelectChannel: (channelId: string) => void;
  onToggleStar: (channelId: string) => void;
  onOpenMobileSidebar: () => void;
}

export const ChannelDirectory: React.FC<ChannelDirectoryProps> = ({
  channels,
  stats,
  starredIds,
  onSelectChannel,
  onToggleStar,
  onOpenMobileSidebar,
}) => {
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
      <div className="border-b border-[var(--slack-border)] px-3 py-2 sm:px-5 sm:py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="rounded-md p-1.5 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-[var(--slack-text)] sm:text-lg">
                Channel Directory
              </h1>
              <p className="text-xs text-[var(--slack-text-muted)]">
                {channels.length.toLocaleString()} public channels
                {stats
                  ? ` · ${stats.messages.toLocaleString()} archived messages · ${stats.users.toLocaleString()} users`
                  : ''}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative min-w-0 flex-1 sm:flex-initial">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--slack-text-muted)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search channels, topics..."
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
                <option value="members">Most Members</option>
                <option value="messages">Most Messages</option>
                <option value="recent">Recently Active</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Channel List */}
      <div className="slack-scroll min-h-0 flex-1 overflow-y-auto divide-y divide-[var(--slack-border)]">
        {filtered.map((ch) => {
          const isStarred = starredSet.has(ch.id);
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
                  {ch.isArchived && (
                    <span className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--slack-text-muted)]">
                      Archived
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
                      · Last post {ch.lastPostedLabel.split(' ')[0]}
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
                title={isStarred ? 'Unstar channel' : 'Star channel'}
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
            No channels matched "{query}".
          </div>
        )}
      </div>
    </div>
  );
};
