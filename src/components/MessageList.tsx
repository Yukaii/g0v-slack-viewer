import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUpDown,
  Filter,
  MessageSquare,
  Search,
  X,
} from 'lucide-react';
import type { ArchiveMessage, MessageFile } from '../types';
import { formatDateDivider } from '../utils/format';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  channelId: string;
  month: string;
  isLatestMonth: boolean;
  messages: ArchiveMessage[];
  highlightTs?: string;
  activeThreadTs?: string;
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
  channelId,
  month,
  isLatestMonth,
  messages,
  highlightTs,
  activeThreadTs,
  onOpenThread,
  onNavigateChannel,
  onPreviewFile,
}) => {
  const [localFilter, setLocalFilter] = useState('');
  const [showHiddenReplies, setShowHiddenReplies] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, [highlightTs, visibleMessages]);

  // Reset local filter and scroll to bottom (latest) on latest month, or top on archived months
  useEffect(() => {
    setLocalFilter('');
    if (highlightTs) return;
    const el = containerRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      if (isLatestMonth && sortOrder === 'asc') {
        el.scrollTo({ top: el.scrollHeight });
      } else {
        el.scrollTo({ top: 0 });
      }
    }, 30);
    return () => clearTimeout(timer);
  }, [channelId, month, isLatestMonth, highlightTs, sortOrder]);

  const scrollToLatest = () => {
    const el = containerRef.current;
    if (!el) return;
    if (sortOrder === 'asc') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Sub-toolbar: in-month quick filter, sort toggle, hidden thread reply toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-5 py-1.5 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-[var(--slack-text-muted)]">
          <span>
            Showing{' '}
            <strong className="text-[var(--slack-text)]">
              {visibleMessages.length}
            </strong>{' '}
            messages in <span className="font-mono-code">{month}</span>
          </span>

          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            }
            className="inline-flex items-center gap-1 rounded-full border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2 py-0.5 text-[var(--slack-text-muted)] transition hover:text-[var(--slack-text)]"
            title="Toggle chronological order"
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortOrder === 'asc' ? 'Oldest → Latest' : 'Latest → Oldest'}
          </button>

          {sortOrder === 'asc' && visibleMessages.length > 5 && (
            <button
              type="button"
              onClick={scrollToLatest}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2 py-0.5 text-[var(--slack-link)] transition hover:bg-[var(--slack-badge-bg)]"
              title="Scroll to latest message"
            >
              <ArrowDown className="h-3 w-3" />
              Latest
            </button>
          )}

          {hiddenReplyCount > 0 && (
            <button
              type="button"
              onClick={() => setShowHiddenReplies((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 transition ${
                showHiddenReplies
                  ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/10 text-[var(--slack-link)]'
                  : 'border-[var(--slack-border)] hover:bg-[var(--slack-badge-bg)]'
              }`}
              title="Thread replies are grouped under their parent message; toggle to also show replies whose parent was posted in an earlier month"
            >
              <Filter className="h-3 w-3" />
              {showHiddenReplies
                ? `Hiding ${hiddenReplyCount} thread replies`
                : `+${hiddenReplyCount} thread replies`}
            </button>
          )}
        </div>

        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-[var(--slack-text-muted)]" />
          <input
            type="text"
            value={localFilter}
            onChange={(e) => setLocalFilter(e.target.value)}
            placeholder="Filter this month..."
            className="w-44 rounded-md border border-[var(--slack-border)] bg-[var(--slack-main-bg)] py-1 pr-6 pl-7 text-xs text-[var(--slack-text)] placeholder:text-[var(--slack-text-muted)] focus:border-[var(--slack-accent)] focus:outline-none sm:w-56"
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

      {/* Scrollable feed */}
      <div
        ref={containerRef}
        className="slack-scroll min-h-0 flex-1 overflow-y-auto pb-8"
      >
        {dateGroups.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center text-[var(--slack-text-muted)]">
            <MessageSquare className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm font-medium text-[var(--slack-text)]">
              No messages match this view
            </p>
            <p className="mt-1 text-xs">
              Try clearing the filter or picking another month above.
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
                  month={month}
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
      </div>
    </div>
  );
};
