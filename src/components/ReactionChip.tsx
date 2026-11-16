import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../i18n/I18nContext';
import type { MessageReaction } from '../types';

const POPOVER_WIDTH = 256;
const POPOVER_GAP = 6;
const VIEWPORT_GUTTER = 8;

type PopoverPosition = {
  left: number;
  top?: number;
  bottom?: number;
};

interface ReactionChipProps {
  reaction: MessageReaction;
}

function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return Array.from(trimmed)[0].toUpperCase();
}

export const ReactionChip: React.FC<ReactionChipProps> = ({ reaction }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const people = useMemo(() => {
    const names = reaction.userNames ?? [];
    return reaction.users.map((id, idx) => ({
      id,
      name: names[idx] || id,
      isFallback: !names[idx] || names[idx] === id,
    }));
  }, [reaction.users, reaction.userNames]);

  const updatePosition = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxLeft = Math.max(
      VIEWPORT_GUTTER,
      window.innerWidth - POPOVER_WIDTH - VIEWPORT_GUTTER
    );
    const left = Math.min(Math.max(VIEWPORT_GUTTER, rect.left), maxLeft);

    if (rect.top > 260) {
      setPosition({
        left,
        bottom: window.innerHeight - rect.top + POPOVER_GAP,
      });
    } else {
      setPosition({ left, top: rect.bottom + POPOVER_GAP });
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
    const onReflow = () => updatePosition();
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={t.messageItem.reactionViewWho}
        aria-label={t.messageItem.reactionViewWho}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition ${
          open
            ? 'border-[var(--slack-accent)] bg-[var(--slack-accent)]/10 text-[var(--slack-link)]'
            : 'border-[var(--slack-border)] bg-[var(--slack-badge-bg)] text-[var(--slack-text)] hover:border-[var(--slack-accent)]/40 hover:bg-[var(--slack-surface-hover)]'
        }`}
      >
        <span
          className="reaction-emoji inline-flex items-center"
          dangerouslySetInnerHTML={{ __html: reaction.emojiHtml }}
        />
        <span>{reaction.count}</span>
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={t.messageItem.reactionViewWho}
            style={{
              left: position.left,
              ...(position.bottom !== undefined
                ? { bottom: position.bottom }
                : { top: position.top }),
            }}
            className="fixed z-[60] w-64 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-[var(--slack-border)] bg-[var(--slack-main-bg)] text-[var(--slack-text)] shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-[var(--slack-border)] px-3 py-2">
              <span
                className="reaction-emoji inline-flex items-center"
                dangerouslySetInnerHTML={{ __html: reaction.emojiHtml }}
              />
              <span className="text-xs font-semibold">
                {t.messageItem.reactionCount(reaction.count)}
              </span>
            </div>

            {people.length > 0 && (
              <ul className="slack-scroll max-h-56 overflow-y-auto py-1">
                {people.map((person, idx) => (
                  <li
                    key={`${person.id}-${idx}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--slack-badge-bg)] text-[10px] font-semibold text-[var(--slack-text-muted)] uppercase"
                    >
                      {initialOf(person.isFallback ? person.id : person.name)}
                    </span>
                    <span
                      className={`truncate ${
                        person.isFallback
                          ? 'font-mono-code text-[var(--slack-text-muted)]'
                          : ''
                      }`}
                    >
                      {person.isFallback ? `@${person.id}` : person.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body
        )}
    </>
  );
};
