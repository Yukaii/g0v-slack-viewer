import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  ExternalLink,
  Hash,
  Info,
  MessageSquare,
  Rss,
  Search,
  Users,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type {
  ArchiveMessage,
  ChannelSummary,
  SlackUserProfile,
} from '../types';
import { formatCompactNumber } from '../utils/format';
import type { ChannelInfoTab } from './ChannelHeader';
import { RichContent } from './RichContent';

interface ChannelInfoPanelProps {
  channel: ChannelSummary;
  activeTab: ChannelInfoTab;
  messages: ArchiveMessage[];
  loadedMonths: string[];
  onTabChange: (tab: ChannelInfoTab) => void;
  onClose: () => void;
  onNavigateChannel: (channelId: string, month?: string, ts?: string) => void;
}

interface ChannelParticipant {
  key: string;
  user: SlackUserProfile;
  postCount: number;
  latestTs: string;
  latestMonth: string;
}

export const ChannelInfoPanel: React.FC<ChannelInfoPanelProps> = ({
  channel,
  activeTab,
  messages,
  loadedMonths,
  onTabChange,
  onClose,
  onNavigateChannel,
}) => {
  const { t } = useI18n();
  const [memberQuery, setMemberQuery] = useState('');

  const upstreamChannelUrl = `https://g0v-slack-archive.g0v.ronny.tw/index/channel/${encodeURIComponent(
    channel.id
  )}`;
  const rssUrl = `https://g0v-slack-archive.g0v.ronny.tw/index/rss/${encodeURIComponent(
    channel.id
  )}`;

  const participants = useMemo<ChannelParticipant[]>(() => {
    const map = new Map<string, ChannelParticipant>();
    const fallbackMonth = loadedMonths[0] || '';

    const recordUser = (
      user: SlackUserProfile,
      ts: string,
      dateStr: string
    ) => {
      const key = user.id || user.name || user.displayName;
      if (!key) return;
      const month = dateStr ? dateStr.slice(0, 7) : fallbackMonth;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          user,
          postCount: 1,
          latestTs: ts,
          latestMonth: month,
        });
        return;
      }
      existing.postCount += 1;
      if (ts > existing.latestTs) {
        existing.latestTs = ts;
        existing.latestMonth = month;
      }
      if (!existing.user.title && user.title) {
        existing.user = user;
      }
    };

    for (const msg of messages) {
      recordUser(msg.user, msg.ts, msg.date);
      for (const reply of msg.replies) {
        recordUser(reply.user, reply.ts, msg.date);
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.postCount !== a.postCount) return b.postCount - a.postCount;
      return b.latestTs.localeCompare(a.latestTs);
    });
  }, [messages, loadedMonths]);

  const filteredParticipants = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter(({ user }) => {
      return (
        user.displayName.toLowerCase().includes(q) ||
        user.realName.toLowerCase().includes(q) ||
        user.name.toLowerCase().includes(q) ||
        (user.title ? user.title.toLowerCase().includes(q) : false)
      );
    });
  }, [participants, memberQuery]);

  const monthsLabel = useMemo(() => {
    if (loadedMonths.length === 0) return '—';
    if (loadedMonths.length === 1) return loadedMonths[0];
    return `${loadedMonths[0]}–${loadedMonths[loadedMonths.length - 1]}`;
  }, [loadedMonths]);

  return (
    <aside className="fixed inset-0 z-40 flex h-dvh w-full shrink-0 flex-col border-l border-[var(--slack-border)] bg-[var(--slack-surface-bg)] md:static md:z-auto md:h-full md:w-[340px]">
      <div className="flex items-center justify-between border-b border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-1.5 font-bold text-[var(--slack-text)]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] md:hidden"
            aria-label={t.threadPanel.backToChannel}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Hash className="h-4 w-4 text-[var(--slack-text-muted)]" />
          <span className="truncate">{channel.name}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
          aria-label={t.channelInfo.closeInfo}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* About / Members Tab Bar */}
      <div
        role="tablist"
        aria-label={t.channelInfo.title}
        className="flex border-b border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-3"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'about'}
          onClick={() => onTabChange('about')}
          className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${
            activeTab === 'about'
              ? 'border-[var(--slack-accent)] text-[var(--slack-text)]'
              : 'border-transparent text-[var(--slack-text-muted)] hover:text-[var(--slack-text)]'
          }`}
        >
          <Info className="h-3.5 w-3.5" />
          <span>{t.channelInfo.aboutTab}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'members'}
          onClick={() => onTabChange('members')}
          className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition ${
            activeTab === 'members'
              ? 'border-[var(--slack-accent)] text-[var(--slack-text)]'
              : 'border-transparent text-[var(--slack-text-muted)] hover:text-[var(--slack-text)]'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>{t.channelInfo.membersTab}</span>
          <span className="rounded-full bg-[var(--slack-badge-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--slack-text-muted)]">
            {formatCompactNumber(channel.memberCount)}
          </span>
        </button>
      </div>

      {activeTab === 'members' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-2.5 border-b border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-3.5">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--slack-text)]">
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[var(--slack-accent)]" />
                {t.channelInfo.membersCountTitle(
                  channel.memberCount.toLocaleString()
                )}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--slack-text-muted)]">
              {t.channelInfo.participantsHint(participants.length, monthsLabel)}
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[var(--slack-text-muted)]" />
              <input
                type="search"
                value={memberQuery}
                onChange={(e) => setMemberQuery(e.target.value)}
                placeholder={t.channelInfo.searchMembersPlaceholder}
                className="w-full rounded-lg border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] py-1.5 pr-3 pl-8 text-xs text-[var(--slack-text)] placeholder:text-[var(--slack-text-muted)] focus:border-[var(--slack-accent)] focus:outline-none"
              />
            </div>
          </div>

          <div className="slack-scroll flex-1 overflow-y-auto p-2">
            {participants.length === 0 ? (
              <p className="px-2 py-8 text-center text-xs text-[var(--slack-text-muted)]">
                {t.channelInfo.noMembersYet}
              </p>
            ) : filteredParticipants.length === 0 ? (
              <p className="px-2 py-8 text-center text-xs text-[var(--slack-text-muted)]">
                {t.channelInfo.noMemberMatches(memberQuery.trim())}
              </p>
            ) : (
              <ul className="space-y-1">
                {filteredParticipants.map((item) => {
                  const showHandle =
                    item.user.name &&
                    item.user.name.toLowerCase() !==
                      item.user.displayName.toLowerCase();
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateChannel(
                            channel.id,
                            item.latestMonth,
                            item.latestTs
                          );
                          if (window.innerWidth < 768) {
                            onClose();
                          }
                        }}
                        title={t.channelInfo.jumpToLatestPost}
                        className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-[var(--slack-main-bg)]"
                      >
                        <img
                          src={item.user.avatar}
                          alt=""
                          loading="lazy"
                          className="h-8 w-8 shrink-0 rounded-md object-cover bg-[var(--slack-badge-bg)]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-semibold text-[var(--slack-text)]">
                              {item.user.displayName}
                            </span>
                            {item.user.isBot && (
                              <span className="shrink-0 rounded bg-[var(--slack-badge-bg)] px-1 py-0.5 text-[9px] font-semibold uppercase text-[var(--slack-text-muted)]">
                                {t.channelInfo.botBadge}
                              </span>
                            )}
                          </div>
                          {(showHandle || item.user.title) && (
                            <div className="truncate text-[11px] text-[var(--slack-text-muted)]">
                              {showHandle ? `@${item.user.name}` : ''}
                              {showHandle && item.user.title ? ' · ' : ''}
                              {item.user.title || ''}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 rounded-full bg-[var(--slack-badge-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--slack-text-muted)] group-hover:text-[var(--slack-text)]">
                          {t.channelInfo.memberPosts(item.postCount)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="slack-scroll flex-1 space-y-4 overflow-y-auto p-4 text-sm">
          {/* Topic */}
          <div className="rounded-xl border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-3.5">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--slack-text-muted)]">
              {t.channelInfo.topic}
            </div>
            {channel.topicHtml ? (
              <RichContent
                html={channel.topicHtml}
                className="text-sm"
                onNavigateChannel={onNavigateChannel}
              />
            ) : (
              <p className="text-xs italic text-[var(--slack-text-muted)]">
                {t.channelInfo.noTopic}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="rounded-xl border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-3.5">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--slack-text-muted)]">
              {t.channelInfo.description}
            </div>
            {channel.descriptionHtml ? (
              <RichContent
                html={channel.descriptionHtml}
                className="text-sm"
                onNavigateChannel={onNavigateChannel}
              />
            ) : (
              <p className="text-xs italic text-[var(--slack-text-muted)]">
                {t.channelInfo.noDescription}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-3.5 space-y-2.5 text-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--slack-text-muted)]">
              {t.channelInfo.archiveMetadata}
            </div>
            <button
              type="button"
              onClick={() => onTabChange('members')}
              className="flex w-full items-center justify-between rounded-md px-1 py-0.5 -mx-1 text-left transition hover:bg-[var(--slack-badge-bg)]"
            >
              <span className="flex items-center gap-1.5 text-[var(--slack-text-muted)]">
                <Users className="h-3.5 w-3.5" /> {t.channelInfo.members}
              </span>
              <span className="flex items-center gap-1 font-semibold text-[var(--slack-link)]">
                {channel.memberCount.toLocaleString()}
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--slack-text-muted)]">
                <MessageSquare className="h-3.5 w-3.5" />{' '}
                {t.channelInfo.archivedMessages}
              </span>
              <span className="font-semibold">
                {channel.messageCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--slack-text-muted)]">
                <Calendar className="h-3.5 w-3.5" /> {t.channelInfo.created}
              </span>
              <span className="font-mono-code">{channel.createdLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--slack-text-muted)]">
                {t.channelInfo.lastPosted}
              </span>
              <span className="font-mono-code">{channel.lastPostedLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--slack-text-muted)]">
                {t.channelInfo.lastSynced}
              </span>
              <span className="font-mono-code">{channel.lastSyncedLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--slack-text-muted)]">
                {t.channelInfo.channelId}
              </span>
              <span className="font-mono-code text-[11px]">{channel.id}</span>
            </div>
            {channel.previousNames.length > 0 && (
              <div className="pt-1 border-t border-[var(--slack-border)]">
                <div className="mb-1 text-[var(--slack-text-muted)]">
                  {t.channelInfo.previouslyNamed}
                </div>
                <div className="flex flex-wrap gap-1">
                  {channel.previousNames.map((n) => (
                    <span
                      key={n}
                      className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.5 text-[11px]"
                    >
                      #{n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <a
              href={upstreamChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-3 py-2 text-xs font-medium text-[var(--slack-text)] hover:bg-[var(--slack-badge-bg)]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t.channelInfo.openOriginalArchive}
            </a>
            <a
              href={rssUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-3 py-2 text-xs font-medium text-[var(--slack-text)] hover:bg-[var(--slack-badge-bg)]"
            >
              <Rss className="h-3.5 w-3.5 text-orange-500" />
              {t.channelInfo.channelRssFeed}
            </a>
          </div>
        </div>
      )}
    </aside>
  );
};
