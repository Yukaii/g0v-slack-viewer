import React, { useMemo } from 'react';

const INLINE_TOKEN = /(<[^<>\n]+>|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
};

export function decodeSlackEntities(text: string): string {
  return text.replace(
    /&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g,
    (match, code: string) => {
      if (code.startsWith('#')) {
        const isHex = code[1] === 'x' || code[1] === 'X';
        const value = parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
        return Number.isFinite(value) ? String.fromCodePoint(value) : match;
      }
      return NAMED_ENTITIES[code.toLowerCase()] ?? match;
    }
  );
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  INLINE_TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE_TOKEN.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(decodeSlackEntities(text.slice(lastIndex, match.index)));
    }

    const token = match[0];
    if (token.startsWith('<')) {
      const inner = token.slice(1, -1);
      const pipe = inner.indexOf('|');
      const target = pipe === -1 ? inner : inner.slice(0, pipe);
      const label = pipe === -1 ? inner : inner.slice(pipe + 1);

      if (/^(https?:\/\/|mailto:)/i.test(target)) {
        const href = decodeSlackEntities(target);
        nodes.push(
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--slack-link)] hover:underline"
          >
            {decodeSlackEntities(
              target.startsWith('mailto:') && pipe === -1
                ? target.slice('mailto:'.length)
                : label
            )}
          </a>
        );
      } else if (target.startsWith('!date')) {
        // <!date^1605100125^{date_short}|2020-11-11T13:08:45Z>
        nodes.push(
          <span key={key++}>
            {decodeSlackEntities(label.split('T')[0])}
          </span>
        );
      } else if (target.startsWith('#')) {
        nodes.push(
          <span key={key++}>
            #{decodeSlackEntities(label || target.slice(1))}
          </span>
        );
      } else if (target.startsWith('@')) {
        nodes.push(
          <span key={key++}>
            @{decodeSlackEntities(label || target.slice(1))}
          </span>
        );
      } else if (target.startsWith('!')) {
        // <!here>, <!channel>, <!everyone>
        nodes.push(<span key={key++}>@{target.slice(1)}</span>);
      } else if (label) {
        nodes.push(<span key={key++}>{decodeSlackEntities(label)}</span>);
      } else {
        nodes.push(<span key={key++}>{decodeSlackEntities(target)}</span>);
      }
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key++}
          className="font-mono-code rounded bg-[var(--slack-badge-bg)] px-1 py-0.5 text-[0.9em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*')) {
      nodes.push(
        <strong key={key++} className="font-semibold">
          {decodeSlackEntities(token.slice(1, -1))}
        </strong>
      );
    } else if (token.startsWith('_')) {
      nodes.push(
        <em key={key++} className="italic">
          {decodeSlackEntities(token.slice(1, -1))}
        </em>
      );
    } else if (token.startsWith('~')) {
      nodes.push(
        <del key={key++} className="line-through">
          {decodeSlackEntities(token.slice(1, -1))}
        </del>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(decodeSlackEntities(text.slice(lastIndex)));
  }

  return nodes;
}

interface SlackTextProps {
  text: string;
  className?: string;
}

/**
 * Renders the inline Slack mrkdwn found in attachment fields (links, mentions,
 * bold/italic/strike, inline code) without injecting raw HTML.
 */
export const SlackText: React.FC<SlackTextProps> = ({
  text,
  className = '',
}) => {
  const nodes = useMemo(() => renderInline(text), [text]);
  return <span className={className}>{nodes}</span>;
};

export function hasSlackLinkMarkup(text: string): boolean {
  return /<(?:https?:\/\/|mailto:)[^<>\n]*>/i.test(text);
}
