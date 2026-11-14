import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Compass,
  Hash,
  History,
  Info,
  Languages,
  Loader2,
  Palette,
  Search,
  Star,
  X,
} from 'lucide-react';
import { searchArchive } from '../api';
import { useI18n } from '../i18n/I18nContext';
import type { ChannelSummary, SearchResultItem } from '../types';
import { dedupeSearchResults } from '../utils/dedupeMessages';
import { formatCompactNumber } from '../utils/format';
import { getCommandShortcutLabel } from '../utils/platform';
import type { Locale } from '../utils/storage';
import { APP_THEMES, type AppThemeId } from '../utils/themes';
import { RichContent } from './RichContent';

export type PaletteMode = 'switcher' | 'search';

interface CommandPaletteProps {
  open: boolean;
  initialMode: PaletteMode;
  channels: ChannelSummary[];
  starredIds: string[];
  recentIds: string[];
  activeChannelId: string;
  viewMode: 'channel' | 'directory';
  theme: AppThemeId;
  onClose: () => void;
  onSelectChannel: (channelId: string) => void;
  onJumpToMessage: (channelId: string, month: string, ts: string) => void;
  onOpenDirectory: () => void;
  onToggleTheme: () => void;
  onSelectTheme?: (theme: AppThemeId) => void;
  onToggleChannelInfo: () => void;
}

type SwitcherItem =
  | {
      kind: 'channel';
      key: string;
      channel: ChannelSummary;
      badge?: 'Starred' | 'Recent';
    }
  | {
      kind: 'action';
      key: string;
      id:
        | 'directory'
        | 'theme'
        | 'language'
        | 'info'
        | 'search-mode'
        | `set-theme:${AppThemeId}`
        | `set-locale:${Locale}`;
      label: string;
      description: string;
      keywords?: string;
      shortcut?: string;
    };

function scoreChannel(
  ch: ChannelSummary,
  rawQuery: string,
  starredSet: Set<string>,
  recentSet: Set<string>
): number {
  const q = rawQuery.replace(/^#/, '').trim().toLowerCase();
  if (!q) return 0;
  const name = ch.name.toLowerCase();
  const topic = ch.topicText.toLowerCase();
  const purpose = ch.descriptionText.toLowerCase();

  let score = 0;
  if (name === q) {
    score = 1000;
  } else if (name.startsWith(q)) {
    score = 800;
  } else if (name.split(/[-_]/).some((part) => part.startsWith(q))) {
    score = 650;
  } else if (name.includes(q)) {
    score = 450;
  } else if (topic.includes(q) || purpose.includes(q)) {
    score = 200;
  } else {
    return -1;
  }

  if (starredSet.has(ch.id)) score += 60;
  if (recentSet.has(ch.id)) score += 40;
  score += Math.min(35, Math.log10(Math.max(1, ch.messageCount)) * 7);
  return score;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  open,
  initialMode,
  channels,
  starredIds,
  recentIds,
  activeChannelId,
  viewMode,
  theme,
  onClose,
  onSelectChannel,
  onJumpToMessage,
  onOpenDirectory,
  onToggleTheme,
  onSelectTheme,
  onToggleChannelInfo,
}) => {
  const { locale, setLocale, toggleLocale, t } = useI18n();
  const [mode, setMode] = useState<PaletteMode>(initialMode);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search-mode state
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const shortcutLabel = useMemo(() => getCommandShortcutLabel(), []);

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setSelectedIndex(0);
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
    return () => clearTimeout(timer);
  }, [open, initialMode]);

  const starredSet = useMemo(() => new Set(starredIds), [starredIds]);
  const recentSet = useMemo(() => new Set(recentIds), [recentIds]);

  const channelMap = useMemo(() => {
    const map = new Map<string, ChannelSummary>();
    for (const c of channels) map.set(c.id, c);
    return map;
  }, [channels]);

  const switcherItems = useMemo<SwitcherItem[]>(() => {
    const q = query.trim();
    const qLower = q.toLowerCase();
    const items: SwitcherItem[] = [];

    if (!q) {
      const seen = new Set<string>();

      for (const id of recentIds) {
        const ch = channelMap.get(id);
        if (ch && !seen.has(ch.id)) {
          seen.add(ch.id);
          items.push({
            kind: 'channel',
            key: `ch:${ch.id}`,
            channel: ch,
            badge: starredSet.has(ch.id) ? 'Starred' : 'Recent',
          });
        }
        if (items.length >= 6) break;
      }

      for (const id of starredIds) {
        if (items.length >= 9) break;
        const ch = channelMap.get(id);
        if (ch && !seen.has(ch.id)) {
          seen.add(ch.id);
          items.push({
            kind: 'channel',
            key: `ch:${ch.id}`,
            channel: ch,
            badge: 'Starred',
          });
        }
      }

      if (items.length < 9) {
        const popular = [...channels]
          .sort((a, b) => b.messageCount - a.messageCount)
          .slice(0, 15);
        for (const ch of popular) {
          if (items.length >= 9) break;
          if (!seen.has(ch.id)) {
            seen.add(ch.id);
            items.push({
              kind: 'channel',
              key: `ch:${ch.id}`,
              channel: ch,
            });
          }
        }
      }
    } else {
      const ranked = channels
        .map((ch) => ({
          ch,
          score: scoreChannel(ch, q, starredSet, recentSet),
        }))
        .filter((x) => x.score >= 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);

      for (const { ch } of ranked) {
        items.push({
          kind: 'channel',
          key: `ch:${ch.id}`,
          channel: ch,
          badge: starredSet.has(ch.id)
            ? 'Starred'
            : recentSet.has(ch.id)
              ? 'Recent'
              : undefined,
        });
      }
    }

    const currentThemeName = t.themes.items[theme].name;
    const actions: Extract<SwitcherItem, { kind: 'action' }>[] = [
      {
        kind: 'action',
        key: 'act:search',
        id: 'search-mode',
        label: q
          ? t.commandPalette.searchArchiveAction(q)
          : t.commandPalette.searchArchiveActionEmpty,
        description: t.commandPalette.searchArchiveSub,
        keywords: 'search messages 搜尋 訊息',
        shortcut: 'Tab',
      },
      {
        kind: 'action',
        key: 'act:directory',
        id: 'directory',
        label: `${t.commandPalette.openDirectoryAction} (${channels.length.toLocaleString()})`,
        description: t.commandPalette.openDirectorySub,
        keywords: 'directory channels browse 目錄 頻道 瀏覽',
      },
      {
        kind: 'action',
        key: 'act:theme',
        id: 'theme',
        label:
          locale === 'zh-TW'
            ? `切換佈景主題（目前：${currentThemeName}）`
            : locale === 'ja'
              ? `テーマを切り替え（現在: ${currentThemeName}）`
              : `Cycle Theme (current: ${currentThemeName})`,
        description: t.themes.title,
        keywords: 'theme dark light jothon classic 主題 佈景 暗夜 公民白 揪松 テーマ',
      },
      ...APP_THEMES.filter((item) => item.id !== theme).map((item) => {
        const localized = t.themes.items[item.id];
        return {
          kind: 'action' as const,
          key: `act:theme:${item.id}`,
          id: `set-theme:${item.id}` as const,
          label: t.themes.themeLabel(localized.name),
          description: localized.subtitle,
          keywords: `theme ${item.name} ${item.id} 主題 佈景 テーマ`,
        };
      }),
      {
        kind: 'action',
        key: 'act:language',
        id: 'language',
        label: t.commandPalette.switchLangAction,
        description: t.commandPalette.switchLangSub,
        keywords:
          'language locale i18n english chinese japanese zh-tw ja 語言 中文 正體中文 英文 日本語 にほんご 言語',
      },
      ...(
        [
          { id: 'zh-TW', label: '正體中文', desc: 'Switch to 正體中文 (zh-TW)', kw: 'chinese taiwan zh-tw 正體中文 繁體中文 中文 台灣' },
          { id: 'en', label: 'English', desc: 'Switch to English (en)', kw: 'english en 英文 英語' },
          { id: 'ja', label: '日本語', desc: 'Switch to 日本語 (ja)', kw: 'japanese ja 日本語 にほんご 日文 日語' },
        ] as const
      )
        .filter((l) => l.id !== locale)
        .map((l) => ({
          kind: 'action' as const,
          key: `act:locale:${l.id}`,
          id: `set-locale:${l.id}` as const,
          label: l.label,
          description: l.desc,
          keywords: `language locale ${l.kw}`,
        })),
    ];

    if (viewMode === 'channel') {
      actions.push({
        kind: 'action',
        key: 'act:info',
        id: 'info',
        label:
          locale === 'zh-TW'
            ? '開啟／關閉頻道詳情'
            : locale === 'ja'
              ? 'チャンネル詳細を表示／非表示'
              : 'Toggle Channel Details',
        description:
          locale === 'zh-TW'
            ? '檢視主題、說明、成員數與 RSS 訂閱'
            : locale === 'ja'
              ? 'トピック、説明、メンバー数、RSS フィードを表示'
              : 'View topic, purpose, members, and RSS feed',
        keywords: 'details info topic rss 詳情 資訊 主題 詳細 情報 トピック',
      });
    }

    const filteredActions = q
      ? actions.filter(
          (a) =>
            a.id === 'search-mode' ||
            a.label.toLowerCase().includes(qLower) ||
            a.description.toLowerCase().includes(qLower) ||
            (a.keywords && a.keywords.toLowerCase().includes(qLower))
        )
      : actions.filter(
          (a) =>
            !a.id.startsWith('set-theme:') && !a.id.startsWith('set-locale:')
        );

    // Put message search action right after channel matches (or first if no channels matched)
    if (q) {
      const searchAct = filteredActions.find((a) => a.id === 'search-mode');
      const otherActs = filteredActions.filter((a) => a.id !== 'search-mode');
      return [
        ...items,
        ...otherActs,
        ...(searchAct ? [searchAct] : []),
      ];
    }

    return [...items, ...filteredActions];
  }, [
    query,
    channels,
    recentIds,
    starredIds,
    channelMap,
    starredSet,
    recentSet,
    theme,
    viewMode,
    locale,
    t,
  ]);

  const runArchiveSearch = useCallback(
    async (searchText: string) => {
      const q = searchText.trim();
      if (!q) return;
      setMode('search');
      setLoading(true);
      setError(null);
      setChannelFilter('ALL');
      setSubmittedQuery(q);
      setSelectedIndex(0);
      try {
        const res = await searchArchive(q);
        setResults(dedupeSearchResults(res.results));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t.commandPalette.searchFailed
        );
      } finally {
        setLoading(false);
      }
    },
    [t.commandPalette.searchFailed]
  );

  const channelFacetCounts = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    for (const r of results) {
      const prev = map.get(r.channelId);
      if (prev) {
        prev.count += 1;
      } else {
        map.set(r.channelId, { name: r.channelName, count: 1 });
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [results]);

  const filteredResults = useMemo(() => {
    if (channelFilter === 'ALL') return results;
    return results.filter((r) => r.channelId === channelFilter);
  }, [results, channelFilter]);

  const activeListLength =
    mode === 'switcher' ? switcherItems.length : filteredResults.length;

  useEffect(() => {
    setSelectedIndex((prev) =>
      activeListLength === 0 ? 0 : Math.min(prev, activeListLength - 1)
    );
  }, [activeListLength]);

  useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-palette-idx="${selectedIndex}"]`
    );
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, mode]);

  const executeSwitcherItem = useCallback(
    (item: SwitcherItem) => {
      if (item.kind === 'channel') {
        onSelectChannel(item.channel.id);
        onClose();
        return;
      }
      if (item.id === 'directory') {
        onOpenDirectory();
        onClose();
      } else if (item.id === 'theme') {
        onToggleTheme();
        onClose();
      } else if (item.id === 'language') {
        toggleLocale();
        onClose();
      } else if (item.id.startsWith('set-locale:')) {
        const nextLocale = item.id.replace('set-locale:', '') as Locale;
        setLocale(nextLocale);
        onClose();
      } else if (item.id.startsWith('set-theme:')) {
        const nextTheme = item.id.replace('set-theme:', '') as AppThemeId;
        onSelectTheme?.(nextTheme);
        onClose();
      } else if (item.id === 'info') {
        onToggleChannelInfo();
        onClose();
      } else if (item.id === 'search-mode') {
        if (query.trim()) {
          runArchiveSearch(query);
        } else {
          setMode('search');
          setTimeout(() => inputRef.current?.focus(), 20);
        }
      }
    },
    [
      onSelectChannel,
      onClose,
      onOpenDirectory,
      onToggleTheme,
      toggleLocale,
      setLocale,
      onSelectTheme,
      onToggleChannelInfo,
      query,
      runArchiveSearch,
    ]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (mode === 'switcher') {
        setMode('search');
        if (query.trim() && query.trim() !== submittedQuery) {
          runArchiveSearch(query);
        }
      } else {
        setMode('switcher');
      }
      setSelectedIndex(0);
      return;
    }

    if (e.key === 'ArrowDown' || (e.ctrlKey && e.key.toLowerCase() === 'n')) {
      if (activeListLength === 0) return;
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % activeListLength);
      return;
    }

    if (e.key === 'ArrowUp' || (e.ctrlKey && e.key.toLowerCase() === 'p')) {
      if (activeListLength === 0) return;
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + activeListLength) % activeListLength);
      return;
    }

    if (e.key === 'Enter') {
      if (mode === 'switcher') {
        const item = switcherItems[selectedIndex];
        if (item) {
          e.preventDefault();
          executeSwitcherItem(item);
        } else if (query.trim()) {
          e.preventDefault();
          runArchiveSearch(query);
        }
      } else {
        // In search mode: if query changed since last submit, run new search; otherwise open highlighted result
        const trimmed = query.trim();
        if (trimmed && trimmed !== submittedQuery) {
          e.preventDefault();
          runArchiveSearch(trimmed);
        } else {
          const hit = filteredResults[selectedIndex];
          if (hit) {
            e.preventDefault();
            onJumpToMessage(hit.channelId, hit.month, hit.message.ts);
            onClose();
          }
        }
      }
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-2.5 pt-3 backdrop-blur-xs sm:px-4 sm:pt-16"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-2xl sm:max-h-[82vh] flex-col overflow-hidden rounded-xl border border-[var(--slack-border)] bg-[var(--slack-main-bg)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Mode Switcher + Input */}
        <div className="border-b border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-4 pt-3 pb-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('switcher');
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                }}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  mode === 'switcher'
                    ? 'bg-[var(--slack-accent)] text-white'
                    : 'text-[var(--slack-text-muted)] hover:text-[var(--slack-text)]'
                }`}
              >
                {t.commandPalette.quickSwitcherTab}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('search');
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                  if (query.trim() && query.trim() !== submittedQuery) {
                    runArchiveSearch(query);
                  }
                }}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  mode === 'search'
                    ? 'bg-[var(--slack-accent)] text-white'
                    : 'text-[var(--slack-text-muted)] hover:text-[var(--slack-text)]'
                }`}
              >
                {t.commandPalette.searchMessagesTab}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
              aria-label={t.commandPalette.closeHint}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 rounded-lg border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-3 py-2 focus-within:border-[var(--slack-accent)]">
            <Search className="h-4 w-4 shrink-0 text-[var(--slack-text-muted)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder={
                mode === 'switcher'
                  ? t.commandPalette.jumpPlaceholder
                  : t.commandPalette.searchPlaceholder
              }
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--slack-text)] placeholder:text-[var(--slack-text-muted)] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                }}
                className="rounded p-0.5 text-[var(--slack-text-muted)] hover:text-[var(--slack-text)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {mode === 'search' && (
              <button
                type="button"
                disabled={loading || !query.trim()}
                onClick={() => runArchiveSearch(query)}
                className="rounded-md bg-[var(--slack-accent)] px-3 py-1 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-45"
              >
                {loading
                  ? t.commandPalette.searchingBtn
                  : t.commandPalette.searchBtn}
              </button>
            )}
          </div>
        </div>

        {/* Channel Filter Pills in Search Mode */}
        {mode === 'search' && results.length > 0 && (
          <div className="slack-scroll flex items-center gap-1.5 overflow-x-auto border-b border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-4 py-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setChannelFilter('ALL');
                setSelectedIndex(0);
              }}
              className={`shrink-0 rounded-full px-2.5 py-0.5 font-medium transition ${
                channelFilter === 'ALL'
                  ? 'bg-[var(--slack-accent)] text-white'
                  : 'bg-[var(--slack-badge-bg)] text-[var(--slack-text-muted)] hover:text-[var(--slack-text)]'
              }`}
            >
              {t.commandPalette.allChannelsFilter(results.length)}
            </button>
            {channelFacetCounts.map(([cid, info]) => (
              <button
                key={cid}
                type="button"
                onClick={() => {
                  setChannelFilter(cid);
                  setSelectedIndex(0);
                }}
                className={`shrink-0 rounded-full px-2.5 py-0.5 font-medium transition ${
                  channelFilter === cid
                    ? 'bg-[var(--slack-accent)] text-white'
                    : 'bg-[var(--slack-badge-bg)] text-[var(--slack-text-muted)] hover:text-[var(--slack-text)]'
                }`}
              >
                #{info.name} ({info.count})
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div
          ref={listRef}
          className="slack-scroll min-h-[260px] flex-1 overflow-y-auto p-2"
        >
          {mode === 'switcher' ? (
            switcherItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-[var(--slack-text-muted)]">
                <Hash className="mb-2 h-8 w-8 opacity-35" />
                <p>{t.commandPalette.noChannelsMatch}</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {!query.trim() && (
                  <div className="px-2.5 pt-1 pb-1 text-[11px] font-semibold tracking-wide text-[var(--slack-text-muted)] uppercase">
                    {t.commandPalette.channelsHeading(channels.length)}
                  </div>
                )}

                {switcherItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  if (item.kind === 'channel') {
                    const ch = item.channel;
                    const isCurrentChannel =
                      viewMode === 'channel' && activeChannelId === ch.id;
                    return (
                      <button
                        key={item.key}
                        data-palette-idx={idx}
                        type="button"
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => executeSwitcherItem(item)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition ${
                          isSelected
                            ? 'bg-[var(--slack-accent)] text-white'
                            : 'text-[var(--slack-text)] hover:bg-[var(--slack-msg-hover)]'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Hash
                            className={`h-4 w-4 shrink-0 ${
                              isSelected
                                ? 'text-white/90'
                                : 'text-[var(--slack-text-muted)]'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold">
                                {ch.name}
                              </span>
                              {isCurrentChannel && (
                                <span
                                  className={`rounded px-1.5 py-0.2 text-[10px] font-medium ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-[var(--slack-badge-bg)] text-[var(--slack-text-muted)]'
                                  }`}
                                >
                                  {t.commandPalette.currentBadge}
                                </span>
                              )}
                            </div>
                            {(ch.topicText || ch.descriptionText) && (
                              <p
                                className={`truncate text-xs ${
                                  isSelected
                                    ? 'text-white/80'
                                    : 'text-[var(--slack-text-muted)]'
                                }`}
                              >
                                {ch.topicText || ch.descriptionText}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 text-xs">
                          {item.badge === 'Starred' && (
                            <span title={t.commandPalette.starredBadge}>
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            </span>
                          )}
                          {item.badge === 'Recent' && (
                            <span title={t.commandPalette.recentBadge}>
                              <History
                                className={`h-3.5 w-3.5 ${
                                  isSelected
                                    ? 'text-white/80'
                                    : 'text-[var(--slack-text-muted)]'
                                }`}
                              />
                            </span>
                          )}
                          <span
                            className={`tabular-nums ${
                              isSelected
                                ? 'text-white/85'
                                : 'text-[var(--slack-text-muted)]'
                            }`}
                          >
                            {formatCompactNumber(ch.messageCount)}{' '}
                            {t.messageList.msgsShort}
                          </span>
                        </div>
                      </button>
                    );
                  }

                  const ActionIcon =
                    item.id === 'directory'
                      ? Compass
                      : item.id === 'theme' || item.id.startsWith('set-theme:')
                        ? Palette
                        : item.id === 'language' ||
                            item.id.startsWith('set-locale:')
                          ? Languages
                          : item.id === 'info'
                            ? Info
                            : Search;

                  return (
                    <button
                      key={item.key}
                      data-palette-idx={idx}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => executeSwitcherItem(item)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition ${
                        isSelected
                          ? 'bg-[var(--slack-accent)] text-white'
                          : 'text-[var(--slack-text)] hover:bg-[var(--slack-msg-hover)]'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ActionIcon
                          className={`h-4 w-4 shrink-0 ${
                            isSelected
                              ? 'text-white/90'
                              : 'text-[var(--slack-text-muted)]'
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {item.label}
                          </div>
                          <div
                            className={`truncate text-xs ${
                              isSelected
                                ? 'text-white/80'
                                : 'text-[var(--slack-text-muted)]'
                            }`}
                          >
                            {item.description}
                          </div>
                        </div>
                      </div>

                      {item.shortcut ? (
                        <kbd
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-[var(--slack-badge-bg)] text-[var(--slack-text-muted)]'
                          }`}
                        >
                          {item.shortcut}
                        </kbd>
                      ) : (
                        <ArrowRight
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isSelected
                              ? 'text-white'
                              : 'text-[var(--slack-text-muted)]'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )
          ) : loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-sm text-[var(--slack-text-muted)]">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--slack-accent)]" />
              <span>{t.commandPalette.searchingStatus}</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-sm text-rose-500">
              {error}
            </div>
          ) : !submittedQuery ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-[var(--slack-text-muted)]">
              <Search className="mb-2 h-8 w-8 opacity-35" />
              <p className="text-sm font-medium text-[var(--slack-text)]">
                {t.commandPalette.searchHintTitle}
              </p>
              <p className="mt-1">{t.commandPalette.searchHintSub}</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--slack-text-muted)]">
              {t.commandPalette.noResults(submittedQuery)}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredResults.map((hit, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${hit.channelId}-${hit.message.ts}-${idx}`}
                    data-palette-idx={idx}
                    type="button"
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      onJumpToMessage(hit.channelId, hit.month, hit.message.ts);
                      onClose();
                    }}
                    className={`group flex w-full flex-col gap-1 rounded-lg border px-3.5 py-2.5 text-left transition ${
                      isSelected
                        ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/10'
                        : 'border-transparent hover:border-[var(--slack-border)] hover:bg-[var(--slack-msg-hover)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="inline-flex items-center gap-0.5 text-[var(--slack-link)]">
                          <Hash className="h-3 w-3" />
                          {hit.channelName}
                        </span>
                        {hit.message.user.displayName && (
                          <span className="text-[var(--slack-text)]">
                            {hit.message.user.displayName}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--slack-text-muted)]">
                        {hit.dateLabel}
                        <ArrowRight className="h-3 w-3 opacity-70" />
                      </span>
                    </div>
                    <div className="line-clamp-3 text-sm text-[var(--slack-text)]">
                      {hit.message.contentsHtml ? (
                        <RichContent
                          html={hit.message.contentsHtml}
                          className="pointer-events-none"
                        />
                      ) : (
                        hit.message.text
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer keyboard hints */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-4 py-2 text-[11px] text-[var(--slack-text-muted)]">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              <kbd className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 font-medium text-[var(--slack-text)]">
                ↑↓
              </kbd>{' '}
              {t.commandPalette.navigateHint}
            </span>
            <span>
              <kbd className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 font-medium text-[var(--slack-text)]">
                ↵
              </kbd>{' '}
              {mode === 'switcher'
                ? t.commandPalette.openHint
                : t.commandPalette.searchJumpHint}
            </span>
            <span>
              <kbd className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 font-medium text-[var(--slack-text)]">
                Tab
              </kbd>{' '}
              {mode === 'switcher'
                ? t.commandPalette.searchMessagesTab
                : t.commandPalette.quickSwitcherTab}
            </span>
            <span>
              <kbd className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 font-medium text-[var(--slack-text)]">
                Esc
              </kbd>{' '}
              {t.commandPalette.closeHint}
            </span>
          </div>
          <span className="hidden sm:inline">
            {t.commandPalette.shortcutHint}
            <kbd className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 font-medium text-[var(--slack-text)]">
              {shortcutLabel}
            </kbd>
          </span>
        </div>
      </div>
    </div>
  );
};
