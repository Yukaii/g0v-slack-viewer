import React from 'react';
import { Hash, X } from 'lucide-react';
import type { ArchiveMessage, MessageFile } from '../types';
import { formatShortTime } from '../utils/format';
import { MessageItem } from './MessageItem';
import { RichContent } from './RichContent';

interface ThreadPanelProps {
  channelId: string;
  channelName: string;
  month: string;
  message: ArchiveMessage;
  onClose: () => void;
  onNavigateChannel: (channelId: string, month?: string, ts?: string) => void;
  onPreviewFile: (file: MessageFile) => void;
}

export const ThreadPanel: React.FC<ThreadPanelProps> = ({
  channelId,
  channelName,
  month,
  message,
  onClose,
  onNavigateChannel,
  onPreviewFile,
}) => {
  return (
    <aside className="flex h-full w-full flex-col border-l border-[var(--slack-border)] bg-[var(--slack-main-bg)] md:w-[380px] lg:w-[420px] shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--slack-border)] px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[var(--slack-text)]">
            Thread
          </h2>
          <div className="flex items-center gap-1 text-xs text-[var(--slack-text-muted)]">
            <Hash className="h-3 w-3" />
            <span className="truncate">{channelName}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-[var(--slack-text-muted)] hover:bg-[var(--slack-badge-bg)] hover:text-[var(--slack-text)]"
          aria-label="Close thread"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="slack-scroll flex-1 overflow-y-auto py-3">
        {/* Root message */}
        <MessageItem
          message={{ ...message, replies: [] }}
          channelId={channelId}
          month={month}
          onNavigateChannel={onNavigateChannel}
          onPreviewFile={onPreviewFile}
        />

        {/* Divider */}
        <div className="my-2 flex items-center gap-3 px-5">
          <span className="text-xs font-medium text-[var(--slack-text-muted)]">
            {message.replies.length}{' '}
            {message.replies.length === 1 ? 'reply' : 'replies'}
          </span>
          <div className="h-px flex-1 bg-[var(--slack-border)]" />
        </div>

        {message.replies.length === 0 ? (
          <div className="px-5 py-6 text-center text-xs text-[var(--slack-text-muted)]">
            No replies in this thread yet.
          </div>
        ) : (
          <div className="space-y-1">
            {message.replies.map((reply) => (
              <div
                key={reply.ts}
                className="flex gap-3 px-5 py-2 hover:bg-[var(--slack-surface-hover)]"
              >
                <img
                  src={reply.user.avatar}
                  alt={reply.user.displayName}
                  loading="lazy"
                  className="mt-0.5 h-8 w-8 shrink-0 rounded-lg object-cover bg-[var(--slack-badge-bg)]"
                />
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-bold text-[var(--slack-text)]">
                      {reply.user.displayName}
                    </span>
                    <span
                      title={reply.timeLabel}
                      className="text-xs text-[var(--slack-text-muted)]"
                    >
                      {reply.timeLabel.includes(' ')
                        ? reply.timeLabel.slice(0, 16)
                        : formatShortTime(reply.timeLabel)}
                    </span>
                  </div>
                  <RichContent
                    html={reply.contentsHtml}
                    onNavigateChannel={onNavigateChannel}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
