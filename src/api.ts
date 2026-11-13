import type {
  ArchiveStats,
  ChannelDetailResponse,
  ChannelSummary,
  SearchResponse,
} from './types';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      (errBody as { error?: string }).error || `Request failed (${res.status})`
    );
  }
  return (await res.json()) as T;
}

export function fetchStats(): Promise<ArchiveStats> {
  return fetchJson<ArchiveStats>('/api/stats');
}

export async function fetchChannels(): Promise<ChannelSummary[]> {
  const data = await fetchJson<{ channels: ChannelSummary[] }>('/api/channels');
  return data.channels;
}

export function fetchChannelMessages(
  channelId: string,
  month?: string
): Promise<ChannelDetailResponse> {
  const path = month
    ? `/api/channel/${encodeURIComponent(channelId)}/${encodeURIComponent(month)}`
    : `/api/channel/${encodeURIComponent(channelId)}`;
  return fetchJson<ChannelDetailResponse>(path);
}

export function searchArchive(query: string): Promise<SearchResponse> {
  return fetchJson<SearchResponse>(
    `/api/search?q=${encodeURIComponent(query)}`
  );
}
