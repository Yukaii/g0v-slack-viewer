import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Compass,
  Download,
  ExternalLink,
  Hash,
  Languages,
  Search,
  Palette,
  Star,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { ArchiveStats, ChannelSummary } from '../types';
import { formatCompactNumber } from '../utils/format';
import { getCommandShortcutLabel } from '../utils/platform';
import {
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MAX_WIDTH,
  SIDEBAR_MIN_WIDTH,
} from '../utils/storage';
import type { AppThemeId } from '../utils/themes';
import { G0vLogo } from './G0vLogo';

interface SidebarProps {
  channels: ChannelSummary[];
  channelsLoading?: boolean;
  stats: ArchiveStats | null;
  statsLoading?: boolean;
  activeChannelId: string | null;
  viewMode: 'channel' | 'directory';
  starredIds: string[];
  recentIds: string[];
  unreadIds?: ReadonlySet<string>;
  desktopOpen?: boolean;
  width?: number;
  onResizeWidth?: (width: number) => void;
  onResetWidth?: () => void;
  quickSwitcherShortcut?: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelectChannel: (channelId: string) => void;
  onOpenDirectory: () => void;
  onOpenSwitcher: () => void;
  onOpenSearch: () => void;
  theme: AppThemeId;
  onToggleTheme: () => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

const SIDEBAR_SKELETON_WIDTHS: Array<{ name: string; count: string }> = [
  { name: '58%', count: '26px' },
  { name: '74%', count: '22px' },
  { name: '46%', count: '28px' },
  { name: '80%', count: '20px' },
  { name: '64%', count: '24px' },
  { name: '52%', count: '26px' },
  { name: '70%', count: '18px' },
  { name: '42%', count: '24px' },
  { name: '76%', count: '22px' },
  { name: '60%', count: '28px' },
  { name: '68%', count: '20px' },
  { name: '50%', count: '24px' },
  { name: '72%', count: '22px' },
  { name: '44%', count: '26px' },
  { name: '66%', count: '18px' },
  { name: '56%', count: '24px' },
  { name: '78%', count: '22px' },
  { name: '48%', count: '26px' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  channels,
  channelsLoading = false,
  stats,
  statsLoading = false,
  activeChannelId,
  viewMode,
  starredIds,
  recentIds,
  unreadIds,
  desktopOpen = true,
  width = SIDEBAR_DEFAULT_WIDTH,
  onResizeWidth,
  onResetWidth,
  quickSwitcherShortcut,
  mobileOpen,
  onCloseMobile,
  onSelectChannel,
  onOpenDirectory,
  onOpenSwitcher,
  onOpenSearch,
  theme,
  onToggleTheme,
  canInstallPwa = false,
  onInstallPwa,
}) => {
  const { t, toggleLocale } = useI18n();
  const fallbackShortcutLabel = useMemo(() => getCommandShortcutLabel(), []);
  const shortcutLabel = quickSwitcherShortcut ?? fallbackShortcutLabel;
  const themeName = t.themes.items[theme].name;
  const [filter, setFilter] = useState('');
  const [starredOpen, setStarredOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
      dragCleanupRef.current = null;
    };
  }, []);

  const getMaxViewportWidth = useCallback(() => {
    if (typeof window === 'undefined') return SIDEBAR_MAX_WIDTH;
    return Math.min(
      SIDEBAR_MAX_WIDTH,
      Math.max(SIDEBAR_MIN_WIDTH, window.innerWidth - 360)
    );
  }, []);

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || !onResizeWidth) return;
      e.preventDefault();

      dragCleanupRef.current?.();

      const startX = e.clientX;
      const startWidth = width;
      const prevUserSelect = document.body.style.userSelect;
      const prevCursor = document.body.style.cursor;

      setIsResizing(true);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';

      const onPointerMove = (moveEvent: PointerEvent) => {
        const maxAllowed = getMaxViewportWidth();
        const nextWidth = Math.min(
          maxAllowed,
          Math.max(SIDEBAR_MIN_WIDTH, startWidth + (moveEvent.clientX - startX))
        );
        onResizeWidth(Math.round(nextWidth));
      };

      const cleanup = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', cleanup);
        window.removeEventListener('pointercancel', cleanup);
        document.body.style.userSelect = prevUserSelect;
        document.body.style.cursor = prevCursor;
        setIsResizing(false);
        dragCleanupRef.current = null;
      };

      dragCleanupRef.current = cleanup;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', cleanup);
      window.addEventListener('pointercancel', cleanup);
    },
    [width, onResizeWidth, getMaxViewportWidth]
  );

  const handleResizeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!onResizeWidth) return;
      const step = e.shiftKey ? 32 : 16;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onResizeWidth(Math.max(SIDEBAR_MIN_WIDTH, width - step));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onResizeWidth(Math.min(getMaxViewportWidth(), width + step));
      } else if (e.key === 'Home' || e.key === 'Enter' || e.key === '0') {
        e.preventDefault();
        onResetWidth?.();
      }
    },
    [width, onResizeWidth, onResetWidth, getMaxViewportWidth]
  );

  const channelMap = useMemo(() => {
    const m = new Map<string, ChannelSummary>();
    for (const c of channels) m.set(c.id, c);
    return m;
  }, [channels]);

  const normalizedFilter = filter.trim().toLowerCase().replace(/^#/, '');
  const hasActiveFilter = normalizedFilter.length > 0;

  const starredChannels = useMemo(() => {
    const seen = new Set<string>();
    const list: ChannelSummary[] = [];
    for (const id of starredIds) {
      if (seen.has(id)) continue;
      const ch = channelMap.get(id);
      if (ch) {
        seen.add(id);
        list.push(ch);
      }
    }
    return list;
  }, [starredIds, channelMap]);

  const recentChannels = useMemo(() => {
    const seen = new Set<string>(starredChannels.map((c) => c.id));
    const list: ChannelSummary[] = [];
    for (const id of recentIds) {
      if (seen.has(id)) continue;
      const ch = channelMap.get(id);
      if (ch) {
        seen.add(id);
        list.push(ch);
        if (list.length >= 6) break;
      }
    }
    return list;
  }, [recentIds, starredChannels, channelMap]);

  const prioritizedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const ch of starredChannels) ids.add(ch.id);
    for (const ch of recentChannels) ids.add(ch.id);
    return ids;
  }, [starredChannels, recentChannels]);

  const filteredChannels = useMemo(() => {
    if (!hasActiveFilter) {
      // Show top 45 remaining channels by member count, excluding channels
      // already rendered in higher-priority Starred or Recent sections.
      return channels
        .filter((c) => !prioritizedIds.has(c.id))
        .slice(0, 45);
    }
    return channels
      .filter(
        (c) =>
          c.name.toLowerCase().includes(normalizedFilter) ||
          c.topicText.toLowerCase().includes(normalizedFilter)
      )
      .slice(0, 80);
  }, [channels, hasActiveFilter, normalizedFilter, prioritizedIds]);

  const isLoadingChannels = channelsLoading && channels.length === 0;
  const pendingStarredCount = useMemo(
    () => new Set(starredIds).size,
    [starredIds]
  );
  const pendingRecentCount = useMemo(() => {
    const starredSet = new Set(starredIds);
    const seen = new Set<string>();
    for (const id of recentIds) {
      if (starredSet.has(id) || seen.has(id)) continue;
      seen.add(id);
      if (seen.size >= 6) break;
    }
    return seen.size;
  }, [recentIds, starredIds]);

  const renderChannelSkeletonRow = (
    key: string,
    nameWidth: string,
    countWidth: string
  ) => (
    <div
      key={key}
      aria-hidden="true"
      className="flex h-7 w-full items-center justify-between gap-2 rounded-md px-2.5"
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <Hash className="h-3.5 w-3.5 shrink-0 opacity-25" />
        <span
          className="skeleton-sidebar h-3 rounded"
          style={{ width: nameWidth }}
        />
      </span>
      <span
        className="skeleton-sidebar-subtle h-2.5 shrink-0 rounded"
        style={{ width: countWidth }}
      />
    </div>
  );

  const renderChannelRow = (ch: ChannelSummary) => {
    const isActive = viewMode === 'channel' && activeChannelId === ch.id;
    const isUnread = Boolean(unreadIds?.has(ch.id));
    return (
      <button
        key={ch.id}
        type="button"
        onClick={() => {
          onSelectChannel(ch.id);
          onCloseMobile();
        }}
        className={`group flex h-7 w-full items-center justify-between gap-2 rounded-md px-2.5 text-left text-[14px] leading-5 transition-colors ${
          isActive
            ? 'bg-[var(--slack-sidebar-active)] font-semibold text-white'
            : isUnread
              ? 'font-semibold text-white hover:bg-[var(--slack-sidebar-hover)]'
              : 'text-[var(--slack-sidebar-text)] hover:bg-[var(--slack-sidebar-hover)] hover:text-white'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Hash className="h-3.5 w-3.5 shrink-0 opacity-75" />
          <span className="truncate">{ch.name}</span>
          {isUnread && (
            <span
              title={t.unreadLabel}
              aria-label={t.unreadLabel}
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400"
            />
          )}
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
    <div className="flex h-full w-full flex-col bg-[var(--slack-sidebar-bg)] text-[var(--slack-sidebar-text)] select-none">
      {/* Workspace Header */}
      <div className="flex items-center justify-between border-b border-[var(--slack-sidebar-border)] px-4 pt-[calc(0.75rem+var(--pwa-top-inset))] pb-3 lg:pt-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <G0vLogo variant="icon" size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-base font-extrabold tracking-tight text-white">
                  g0v.tw
                </span>
                <span className="rounded bg-white/10 px-1.5 py-0.2 text-[10px] font-medium text-white/75">
                  零時政府
                </span>
              </div>
              <div className="truncate text-[11px] font-medium text-white/75">
                {t.topBar.subtitle}
              </div>
            </div>
          </div>
          {(stats || statsLoading) && (
            <div className="mt-1 flex h-4 items-center text-[11px] leading-4 text-white/55">
              {stats ? (
                <span className="truncate">
                  {t.sidebar.stats(
                    formatCompactNumber(stats.messages),
                    stats.channels
                  )}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="skeleton-sidebar h-2.5 w-32 rounded"
                />
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded p-1 text-white/70 hover:bg-white/10 lg:hidden"
          aria-label={t.sidebar.closeSidebar}
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
          <span className="truncate">{t.sidebar.channelDirectory}</span>
          {isLoadingChannels ? (
            <span
              aria-hidden="true"
              className="skeleton-sidebar ml-auto inline-block h-[18px] w-9 shrink-0 rounded-full"
            />
          ) : (
            <span className="ml-auto inline-flex h-[18px] min-w-8 shrink-0 items-center justify-center rounded-full bg-white/10 px-1.5 text-[11px] leading-none tabular-nums text-white/80">
              {channels.length}
            </span>
          )}
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
          <span className="truncate">{t.sidebar.jumpTo}</span>
          <kbd className="ml-auto shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/75">
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
          <span className="truncate">{t.sidebar.searchMessages}</span>
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
            placeholder={t.sidebar.filterPlaceholder}
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
        {!hasActiveFilter &&
          (starredChannels.length > 0 ||
            (isLoadingChannels && pendingStarredCount > 0)) && (
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
                <span>{t.sidebar.starred}</span>
              </button>
              {starredOpen && (
                <div className="space-y-0.5">
                  {isLoadingChannels
                    ? Array.from({ length: pendingStarredCount }).map(
                        (_, idx) => {
                          const spec =
                            SIDEBAR_SKELETON_WIDTHS[
                              idx % SIDEBAR_SKELETON_WIDTHS.length
                            ];
                          return renderChannelSkeletonRow(
                            `starred-sk-${idx}`,
                            spec.name,
                            spec.count
                          );
                        }
                      )
                    : starredChannels.map(renderChannelRow)}
                </div>
              )}
            </div>
          )}

        {/* Recent */}
        {!hasActiveFilter &&
          (recentChannels.length > 0 ||
            (isLoadingChannels && pendingRecentCount > 0)) && (
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
                <span>{t.sidebar.recent}</span>
              </button>
              {recentOpen && (
                <div className="space-y-0.5">
                  {isLoadingChannels
                    ? Array.from({ length: pendingRecentCount }).map(
                        (_, idx) => {
                          const spec =
                            SIDEBAR_SKELETON_WIDTHS[
                              (idx + 3) % SIDEBAR_SKELETON_WIDTHS.length
                            ];
                          return renderChannelSkeletonRow(
                            `recent-sk-${idx}`,
                            spec.name,
                            spec.count
                          );
                        }
                      )
                    : recentChannels.map(renderChannelRow)}
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
              <span>
                {hasActiveFilter
                  ? t.sidebar.matchingChannels
                  : t.sidebar.popularChannels}
              </span>
            </span>
          </button>
          {channelsOpen && (
            <div className="space-y-0.5">
              {isLoadingChannels
                ? SIDEBAR_SKELETON_WIDTHS.map((spec, idx) =>
                    renderChannelSkeletonRow(
                      `ch-sk-${idx}`,
                      spec.name,
                      spec.count
                    )
                  )
                : filteredChannels.map(renderChannelRow)}
              {!isLoadingChannels &&
                !hasActiveFilter &&
                prioritizedIds.size + filteredChannels.length <
                  channels.length && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDirectory();
                    onCloseMobile();
                  }}
                  className="mt-1.5 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-white/65 hover:bg-[var(--slack-sidebar-hover)] hover:text-white"
                >
                  <Compass className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {t.sidebar.browseAll(channels.length)}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Optional PWA Install CTA (mobile / tablet when browser supports install prompt) */}
      {canInstallPwa && onInstallPwa && (
        <div className="border-t border-[var(--slack-sidebar-border)] px-2.5 py-2 lg:hidden">
          <button
            type="button"
            onClick={() => {
              onInstallPwa();
              onCloseMobile();
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[var(--g0v-brand-accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            <span>{t.pwa.installApp}</span>
          </button>
        </div>
      )}

      {/* Mobile footer utilities (Theme + Language + GitHub + Archive) */}
      <div className="flex items-center justify-between gap-1 border-t border-[var(--slack-sidebar-border)] px-2.5 pt-2 pb-[calc(0.5rem+var(--safe-bottom))] text-xs lg:hidden">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex min-w-0 items-center gap-1.5 truncate rounded-md px-2 py-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Palette className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{themeName}</span>
          </button>
          <button
            type="button"
            onClick={toggleLocale}
            title={t.switchLangTitle}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Languages className="h-3.5 w-3.5 shrink-0" />
            <span>{t.langShort}</span>
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <a
            href="https://github.com/Yukaii/g0v-slack-viewer"
            target="_blank"
            rel="noopener noreferrer"
            title={t.topBar.githubTitle}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            <span>{t.sidebar.repo}</span>
          </a>
          <a
            href="https://g0v-slack-archive.g0v.ronny.tw/"
            target="_blank"
            rel="noopener noreferrer"
            title={t.topBar.archiveLinkTitle}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-white/75 hover:bg-white/10 hover:text-white"
          >
            <span>{t.sidebar.archive}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      {desktopOpen && (
        <div
          className="relative hidden h-full shrink-0 lg:flex"
          style={{ width: `${width}px` }}
        >
          <div className="h-full w-full min-w-0">{sidebarContent}</div>
          {onResizeWidth && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label={t.sidebar.resizeHandleLabel}
              aria-valuenow={width}
              aria-valuemin={SIDEBAR_MIN_WIDTH}
              aria-valuemax={SIDEBAR_MAX_WIDTH}
              tabIndex={0}
              title={t.sidebar.resizeHandleLabel}
              onPointerDown={handleResizePointerDown}
              onDoubleClick={onResetWidth}
              onKeyDown={handleResizeKeyDown}
              className="group absolute top-0 -right-1 z-20 flex h-full w-2.5 cursor-col-resize items-center justify-center focus:outline-none"
            >
              <span
                className={`h-full w-0.5 transition-colors ${
                  isResizing
                    ? 'bg-[var(--slack-accent)]'
                    : 'bg-transparent group-hover:bg-[var(--slack-accent)]/75 group-focus-visible:bg-[var(--slack-accent)]'
                }`}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full w-64 max-w-[85vw] shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
