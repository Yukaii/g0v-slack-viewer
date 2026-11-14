import React from 'react';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Hash,
  MessageSquare,
  Rss,
  Users,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { ChannelSummary } from '../types';
import { RichContent } from './RichContent';

interface ChannelInfoPanelProps {
  channel: ChannelSummary;
  onClose: () => void;
  onNavigateChannel: (channelId: string, month?: string, ts?: string) => void;
}

export const ChannelInfoPanel: React.FC<ChannelInfoPanelProps> = ({
  channel,
  onClose,
  onNavigateChannel,
}) => {
  const { t } = useI18n();
  const upstreamChannelUrl = `https://g0v-slack-archive.g0v.ronny.tw/index/channel/${encodeURIComponent(
    channel.id
  )}`;
  const rssUrl = `https://g0v-slack-archive.g0v.ronny.tw/index/rss/${encodeURIComponent(
    channel.id
  )}`;

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
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[var(--slack-text-muted)]">
              <Users className="h-3.5 w-3.5" /> {t.channelInfo.members}
            </span>
            <span className="font-semibold">
              {channel.memberCount.toLocaleString()}
            </span>
          </div>
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
    </aside>
  );
};
