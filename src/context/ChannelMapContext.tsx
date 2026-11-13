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

const CHANNEL_REF_RE = /&lt;#([CG][A-Z0-9]{6,})(?:\|((?:(?!&gt;).)+?))?&gt;/g;
const HTML_TAG_RE = /<[^>]+>/g;

export function resolveChannelReferencesInHtml(
  html: string,
  channelMap: Map<string, string>
): string {
  if (!html || !html.includes('&lt;#') || channelMap.size === 0) {
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
    return segment.replace(
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
