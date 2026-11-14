import type { ArchiveMessage, SearchResultItem, ThreadReply } from '../types';

function decimalPlaces(ts: string): number {
  const dot = ts.indexOf('.');
  return dot === -1 ? 0 : ts.length - dot - 1;
}

function isSixDecimalTs(ts: string): boolean {
  return decimalPlaces(ts) >= 6;
}

function normalizeUserKey(user: { id?: string; displayName: string }): string {
  return user.id ? `id:${user.id}` : `name:${user.displayName}`;
}

function scoreReply(r: ThreadReply): number {
  let score = 0;
  if (isSixDecimalTs(r.ts)) score += 100;
  if (r.rawTs && r.ts === r.rawTs) score += 50;
  if (!r.eventTs) score += 20;
  if (r.rawTs) score += 10;
  if (r.clientMsgId) score += 5;
  score += Math.min(20, r.text.length / 50);
  return score;
}

function scoreMessage(m: ArchiveMessage): number {
  let score = 0;
  // Edited messages in conversations.history have fresher body text than Events API copies
  if (m.edited) score += 1000;
  // Conversations.history rows omit event_ts and preserve full 6-decimal ts
  if (!m.eventTs) score += 300;
  if (isSixDecimalTs(m.ts)) score += 200;
  if (m.rawTs && m.ts === m.rawTs) score += 100;
  if (m.isThreadBroadcast) score += 50;
  if (m.replies.length > 0) score += 40 + Math.min(40, m.replies.length);
  if (m.reactions.length > 0) score += 20;
  if (m.files.length > 0 || m.attachments.length > 0) score += 15;
  if (m.threadRoot) score += 10;
  if (m.rawTs) score += 5;
  return score;
}

function collectAliases(
  canonicalTs: string,
  ...candidates: Array<string | undefined | string[]>
): string[] | undefined {
  const set = new Set<string>();
  for (const item of candidates) {
    if (!item) continue;
    if (Array.isArray(item)) {
      for (const s of item) {
        if (s && s !== canonicalTs) set.add(s);
      }
    } else if (item !== canonicalTs) {
      set.add(item);
    }
  }
  return set.size > 0 ? Array.from(set) : undefined;
}

function areSimilarWithoutIds(
  a: { ts: string; user: { id?: string; displayName: string }; text: string; contentsHtml: string },
  b: { ts: string; user: { id?: string; displayName: string }; text: string; contentsHtml: string }
): boolean {
  if (normalizeUserKey(a.user) !== normalizeUserKey(b.user)) return false;
  const numA = Number(a.ts);
  const numB = Number(b.ts);
  if (Number.isNaN(numA) || Number.isNaN(numB)) return false;
  if (Math.abs(numA - numB) > 0.00011) return false;
  // At least one should look like a rounded timestamp (< 6 decimals) unless exact match
  if (a.ts !== b.ts && isSixDecimalTs(a.ts) && isSixDecimalTs(b.ts)) {
    return false;
  }
  const textA = a.text.trim();
  const textB = b.text.trim();
  if (textA || textB) {
    return textA === textB;
  }
  return a.contentsHtml.trim() === b.contentsHtml.trim();
}

export function areRepliesDuplicate(a: ThreadReply, b: ThreadReply): boolean {
  // Explicit conflict checks prevent collapsing genuine collisions
  if (a.rawTs && b.rawTs) {
    return a.rawTs === b.rawTs;
  }
  if (a.clientMsgId && b.clientMsgId) {
    return (
      a.clientMsgId === b.clientMsgId &&
      normalizeUserKey(a.user) === normalizeUserKey(b.user)
    );
  }
  if (a.ts === b.ts) {
    return normalizeUserKey(a.user) === normalizeUserKey(b.user);
  }
  return areSimilarWithoutIds(a, b);
}

export function areMessagesDuplicate(
  a: ArchiveMessage,
  b: ArchiveMessage
): boolean {
  // 1. Both have Slack's exact 6-decimal ts from JSON -> authoritative identity
  if (a.rawTs && b.rawTs) {
    return a.rawTs === b.rawTs;
  }

  // 2. Both have Slack's client_msg_id -> authoritative identity
  if (a.clientMsgId && b.clientMsgId) {
    return (
      a.clientMsgId === b.clientMsgId &&
      normalizeUserKey(a.user) === normalizeUserKey(b.user)
    );
  }

  // 3. Exact ts match without conflicting rawTs / clientMsgId
  if (a.ts === b.ts) {
    if (a.files.length !== b.files.length && a.text.trim() !== b.text.trim()) {
      return false;
    }
    return normalizeUserKey(a.user) === normalizeUserKey(b.user);
  }

  // 4. Fallback for messages lacking rawTs/clientMsgId on one or both sides
  if (!areSimilarWithoutIds(a, b)) return false;
  return (
    a.files.length === b.files.length &&
    a.attachments.length === b.attachments.length
  );
}

function mergeTwoReplies(a: ThreadReply, b: ThreadReply): ThreadReply {
  const [primary, secondary] =
    scoreReply(a) >= scoreReply(b) ? [a, b] : [b, a];
  const canonicalTs =
    isSixDecimalTs(primary.ts) || !isSixDecimalTs(secondary.ts)
      ? primary.ts
      : secondary.ts;
  const aliasTs = collectAliases(
    canonicalTs,
    primary.ts,
    primary.rawTs,
    primary.aliasTs,
    secondary.ts,
    secondary.rawTs,
    secondary.aliasTs
  );
  return {
    ...primary,
    ts: canonicalTs,
    rawTs: primary.rawTs || secondary.rawTs,
    clientMsgId: primary.clientMsgId || secondary.clientMsgId,
    eventTs: primary.eventTs && secondary.eventTs ? primary.eventTs : undefined,
    aliasTs,
  };
}

export function dedupeReplies(replies: ThreadReply[]): ThreadReply[] {
  if (replies.length <= 1) return replies;
  const result: ThreadReply[] = [];
  const byTs = new Map<string, number>();
  const byBucket = new Map<number, number[]>();

  for (const reply of replies) {
    const num = Number(reply.rawTs || reply.ts);
    const bucket = Number.isFinite(num) ? Math.floor(num * 1000) : 0;

    let matchIdx: number | undefined =
      byTs.get(reply.ts) ?? (reply.rawTs ? byTs.get(reply.rawTs) : undefined);

    if (matchIdx !== undefined && !areRepliesDuplicate(result[matchIdx], reply)) {
      matchIdx = undefined;
    }

    if (matchIdx === undefined) {
      for (const bKey of [bucket - 1, bucket, bucket + 1]) {
        const candidates = byBucket.get(bKey);
        if (!candidates) continue;
        for (const idx of candidates) {
          if (areRepliesDuplicate(result[idx], reply)) {
            matchIdx = idx;
            break;
          }
        }
        if (matchIdx !== undefined) break;
      }
    }

    if (matchIdx !== undefined) {
      const merged = mergeTwoReplies(result[matchIdx], reply);
      result[matchIdx] = merged;
      byTs.set(merged.ts, matchIdx);
      if (merged.rawTs) byTs.set(merged.rawTs, matchIdx);
      if (merged.aliasTs) {
        for (const a of merged.aliasTs) byTs.set(a, matchIdx);
      }
    } else {
      const idx = result.length;
      result.push(reply);
      byTs.set(reply.ts, idx);
      if (reply.rawTs) byTs.set(reply.rawTs, idx);
      const list = byBucket.get(bucket);
      if (list) list.push(idx);
      else byBucket.set(bucket, [idx]);
    }
  }

  return result.sort((a, b) => Number(a.ts) - Number(b.ts));
}

function mergeTwoMessages(
  a: ArchiveMessage,
  b: ArchiveMessage
): ArchiveMessage {
  const [primary, secondary] =
    scoreMessage(a) >= scoreMessage(b) ? [a, b] : [b, a];

  // Prefer a real 6-decimal ts that actually exists in upstream HTML when available
  const canonicalTs = isSixDecimalTs(primary.ts)
    ? primary.ts
    : isSixDecimalTs(secondary.ts)
      ? secondary.ts
      : primary.ts;

  const aliasTs = collectAliases(
    canonicalTs,
    primary.ts,
    primary.rawTs,
    primary.aliasTs,
    secondary.ts,
    secondary.rawTs,
    secondary.aliasTs
  );

  const mergedReplies = dedupeReplies([
    ...primary.replies,
    ...secondary.replies,
  ]);

  const primaryReactionTotal = primary.reactions.reduce(
    (sum, r) => sum + r.count,
    0
  );
  const secondaryReactionTotal = secondary.reactions.reduce(
    (sum, r) => sum + r.count,
    0
  );
  const reactions =
    primaryReactionTotal >= secondaryReactionTotal
      ? primary.reactions
      : secondary.reactions;

  return {
    ...primary,
    ts: canonicalTs,
    rawTs: primary.rawTs || secondary.rawTs,
    clientMsgId: primary.clientMsgId || secondary.clientMsgId,
    eventTs: primary.eventTs && secondary.eventTs ? primary.eventTs : undefined,
    aliasTs,
    subtype: primary.subtype || secondary.subtype,
    isThreadBroadcast: primary.isThreadBroadcast || secondary.isThreadBroadcast,
    threadTs: primary.threadTs || secondary.threadTs,
    threadRoot: primary.threadRoot || secondary.threadRoot,
    edited: primary.edited || secondary.edited,
    files: primary.files.length > 0 ? primary.files : secondary.files,
    attachments:
      primary.attachments.length > 0
        ? primary.attachments
        : secondary.attachments,
    reactions,
    replies: mergedReplies,
  };
}

/**
 * Deduplicates messages on the client side while protecting against
 * 4-decimal vs 6-decimal timestamp collisions (g0v-slack-archive#8).
 */
export function dedupeAndMergeMessages(
  ...batches: ArchiveMessage[][]
): ArchiveMessage[] {
  const result: ArchiveMessage[] = [];
  const byTs = new Map<string, number[]>();
  const byRawTs = new Map<string, number>();
  const byClientMsgId = new Map<string, number>();
  const byBucket = new Map<number, number[]>();

  const registerIndex = (msg: ArchiveMessage, idx: number) => {
    const tsKeys = new Set<string>([msg.ts]);
    if (msg.rawTs) tsKeys.add(msg.rawTs);
    if (msg.aliasTs) {
      for (const a of msg.aliasTs) tsKeys.add(a);
    }
    for (const k of tsKeys) {
      const list = byTs.get(k);
      if (!list) byTs.set(k, [idx]);
      else if (!list.includes(idx)) list.push(idx);
    }
    if (msg.rawTs) byRawTs.set(msg.rawTs, idx);
    if (msg.clientMsgId) {
      byClientMsgId.set(
        `${msg.clientMsgId}:${normalizeUserKey(msg.user)}`,
        idx
      );
    }
    const num = Number(msg.rawTs || msg.ts);
    const bucket = Number.isFinite(num) ? Math.floor(num * 1000) : 0;
    const bList = byBucket.get(bucket);
    if (!bList) byBucket.set(bucket, [idx]);
    else if (!bList.includes(idx)) bList.push(idx);
  };

  for (const batch of batches) {
    for (const rawMsg of batch) {
      const msg: ArchiveMessage =
        rawMsg.replies.length > 1
          ? { ...rawMsg, replies: dedupeReplies(rawMsg.replies) }
          : rawMsg;

      let matchIdx: number | undefined;

      if (msg.rawTs !== undefined) {
        const hit = byRawTs.get(msg.rawTs);
        if (hit !== undefined && areMessagesDuplicate(result[hit], msg)) {
          matchIdx = hit;
        }
      }

      if (matchIdx === undefined && msg.clientMsgId) {
        const hit = byClientMsgId.get(
          `${msg.clientMsgId}:${normalizeUserKey(msg.user)}`
        );
        if (hit !== undefined && areMessagesDuplicate(result[hit], msg)) {
          matchIdx = hit;
        }
      }

      if (matchIdx === undefined) {
        const tsHits = byTs.get(msg.ts);
        if (tsHits) {
          for (const hit of tsHits) {
            if (areMessagesDuplicate(result[hit], msg)) {
              matchIdx = hit;
              break;
            }
          }
        }
      }

      if (matchIdx === undefined) {
        const num = Number(msg.rawTs || msg.ts);
        const bucket = Number.isFinite(num) ? Math.floor(num * 1000) : 0;
        for (const bKey of [bucket - 1, bucket, bucket + 1]) {
          const candidates = byBucket.get(bKey);
          if (!candidates) continue;
          for (const idx of candidates) {
            if (areMessagesDuplicate(result[idx], msg)) {
              matchIdx = idx;
              break;
            }
          }
          if (matchIdx !== undefined) break;
        }
      }

      if (matchIdx !== undefined) {
        const merged = mergeTwoMessages(result[matchIdx], msg);
        result[matchIdx] = merged;
        registerIndex(merged, matchIdx);
      } else {
        const idx = result.length;
        result.push(msg);
        registerIndex(msg, idx);
      }
    }
  }

  return result.sort((a, b) => {
    const diff = Number(a.ts) - Number(b.ts);
    if (diff !== 0) return diff;
    return (a.rawTs || a.ts).localeCompare(b.rawTs || b.ts);
  });
}

export function messageMatchesTs(
  msg: ArchiveMessage,
  targetTs?: string
): boolean {
  if (!targetTs) return false;
  if (msg.ts === targetTs || msg.rawTs === targetTs) return true;
  if (msg.aliasTs?.includes(targetTs)) return true;
  return false;
}

export function messageOrReplyMatchesTs(
  msg: ArchiveMessage,
  targetTs?: string
): boolean {
  if (!targetTs) return false;
  if (messageMatchesTs(msg, targetTs)) return true;
  return msg.replies.some(
    (r) =>
      r.ts === targetTs ||
      r.rawTs === targetTs ||
      Boolean(r.aliasTs?.includes(targetTs))
  );
}

export function resolveCanonicalMessageTs(
  messages: ArchiveMessage[],
  targetTs?: string
): string | undefined {
  if (!targetTs) return undefined;
  const hit = messages.find((m) => messageMatchesTs(m, targetTs));
  return hit?.ts ?? targetTs;
}

export function dedupeSearchResults(
  results: SearchResultItem[]
): SearchResultItem[] {
  const deduped: SearchResultItem[] = [];
  for (const item of results) {
    const existingIdx = deduped.findIndex(
      (existing) =>
        existing.channelId === item.channelId &&
        areMessagesDuplicate(existing.message, item.message)
    );
    if (existingIdx === -1) {
      deduped.push(item);
    } else {
      const mergedMsg = mergeTwoMessages(
        deduped[existingIdx].message,
        item.message
      );
      deduped[existingIdx] = {
        ...deduped[existingIdx],
        ts: mergedMsg.ts,
        message: mergedMsg,
      };
    }
  }
  return deduped;
}

