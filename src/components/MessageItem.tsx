import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  CornerDownRight,
  ExternalLink,
  FileText,
  Link2,
  MessageSquare,
} from 'lucide-react';
import type { ArchiveMessage, MessageFile } from '../types';
import { formatFileSize, formatShortTime } from '../utils/format';
import { RichContent } from './RichContent';

interface MessageItemProps {
  message: ArchiveMessage;
  channelId: string;
  month: string;
  compact?: boolean;
  isHighlighted?: boolean;
  isThreadOpen?: boolean;
  onOpenThread?: (message: ArchiveMessage) => void;
  onNavigateChannel?: (channelId: string, month?: string, ts?: string) => void;
  onPreviewFile?: (file: MessageFile) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  channelId,
  month,
  compact = false,
  isHighlighted = false,
  isThreadOpen = false,
  onOpenThread,
  onNavigateChannel,
  onPreviewFile,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/channel/${channelId}/${month}?ts=${encodeURIComponent(
      message.ts
    )}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const upstreamUrl = `https://g0v-slack-archive.g0v.ronny.tw/index/channel/${encodeURIComponent(
    channelId
  )}/${encodeURIComponent(month)}#ts-${encodeURIComponent(message.ts)}`;

  // Deduplicate reply avatars for the thread summary bar
  const uniqueReplyUsers = [];
  const seenUserIds = new Set<string>();
  for (const r of message.replies) {
    const key = r.user.id || r.user.displayName;
    if (!seenUserIds.has(key)) {
      seenUserIds.add(key);
      uniqueReplyUsers.push(r.user);
    }
    if (uniqueReplyUsers.length >= 4) break;
  }

  const lastReply = message.replies[message.replies.length - 1];

  return (
    <div
      id={`ts-${message.ts}`}
      data-ts={message.ts}
      className={`group relative flex gap-3 px-5 py-1.5 transition-colors hover:bg-[var(--slack-surface-hover)] ${
        isHighlighted ? 'message-flash' : ''
      } ${
        isThreadOpen
          ? 'bg-[var(--slack-surface-hover)]'
          : ''
      } ${compact ? 'pt-0.5 pb-1' : 'pt-2 pb-1.5'}`}
    >
      {/* Floating Slack-style hover action bar */}
      <div className="pointer-events-none absolute -top-3.5 right-5 z-10 flex items-center gap-0.5 rounded-lg border border-[var(--slack-border)] bg-[var(--slack-main-bg)] p-0.5 opacity-0 shadow-sm transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        {onOpenThread && (
          <button
            type="button"
            onClick={() => onOpenThread(message)}
            title="View thread"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {message.replies.length > 0 ? 'Thread' : 'Inspect'}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={handleCopyLink}
          title="Copy permalink"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
        </button>
        <a
          href={upstreamUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="View on g0v-slack-archive"
          className="inline-flex items-center rounded-md px-2 py-1 text-xs text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Left gutter: avatar or compact hover time */}
      <div className="w-9 shrink-0">
        {compact ? (
          <span className="font-mono-code mt-1 block text-right text-[11px] text-[var(--slack-text-muted)] opacity-0 group-hover:opacity-100">
            {formatShortTime(message.timeLabel)}
          </span>
        ) : (
          <img
            src={message.user.avatar}
            alt={message.user.displayName}
            loading="lazy"
            className="mt-0.5 h-9 w-9 rounded-lg object-cover bg-[var(--slack-badge-bg)]"
          />
        )}
      </div>

      {/* Message content column */}
      <div className="min-w-0 flex-1">
        {!compact && (
          <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className="text-[15px] font-bold text-[var(--slack-text)]"
              title={
                message.user.realName &&
                message.user.realName !== message.user.displayName
                  ? `${message.user.realName} (@${message.user.name})`
                  : `@${message.user.name}`
              }
            >
              {message.user.displayName}
            </span>
            {message.user.isBot && (
              <span className="rounded bg-[var(--slack-badge-bg)] px-1.5 py-0.2 text-[10px] font-semibold uppercase tracking-wide text-[var(--slack-text-muted)]">
                APP
              </span>
            )}
            <a
              href={`#ts-${message.ts}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigateChannel?.(channelId, month, message.ts);
              }}
              title={`${message.date} ${message.timeLabel}`}
              className="text-xs text-[var(--slack-text-muted)] hover:underline"
            >
              {formatShortTime(message.timeLabel)}
            </a>
            {message.edited && (
              <span className="text-[11px] text-[var(--slack-text-muted)]">
                (edited)
              </span>
            )}
            {message.isThreadReply && !message.isThreadBroadcast && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                thread reply
              </span>
            )}
          </div>
        )}

        {/* Thread broadcast banner */}
        {message.threadRoot && (
          <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--slack-text-muted)]">
            <CornerDownRight className="h-3.5 w-3.5" />
            <span>Replied to a thread:</span>
            <button
              type="button"
              onClick={() =>
                onNavigateChannel?.(
                  channelId,
                  message.threadRoot?.month,
                  message.threadRoot?.ts
                )
              }
              className="font-medium text-[var(--slack-link)] hover:underline"
            >
              {message.threadRoot.label}
            </button>
          </div>
        )}

        {/* Message text */}
        {message.contentsHtml && (
          <RichContent
            html={message.contentsHtml}
            onNavigateChannel={onNavigateChannel}
          />
        )}

        {/* Files / Image previews */}
        {message.files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2.5">
            {message.files.map((file, idx) =>
              file.isImage && file.thumbUrl ? (
                <div key={file.id || idx} className="max-w-sm">
                  <button
                    type="button"
                    onClick={() => onPreviewFile?.(file)}
                    className="group/img block overflow-hidden rounded-lg border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] text-left transition hover:border-[var(--slack-accent)]"
                  >
                    <img
                      src={file.thumbUrl}
                      alt={file.title}
                      loading="lazy"
                      className="max-h-72 max-w-full object-contain transition-transform duration-200 group-hover/img:scale-[1.01]"
                    />
                    <div className="flex items-center justify-between gap-2 border-t border-[var(--slack-border)] px-2.5 py-1.5 text-xs text-[var(--slack-text-muted)]">
                      <span className="truncate font-medium">{file.title}</span>
                      {file.size && (
                        <span className="shrink-0">{formatFileSize(file.size)}</span>
                      )}
                    </div>
                  </button>
                </div>
              ) : (
                <a
                  key={file.id || idx}
                  href={file.fullUrl || file.thumbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-3 py-2 text-xs hover:border-[var(--slack-accent)]"
                >
                  <FileText className="h-4 w-4 text-[var(--slack-link)]" />
                  <span className="font-medium">{file.title}</span>
                  {file.size && (
                    <span className="text-[var(--slack-text-muted)]">
                      ({formatFileSize(file.size)})
                    </span>
                  )}
                </a>
              )
            )}
          </div>
        )}

        {/* Attachments / Unfurls */}
        {message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((att, idx) =>
              att.isMsgUnfurl ? (
                <div
                  key={idx}
                  className="max-w-2xl rounded-r-md border-l-4 border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-3.5 py-2.5"
                >
                  <div className="mb-1 flex items-center gap-2">
                    {att.authorIcon && (
                      <img
                        src={att.authorIcon}
                        alt={att.authorName || ''}
                        className="h-5 w-5 rounded"
                      />
                    )}
                    <span className="text-xs font-bold text-[var(--slack-text)]">
                      {att.authorName}
                    </span>
                  </div>
                  {att.textHtml && (
                    <RichContent
                      html={att.textHtml}
                      className="text-sm"
                      onNavigateChannel={onNavigateChannel}
                    />
                  )}
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--slack-text-muted)]">
                    {att.channelId && att.channelName ? (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigateChannel?.(
                            att.channelId!,
                            att.href?.match(/\/(\d{4}-\d{2})#/)?.[1],
                            att.ts
                          )
                        }
                        className="font-medium text-[var(--slack-link)] hover:underline"
                      >
                        Posted in #{att.channelName}
                      </button>
                    ) : (
                      <span>Forwarded message</span>
                    )}
                    {att.ts && (
                      <span>
                        ·{' '}
                        {new Date(Number(att.ts) * 1000).toLocaleDateString(
                          'en-CA'
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  key={idx}
                  className="flex max-w-2xl items-start justify-between gap-3 rounded-r-md border-l-4 border-[#d1d2d3] dark:border-[#4b4d52] bg-[var(--slack-surface-bg)] px-3.5 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    {att.serviceName && (
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--slack-text-muted)]">
                        {att.serviceIcon && (
                          <img
                            src={att.serviceIcon}
                            alt=""
                            className="h-4 w-4 rounded-xs object-contain"
                          />
                        )}
                        <span>{att.serviceName}</span>
                      </div>
                    )}
                    {att.title && (
                      <div className="text-sm font-semibold">
                        {att.titleLink ? (
                          <a
                            href={att.titleLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--slack-link)] hover:underline"
                          >
                            {att.title}
                          </a>
                        ) : (
                          att.title
                        )}
                      </div>
                    )}
                    {att.text && (
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[var(--slack-text-muted)]">
                        {att.text}
                      </p>
                    )}
                  </div>
                  {att.imageUrl && (
                    <img
                      src={att.imageUrl}
                      alt={att.title || ''}
                      loading="lazy"
                      className="h-16 w-24 shrink-0 rounded border border-[var(--slack-border)] object-cover"
                    />
                  )}
                </div>
              )
            )}
          </div>
        )}

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {message.reactions.map((reaction, idx) => (
              <span
                key={`${reaction.name}-${idx}`}
                title={
                  reaction.userNames?.length
                    ? `:${reaction.name}: — ${reaction.userNames.join(', ')}${
                        reaction.users.length > reaction.userNames.length
                          ? ` +${reaction.users.length - reaction.userNames.length}`
                          : ''
                      }`
                    : `:${reaction.name}:`
                }
                className="inline-flex items-center gap-1 rounded-full border border-[var(--slack-border)] bg-[var(--slack-badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--slack-text)]"
              >
                <span
                  className="reaction-emoji inline-flex items-center"
                  dangerouslySetInnerHTML={{ __html: reaction.emojiHtml }}
                />
                <span>{reaction.count}</span>
              </span>
            ))}
          </div>
        )}

        {/* Thread summary bar */}
        {message.replies.length > 0 && onOpenThread && (
          <button
            type="button"
            onClick={() => onOpenThread(message)}
            className="group/thread mt-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-left transition hover:border-[var(--slack-border)] hover:bg-[var(--slack-main-bg)]"
          >
            <div className="flex -space-x-1">
              {uniqueReplyUsers.map((u, idx) => (
                <img
                  key={u.id || idx}
                  src={u.avatar}
                  alt={u.displayName}
                  className="h-5 w-5 rounded object-cover ring-1 ring-[var(--slack-main-bg)]"
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-[var(--slack-link)] group-hover/thread:underline">
              {message.replies.length}{' '}
              {message.replies.length === 1 ? 'reply' : 'replies'}
            </span>
            {lastReply && (
              <span className="hidden truncate text-xs text-[var(--slack-text-muted)] sm:inline">
                Last reply {lastReply.timeLabel}
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-[var(--slack-text-muted)] opacity-0 transition-opacity group-hover/thread:opacity-100" />
          </button>
        )}
      </div>
    </div>
  );
};
