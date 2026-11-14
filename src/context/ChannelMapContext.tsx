import React, { createContext, useContext, useMemo } from 'react';
import type { ChannelSummary } from '../types';

const ChannelMapContext = createContext<Map<string, string>>(new Map());

export const ChannelMapProvider: React.FC<{
  channels: ChannelSummary[];
  children: React.ReactNode;
}> = ({ channels, children }) => {
  const channelMap = useMemo(
    () => new Map(channels.map((c) => [c.id, c.name])),
    [channels]
  );

  return (
    <ChannelMapContext.Provider value={channelMap}>
      {children}
    </ChannelMapContext.Provider>
  );
};

export function useChannelMap(): Map<string, string> {
  return useContext(ChannelMapContext);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const CHANNEL_REF_RE = /&lt;#([CG][A-Z0-9]{6,})(?:\|((?:(?!&gt;).)+?))?&gt;/g;
const SPECIAL_MENTION_RE =
  /&lt;!(here|channel|everyone|group)(?:\|((?:(?!&gt;).)+?))?&gt;/g;
const SUBTEAM_MENTION_RE =
  /&lt;!subteam\^([A-Z0-9]+)(?:\|((?:(?!&gt;).)+?))?&gt;/g;
const USER_MENTION_RE =
  /&lt;@([UW][A-Z0-9]{4,})(?:\|((?:(?!&gt;).)+?))?&gt;/g;
const DATE_TOKEN_RE =
  /&lt;!date\^(\d+)(?:\^((?:(?!&gt;|\|).)*))?(?:\|((?:(?!&gt;).)+?))?&gt;/g;
const HTML_TAG_RE = /<[^>]+>/g;

function formatSlackDateToken(
  timestampSec: number,
  formatAndLink?: string,
  fallback?: string
): string {
  const date = new Date(timestampSec * 1000);
  if (Number.isNaN(date.getTime())) {
    return fallback || String(timestampSec);
  }

  let formatStr = formatAndLink || '';
  let linkUrl: string | undefined;
  const caretIdx = formatStr.indexOf('^');
  if (caretIdx !== -1) {
    const candidate = formatStr.slice(caretIdx + 1).trim();
    formatStr = formatStr.slice(0, caretIdx);
    if (/^https?:\/\//i.test(candidate)) {
      linkUrl = candidate;
    }
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const dateNum = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
  const timeShort = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const timeSecs = `${timeShort}:${pad(date.getSeconds())}`;

  let rendered = formatStr
    ? formatStr
        .replace(/\{date_num\}/g, dateNum)
        .replace(/\{date_short_pretty\}|\{date_short\}/g, date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }))
        .replace(/\{date_long_pretty\}|\{date_long\}|\{date_pretty\}|\{date\}/g, date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }))
        .replace(/\{time_secs\}/g, timeSecs)
        .replace(/\{time\}/g, timeShort)
    : '';

  if (!rendered.trim()) {
    rendered = fallback || `${dateNum} ${timeShort}`;
  } else {
    rendered = escapeHtml(rendered);
  }

  const titleText = escapeAttr(
    fallback
      ? `${fallback.replace(/&quot;/g, '"')} (${date.toLocaleString()})`
      : date.toLocaleString()
  );

  if (linkUrl) {
    return `<a href="${escapeHtml(linkUrl)}" class="slack-date" title="${titleText}">${rendered}</a>`;
  }
  return `<time class="slack-date" datetime="${date.toISOString()}" title="${titleText}">${rendered}</time>`;
}

export function resolveSlackEntitiesInHtml(
  html: string,
  channelMap: Map<string, string>
): string {
  if (!html || !html.includes('&lt;')) {
    return html;
  }

  let result = '';
  let lastIndex = 0;
  let codeDepth = 0;
  let preDepth = 0;
  let anchorDepth = 0;

  const replaceSegment = (segment: string): string => {
    if (!segment || codeDepth > 0 || preDepth > 0 || anchorDepth > 0) {
      return segment;
    }

    let out = segment;

    if (out.includes('&lt;#')) {
      out = out.replace(
        CHANNEL_REF_RE,
        (_match, channelId: string, fallbackName?: string) => {
          const knownName = channelMap.get(channelId);
          if (knownName) {
            return `<a href="/index/channel/${encodeURIComponent(
              channelId
            )}" class="channel-mention" data-channel-id="${escapeHtml(
              channelId
            )}">#${escapeHtml(knownName)}</a>`;
          }
          if (fallbackName) {
            return `<span class="channel-mention channel-mention-unknown" title="Channel ${escapeHtml(
              channelId
            )} (not in public archive)">#${fallbackName}</span>`;
          }
          return `<span class="channel-mention channel-mention-unknown" title="Private or unavailable channel (${escapeHtml(
            channelId
          )})">#${escapeHtml(channelId)}</span>`;
        }
      );
    }

    if (out.includes('&lt;!')) {
      out = out.replace(
        SPECIAL_MENTION_RE,
        (_match, kind: string, label?: string) => {
          const display = label ? label.replace(/^@/, '') : kind;
          return `<span class="special-mention" data-mention="${escapeHtml(
            kind
          )}">@${display}</span>`;
        }
      );

      out = out.replace(
        SUBTEAM_MENTION_RE,
        (_match, subteamId: string, label?: string) => {
          const display = label
            ? label.replace(/^@/, '')
            : escapeHtml(subteamId);
          const cls = label
            ? 'special-mention'
            : 'special-mention special-mention-unknown';
          return `<span class="${cls}" data-subteam="${escapeHtml(
            subteamId
          )}" title="User group (${escapeHtml(subteamId)})">@${display}</span>`;
        }
      );

      if (out.includes('&lt;!date^')) {
        out = out.replace(
          DATE_TOKEN_RE,
          (_match, tsStr: string, fmt?: string, fallback?: string) =>
            formatSlackDateToken(Number(tsStr), fmt, fallback)
        );
      }
    }

    if (out.includes('&lt;@')) {
      out = out.replace(
        USER_MENTION_RE,
        (_match, userId: string, label?: string) => {
          if (label) {
            const display = label.replace(/^@/, '');
            return `<span class="user-mention" data-user-id="${escapeHtml(
              userId
            )}" title="User (${escapeHtml(userId)})">@${display}</span>`;
          }
          return `<span class="user-mention user-mention-unknown" data-user-id="${escapeHtml(
            userId
          )}" title="Slack user (${escapeHtml(userId)})">@${escapeHtml(
            userId
          )}</span>`;
        }
      );
    }

    return out;
  };

  HTML_TAG_RE.lastIndex = 0;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = HTML_TAG_RE.exec(html)) !== null) {
    const textBefore = html.slice(lastIndex, tagMatch.index);
    result += replaceSegment(textBefore);

    const tag = tagMatch[0];
    result += tag;
    lastIndex = HTML_TAG_RE.lastIndex;

    const nameMatch = tag.match(/^<\/?\s*([a-zA-Z0-9-]+)/);
    if (nameMatch) {
      const tagName = nameMatch[1].toLowerCase();
      const isClosing = tag.startsWith('</');
      const isSelfClosing = tag.endsWith('/>');
      if (!isSelfClosing) {
        const delta = isClosing ? -1 : 1;
        if (tagName === 'code') codeDepth = Math.max(0, codeDepth + delta);
        else if (tagName === 'pre') preDepth = Math.max(0, preDepth + delta);
        else if (tagName === 'a') anchorDepth = Math.max(0, anchorDepth + delta);
      }
    }
  }

  result += replaceSegment(html.slice(lastIndex));
  return result;
}

export function resolveChannelReferencesInHtml(
  html: string,
  channelMap: Map<string, string>
): string {
  return resolveSlackEntitiesInHtml(html, channelMap);
}
