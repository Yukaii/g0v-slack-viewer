import React from 'react';
import { ArrowUpDown, Search } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface SkeletonMessageSpec {
  id: string;
  compact?: boolean;
  authorWidth: string;
  lines: string[];
  reactions?: number;
  threadAvatars?: number;
  attachment?: boolean;
}

const FIRST_DATE_MESSAGES: SkeletonMessageSpec[] = [
  {
    id: 'm1',
    authorWidth: '7.5rem',
    lines: ['82%', '56%'],
    reactions: 2,
  },
  {
    id: 'm2',
    compact: true,
    authorWidth: '0',
    lines: ['64%'],
  },
  {
    id: 'm3',
    authorWidth: '6rem',
    lines: ['91%', '74%', '38%'],
    threadAvatars: 3,
  },
  {
    id: 'm4',
    authorWidth: '8.5rem',
    lines: ['70%'],
    attachment: true,
  },
  {
    id: 'm5',
    authorWidth: '5.5rem',
    lines: ['88%', '48%'],
    reactions: 1,
  },
];

const SECOND_DATE_MESSAGES: SkeletonMessageSpec[] = [
  {
    id: 'm6',
    authorWidth: '7rem',
    lines: ['78%', '62%'],
    threadAvatars: 2,
  },
  {
    id: 'm7',
    compact: true,
    authorWidth: '0',
    lines: ['52%'],
  },
  {
    id: 'm8',
    authorWidth: '9rem',
    lines: ['86%', '41%'],
    reactions: 3,
  },
  {
    id: 'm9',
    authorWidth: '6.5rem',
    lines: ['68%', '76%', '30%'],
  },
];

const renderSkeletonMessage = (spec: SkeletonMessageSpec) => (
  <div
    key={spec.id}
    aria-hidden="true"
    className={`flex gap-2.5 px-3 sm:gap-3 sm:px-5 ${
      spec.compact ? 'pt-0.5 pb-1' : 'pt-2 pb-1.5'
    }`}
  >
    {/* Left gutter: avatar placeholder or compact spacer */}
    <div className="w-9 shrink-0">
      {!spec.compact && (
        <div className="skeleton-block-strong mt-0.5 h-9 w-9 rounded-lg" />
      )}
    </div>

    {/* Right content column */}
    <div className="min-w-0 flex-1 max-w-3xl">
      {!spec.compact && (
        <div className="mb-1.5 flex items-center gap-2 pt-0.5">
          <span
            className="skeleton-block-strong h-3.5 rounded"
            style={{ width: spec.authorWidth }}
          />
          <span className="skeleton-block h-2.5 w-10 rounded" />
        </div>
      )}

      <div className="space-y-2 py-0.5">
        {spec.lines.map((width, idx) => (
          <div
            key={idx}
            className="skeleton-block h-3.5 rounded"
            style={{ width }}
          />
        ))}
      </div>

      {spec.attachment && (
        <div className="mt-2.5 max-w-md space-y-2 rounded-r-md border-l-4 border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-3.5 py-2.5">
          <div className="skeleton-block-strong h-3 w-28 rounded" />
          <div className="skeleton-block h-3.5 w-4/5 rounded" />
          <div className="skeleton-block h-3 w-3/5 rounded" />
        </div>
      )}

      {spec.reactions && spec.reactions > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Array.from({ length: spec.reactions }).map((_, idx) => (
            <span
              key={idx}
              className="inline-flex h-6 w-12 items-center justify-center rounded-full border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-2"
            >
              <span className="skeleton-block h-2.5 w-6 rounded-full" />
            </span>
          ))}
        </div>
      )}

      {spec.threadAvatars && spec.threadAvatars > 0 && (
        <div className="mt-2 inline-flex items-center gap-2 px-2 py-1">
          <div className="flex -space-x-1">
            {Array.from({ length: spec.threadAvatars }).map((_, idx) => (
              <span
                key={idx}
                className="skeleton-block-strong h-5 w-5 rounded ring-1 ring-[var(--slack-main-bg)]"
              />
            ))}
          </div>
          <span className="skeleton-block h-3 w-14 rounded" />
          <span className="skeleton-block hidden h-2.5 w-24 rounded sm:inline-block" />
        </div>
      )}
    </div>
  </div>
);

export const MessageListSkeleton: React.FC = () => {
  const { t } = useI18n();

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      role="status"
      aria-busy="true"
      aria-label={t.app.loadingMessages}
    >
      <span className="sr-only">{t.app.loadingMessages}</span>

      {/* Sub-toolbar placeholder: matches MessageList sub-toolbar height & layout */}
      <div className="border-b border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-2.5 py-1 text-[11px] sm:px-4 sm:py-1 sm:text-xs">
        <div className="flex min-h-6 items-center justify-between gap-2">
          <div
            aria-hidden="true"
            className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden"
          >
            {/* Message count & month range placeholder */}
            <span className="skeleton-block h-3.5 w-16 shrink-0 rounded sm:hidden" />
            <span className="skeleton-block hidden h-3.5 w-28 shrink-0 rounded sm:inline-block md:w-44" />

            {/* Sort order pill placeholder */}
            <span className="inline-flex h-[22px] shrink-0 items-center gap-1 rounded-full border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2">
              <ArrowUpDown className="h-3 w-3 text-[var(--slack-text-muted)] opacity-40" />
              <span className="skeleton-block h-2.5 w-10 rounded sm:w-20" />
            </span>

            {/* Secondary action pill placeholder */}
            <span className="hidden h-[22px] shrink-0 items-center rounded-full border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2 sm:inline-flex">
              <span className="skeleton-block h-2.5 w-12 rounded" />
            </span>
          </div>

          {/* Mobile filter button placeholder */}
          <span
            aria-hidden="true"
            className="inline-flex h-6 shrink-0 items-center justify-center rounded-md border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2 text-[var(--slack-text-muted)] opacity-45 sm:hidden"
          >
            <Search className="h-3.5 w-3.5" />
          </span>

          {/* Desktop filter input placeholder */}
          <div
            aria-hidden="true"
            className="hidden h-6 w-52 shrink-0 items-center gap-1.5 rounded-md border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-2 sm:flex"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-[var(--slack-text-muted)] opacity-40" />
            <span className="skeleton-block h-3 w-28 rounded" />
          </div>
        </div>
      </div>

      {/* Main message frame placeholders */}
      <div className="min-h-0 flex-1 overflow-hidden pb-6 sm:pb-8">
        {/* Top sentinel pill placeholder */}
        <div
          aria-hidden="true"
          className="flex items-center justify-center pt-3 pb-1"
        >
          <span className="inline-flex h-[26px] items-center rounded-full border border-[var(--slack-border)] bg-[var(--slack-surface-bg)] px-3.5">
            <span className="skeleton-block h-3 w-32 rounded" />
          </span>
        </div>

        {/* Date group 1 */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="relative flex items-center justify-center py-3"
          >
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[var(--slack-border)]" />
            <span className="relative inline-flex h-[22px] items-center rounded-full border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-3.5 shadow-2xs">
              <span className="skeleton-block h-3 w-24 rounded" />
            </span>
          </div>
          {FIRST_DATE_MESSAGES.map(renderSkeletonMessage)}
        </div>

        {/* Date group 2 */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="relative flex items-center justify-center py-3"
          >
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[var(--slack-border)]" />
            <span className="relative inline-flex h-[22px] items-center rounded-full border border-[var(--slack-border)] bg-[var(--slack-main-bg)] px-3.5 shadow-2xs">
              <span className="skeleton-block h-3 w-28 rounded" />
            </span>
          </div>
          {SECOND_DATE_MESSAGES.map(renderSkeletonMessage)}
        </div>
      </div>
    </div>
  );
};
