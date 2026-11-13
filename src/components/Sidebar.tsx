import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Compass,
  ExternalLink,
  Hash,
  Search,
  Palette,
  Star,
  X,
} from 'lucide-react';
import type { ArchiveStats, ChannelSummary } from '../types';
import { formatCompactNumber } from '../utils/format';
import { getCommandShortcutLabel } from '../utils/platform';
import { getThemeMeta, type AppThemeId } from '../utils/themes';
import { G0vLogo } from './G0vLogo';

interface SidebarProps {
  channels: ChannelSummary[];
  stats: ArchiveStats | null;
  activeChannelId: string | null;
  viewMode: 'channel' | 'directory';
  starredIds: string[];
  recentIds: string[];
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectChannel: (channelId: string) => void;
  onOpenDirectory: () => void;
  onOpenSwitcher: () => void;
  onOpenSearch: () => void;
  theme: AppThemeId;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  channels,
  stats,
  activeChannelId,
  viewMode,
  starredIds,
  recentIds,
  mobileOpen,
  onCloseMobile,
  onSelectChannel,
  onOpenDirectory,
  onOpenSwitcher,
  onOpenSearch,
  theme,
  onToggleTheme,
}) => {
  const shortcutLabel = useMemo(() => getCommandShortcutLabel(), []);
  const themeMeta = getThemeMeta(theme);
  const [filter, setFilter] = useState('');
  const [starredOpen, setStarredOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const [channelsOpen, setChannelsOpen] = useState(true);

  const channelMap = useMemo(() => {
    const m = new Map<string, ChannelSummary>();
    for (const c of channels) m.set(c.id, c);
    return m;
  }, [channels]);

  const starredChannels = useMemo(
    () =>
      starredIds
        .map((id) => channelMap.get(id))
        .filter((c): c is ChannelSummary => Boolean(c)),
    [starredIds, channelMap]
  );

  const recentChannels = useMemo(
    () =>
      recentIds
        .filter((id) => !starredIds.includes(id))
        .map((id) => channelMap.get(id))
        .filter((c): c is ChannelSummary => Boolean(c))
        .slice(0, 6),
    [recentIds, starredIds, channelMap]
  );

  const filteredChannels = useMemo(() => {
    const q = filter.trim().toLowerCase().replace(/^#/, '');
    if (!q) {
      // Show top 45 channels by member count when unfiltered so sidebar stays snappy
      return channels.slice(0, 45);
    }
    return channels
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.topicText.toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [channels, filter]);

  const renderChannelRow = (ch: ChannelSummary) => {
    const isActive = viewMode === 'channel' && activeChannelId === ch.id;
    return (
      <button
        key={ch.id}
        type="button"
        onClick={() => {
          onSelectChannel(ch.id);
          onCloseMobile();
        }}
        className={`group flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1 text-left text-[14px] transition-colors ${
          isActive
            ? 'bg-[var(--slack-sidebar-active)] font-semibold text-white'
            : 'text-[var(--slack-sidebar-text)] hover:bg-[var(--slack-sidebar-hover)] hover:text-white'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Hash className="h-3.5 w-3.5 shrink-0 opacity-75" />
          <span className="truncate">{ch.name}</span>
        </span>
        {ch.messageCount > 0 && (
          <span
            className={`shrink-0 text-[11px] tabular-nums ${
              isActive ? 'text-white/80' : 'opacity-50 group-hover:opacity-80'
            }`}
          >
            {formatCompactNumber(ch.messageCount)}
          </span>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex h-full w-64 flex-col bg-[var(--slack-sidebar-bg)] text-[var(--slack-sidebar-text)] select-none">
      {/* Workspace Header */}
      <div className="flex items-center justify-between border-b border-[var(--slack-sidebar-border)] px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <G0vLogo size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-base font-extrabold tracking-tight text-white">
                  g0v.tw
                </span>
                <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-medium text-white/75">
                  零時政府
                </span>
              </div>
            </div>
          </div>
          {stats && (
            <div className="mt-0.5 truncate text-[11px] text-white/60">
              {formatCompactNumber(stats.messages)} msgs ·{' '}
              {stats.channels.toLocaleString()} ch
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded p-1 text-white/70 hover:bg-white/10 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Primary actions */}
      <div className="space-y-0.5 border-b border-[var(--slack-sidebar-border)] px-2.5 py-2.5">
        <button
          type="button"
          onClick={() => {
            onOpenDirectory();
            onCloseMobile();
          }}
          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
            viewMode === 'directory'
              ? 'bg-[var(--slack-sidebar-active)] text-white'
              : 'text-[var(--slack-sidebar-text)] hover:bg-[var(--slack-sidebar-hover)] hover:text-white'
          }`}
        >
          <Compass className="h-4 w-4 shrink-0" />
          <span>Channel Directory</span>
          <span className="ml-auto rounded-full bg-white/10 px-1.5 py-0.2 text-[11px] text-white/80">
            {channels.length || '…'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenSwitcher();
            onCloseMobile();
          }}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-[var(--slack-sidebar-text)] transition-colors hover:bg-[var(--slack-sidebar-hover)] hover:text-white"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>Jump to…</span>
          <kbd className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/75">
            {shortcutLabel}
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenSearch();
            onCloseMobile();
          }}
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-[var(--slack-sidebar-text)] transition-colors hover:bg-[var(--slack-sidebar-hover)] hover:text-white"
        >
          <Search className="h-4 w-4 shrink-0 opacity-75" />
          <span>Search Messages</span>
        </button>
      </div>

      {/* Sidebar quick filter */}
      <div className="px-3 pt-2.5 pb-1">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter sidebar channels..."
            className="w-full rounded-md border border-white/15 bg-white/10 py-1 pr-7 pl-8 text-xs text-white placeholder:text-white/50 focus:border-white/35 focus:bg-white/15 focus:outline-none"
          />
          {filter && (
            <button
              type="button"
              onClick={() => setFilter('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable channel sections */}
      <div className="slack-scroll flex-1 space-y-4 overflow-y-auto px-2.5 py-2">
        {/* Starred */}
        {!filter && starredChannels.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setStarredOpen((v) => !v)}
              className="mb-1 flex w-full items-center gap-1 px-1.5 text-xs font-semibold tracking-wide text-white/65 hover:text-white"
            >
              {starredOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>Starred</span>
            </button>
            {starredOpen && (
              <div className="space-y-0.5">
                {starredChannels.map(renderChannelRow)}
              </div>
            )}
          </div>
        )}

        {/* Recent */}
        {!filter && recentChannels.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setRecentOpen((v) => !v)}
              className="mb-1 flex w-full items-center gap-1 px-1.5 text-xs font-semibold tracking-wide text-white/65 hover:text-white"
            >
              {recentOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <span>Recent</span>
            </button>
            {recentOpen && (
              <div className="space-y-0.5">
                {recentChannels.map(renderChannelRow)}
              </div>
            )}
          </div>
        )}

        {/* Channels */}
        <div>
          <button
            type="button"
            onClick={() => setChannelsOpen((v) => !v)}
            className="mb-1 flex w-full items-center justify-between px-1.5 text-xs font-semibold tracking-wide text-white/65 hover:text-white"
          >
            <span className="flex items-center gap-1">
              {channelsOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <span>{filter ? 'Matching Channels' : 'Popular Channels'}</span>
            </span>
          </button>
          {channelsOpen && (
            <div className="space-y-0.5">
              {filteredChannels.map(renderChannelRow)}
              {!filter && channels.length > 45 && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDirectory();
                    onCloseMobile();
                  }}
                  className="mt-1.5 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/65 hover:bg-[var(--slack-sidebar-hover)] hover:text-white"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Browse all {channels.length.toLocaleString()} channels…
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile footer utilities (Theme + Source) */}
      <div className="flex items-center justify-between border-t border-[var(--slack-sidebar-border)] px-3 py-2 text-xs lg:hidden">
        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Theme: {themeMeta.name}</span>
        </button>
        <a
          href="https://g0v-slack-archive.g0v.ronny.tw/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-white/75 hover:bg-white/10 hover:text-white"
        >
          <span>Source</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden h-full shrink-0 lg:block">{sidebarContent}</div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
