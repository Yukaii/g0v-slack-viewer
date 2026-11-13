import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Filter,
  Loader2,
  MessageSquare,
  Search,
  X,
} from 'lucide-react';
import type { ArchiveMessage, MessageFile } from '../types';
import { formatDateDivider } from '../utils/format';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  sessionKey: string;
  channelId: string;
  loadedMonths: string[];
  isLatestLoaded: boolean;
  prevMonth: string | null;
  nextMonth: string | null;
  loadingPrev: boolean;
  loadingNext: boolean;
  messages: ArchiveMessage[];
  highlightTs?: string;
  activeThreadTs?: string;
  onLoadPrev: () => void;
  onLoadNext: () => void;
  onOpenThread: (message: ArchiveMessage) => void;
  onNavigateChannel: (channelId: string, month?: string, ts?: string) => void;
  onPreviewFile: (file: MessageFile) => void;
}

function shouldGroupWithPrevious(
  prev: ArchiveMessage | undefined,
  curr: ArchiveMessage
): boolean {
  if (!prev) return false;
  if (prev.date !== curr.date) return false;
  if (prev.isThreadBroadcast || curr.isThreadBroadcast) return false;
  const prevUser = prev.user.id || prev.user.displayName;
  const currUser = curr.user.id || curr.user.displayName;
  if (prevUser !== currUser) return false;
  const deltaSec = Number(curr.ts) - Number(prev.ts);
  return deltaSec >= 0 && deltaSec < 300; // within 5 minutes
}

export const MessageList: React.FC<MessageListProps> = ({
  sessionKey,
  channelId,
  loadedMonths,
  isLatestLoaded,
  prevMonth,
  nextMonth,
  loadingPrev,
  loadingNext,
  messages,
  highlightTs,
  activeThreadTs,
  onLoadPrev,
  onLoadNext,
  onOpenThread,
  onNavigateChannel,
  onPreviewFile,
}) => {
  const [localFilter, setLocalFilter] = useState('');
  const [showHiddenReplies, setShowHiddenReplies] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const initialReadyRef = useRef(false);
  const lastAutoTriggerRef = useRef(0);
  const prependAnchorRef = useRef<{
    active: boolean;
    scrollHeight: number;
    scrollTop: number;
  }>({ active: false, scrollHeight: 0, scrollTop: 0 });

  const hiddenReplyCount = useMemo(
    () =>
      messages.filter((m) => m.isThreadReply && !m.isThreadBroadcast).length,
    [messages]
  );

  // If the highlighted ts is a hidden thread reply, reveal hidden replies automatically
  useEffect(() => {
    if (!highlightTs) return;
    const match = messages.find((m) => m.ts === highlightTs);
    if (match && match.isThreadReply && !match.isThreadBroadcast) {
      setShowHiddenReplies(true);
    }
  }, [highlightTs, messages]);

  const visibleMessages = useMemo(() => {
    const q = localFilter.trim().toLowerCase();
    const filtered = messages.filter((m) => {
      if (!showHiddenReplies && m.isThreadReply && !m.isThreadBroadcast) {
        return false;
      }
      if (!q) return true;
      return (
        m.text.toLowerCase().includes(q) ||
        m.user.displayName.toLowerCase().includes(q) ||
        m.user.name.toLowerCase().includes(q) ||
        m.replies.some((r) => r.text.toLowerCase().includes(q))
      );
    });

    return [...filtered].sort((a, b) =>
      sortOrder === 'asc'
        ? Number(a.ts) - Number(b.ts)
        : Number(b.ts) - Number(a.ts)
    );
  }, [messages, showHiddenReplies, localFilter, sortOrder]);

  // Group by date
  const dateGroups = useMemo(() => {
    const groups: Array<{ date: string; items: ArchiveMessage[] }> = [];
    for (const msg of visibleMessages) {
      const last = groups[groups.length - 1];
      if (!last || last.date !== msg.date) {
        groups.push({ date: msg.date, items: [msg] });
      } else {
        last.items.push(msg);
      }
    }
    return groups;
  }, [visibleMessages]);

  // Maintain scroll position when messages are prepended at the top
  useLayoutEffect(() => {
    const anchor = prependAnchorRef.current;
    const el = containerRef.current;
    if (!anchor.active || !el) return;
    const delta = el.scrollHeight - anchor.scrollHeight;
    if (delta > 0) {
      el.scrollTop = anchor.scrollTop + delta;
    }
    anchor.active = false;
  }, [visibleMessages]);

  // Scroll to highlighted message
  useEffect(() => {
    if (!highlightTs) return;
    const timer = setTimeout(() => {
      const target = containerRef.current?.querySelector(
        `[data-ts="${CSS.escape(highlightTs)}"]`
      );
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [highlightTs, sessionKey]);

  // Initial scroll behavior ONLY when switching channel/requested-month session (not on infinite-load append/prepend)
  useEffect(() => {
    setLocalFilter('');
    initialReadyRef.current = false;
    prependAnchorRef.current.active = false;

    if (highlightTs) {
      const readyTimer = setTimeout(() => {
        initialReadyRef.current = true;
      }, 250);
      return () => clearTimeout(readyTimer);
    }

    const el = containerRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      if (isLatestLoaded && sortOrder === 'asc') {
        el.scrollTo({ top: el.scrollHeight });
      } else {
        el.scrollTo({ top: 0 });
      }
      setTimeout(() => {
        initialReadyRef.current = true;
      }, 150);
    }, 30);
    return () => clearTimeout(timer);
  }, [sessionKey, sortOrder, highlightTs]);

  const triggerTopLoad = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const now = Date.now();
    if (now - lastAutoTriggerRef.current < 450) return;

    if (sortOrder === 'asc') {
      if (!prevMonth || loadingPrev) return;
      lastAutoTriggerRef.current = now;
      prependAnchorRef.current = {
        active: true,
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
      };
      onLoadPrev();
    } else {
      if (!nextMonth || loadingNext) return;
      lastAutoTriggerRef.current = now;
      prependAnchorRef.current = {
        active: true,
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
      };
      onLoadNext();
    }
  }, [sortOrder, prevMonth, nextMonth, loadingPrev, loadingNext, onLoadPrev, onLoadNext]);

  const triggerBottomLoad = useCallback(() => {
    const now = Date.now();
    if (now - lastAutoTriggerRef.current < 450) return;

    if (sortOrder === 'asc') {
      if (!nextMonth || loadingNext) return;
      lastAutoTriggerRef.current = now;
      onLoadNext();
    } else {
      if (!prevMonth || loadingPrev) return;
      lastAutoTriggerRef.current = now;
      onLoadPrev();
    }
  }, [sortOrder, prevMonth, nextMonth, loadingPrev, loadingNext, onLoadPrev, onLoadNext]);

  const handleScroll = () => {
    if (!initialReadyRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    // Near top -> load earlier (in asc) or newer (in desc)
    if (el.scrollTop < 180) {
      triggerTopLoad();
      return;
    }

    // Near bottom -> load newer (in asc) or earlier (in desc)
    const distToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distToBottom < 180) {
      triggerBottomLoad();
    }
  };

  // Also support wheel-up at top / wheel-down at bottom when a single month fits without a scrollbar
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!initialReadyRef.current) return;
    const el = containerRef.current;
    if (!el) return;

    if (e.deltaY < 0 && el.scrollTop <= 10) {
      triggerTopLoad();
    } else if (
      e.deltaY > 0 &&
      el.scrollHeight - el.scrollTop - el.clientHeight <= 10
    ) {
      triggerBottomLoad();
    }
  };

  const scrollToLatest = () => {
    const el = containerRef.current;
    if (!el) return;
    if (sortOrder === 'asc') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const monthRangeLabel = useMemo(() => {
    if (loadedMonths.length === 0) return '';
    if (loadedMonths.length === 1) return loadedMonths[0];
    return `${loadedMonths[0]} – ${loadedMonths[loadedMonths.length - 1]}`;
  }, [loadedMonths]);

  const topHasMore = sortOrder === 'asc' ? prevMonth : nextMonth;
  const topLoading = sortOrder === 'asc' ? loadingPrev : loadingNext;
  const bottomHasMore = sortOrder === 'asc' ? nextMonth : prevMonth;
  const bottomLoading = sortOrder === 'asc' ? loadingNext : loadingPrev;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Sub-toolbar: loaded month range, sort toggle, quick jump, filter */}
      <div className="border-b border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-2.5 py-1 text-[11px] sm:px-5 sm:py-1.5 sm:text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="slack-scroll flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[var(--slack-text-muted)] sm:flex-wrap sm:gap-2">
            <span className="shrink-0">
              <span className="hidden sm:inline">Showing </span>
              <strong className="text-[var(--slack-text)]">
                {visibleMessages.length}
              </strong>{' '}
              <span className="sm:hidden">msgs</span>
              <span className="hidden sm:inline">messages</span>
              {monthRangeLabel && (
                <span className="hidden md:inline">
                  {' '}
                  in <span className="font-mono-code">{monthRangeLabel}</span>
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={() =>
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              }
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2 py-0.5 text-[var(--slack-text-muted)] transition hover:text-[var(--slack-text)]"
              title="Toggle chronological order"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span className="sm:hidden">{sortOrder === 'asc' ? 'Oldest' : 'Latest'}</span>
              <span className="hidden sm:inline">
                {sortOrder === 'asc' ? 'Oldest → Latest' : 'Latest → Oldest'}
              </span>
            </button>

            {sortOrder === 'asc' && visibleMessages.length > 5 && (
              <button
                type="button"
                onClick={scrollToLatest}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2 py-0.5 text-[var(--slack-link)] transition hover:bg-[var(--slack-badge-bg)]"
                title="Scroll to latest loaded message"
              >
                <ArrowDown className="h-3 w-3" />
                Latest
              </button>
            )}

            {hiddenReplyCount > 0 && (
              <button
                type="button"
                onClick={() => setShowHiddenReplies((v) => !v)}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 transition ${
                  showHiddenReplies
                    ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/10 text-[var(--slack-link)]'
                    : 'border-[var(--slack-border)] hover:bg-[var(--slack-badge-bg)]'
                }`}
                title="Thread replies are grouped under their parent message; toggle to also show replies whose parent was posted in an earlier month"
              >
                <Filter className="h-3 w-3" />
                <span className="sm:hidden">+{hiddenReplyCount}</span>
                <span className="hidden sm:inline">
                  {showHiddenReplies
                    ? `Hiding ${hiddenReplyCount} thread replies`
                    : `+${hiddenReplyCount} thread replies`}
                </span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileFilterOpen((v) => !v)}
            className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 sm:hidden ${
              mobileFilterOpen || localFilter
                ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/10 text-[var(--slack-link)]'
                : 'border-[var(--slack-border)] bg-[var(--slack-main-bg)] text-[var(--slack-text-muted)]'
            }`}
            aria-label="Filter messages"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          <div className="relative hidden items-center sm:flex">
            <Search className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-[var(--slack-text-muted)]" />
            <input
              type="text"
              value={localFilter}
              onChange={(e) => setLocalFilter(e.target.value)}
              placeholder="Filter loaded messages..."
              className="w-56 rounded-md border border-[var(--slack-border)] bg-[var(--slack-main-bg)] py-1 pr-6 pl-7 text-xs text-[var(--slack-text)] placeholder:text-[var(--slack-text-muted)] focus:border-[var(--slack-accent)] focus:outline-none"
            />
            {localFilter && (
              <button
                type="button"
                onClick={() => setLocalFilter('')}
                className="absolute right-1.5 text-[var(--slack-text-muted)] hover:text-[var(--slack-text)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {mobileFilterOpen && (
          <div className="relative mt-1.5 flex items-center sm:hidden">
            <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-[var(--slack-text-muted)]" />
            <input
              type="text"
              value={localFilter}
              onChange={(e) => setLocalFilter(e.target.value)}
              placeholder="Filter loaded messages..."
              autoFocus
              className="w-full rounded-md border border-[var(--slack-border)] bg-[var(--slack-main-bg)] py-1.5 pr-7 pl-8 text-xs text-[var(--slack-text)] placeholder:text-[var(--slack-text-muted)] focus:border-[var(--slack-accent)] focus:outline-none"
            />
            {localFilter && (
              <button
                type="button"
                onClick={() => setLocalFilter('')}
                className="absolute right-2 text-[var(--slack-text-muted)] hover:text-[var(--slack-text)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable feed with infinite loading */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        className="slack-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto pb-6 sm:pb-8"
      >
        {/* Top infinite-load sentinel / control */}
        <div className="flex items-center justify-center pt-3 pb-1">
          {topLoading ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-3.5 py-1 text-xs text-[var(--slack-text-muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--slack-accent)]" />
              <span>Loading {topHasMore}...</span>
            </div>
          ) : topHasMore ? (
            <button
              type="button"
              onClick={triggerTopLoad}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-3.5 py-1 text-xs font-medium text-[var(--slack-link)] transition hover:bg-[var(--slack-badge-bg)]"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              Load {sortOrder === 'asc' ? 'earlier' : 'newer'} month (
              <span className="font-mono-code">{topHasMore}</span>)
            </button>
          ) : visibleMessages.length > 0 ? (
            <span className="text-[11px] text-[var(--slack-text-muted)]">
              {sortOrder === 'asc'
                ? 'Beginning of archived channel history'
                : 'Latest archived messages'}
            </span>
          ) : null}
        </div>

        {dateGroups.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center text-[var(--slack-text-muted)]">
            <MessageSquare className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm font-medium text-[var(--slack-text)]">
              No messages match this view
            </p>
            <p className="mt-1 text-xs">
              Try clearing the filter or loading another month.
            </p>
          </div>
        ) : (
          dateGroups.map((group) => (
            <div key={group.date} className="relative">
              {/* Sticky Date Divider Pill */}
              <div className="sticky top-0 z-10 flex items-center justify-center py-3">
                <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[var(--slack-border)]" />
                <span className="relative rounded-full border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-3.5 py-0.5 text-xs font-semibold text-[var(--slack-text)] shadow-2xs">
                  {formatDateDivider(group.date)}
                </span>
              </div>

              {group.items.map((msg, idx) => (
                <MessageItem
                  key={msg.ts}
                  message={msg}
                  channelId={channelId}
                  month={msg.date.slice(0, 7) || loadedMonths[0] || ''}
                  compact={
                    sortOrder === 'asc' &&
                    shouldGroupWithPrevious(group.items[idx - 1], msg)
                  }
                  isHighlighted={highlightTs === msg.ts}
                  isThreadOpen={activeThreadTs === msg.ts}
                  onOpenThread={onOpenThread}
                  onNavigateChannel={onNavigateChannel}
                  onPreviewFile={onPreviewFile}
                />
              ))}
            </div>
          ))
        )}

        {/* Bottom infinite-load sentinel / control */}
        <div className="flex items-center justify-center pt-4 pb-2">
          {bottomLoading ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-3.5 py-1 text-xs text-[var(--slack-text-muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--slack-accent)]" />
              <span>Loading {bottomHasMore}...</span>
            </div>
          ) : bottomHasMore ? (
            <button
              type="button"
              onClick={triggerBottomLoad}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-3.5 py-1 text-xs font-medium text-[var(--slack-link)] transition hover:bg-[var(--slack-badge-bg)]"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              Load {sortOrder === 'asc' ? 'newer' : 'earlier'} month (
              <span className="font-mono-code">{bottomHasMore}</span>)
            </button>
          ) : visibleMessages.length > 0 ? (
            <span className="text-[11px] text-[var(--slack-text-muted)]">
              {sortOrder === 'asc'
                ? 'End of archived channel history (latest)'
                : 'Beginning of archived channel history'}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
