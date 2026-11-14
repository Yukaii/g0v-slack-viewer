import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import type {
  ArchiveMessage,
  ArchiveStats,
  ChannelDetailResponse,
  ChannelSummary,
  MessageAttachment,
  MessageFile,
  MessageReaction,
  SearchResponse,
  SearchResultItem,
  SlackUserProfile,
  ThreadReply,
  YearEntry,
} from './types.js';

const UPSTREAM_BASE = 'https://g0v-slack-archive.g0v.ronny.tw';
const DEFAULT_AVATAR =
  'https://ca.slack-edge.com/T02G2SXKM-UD94JT3KQ-g8c100274e62-48';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const userCache = new Map<string, SlackUserProfile>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T, ttlMs: number): T {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

async function fetchUpstreamText(path: string): Promise<string> {
  const url = path.startsWith('http') ? path : `${UPSTREAM_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'g0v-slack-viewer/0.1 (+https://g0v.tw)',
      Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    throw new Error(`Upstream HTTP ${res.status} for ${url}`);
  }
  return await res.text();
}

function safeJsonParse<T = Record<string, unknown>>(
  raw: string | undefined | null
): T | null {
  if (!raw || raw === 'null') return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function rewriteFileUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('/index/file?url=')) {
    return '/api/file?url=' + url.slice('/index/file?url='.length);
  }
  if (url.startsWith('https://files.slack.com/')) {
    return `/api/file?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function parseDateMs(label: string): number | null {
  const trimmed = label.trim();
  if (!trimmed || trimmed === 'not yet') return null;
  // Format: YYYY/MM/DD HH:mm:ss (Asia/Taipei UTC+8 on upstream server)
  const normalized = trimmed.replace(/\//g, '-').replace(' ', 'T') + '+08:00';
  const t = Date.parse(normalized);
  return Number.isNaN(t) ? null : t;
}

function normalizeUser(
  rawUser: Record<string, unknown> | null,
  fallbackName: string,
  fallbackAvatar: string,
  fallbackUserId?: string
): SlackUserProfile {
  const profile = (rawUser?.profile as Record<string, unknown>) || {};
  const id = String(rawUser?.id || fallbackUserId || '');
  const displayName =
    String(profile.display_name || '') ||
    String(rawUser?.name || '') ||
    fallbackName ||
    (id ? `@${id}` : 'Unknown');
  const realName = String(
    profile.real_name || rawUser?.real_name || displayName
  );
  const name = String(rawUser?.name || fallbackName || displayName);
  const avatar =
    String(
      profile.image_72 ||
        profile.image_48 ||
        profile.image_192 ||
        fallbackAvatar ||
        DEFAULT_AVATAR
    ) || DEFAULT_AVATAR;

  const user: SlackUserProfile = {
    id,
    name,
    displayName,
    realName,
    avatar,
    title: profile.title ? String(profile.title) : undefined,
    isBot: Boolean(rawUser?.is_bot),
    deleted: Boolean(rawUser?.deleted),
    color: rawUser?.color ? String(rawUser.color) : undefined,
  };

  if (id && rawUser) {
    userCache.set(id, user);
  } else if (id && userCache.has(id)) {
    return userCache.get(id)!;
  }

  return user;
}

export async function getStats(): Promise<ArchiveStats> {
  const cacheKey = 'stats';
  const cached = getCached<ArchiveStats>(cacheKey);
  if (cached) return cached;

  const text = await fetchUpstreamText('/index/count');
  const data = JSON.parse(text) as ArchiveStats;
  return setCached(cacheKey, data, 5 * 60 * 1000);
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

function messagesNeedChannelResolution(messages: ArchiveMessage[]): boolean {
  return messages.some(
    (m) =>
      m.contentsHtml.includes('&lt;#') ||
      m.replies.some((r) => r.contentsHtml.includes('&lt;#')) ||
      m.attachments.some((a) => a.textHtml?.includes('&lt;#'))
  );
}

function resolveMessagesChannelRefs(
  messages: ArchiveMessage[],
  channelMap: Map<string, string>
): void {
  if (channelMap.size === 0) return;
  for (const m of messages) {
    if (m.contentsHtml.includes('&lt;#')) {
      m.contentsHtml = resolveChannelReferencesInHtml(m.contentsHtml, channelMap);
    }
    for (const r of m.replies) {
      if (r.contentsHtml.includes('&lt;#')) {
        r.contentsHtml = resolveChannelReferencesInHtml(r.contentsHtml, channelMap);
      }
    }
    for (const a of m.attachments) {
      if (a.textHtml && a.textHtml.includes('&lt;#')) {
        a.textHtml = resolveChannelReferencesInHtml(a.textHtml, channelMap);
      }
    }
  }
}

async function getChannelNameMap(): Promise<Map<string, string> | null> {
  try {
    const channels = await getChannels();
    return new Map(channels.map((c) => [c.id, c.name]));
  } catch (err) {
    console.warn('Failed to load channel map for reference resolution:', err);
    return null;
  }
}

export async function getChannels(): Promise<ChannelSummary[]> {
  const cacheKey = 'channels';
  const cached = getCached<ChannelSummary[]>(cacheKey);
  if (cached) return cached;

  const html = await fetchUpstreamText('/');
  const $ = cheerio.load(html);
  const channels: ChannelSummary[] = [];

  $('table tbody tr').each((_, tr) => {
    const row = $(tr);
    const link = row.find('th a.channel').first();
    const href = link.attr('href') || '';
    const id = href.split('/').pop() || '';
    if (!id) return;

    const rawJson = safeJsonParse<Record<string, unknown>>(link.attr('title'));
    const rawName = link.text().trim().replace(/^#/, '');
    const tds = row.find('td');
    const topicEl = tds.eq(0);
    const descEl = tds.eq(1);
    const createdLabel = tds.eq(2).text().trim();
    const msgCountText = tds.eq(3).text().trim();
    const memberCountText = tds.eq(4).text().trim();
    const lastPostedLabel = tds.eq(5).text().trim();
    const lastSyncedLabel = tds.eq(6).text().trim();

    const rawTopic = rawJson?.topic as Record<string, unknown> | undefined;
    const rawPurpose = rawJson?.purpose as Record<string, unknown> | undefined;

    channels.push({
      id,
      name: String(rawJson?.name || rawName),
      topicHtml: (topicEl.html() || '').trim(),
      topicText: String(rawTopic?.value || topicEl.text() || '').trim(),
      descriptionHtml: (descEl.html() || '').trim(),
      descriptionText: String(rawPurpose?.value || descEl.text() || '').trim(),
      createdAt: Number(rawJson?.created || 0),
      createdLabel,
      messageCount: parseInt(msgCountText, 10) || 0,
      memberCount:
        Number(rawJson?.num_members) || parseInt(memberCountText, 10) || 0,
      lastPostedAt: parseDateMs(lastPostedLabel),
      lastPostedLabel,
      lastSyncedLabel,
      isGeneral: Boolean(rawJson?.is_general),
      isArchived: Boolean(rawJson?.is_archived),
      previousNames: Array.isArray(rawJson?.previous_names)
        ? (rawJson.previous_names as string[])
        : [],
    });
  });

  const channelMap = new Map(channels.map((c) => [c.id, c.name]));
  for (const ch of channels) {
    if (ch.topicHtml.includes('&lt;#')) {
      ch.topicHtml = resolveChannelReferencesInHtml(ch.topicHtml, channelMap);
    }
    if (ch.descriptionHtml.includes('&lt;#')) {
      ch.descriptionHtml = resolveChannelReferencesInHtml(
        ch.descriptionHtml,
        channelMap
      );
    }
  }

  return setCached(cacheKey, channels, 5 * 60 * 1000);
}

function parseMessageElement(
  $: cheerio.CheerioAPI,
  msgEl: Element,
  dateStr: string
): ArchiveMessage {
  const el = $(msgEl);
  const idAttr = el.attr('id') || '';
  const ts = idAttr.startsWith('ts-') ? idAttr.slice(3) : idAttr;
  const isThreadReply = el.hasClass('thread-message');

  const avatarSrc =
    el.children('img.avatar').attr('src') || DEFAULT_AVATAR;
  const body = el.children('div.flex-grow-1');
  const meta = body.children('.meta');
  const userSpan = meta.children('.user-name');
  const timeSpan = meta.children('.message-time');

  const rawUserJson = safeJsonParse<Record<string, unknown>>(
    userSpan.attr('title')
  );
  const rawMsgJson = safeJsonParse<Record<string, unknown>>(
    timeSpan.attr('title')
  );
  const rawUserId = rawMsgJson?.user ? String(rawMsgJson.user) : undefined;
  const fallbackUserName = userSpan.text().trim();

  const user = normalizeUser(
    rawUserJson,
    fallbackUserName,
    avatarSrc,
    rawUserId
  );

  const timeLabel = timeSpan.text().trim();
  const contentsHtml = (body.children('.contents').html() || '').trim();

  // Thread broadcast root info
  let threadRoot: ArchiveMessage['threadRoot'];
  const threadRootEl = body.children('.thread-root');
  if (threadRootEl.length > 0) {
    const a = threadRootEl.find('a').first();
    const href = a.attr('href') || '';
    const match = href.match(/\/index\/channel\/[^/]+\/(\d{4}-\d{2})#ts-(.+)$/);
    threadRoot = {
      href,
      label: a.text().trim(),
      month: match?.[1],
      ts: match?.[2],
    };
  }

  // Files
  const files: MessageFile[] = [];
  const rawFiles = Array.isArray(rawMsgJson?.files)
    ? (rawMsgJson!.files as Array<Record<string, unknown>>)
    : [];

  body.children('figure.figure').each((idx, fig) => {
    const figEl = $(fig);
    const imgSrc = figEl.find('img').attr('src') || '';
    const caption = figEl.find('figcaption').text().trim();
    const rawFile = rawFiles[idx] || {};
    const thumbCandidate = String(
      rawFile.thumb_720 || rawFile.thumb_480 || rawFile.thumb_360 || ''
    );
    const fullCandidate = String(
      rawFile.url_private || rawFile.thumb_1024 || thumbCandidate || ''
    );
    const mimetype = rawFile.mimetype ? String(rawFile.mimetype) : undefined;
    const isImage =
      !mimetype || mimetype.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(caption);

    files.push({
      id: rawFile.id ? String(rawFile.id) : undefined,
      title: String(rawFile.title || caption || 'Attachment'),
      name: rawFile.name ? String(rawFile.name) : undefined,
      mimetype,
      filetype: rawFile.filetype ? String(rawFile.filetype) : undefined,
      size: typeof rawFile.size === 'number' ? rawFile.size : undefined,
      thumbUrl: rewriteFileUrl(imgSrc || thumbCandidate),
      fullUrl: rewriteFileUrl(fullCandidate || imgSrc),
      isImage,
    });
  });

  // Also include non-image files from rawFiles if not already captured
  if (files.length === 0 && rawFiles.length > 0) {
    for (const rawFile of rawFiles) {
      const thumbCandidate = String(
        rawFile.thumb_720 || rawFile.thumb_360 || rawFile.url_private || ''
      );
      if (!thumbCandidate) continue;
      const mimetype = rawFile.mimetype ? String(rawFile.mimetype) : undefined;
      files.push({
        id: rawFile.id ? String(rawFile.id) : undefined,
        title: String(rawFile.title || rawFile.name || 'File'),
        name: rawFile.name ? String(rawFile.name) : undefined,
        mimetype,
        filetype: rawFile.filetype ? String(rawFile.filetype) : undefined,
        size: typeof rawFile.size === 'number' ? rawFile.size : undefined,
        thumbUrl: rewriteFileUrl(thumbCandidate),
        fullUrl: rewriteFileUrl(
          String(rawFile.url_private || thumbCandidate)
        ),
        isImage: Boolean(mimetype?.startsWith('image/')),
      });
    }
  }

  // Attachments (unfurls and forwarded messages)
  const attachments: MessageAttachment[] = [];
  body.children('blockquote.card').each((_, card) => {
    const cardEl = $(card);
    const rawAtt = safeJsonParse<Record<string, unknown>>(cardEl.attr('title'));
    const isMsgUnfurl = Boolean(rawAtt?.is_msg_unfurl) || cardEl.find('.message-meta').length > 0;

    if (isMsgUnfurl) {
      const channelLink = cardEl.find('.message-meta a.channel').first();
      const timeLink = cardEl.find('.message-meta a.message-time').first();
      const href = timeLink.attr('href') || '';
      const chHref = channelLink.attr('href') || '';
      attachments.push({
        isMsgUnfurl: true,
        authorName:
          String(rawAtt?.author_name || '') ||
          cardEl.find('.card-title .user-name').text().trim(),
        authorIcon:
          String(rawAtt?.author_icon || '') ||
          cardEl.find('.card-title img.avatar').attr('src') ||
          undefined,
        textHtml: (cardEl.find('.card-text').html() || '').trim(),
        channelId:
          String(rawAtt?.channel_id || '') ||
          chHref.split('/').pop() ||
          undefined,
        channelName: channelLink.text().trim().replace(/^#/, '') || undefined,
        ts: rawAtt?.ts ? String(rawAtt.ts) : undefined,
        href,
      });
    } else {
      const img = cardEl.find('img.attachment-image');
      const titleLinkEl = cardEl.find('.card-subtitle a').first();
      attachments.push({
        isMsgUnfurl: false,
        serviceName:
          String(rawAtt?.service_name || '') ||
          cardEl.find('.card-title').text().trim() ||
          undefined,
        serviceIcon:
          String(rawAtt?.service_icon || '') ||
          cardEl.find('.card-title img.icon').attr('src') ||
          undefined,
        title:
          String(rawAtt?.title || '') || titleLinkEl.text().trim() || undefined,
        titleLink:
          String(rawAtt?.title_link || '') ||
          titleLinkEl.attr('href') ||
          undefined,
        text:
          String(rawAtt?.text || '') ||
          cardEl.find('.card-text').text().trim() ||
          undefined,
        imageUrl:
          String(rawAtt?.image_url || '') || img.attr('src') || undefined,
        imageWidth: rawAtt?.image_width ? Number(rawAtt.image_width) : undefined,
        imageHeight: rawAtt?.image_height
          ? Number(rawAtt.image_height)
          : undefined,
        fromUrl: rawAtt?.from_url ? String(rawAtt.from_url) : undefined,
      });
    }
  });

  // Reactions
  const rawReactions = Array.isArray(rawMsgJson?.reactions)
    ? (rawMsgJson!.reactions as Array<Record<string, unknown>>)
    : [];
  const reactions: MessageReaction[] = [];
  body.children('ul.reactions').children('li').each((idx, li) => {
    const liEl = $(li);
    const emojiEl = liEl.find('.emoji').first();
    const emojiHtml = (emojiEl.html() || '').trim();
    const clone = liEl.clone();
    clone.find('.emoji').remove();
    const count = parseInt(clone.text().trim(), 10) || 1;
    const rawR = rawReactions[idx];
    const users = Array.isArray(rawR?.users)
      ? (rawR.users as string[])
      : [];
    const userNames = users
      .map((uid) => userCache.get(uid)?.displayName || uid)
      .slice(0, 12);
    reactions.push({
      name: String(rawR?.name || ''),
      emojiHtml,
      count,
      users,
      userNames,
    });
  });

  // Thread replies
  const replies: ThreadReply[] = [];
  body
    .children('.replies')
    .children('div.message')
    .each((_, rEl) => {
      const r = $(rEl);
      const rId = r.attr('id') || '';
      const rTs = rId.startsWith('ts-') ? rId.slice(3) : rId;
      const rAvatar = r.children('img.avatar').attr('src') || DEFAULT_AVATAR;
      const rBody = r.children('div.flex-grow-1');
      const rMeta = rBody.children('.meta');
      const rUserSpan = rMeta.children('.user-name');
      const rTimeSpan = rMeta.children('.message-time');
      const rRawUser = safeJsonParse<Record<string, unknown>>(
        rUserSpan.attr('title')
      );
      const rRawMsg = safeJsonParse<Record<string, unknown>>(
        rTimeSpan.attr('title')
      );
      const rUser = normalizeUser(
        rRawUser,
        rUserSpan.text().trim(),
        rAvatar,
        rRawMsg?.user ? String(rRawMsg.user) : undefined
      );

      replies.push({
        ts: rTs,
        rawTs: rRawMsg?.ts ? String(rRawMsg.ts) : undefined,
        clientMsgId: rRawMsg?.client_msg_id
          ? String(rRawMsg.client_msg_id)
          : undefined,
        eventTs: rRawMsg?.event_ts ? String(rRawMsg.event_ts) : undefined,
        timeLabel: rTimeSpan.text().trim(),
        user: rUser,
        contentsHtml: (rBody.children('.contents').html() || '').trim(),
        text: String(rRawMsg?.text || ''),
        blocks: Array.isArray(rRawMsg?.blocks) ? rRawMsg.blocks : undefined,
      });
    });

  const subtype = rawMsgJson?.subtype ? String(rawMsgJson.subtype) : undefined;

  return {
    ts,
    rawTs: rawMsgJson?.ts ? String(rawMsgJson.ts) : undefined,
    clientMsgId: rawMsgJson?.client_msg_id
      ? String(rawMsgJson.client_msg_id)
      : undefined,
    eventTs: rawMsgJson?.event_ts ? String(rawMsgJson.event_ts) : undefined,
    date: dateStr,
    timeLabel,
    user,
    text: String(rawMsgJson?.text || ''),
    contentsHtml,
    blocks: Array.isArray(rawMsgJson?.blocks) ? rawMsgJson.blocks : undefined,
    subtype,
    isThreadReply,
    isThreadBroadcast:
      subtype === 'thread_broadcast' || Boolean(rawMsgJson?.is_thread_broadcast),
    threadTs: rawMsgJson?.thread_ts ? String(rawMsgJson.thread_ts) : undefined,
    threadRoot,
    files,
    attachments,
    reactions,
    replies,
    edited: Boolean(rawMsgJson?.edited),
  };
}

export async function getChannelMessages(
  channelId: string,
  month?: string
): Promise<ChannelDetailResponse> {
  const safeId = encodeURIComponent(channelId);
  const path = month
    ? `/index/channel/${safeId}/${encodeURIComponent(month)}`
    : `/index/channel/${safeId}`;
  const cacheKey = `channel:${channelId}:${month || 'latest'}`;
  const cached = getCached<ChannelDetailResponse>(cacheKey);
  if (cached) return cached;

  const html = await fetchUpstreamText(path);
  const $ = cheerio.load(html);

  const channelName = $('h2').first().text().trim().replace(/^#/, '');

  // Parse years & months from nav[role="pagination"]
  const years: YearEntry[] = [];
  const allMonths: string[] = [];
  let activeMonth = month || '';

  $('nav[role="pagination"] ul.nav-tabs > li.nav-item').each((_, li) => {
    const liEl = $(li);
    const navLink = liEl.children('a.nav-link').first();
    const isActive = navLink.hasClass('active');
    const yearLabel = isActive
      ? navLink.attr('aria-label') || navLink.text().trim().slice(0, 4)
      : navLink.text().trim();

    if (isActive && !activeMonth) {
      const mText = navLink.text().trim();
      if (/^\d{4}-\d{2}$/.test(mText)) {
        activeMonth = mText;
      }
    }

    const months: YearEntry['months'] = [];
    liEl.find('ul.dropdown-menu a.dropdown-item').each((__, item) => {
      const itemEl = $(item);
      const href = itemEl.attr('href') || '';
      const m = href.split('/').pop() || '';
      const countText = itemEl.find('span.badge').text().trim();
      const count = parseInt(countText, 10) || 0;
      if (/^\d{4}-\d{2}$/.test(m)) {
        months.push({ month: m, count });
        allMonths.push(m);
      }
    });

    if (months.length > 0) {
      years.push({ year: yearLabel, months });
    }
  });

  if (!activeMonth && allMonths.length > 0) {
    activeMonth = allMonths[allMonths.length - 1];
  }

  const activeIdx = allMonths.indexOf(activeMonth);
  const previousMonth = activeIdx > 0 ? allMonths[activeIdx - 1] : null;
  const nextMonth =
    activeIdx >= 0 && activeIdx < allMonths.length - 1
      ? allMonths[activeIdx + 1]
      : null;

  const messages: ArchiveMessage[] = [];
  let currentDate = activeMonth ? `${activeMonth}-01` : '';

  $('section[role="feed"]')
    .children()
    .each((_, node) => {
      const tag = node.tagName?.toLowerCase();
      if (tag === 'h5') {
        currentDate = $(node).text().trim();
      } else if (tag === 'div' && $(node).hasClass('message')) {
        messages.push(parseMessageElement($, node, currentDate));
      }
    });

  if (messagesNeedChannelResolution(messages)) {
    const channelMap = await getChannelNameMap();
    if (channelMap) {
      resolveMessagesChannelRefs(messages, channelMap);
    }
  }

  const result: ChannelDetailResponse = {
    channelId,
    channelName,
    activeMonth,
    years,
    previousMonth,
    nextMonth,
    messages,
  };

  // Cache current/latest month briefly, historical months longer
  const currentYm = new Date().toISOString().slice(0, 7);
  const ttl = month && month < currentYm ? 15 * 60 * 1000 : 90 * 1000;
  return setCached(cacheKey, result, ttl);
}

export async function searchMessages(query: string): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: trimmed, results: [] };
  }

  const cacheKey = `search:${trimmed}`;
  const cached = getCached<SearchResponse>(cacheKey);
  if (cached) return cached;

  const html = await fetchUpstreamText(
    `/index/search?q=${encodeURIComponent(trimmed)}`
  );
  const $ = cheerio.load(html);
  const results: SearchResultItem[] = [];

  $('ol.list-group > li.list-group-item').each((_, li) => {
    const liEl = $(li);
    const header = liEl.children('div').first();
    const channelName = header.find('strong').first().text().trim().replace(/^#/, '');
    const link = header.find('a').first();
    const href = link.attr('href') || '';
    const dateLabel = link.text().trim();
    const dateStr = dateLabel.split(' ')[0] || '';

    const match = href.match(/\/index\/channel\/([^/]+)\/(\d{4}-\d{2})#ts-(.+)$/);
    const channelId = match?.[1] || '';
    const month = match?.[2] || dateStr.slice(0, 7);
    const ts = match?.[3] || '';

    const msgEl = liEl.children('div.message').first().get(0);
    if (!msgEl) return;

    const message = parseMessageElement($, msgEl, dateStr);
    results.push({
      channelId,
      channelName,
      month,
      ts: ts || message.ts,
      dateLabel,
      message,
    });
  });

  const searchMessagesList = results.map((r) => r.message);
  if (messagesNeedChannelResolution(searchMessagesList)) {
    const channelMap = await getChannelNameMap();
    if (channelMap) {
      resolveMessagesChannelRefs(searchMessagesList, channelMap);
    }
  }

  const response: SearchResponse = { query: trimmed, results };
  return setCached(cacheKey, response, 2 * 60 * 1000);
}

function detectMimeType(buf: Buffer, url: string): string {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buf.length >= 6 && (buf.subarray(0, 6).toString() === 'GIF89a' || buf.subarray(0, 6).toString() === 'GIF87a')) {
    return 'image/gif';
  }
  if (buf.length >= 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') {
    return 'image/webp';
  }
  if (buf.length >= 4 && buf.subarray(0, 4).toString() === '%PDF') {
    return 'application/pdf';
  }
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
  if (lower.includes('.gif')) return 'image/gif';
  if (lower.includes('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

export async function proxySlackFile(
  fileUrl: string
): Promise<{ buffer: Buffer; contentType: string }> {
  if (!fileUrl.startsWith('https://files.slack.com/')) {
    throw new Error('Invalid Slack file URL');
  }
  const upstreamUrl = `${UPSTREAM_BASE}/index/file?url=${encodeURIComponent(fileUrl)}`;
  const res = await fetch(upstreamUrl, {
    headers: {
      'User-Agent': 'g0v-slack-viewer/0.1',
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    throw new Error(`File proxy HTTP ${res.status}`);
  }
  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);
  const contentType = detectMimeType(buffer, fileUrl);
  return { buffer, contentType };
}
