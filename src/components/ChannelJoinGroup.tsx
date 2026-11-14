import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link2,
  UserPlus,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { ArchiveMessage } from '../types';
import { messageMatchesTs } from '../utils/dedupeMessages';
import { formatShortTime } from '../utils/format';

export function isPlainChannelJoin(msg: ArchiveMessage): boolean {
  const isJoinSubtype =
    msg.subtype === 'channel_join' ||
    /^<@[A-Z0-9]+>\s+has joined the channel$/i.test(msg.text.trim());
  if (!isJoinSubtype) return false;
  return (
    msg.replies.length === 0 &&
    msg.files.length === 0 &&
    msg.attachments.length === 0 &&
    msg.reactions.length === 0
  );
}

interface ChannelJoinGroupProps {
  messages: ArchiveMessage[];
  channelId: string;
  channelName?: string;
  highlightTs?: string;
  onNavigateChannel?: (channelId: string, month?: string, ts?: string) => void;
}

export const ChannelJoinGroup: React.FC<ChannelJoinGroupProps> = ({
  messages,
  channelId,
  channelName,
  highlightTs,
  onNavigateChannel,
}) => {
  const { t } = useI18n();
  const hasHighlighted = Boolean(
    highlightTs && messages.some((m) => messageMatchesTs(m, highlightTs))
  );
  const [expanded, setExpanded] = useState(hasHighlighted);
  const [copiedTs, setCopiedTs] = useState<string | null>(null);

  useEffect(() => {
    if (hasHighlighted) {
      setExpanded(true);
    }
  }, [hasHighlighted]);

  const resolvedChannelName = channelName || channelId;

  const handleCopyLink = (msg: ArchiveMessage) => {
    const month = msg.date.slice(0, 7);
    const url = `${window.location.origin}/channel/${channelId}/${month}?ts=${encodeURIComponent(
      msg.ts
    )}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedTs(msg.ts);
      setTimeout(() => setCopiedTs(null), 1600);
    });
  };

  // Single join message: compact Slack-style system row
  if (messages.length === 1) {
    const msg = messages[0];
    const month = msg.date.slice(0, 7);
    const isHighlighted = messageMatchesTs(msg, highlightTs);
    const copy = t.channelJoin.joinedSingle(
      msg.user.displayName,
      resolvedChannelName
    );
    const upstreamUrl = `https://g0v-slack-archive.g0v.ronny.tw/index/channel/${encodeURIComponent(
      channelId
    )}/${encodeURIComponent(month)}#ts-${encodeURIComponent(msg.ts)}`;

    return (
      <div
        id={`ts-${msg.ts}`}
        data-ts={msg.ts}
        data-alias-ts={msg.aliasTs?.join(' ') || undefined}
        className={`group relative flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-[var(--slack-text-muted)] transition-colors hover:bg-[var(--slack-surface-hover)] sm:gap-3 sm:px-5 ${
          isHighlighted ? 'message-flash' : ''
        }`}
      >
        <div className="flex w-9 shrink-0 items-center justify-end pr-1">
          <UserPlus className="h-3.5 w-3.5 text-[var(--slack-text-muted)]/75" />
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-snug">
          <img
            src={msg.user.avatar}
            alt={msg.user.displayName}
            loading="lazy"
            className="h-4.5 w-4.5 shrink-0 rounded object-cover bg-[var(--slack-badge-bg)]"
          />
          <span>
            {copy.before}
            <strong className="font-semibold text-[var(--slack-text)]">
              {copy.user}
            </strong>
            {copy.middle}
            <span className="font-medium text-[var(--slack-text)]">
              {copy.channel}
            </span>
            {copy.after}
          </span>
          <a
            href={`#ts-${msg.ts}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigateChannel?.(channelId, month, msg.ts);
            }}
            title={`${msg.date} ${msg.timeLabel}`}
            className="text-xs text-[var(--slack-text-muted)] hover:underline"
          >
            {formatShortTime(msg.timeLabel)}
          </a>
        </div>

        <div className="pointer-events-none flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            type="button"
            onClick={() => handleCopyLink(msg)}
            title={t.messageItem.copyPermalink}
            className="rounded p-1 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
          >
            {copiedTs === msg.ts ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Link2 className="h-3.5 w-3.5" />
            )}
          </button>
          <a
            href={upstreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={t.messageItem.viewUpstream}
            className="rounded p-1 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // Chronologically latest joiner for Slack-style collapsed summary
  const latestMsg = messages.reduce((latest, curr) =>
    Number(curr.ts) >= Number(latest.ts) ? curr : latest
  );
  const othersCount = messages.length - 1;
  const collapsedCopy = t.channelJoin.joinedCollapsed(
    latestMsg.user.displayName,
    othersCount,
    resolvedChannelName
  );

  // Deduplicate avatar previews (up to 3)
  const previewAvatars: Array<{ key: string; avatar: string; name: string }> =
    [];
  const seenPreview = new Set<string>();
  for (const m of [latestMsg, ...messages]) {
    const key = m.user.id || m.user.displayName;
    if (seenPreview.has(key)) continue;
    seenPreview.add(key);
    previewAvatars.push({
      key,
      avatar: m.user.avatar,
      name: m.user.displayName,
    });
    if (previewAvatars.length >= 3) break;
  }

  return (
    <div className="my-0.5">
      {/* Collapsed / Summary header row */}
      <div className="group flex items-center gap-2.5 px-3 py-1.5 text-[13px] text-[var(--slack-text-muted)] transition-colors hover:bg-[var(--slack-surface-hover)] sm:gap-3 sm:px-5">
        <div className="flex w-9 shrink-0 items-center justify-end pr-1">
          <UserPlus className="h-3.5 w-3.5 text-[var(--slack-text-muted)]/80" />
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-left leading-snug"
        >
          <span className="flex -space-x-1">
            {previewAvatars.map((a) => (
              <img
                key={a.key}
                src={a.avatar}
                alt={a.name}
                loading="lazy"
                className="h-4.5 w-4.5 rounded object-cover ring-1 ring-[var(--slack-main-bg)] bg-[var(--slack-badge-bg)]"
              />
            ))}
          </span>
          <span>
            {collapsedCopy.before}
            <strong className="font-semibold text-[var(--slack-text)]">
              {collapsedCopy.user}
            </strong>
            {collapsedCopy.middle}
            <strong className="font-semibold text-[var(--slack-text)]">
              {collapsedCopy.others}
            </strong>
            {collapsedCopy.toChannel}
            <span className="font-medium text-[var(--slack-text)]">
              {collapsedCopy.channel}
            </span>
            {collapsedCopy.after}
          </span>
          <span className="text-xs text-[var(--slack-text-muted)]">
            {formatShortTime(latestMsg.timeLabel)}
          </span>
          <span className="ml-1 inline-flex items-center gap-0.5 rounded-full border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-2 py-0.2 text-[11px] font-medium text-[var(--slack-text-muted)] transition group-hover:border-[var(--slack-accent)]/40 group-hover:text-[var(--slack-text)]">
            {expanded ? (
              <>
                {t.channelJoin.collapse}
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                {t.channelJoin.showAll(messages.length)}
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </span>
        </button>
      </div>

      {/* Expanded individual join rows */}
      {expanded && (
        <div className="ml-12 mr-3 mb-1.5 border-l-2 border-[var(--slack-border)] pl-3 sm:ml-17 sm:mr-5">
          {messages.map((msg, idx) => {
            const month = msg.date.slice(0, 7);
            const isHighlighted = messageMatchesTs(msg, highlightTs);
            const singleCopy = t.channelJoin.joinedSingle(
              msg.user.displayName,
              resolvedChannelName
            );
            const upstreamUrl = `https://g0v-slack-archive.g0v.ronny.tw/index/channel/${encodeURIComponent(
              channelId
            )}/${encodeURIComponent(month)}#ts-${encodeURIComponent(msg.ts)}`;

            return (
              <div
                key={`${msg.ts}-${idx}`}
                id={`ts-${msg.ts}`}
                data-ts={msg.ts}
                data-alias-ts={msg.aliasTs?.join(' ') || undefined}
                className={`group/item flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs text-[var(--slack-text-muted)] transition-colors hover:bg-[var(--slack-surface-hover)] ${
                  isHighlighted ? 'message-flash' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <img
                    src={msg.user.avatar}
                    alt={msg.user.displayName}
                    loading="lazy"
                    className="h-5 w-5 shrink-0 rounded object-cover bg-[var(--slack-badge-bg)]"
                  />
                  <span className="truncate">
                    {singleCopy.before}
                    <strong className="font-semibold text-[var(--slack-text)]">
                      {singleCopy.user}
                    </strong>
                    {singleCopy.middle}
                    <span className="font-medium text-[var(--slack-text)]">
                      {singleCopy.channel}
                    </span>
                    {singleCopy.after}
                  </span>
                  <a
                    href={`#ts-${msg.ts}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigateChannel?.(channelId, month, msg.ts);
                    }}
                    title={`${msg.date} ${msg.timeLabel}`}
                    className="shrink-0 text-[11px] text-[var(--slack-text-muted)] hover:underline"
                  >
                    {formatShortTime(msg.timeLabel)}
                  </a>
                </div>

                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(msg)}
                    title={t.messageItem.copyPermalink}
                    className="rounded p-1 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
                  >
                    {copiedTs === msg.ts ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Link2 className="h-3 w-3" />
                    )}
                  </button>
                  <a
                    href={upstreamUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t.messageItem.viewUpstream}
                    className="rounded p-1 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
