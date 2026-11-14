import React, { useCallback, useMemo } from 'react';
import {
  resolveSlackEntitiesInHtml,
  useChannelMap,
} from '../context/ChannelMapContext';
import { parseArchiveChannelHref } from '../utils/format';

interface RichContentProps {
  html: string;
  className?: string;
  onNavigateChannel?: (channelId: string, month?: string, ts?: string) => void;
}

export const RichContent: React.FC<RichContentProps> = ({
  html,
  className = '',
  onNavigateChannel,
}) => {
  const channelMap = useChannelMap();

  const resolvedHtml = useMemo(
    () => resolveSlackEntitiesInHtml(html, channelMap),
    [html, channelMap]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href') || '';
      const parsed = parseArchiveChannelHref(href);
      if (parsed && onNavigateChannel) {
        e.preventDefault();
        onNavigateChannel(parsed.channelId, parsed.month, parsed.ts);
        return;
      }

      if (href.startsWith('http://') || href.startsWith('https://')) {
        e.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    },
    [onNavigateChannel]
  );

  return (
    <div
      className={`slack-html text-[15px] ${className}`}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: resolvedHtml }}
    />
  );
};
