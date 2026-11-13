import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Hash,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { searchArchive } from '../api';
import type { SearchResultItem } from '../types';
import { RichContent } from './RichContent';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onJumpToMessage: (channelId: string, month: string, ts: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  open,
  onClose,
  onJumpToMessage,
}) => {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setChannelFilter('ALL');
    setSubmittedQuery(q);
    try {
      const res = await searchArchive(q);
      setResults(res.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const channelCounts = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; count: number }>();
    for (const r of results) {
      const existing = counts.get(r.channelId);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(r.channelId, {
          id: r.channelId,
          name: r.channelName,
          count: 1,
        });
      }
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }, [results]);

  const filteredResults = useMemo(
    () =>
      channelFilter === 'ALL'
        ? results
        : results.filter((r) => r.channelId === channelFilter),
    [results, channelFilter]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-3 pt-12 backdrop-blur-xs sm:p-6 sm:pt-16"
      onClick={onClose}
    >
      <div
        className="flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--slack-border)] bg-[var(--slack-main-bg)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-b border-[var(--slack-border)] px-4 py-3"
        >
          <Search className="h-5 w-5 shrink-0 text-[var(--slack-text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search g0v.tw Slack messages (press Enter)..."
            className="min-w-0 flex-1 bg-transparent text-base text-[var(--slack-text)] placeholder:text-[var(--slack-text-muted)] focus:outline-none"
          />
          {loading && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--slack-accent)]" />
          )}
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="rounded-md bg-[var(--slack-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
          >
            Search
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)]"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        {/* Channel filter pills when results exist */}
        {channelCounts.length > 1 && (
          <div className="slack-scroll flex items-center gap-1.5 overflow-x-auto border-b border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-4 py-2 text-xs">
            <button
              type="button"
              onClick={() => setChannelFilter('ALL')}
              className={`shrink-0 rounded-full border px-2.5 py-0.5 font-medium ${
                channelFilter === 'ALL'
                  ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)] text-white'
                  : 'border-[var(--slack-border)] bg-[var(--slack-main-bg)] text-[var(--slack-text-muted)]'
              }`}
            >
              All ({results.length})
            </button>
            {channelCounts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannelFilter(c.id)}
                className={`shrink-0 rounded-full border px-2.5 py-0.5 font-medium ${
                  channelFilter === c.id
                    ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)] text-white'
                    : 'border-[var(--slack-border)] bg-[var(--slack-main-bg)] text-[var(--slack-text-muted)] hover:text-[var(--slack-text)]'
                }`}
              >
                #{c.name} ({c.count})
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="slack-scroll min-h-0 flex-1 overflow-y-auto">
          {error && (
            <div className="p-6 text-center text-sm text-red-500">{error}</div>
          )}

          {!submittedQuery && !loading && (
            <div className="px-6 py-12 text-center text-sm text-[var(--slack-text-muted)]">
              <p className="font-medium text-[var(--slack-text)]">
                Search across 522,000+ archived g0v Slack messages
              </p>
              <p className="mt-1 text-xs">
                Try keywords like{' '}
                <button
                  type="button"
                  onClick={() => setQuery('hackmd')}
                  className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 font-mono-code text-[var(--slack-link)] hover:underline"
                >
                  hackmd
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => setQuery('summit')}
                  className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 font-mono-code text-[var(--slack-link)] hover:underline"
                >
                  summit
                </button>
                , or{' '}
                <button
                  type="button"
                  onClick={() => setQuery('cofacts')}
                  className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 font-mono-code text-[var(--slack-link)] hover:underline"
                >
                  cofacts
                </button>
              </p>
            </div>
          )}

          {submittedQuery && !loading && filteredResults.length === 0 && !error && (
            <div className="px-6 py-12 text-center text-sm text-[var(--slack-text-muted)]">
              No messages found for "{submittedQuery}".
            </div>
          )}

          <div className="divide-y divide-[var(--slack-border)]">
            {filteredResults.map((item) => (
              <div
                key={`${item.channelId}-${item.ts}`}
                onClick={() => {
                  onJumpToMessage(item.channelId, item.month, item.ts);
                  onClose();
                }}
                className="group cursor-pointer px-4 py-3.5 transition-colors hover:bg-[var(--slack-surface-hover)]"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded bg-[var(--slack-badge-bg)] px-2 py-0.5 font-semibold text-[var(--slack-text)]">
                    <Hash className="h-3 w-3 text-[var(--slack-text-muted)]" />
                    {item.channelName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[var(--slack-text-muted)] group-hover:text-[var(--slack-link)]">
                    <span>{item.dateLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </div>

                <div className="flex gap-2.5">
                  <img
                    src={item.message.user.avatar}
                    alt={item.message.user.displayName}
                    loading="lazy"
                    className="mt-0.5 h-8 w-8 shrink-0 rounded-lg object-cover bg-[var(--slack-badge-bg)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-[var(--slack-text)]">
                      {item.message.user.displayName}
                    </div>
                    <RichContent
                      html={item.message.contentsHtml}
                      className="line-clamp-4 !text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
