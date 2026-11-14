export interface ArchiveStats {
  users: number;
  channels: number;
  messages: number;
}

export interface ChannelSummary {
  id: string;
  name: string;
  topicHtml: string;
  topicText: string;
  descriptionHtml: string;
  descriptionText: string;
  createdAt: number;
  createdLabel: string;
  messageCount: number;
  memberCount: number;
  lastPostedAt: number | null;
  lastPostedLabel: string;
  lastSyncedLabel: string;
  isGeneral: boolean;
  isArchived: boolean;
  previousNames: string[];
}

export interface MonthEntry {
  month: string; // YYYY-MM
  count: number;
}

export interface YearEntry {
  year: string;
  months: MonthEntry[];
}

export interface SlackUserProfile {
  id: string;
  name: string;
  displayName: string;
  realName: string;
  avatar: string;
  title?: string;
  isBot?: boolean;
  deleted?: boolean;
  color?: string;
}

export interface MessageFile {
  id?: string;
  title: string;
  name?: string;
  mimetype?: string;
  filetype?: string;
  size?: number;
  thumbUrl: string;
  fullUrl?: string;
  isImage: boolean;
}

export interface MessageAttachment {
  isMsgUnfurl: boolean;
  authorName?: string;
  authorIcon?: string;
  textHtml?: string;
  channelId?: string;
  channelName?: string;
  ts?: string;
  href?: string;
  serviceName?: string;
  serviceIcon?: string;
  title?: string;
  titleLink?: string;
  text?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  fromUrl?: string;
}

export interface MessageReaction {
  name: string;
  emojiHtml: string;
  count: number;
  users: string[];
  userNames?: string[];
}

export interface ThreadReply {
  ts: string;
  rawTs?: string;
  clientMsgId?: string;
  eventTs?: string;
  aliasTs?: string[];
  timeLabel: string;
  user: SlackUserProfile;
  contentsHtml: string;
  text: string;
  blocks?: unknown[];
}

export interface ArchiveMessage {
  ts: string;
  rawTs?: string;
  clientMsgId?: string;
  eventTs?: string;
  aliasTs?: string[];
  date: string; // YYYY-MM-DD
  timeLabel: string;
  user: SlackUserProfile;
  text: string;
  contentsHtml: string;
  blocks?: unknown[];
  subtype?: string;
  isThreadReply: boolean;
  isThreadBroadcast: boolean;
  threadTs?: string;
  threadRoot?: {
    href: string;
    label: string;
    month?: string;
    ts?: string;
  };
  files: MessageFile[];
  attachments: MessageAttachment[];
  reactions: MessageReaction[];
  replies: ThreadReply[];
  edited?: boolean;
}

export interface ChannelDetailResponse {
  channelId: string;
  channelName: string;
  activeMonth: string;
  years: YearEntry[];
  previousMonth: string | null;
  nextMonth: string | null;
  messages: ArchiveMessage[];
}

export interface SearchResultItem {
  channelId: string;
  channelName: string;
  month: string;
  ts: string;
  dateLabel: string;
  message: ArchiveMessage;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
}
