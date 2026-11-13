import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { fetchChannelMessages, fetchChannels, fetchStats } from './api';
import type {
  ArchiveMessage,
  ArchiveStats,
  ChannelDetailResponse,
  ChannelSummary,
  MessageFile,
} from './types';
import {
  loadRecentChannels,
  loadStarredChannels,
  loadTheme,
  recordRecentChannel,
  saveStarredChannels,
  saveTheme,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { ChannelHeader } from './components/ChannelHeader';
import { MessageList } from './components/MessageList';
import { ThreadPanel } from './components/ThreadPanel';
import { ChannelInfoPanel } from './components/ChannelInfoPanel';
import { ChannelDirectory } from './components/ChannelDirectory';
import { ChannelMapProvider } from './context/ChannelMapContext';
import { CommandPalette, type PaletteMode } from './components/CommandPalette';
import { getCommandShortcutLabel } from './utils/platform';
import { ImageLightbox } from './components/ImageLightbox';
import { G0vLogo } from './components/G0vLogo';
import { ThemePicker } from './components/ThemePicker';
import { APP_THEMES, getThemeMeta, type AppThemeId } from './utils/themes';

const DEFAULT_CHANNEL_ID = 'C02G2SXKX'; // #general

interface RouteState {
  viewMode: 'channel' | 'directory';
  channelId: string;
  month?: string;
  highlightTs?: string;
}

function parseLocation(): RouteState {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const ts = params.get('ts') || undefined;

  if (path === '/channels') {
    return { viewMode: 'directory', channelId: DEFAULT_CHANNEL_ID };
  }

  const chMatch = path.match(/^\/channel\/([^/]+)(?:\/(\d{4}-\d{2}))?\/?$/);
  if (chMatch) {
    return {
      viewMode: 'channel',
      channelId: decodeURIComponent(chMatch[1]),
      month: chMatch[2],
      highlightTs: ts,
    };
  }

  return {
    viewMode: 'channel',
    channelId: DEFAULT_CHANNEL_ID,
    highlightTs: ts,
  };
}

function mergeMessages(
  existing: ArchiveMessage[],
  incoming: ArchiveMessage[]
): ArchiveMessage[] {
  const map = new Map<string, ArchiveMessage>();
  for (const m of existing) map.set(m.ts, m);
  for (const m of incoming) {
    const prev = map.get(m.ts);
    if (!prev || m.replies.length >= prev.replies.length) {
      map.set(m.ts, m);
    }
  }
  return Array.from(map.values()).sort((a, b) => Number(a.ts) - Number(b.ts));
}

const MAX_CACHED_CHANNELS = 30;

interface AppRouteState {
  viewMode: 'channel' | 'directory';
  channelId: string;
  month?: string;
  highlightTs?: string;
  forceMonthReload?: boolean;
  seq: number;
}

interface MessageListRestoreState {
  scrollTop: number | null;
  sortOrder: 'asc' | 'desc';
  showHiddenReplies: boolean;
  localFilter: string;
}

interface CachedChannelState extends MessageListRestoreState {
  detail: ChannelDetailResponse;
  loadedMonths: string[];
  loadedMessages: ArchiveMessage[];
  prevMonthToLoad: string | null;
  nextMonthToLoad: string | null;
  lastHighlightTs?: string;
}

const DEFAULT_LIST_RESTORE: MessageListRestoreState = {
  scrollTop: null,
  sortOrder: 'asc',
  showHiddenReplies: false,
  localFilter: '',
};

function getInitialRoute(): AppRouteState {
  const parsed = parseLocation();
  return { ...parsed, seq: 0 };
}

export const App: React.FC = () => {
  const initialRoute = useMemo(() => getInitialRoute(), []);

  const [theme, setTheme] = useState<AppThemeId>(() => loadTheme());
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>(() =>
    loadStarredChannels()
  );
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    loadRecentChannels()
  );

  const [routeState, setRouteState] = useState<AppRouteState>(initialRoute);
  const viewMode = routeState.viewMode;
  const activeChannelId = routeState.channelId;
  const highlightTs = routeState.highlightTs;

  const [channelDetail, setChannelDetail] =
    useState<ChannelDetailResponse | null>(null);
  const [loadedMonths, setLoadedMonths] = useState<string[]>([]);
  const [loadedMessages, setLoadedMessages] = useState<ArchiveMessage[]>([]);
  const [prevMonthToLoad, setPrevMonthToLoad] = useState<string | null>(null);
  const [nextMonthToLoad, setNextMonthToLoad] = useState<string | null>(null);
  const [listRestoreState, setListRestoreState] =
    useState<MessageListRestoreState>(DEFAULT_LIST_RESTORE);
  const [highlightRequestKey, setHighlightRequestKey] = useState(
    initialRoute.highlightTs ? 1 : 0
  );
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);

  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const sessionRef = useRef(0);
  const highlightSeqRef = useRef(initialRoute.highlightTs ? 1 : 0);
  const channelCacheRef = useRef<Map<string, CachedChannelState>>(new Map());

  const [activeThread, setActiveThread] = useState<ArchiveMessage | null>(null);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMode, setPaletteMode] = useState<PaletteMode>('switcher');
  const shortcutLabel = useMemo(() => getCommandShortcutLabel(), []);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<MessageFile | null>(null);

  const cycleTheme = useCallback(() => {
    setTheme((prev) => {
      const idx = APP_THEMES.findIndex((t) => t.id === prev);
      return APP_THEMES[(idx + 1) % APP_THEMES.length].id;
    });
  }, []);

  // Apply data-theme attribute and dark class to <html>
  useEffect(() => {
    const root = document.documentElement;
    const meta = getThemeMeta(theme);
    root.setAttribute('data-theme', theme);
    if (meta.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  const openPalette = useCallback((mode: PaletteMode) => {
    setPaletteMode(mode);
    setPaletteOpen(true);
  }, []);

  // Global Slack-like keyboard shortcuts (Cmd/Ctrl+K Quick Switcher, Cmd/Ctrl+Shift+K Directory)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (e.shiftKey) {
          setPaletteOpen(false);
          setRouteState((prev) => ({
            ...prev,
            viewMode: 'directory',
            seq: prev.seq + 1,
          }));
          setActiveThread(null);
          setShowChannelInfo(false);
          window.history.pushState(null, '', '/channels');
          return;
        }
        setPaletteOpen((prevOpen) => {
          if (!prevOpen) {
            setPaletteMode('switcher');
            return true;
          }
          if (paletteMode !== 'switcher') {
            setPaletteMode('switcher');
            return true;
          }
          return false;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paletteMode]);

  // Load workspace stats & channels on mount
  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err) => console.warn('Stats load failed:', err));
    fetchChannels()
      .then(setChannels)
      .catch((err) => console.warn('Channels load failed:', err));
  }, []);

  // Sync browser back/forward
  useEffect(() => {
    const onPopState = () => {
      const next = parseLocation();
      setRouteState((prev) => ({
        ...next,
        forceMonthReload: false,
        seq: prev.seq + 1,
      }));
      setActiveThread(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setCacheEntry = useCallback(
    (channelId: string, entry: CachedChannelState) => {
      const cache = channelCacheRef.current;
      cache.delete(channelId);
      cache.set(channelId, entry);
      if (cache.size > MAX_CACHED_CHANNELS) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }
    },
    []
  );

  const loadChannel = useCallback(
    async (
      channelId: string,
      month?: string,
      ts?: string,
      forceMonthReload?: boolean
    ) => {
      const cached = channelCacheRef.current.get(channelId);
      const canRestoreCached =
        !forceMonthReload &&
        Boolean(cached) &&
        (!month || cached!.loadedMonths.includes(month)) &&
        (!ts ||
          cached!.loadedMessages.some(
            (m) => m.ts === ts || m.replies.some((r) => r.ts === ts)
          ));

      if (canRestoreCached && cached) {
        // Touch LRU entry without discarding loaded messages or scroll state
        setCacheEntry(channelId, cached);
        const mySession = ++sessionRef.current;
        setChannelError(null);
        setChannelLoading(false);
        setLoadingPrev(false);
        setLoadingNext(false);
        setChannelDetail(cached.detail);
        setLoadedMonths(cached.loadedMonths);
        setLoadedMessages(cached.loadedMessages);
        setPrevMonthToLoad(cached.prevMonthToLoad);
        setNextMonthToLoad(cached.nextMonthToLoad);
        setListRestoreState({
          scrollTop: cached.scrollTop,
          sortOrder: cached.sortOrder,
          showHiddenReplies: cached.showHiddenReplies,
          localFilter: cached.localFilter,
        });
        if (ts && (ts !== cached.lastHighlightTs || cached.scrollTop === null)) {
          cached.lastHighlightTs = ts;
          setHighlightRequestKey(++highlightSeqRef.current);
        } else {
          setHighlightRequestKey(0);
        }
        if (sessionRef.current === mySession) {
          setRecentIds(recordRecentChannel(channelId));
        }
        return;
      }

      const mySession = ++sessionRef.current;
      setChannelLoading(true);
      setChannelError(null);
      setLoadingPrev(false);
      setLoadingNext(false);
      try {
        const data = await fetchChannelMessages(channelId, month);
        if (sessionRef.current !== mySession) return;
        const nextRestore: MessageListRestoreState = {
          scrollTop: null,
          sortOrder: cached?.sortOrder ?? 'asc',
          showHiddenReplies: cached?.showHiddenReplies ?? false,
          localFilter: '',
        };
        const newEntry: CachedChannelState = {
          detail: data,
          loadedMonths: [data.activeMonth],
          loadedMessages: data.messages,
          prevMonthToLoad: data.previousMonth,
          nextMonthToLoad: data.nextMonth,
          lastHighlightTs: ts,
          ...nextRestore,
        };
        setCacheEntry(channelId, newEntry);
        setChannelDetail(data);
        setLoadedMonths(newEntry.loadedMonths);
        setLoadedMessages(newEntry.loadedMessages);
        setPrevMonthToLoad(newEntry.prevMonthToLoad);
        setNextMonthToLoad(newEntry.nextMonthToLoad);
        setListRestoreState(nextRestore);
        setHighlightRequestKey(ts ? ++highlightSeqRef.current : 0);
        setRecentIds(recordRecentChannel(channelId));
      } catch (err) {
        if (sessionRef.current !== mySession) return;
        setChannelError(
          err instanceof Error ? err.message : 'Failed to load channel'
        );
      } finally {
        if (sessionRef.current === mySession) {
          setChannelLoading(false);
        }
      }
    },
    [setCacheEntry]
  );

  // Fetch or restore channel messages on route changes in channel mode
  useEffect(() => {
    if (routeState.viewMode !== 'channel') return;
    loadChannel(
      routeState.channelId,
      routeState.month,
      routeState.highlightTs,
      routeState.forceMonthReload
    );
  }, [routeState, loadChannel]);

  const loadPrevMonth = useCallback(async () => {
    if (!prevMonthToLoad || loadingPrev || channelLoading) return;
    const mySession = sessionRef.current;
    const targetChannelId = activeChannelId;
    const targetMonth = prevMonthToLoad;
    setLoadingPrev(true);
    try {
      const data = await fetchChannelMessages(targetChannelId, targetMonth);
      if (sessionRef.current !== mySession) return;
      const entry = channelCacheRef.current.get(targetChannelId);
      const nextMessages = mergeMessages(
        entry ? entry.loadedMessages : loadedMessages,
        data.messages
      );
      const nextMonths = Array.from(
        new Set([data.activeMonth, ...(entry ? entry.loadedMonths : loadedMonths)])
      ).sort();
      if (entry) {
        entry.loadedMessages = nextMessages;
        entry.loadedMonths = nextMonths;
        entry.prevMonthToLoad = data.previousMonth;
      }
      setLoadedMessages(nextMessages);
      setLoadedMonths(nextMonths);
      setPrevMonthToLoad(data.previousMonth);
    } catch (err) {
      console.warn('Failed to load previous month:', err);
    } finally {
      if (sessionRef.current === mySession) {
        setLoadingPrev(false);
      }
    }
  }, [
    activeChannelId,
    prevMonthToLoad,
    loadingPrev,
    channelLoading,
    loadedMessages,
    loadedMonths,
  ]);

  const loadNextMonth = useCallback(async () => {
    if (!nextMonthToLoad || loadingNext || channelLoading) return;
    const mySession = sessionRef.current;
    const targetChannelId = activeChannelId;
    const targetMonth = nextMonthToLoad;
    setLoadingNext(true);
    try {
      const data = await fetchChannelMessages(targetChannelId, targetMonth);
      if (sessionRef.current !== mySession) return;
      const entry = channelCacheRef.current.get(targetChannelId);
      const nextMessages = mergeMessages(
        entry ? entry.loadedMessages : loadedMessages,
        data.messages
      );
      const nextMonths = Array.from(
        new Set([...(entry ? entry.loadedMonths : loadedMonths), data.activeMonth])
      ).sort();
      if (entry) {
        entry.loadedMessages = nextMessages;
        entry.loadedMonths = nextMonths;
        entry.nextMonthToLoad = data.nextMonth;
      }
      setLoadedMessages(nextMessages);
      setLoadedMonths(nextMonths);
      setNextMonthToLoad(data.nextMonth);
    } catch (err) {
      console.warn('Failed to load next month:', err);
    } finally {
      if (sessionRef.current === mySession) {
        setLoadingNext(false);
      }
    }
  }, [
    activeChannelId,
    nextMonthToLoad,
    loadingNext,
    channelLoading,
    loadedMessages,
    loadedMonths,
  ]);

  const handleScrollTopChange = useCallback(
    (channelId: string, scrollTop: number) => {
      const entry = channelCacheRef.current.get(channelId);
      if (entry) {
        entry.scrollTop = scrollTop;
      }
    },
    []
  );

  const handleViewPrefsChange = useCallback(
    (
      channelId: string,
      prefs: {
        sortOrder: 'asc' | 'desc';
        showHiddenReplies: boolean;
        localFilter: string;
      }
    ) => {
      const entry = channelCacheRef.current.get(channelId);
      if (entry) {
        entry.sortOrder = prefs.sortOrder;
        entry.showHiddenReplies = prefs.showHiddenReplies;
        entry.localFilter = prefs.localFilter;
      }
    },
    []
  );

  const navigateToChannel = useCallback(
    (channelId: string, month?: string, ts?: string) => {
      setActiveThread(null);
      setRouteState((prev) => {
        if (
          prev.viewMode === 'channel' &&
          prev.channelId === channelId &&
          !month &&
          !ts
        ) {
          return prev;
        }
        return {
          viewMode: 'channel',
          channelId,
          month,
          highlightTs: ts,
          forceMonthReload: false,
          seq: prev.seq + 1,
        };
      });

      const path = month
        ? `/channel/${encodeURIComponent(channelId)}/${encodeURIComponent(month)}`
        : `/channel/${encodeURIComponent(channelId)}`;
      const fullUrl = ts ? `${path}?ts=${encodeURIComponent(ts)}` : path;
      if (window.location.pathname + window.location.search !== fullUrl) {
        window.history.pushState(null, '', fullUrl);
      }
    },
    []
  );

  const handleSelectMonth = useCallback(
    (month: string) => {
      setActiveThread(null);
      setRouteState((prev) => ({
        viewMode: 'channel',
        channelId: prev.channelId,
        month,
        highlightTs: undefined,
        forceMonthReload: true,
        seq: prev.seq + 1,
      }));
      const path = `/channel/${encodeURIComponent(
        activeChannelId
      )}/${encodeURIComponent(month)}`;
      if (window.location.pathname + window.location.search !== path) {
        window.history.pushState(null, '', path);
      }
    },
    [activeChannelId]
  );

  const navigateToDirectory = useCallback(() => {
    setRouteState((prev) => ({
      ...prev,
      viewMode: 'directory',
      seq: prev.seq + 1,
    }));
    setActiveThread(null);
    setShowChannelInfo(false);
    window.history.pushState(null, '', '/channels');
  }, []);

  const toggleStar = useCallback((channelId: string) => {
    setStarredIds((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      saveStarredChannels(next);
      return next;
    });
  }, []);

  const activeChannelSummary = useMemo(
    () => channels.find((c) => c.id === activeChannelId),
    [channels, activeChannelId]
  );

  const handleOpenThread = useCallback((msg: ArchiveMessage) => {
    setShowChannelInfo(false);
    setActiveThread(msg);
  }, []);

  const handleToggleInfo = useCallback(() => {
    setActiveThread(null);
    setShowChannelInfo((v) => !v);
  }, []);

  const activeDetail =
    channelDetail?.channelId === activeChannelId ? channelDetail : null;
  const sessionKey = activeDetail
    ? `${activeDetail.channelId}:${activeDetail.activeMonth}`
    : `${activeChannelId}:loading`;

  return (
    <ChannelMapProvider channels={channels}>
    <div className="flex h-dvh w-full max-w-full flex-col overflow-hidden bg-[var(--slack-main-bg)] text-[var(--slack-text)]">
      {/* Top Slack Workspace Bar */}
      <div className="hidden h-11 shrink-0 items-center justify-between gap-3 border-b-2 border-[var(--g0v-brand-accent)] bg-[var(--slack-top-bg)] px-3 text-white sm:flex">
        <div className="hidden w-56 shrink-0 items-center gap-2 text-xs text-white/75 md:flex">
          <G0vLogo variant="wordmark" size="sm" />
          <span className="whitespace-nowrap font-semibold tracking-tight text-white">
            Slack Archive
          </span>
          <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/75">
            零時政府
          </span>
        </div>

        {/* Centered Global Search Trigger */}
        <button
          type="button"
          onClick={() => openPalette('switcher')}
          className="flex h-7 w-full max-w-xl items-center justify-between rounded-md border border-white/15 bg-white/15 px-3 text-xs text-white/85 transition hover:bg-white/25"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate sm:hidden">Jump or search…</span>
            <span className="hidden truncate sm:inline">Jump to channel or search g0v.tw...</span>
          </span>
          <kbd className="hidden rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-medium text-white/80 sm:inline">
            {shortcutLabel}
          </kbd>
        </button>

        {/* Right utility controls */}
        <div className="flex shrink-0 items-center gap-1.5">
          <ThemePicker theme={theme} onSelectTheme={setTheme} />
          <a
            href="https://github.com/Yukaii/g0v-slack-viewer"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub Repository (Yukaii/g0v-slack-viewer)"
            className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/80 hover:bg-white/15 hover:text-white sm:inline-flex"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            <span className="hidden md:inline">GitHub</span>
          </a>
          <a
            href="https://g0v-slack-archive.g0v.ronny.tw/"
            target="_blank"
            rel="noopener noreferrer"
            title="Upstream data archive (g0v-slack-archive)"
            className="hidden items-center gap-1 rounded-md px-2 py-1 text-xs text-white/75 hover:bg-white/15 hover:text-white sm:inline-flex"
          >
            <span>Archive</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Main 3-Pane Body */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          channels={channels}
          stats={stats}
          activeChannelId={activeChannelId}
          viewMode={viewMode}
          starredIds={starredIds}
          recentIds={recentIds}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onSelectChannel={(cid) => navigateToChannel(cid)}
          onOpenDirectory={navigateToDirectory}
          onOpenSwitcher={() => openPalette('switcher')}
          onOpenSearch={() => openPalette('search')}
          theme={theme}
          onToggleTheme={cycleTheme}
        />

        {/* Center Pane */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {viewMode === 'directory' ? (
            <ChannelDirectory
              channels={channels}
              stats={stats}
              starredIds={starredIds}
              onSelectChannel={(cid) => navigateToChannel(cid)}
              onToggleStar={toggleStar}
              onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            />
          ) : (
            <>
              <ChannelHeader
                summary={activeChannelSummary}
                detail={activeDetail}
                loadedMonths={activeDetail ? loadedMonths : []}
                loading={channelLoading}
                isStarred={starredIds.includes(activeChannelId)}
                showInfo={showChannelInfo}
                onToggleStar={() => toggleStar(activeChannelId)}
                onToggleInfo={handleToggleInfo}
                onSelectMonth={handleSelectMonth}
                onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
                onOpenSwitcher={() => openPalette('switcher')}
                onNavigateChannel={navigateToChannel}
              />

              {channelLoading && !activeDetail ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-[var(--slack-text-muted)]">
                  <Loader2 className="h-7 w-7 animate-spin text-[var(--slack-accent)]" />
                  <span>Loading archived messages...</span>
                </div>
              ) : channelError && !activeDetail ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                  <AlertCircle className="h-9 w-9 text-rose-500" />
                  <p className="text-sm font-medium">{channelError}</p>
                  <button
                    type="button"
                    onClick={() =>
                      loadChannel(
                        activeChannelId,
                        routeState.month,
                        routeState.highlightTs,
                        routeState.forceMonthReload
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--slack-accent)] px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                </div>
              ) : activeDetail ? (
                <div className="relative flex min-h-0 flex-1 flex-col">
                  {channelLoading && (
                    <div className="absolute top-12 right-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-3 py-1 text-xs shadow-md">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--slack-accent)]" />
                      <span>Loading...</span>
                    </div>
                  )}
                  <MessageList
                    key={sessionKey}
                    sessionKey={sessionKey}
                    channelId={activeDetail.channelId}
                    loadedMonths={loadedMonths}
                    isLatestLoaded={!nextMonthToLoad}
                    prevMonth={prevMonthToLoad}
                    nextMonth={nextMonthToLoad}
                    loadingPrev={loadingPrev}
                    loadingNext={loadingNext}
                    messages={loadedMessages}
                    highlightTs={highlightTs}
                    highlightRequestKey={highlightRequestKey}
                    initialScrollTop={listRestoreState.scrollTop}
                    initialSortOrder={listRestoreState.sortOrder}
                    initialShowHiddenReplies={listRestoreState.showHiddenReplies}
                    initialLocalFilter={listRestoreState.localFilter}
                    activeThreadTs={activeThread?.ts}
                    onLoadPrev={loadPrevMonth}
                    onLoadNext={loadNextMonth}
                    onOpenThread={handleOpenThread}
                    onNavigateChannel={navigateToChannel}
                    onPreviewFile={setPreviewFile}
                    onScrollTopChange={handleScrollTopChange}
                    onViewPrefsChange={handleViewPrefsChange}
                  />
                </div>
              ) : null}
            </>
          )}
        </main>

        {/* Right Contextual Pane: Thread or Channel Info */}
        {viewMode === 'channel' && activeThread && activeDetail && (
          <ThreadPanel
            channelId={activeDetail.channelId}
            channelName={activeDetail.channelName}
            month={activeThread.date.slice(0, 7) || activeDetail.activeMonth}
            message={activeThread}
            onClose={() => setActiveThread(null)}
            onNavigateChannel={navigateToChannel}
            onPreviewFile={setPreviewFile}
          />
        )}

        {viewMode === 'channel' &&
          showChannelInfo &&
          !activeThread &&
          activeChannelSummary && (
            <ChannelInfoPanel
              channel={activeChannelSummary}
              onClose={() => setShowChannelInfo(false)}
              onNavigateChannel={navigateToChannel}
            />
          )}
      </div>

      {/* Modals */}
      <CommandPalette
        open={paletteOpen}
        initialMode={paletteMode}
        channels={channels}
        starredIds={starredIds}
        recentIds={recentIds}
        activeChannelId={activeChannelId}
        viewMode={viewMode}
        theme={theme}
        onClose={() => setPaletteOpen(false)}
        onSelectChannel={(cid) => navigateToChannel(cid)}
        onJumpToMessage={(cid, m, ts) => navigateToChannel(cid, m, ts)}
        onOpenDirectory={navigateToDirectory}
        onToggleTheme={cycleTheme}
        onToggleChannelInfo={handleToggleInfo}
      />

      <ImageLightbox
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
    </ChannelMapProvider>
  );
};

export default App;
