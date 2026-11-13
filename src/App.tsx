import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Moon,
  RefreshCw,
  Search,
  Sun,
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
import { CommandPalette, type PaletteMode } from './components/CommandPalette';
import { getCommandShortcutLabel } from './utils/platform';
import { ImageLightbox } from './components/ImageLightbox';

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

export const App: React.FC = () => {
  const initialRoute = useMemo(() => parseLocation(), []);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme());
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [starredIds, setStarredIds] = useState<string[]>(() =>
    loadStarredChannels()
  );
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    loadRecentChannels()
  );

  const [viewMode, setViewMode] = useState<'channel' | 'directory'>(
    initialRoute.viewMode
  );
  const [activeChannelId, setActiveChannelId] = useState<string>(
    initialRoute.channelId
  );
  const [requestedMonth, setRequestedMonth] = useState<string | undefined>(
    initialRoute.month
  );
  const [highlightTs, setHighlightTs] = useState<string | undefined>(
    initialRoute.highlightTs
  );

  const [channelDetail, setChannelDetail] =
    useState<ChannelDetailResponse | null>(null);
  const [loadedMonths, setLoadedMonths] = useState<string[]>([]);
  const [loadedMessages, setLoadedMessages] = useState<ArchiveMessage[]>([]);
  const [prevMonthToLoad, setPrevMonthToLoad] = useState<string | null>(null);
  const [nextMonthToLoad, setNextMonthToLoad] = useState<string | null>(null);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);

  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const sessionRef = useRef(0);

  const [activeThread, setActiveThread] = useState<ArchiveMessage | null>(null);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteMode, setPaletteMode] = useState<PaletteMode>('switcher');
  const shortcutLabel = useMemo(() => getCommandShortcutLabel(), []);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<MessageFile | null>(null);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
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
          setViewMode('directory');
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
      setViewMode(next.viewMode);
      setActiveChannelId(next.channelId);
      setRequestedMonth(next.month);
      setHighlightTs(next.highlightTs);
      setActiveThread(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const loadChannel = useCallback(
    async (channelId: string, month?: string) => {
      const mySession = ++sessionRef.current;
      setChannelLoading(true);
      setChannelError(null);
      setLoadingPrev(false);
      setLoadingNext(false);
      try {
        const data = await fetchChannelMessages(channelId, month);
        if (sessionRef.current !== mySession) return;
        setChannelDetail(data);
        setLoadedMonths([data.activeMonth]);
        setLoadedMessages(data.messages);
        setPrevMonthToLoad(data.previousMonth);
        setNextMonthToLoad(data.nextMonth);
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
    []
  );

  // Fetch channel messages when in channel mode
  useEffect(() => {
    if (viewMode !== 'channel') return;
    loadChannel(activeChannelId, requestedMonth);
  }, [viewMode, activeChannelId, requestedMonth, loadChannel]);

  const loadPrevMonth = useCallback(async () => {
    if (!prevMonthToLoad || loadingPrev || channelLoading) return;
    const mySession = sessionRef.current;
    const targetMonth = prevMonthToLoad;
    setLoadingPrev(true);
    try {
      const data = await fetchChannelMessages(activeChannelId, targetMonth);
      if (sessionRef.current !== mySession) return;
      setLoadedMessages((prev) => mergeMessages(prev, data.messages));
      setLoadedMonths((prev) =>
        Array.from(new Set([data.activeMonth, ...prev])).sort()
      );
      setPrevMonthToLoad(data.previousMonth);
    } catch (err) {
      console.warn('Failed to load previous month:', err);
    } finally {
      if (sessionRef.current === mySession) {
        setLoadingPrev(false);
      }
    }
  }, [activeChannelId, prevMonthToLoad, loadingPrev, channelLoading]);

  const loadNextMonth = useCallback(async () => {
    if (!nextMonthToLoad || loadingNext || channelLoading) return;
    const mySession = sessionRef.current;
    const targetMonth = nextMonthToLoad;
    setLoadingNext(true);
    try {
      const data = await fetchChannelMessages(activeChannelId, targetMonth);
      if (sessionRef.current !== mySession) return;
      setLoadedMessages((prev) => mergeMessages(prev, data.messages));
      setLoadedMonths((prev) =>
        Array.from(new Set([...prev, data.activeMonth])).sort()
      );
      setNextMonthToLoad(data.nextMonth);
    } catch (err) {
      console.warn('Failed to load next month:', err);
    } finally {
      if (sessionRef.current === mySession) {
        setLoadingNext(false);
      }
    }
  }, [activeChannelId, nextMonthToLoad, loadingNext, channelLoading]);

  const navigateToChannel = useCallback(
    (channelId: string, month?: string, ts?: string) => {
      setViewMode('channel');
      setActiveChannelId(channelId);
      setRequestedMonth(month);
      setHighlightTs(ts);
      setActiveThread(null);

      const path = month
        ? `/channel/${encodeURIComponent(channelId)}/${encodeURIComponent(month)}`
        : `/channel/${encodeURIComponent(channelId)}`;
      const fullUrl = ts ? `${path}?ts=${encodeURIComponent(ts)}` : path;
      window.history.pushState(null, '', fullUrl);
    },
    []
  );

  const navigateToDirectory = useCallback(() => {
    setViewMode('directory');
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

  const sessionKey = `${activeChannelId}:${channelDetail?.activeMonth ?? requestedMonth ?? 'latest'}`;

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-[var(--slack-main-bg)] text-[var(--slack-text)]">
      {/* Top Slack Workspace Bar */}
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 bg-[var(--slack-top-bg)] px-3 text-white">
        <div className="hidden w-56 items-center gap-2 text-xs text-white/70 md:flex">
          <span className="font-semibold text-white/90">g0v Slack Archive</span>
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
          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            title={
              theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
            }
            className="rounded-md p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <a
            href="https://g0v-slack-archive.g0v.ronny.tw/"
            target="_blank"
            rel="noopener noreferrer"
            title="Original g0v-slack-archive"
            className="hidden items-center gap-1 rounded-md px-2 py-1 text-xs text-white/75 hover:bg-white/15 hover:text-white sm:inline-flex"
          >
            <span>Source</span>
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
                detail={channelDetail}
                loadedMonths={loadedMonths}
                loading={channelLoading}
                isStarred={starredIds.includes(activeChannelId)}
                showInfo={showChannelInfo}
                onToggleStar={() => toggleStar(activeChannelId)}
                onToggleInfo={handleToggleInfo}
                onSelectMonth={(m) => navigateToChannel(activeChannelId, m)}
                onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
                onNavigateChannel={navigateToChannel}
              />

              {channelLoading && !channelDetail ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 text-sm text-[var(--slack-text-muted)]">
                  <Loader2 className="h-7 w-7 animate-spin text-[var(--slack-accent)]" />
                  <span>Loading archived messages...</span>
                </div>
              ) : channelError ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                  <AlertCircle className="h-9 w-9 text-rose-500" />
                  <p className="text-sm font-medium">{channelError}</p>
                  <button
                    type="button"
                    onClick={() => loadChannel(activeChannelId, requestedMonth)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--slack-accent)] px-3.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                </div>
              ) : channelDetail ? (
                <div className="relative flex min-h-0 flex-1 flex-col">
                  {channelLoading && (
                    <div className="absolute top-12 right-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-3 py-1 text-xs shadow-md">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--slack-accent)]" />
                      <span>Loading...</span>
                    </div>
                  )}
                  <MessageList
                    sessionKey={sessionKey}
                    channelId={channelDetail.channelId}
                    loadedMonths={loadedMonths}
                    isLatestLoaded={!nextMonthToLoad}
                    prevMonth={prevMonthToLoad}
                    nextMonth={nextMonthToLoad}
                    loadingPrev={loadingPrev}
                    loadingNext={loadingNext}
                    messages={loadedMessages}
                    highlightTs={highlightTs}
                    activeThreadTs={activeThread?.ts}
                    onLoadPrev={loadPrevMonth}
                    onLoadNext={loadNextMonth}
                    onOpenThread={handleOpenThread}
                    onNavigateChannel={navigateToChannel}
                    onPreviewFile={setPreviewFile}
                  />
                </div>
              ) : null}
            </>
          )}
        </main>

        {/* Right Contextual Pane: Thread or Channel Info */}
        {viewMode === 'channel' && activeThread && channelDetail && (
          <ThreadPanel
            channelId={channelDetail.channelId}
            channelName={channelDetail.channelName}
            month={activeThread.date.slice(0, 7) || channelDetail.activeMonth}
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
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onToggleChannelInfo={handleToggleInfo}
      />

      <ImageLightbox
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};

export default App;
