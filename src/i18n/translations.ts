import type { Locale } from '../utils/storage';
import type { AppThemeId } from '../utils/themes';

export interface Translations {
  langLabel: string;
  langShort: string;
  switchLangTitle: string;
  appTitle: string;
  topBar: {
    subtitle: string;
    jumpOrSearchShort: string;
    jumpOrSearchLong: string;
    archiveLink: string;
    archiveLinkTitle: string;
    githubTitle: string;
  };
  sidebar: {
    closeSidebar: string;
    stats: (msgs: string, chs: number) => string;
    channelDirectory: string;
    jumpTo: string;
    searchMessages: string;
    filterPlaceholder: string;
    starred: string;
    recent: string;
    popularChannels: string;
    matchingChannels: string;
    browseAll: (count: number) => string;
    themeBtn: string;
    langBtn: string;
    repo: string;
    archive: string;
  };
  channelHeader: {
    openSidebar: string;
    directoryTitle: string;
    unstarChannel: string;
    starChannel: string;
    jumpOrSearch: string;
    channelDetails: string;
    detailsShort: string;
    previousMonth: string;
    nextMonth: string;
    latest: string;
    oldestMonth: string;
    latestMonth: string;
    messagesCount: (count: string) => string;
    membersCount: (count: string) => string;
  };
  channelDirectory: {
    title: string;
    summary: (channels: string, messages: string, users: string) => string;
    searchPlaceholder: string;
    sortMembers: string;
    sortMessages: string;
    sortRecent: string;
    sortName: string;
    archived: string;
    lastPost: (date: string) => string;
    noMatches: (query: string) => string;
  };
  channelInfo: {
    title: string;
    closeInfo: string;
    topic: string;
    noTopic: string;
    description: string;
    noDescription: string;
    archiveMetadata: string;
    members: string;
    archivedMessages: string;
    created: string;
    lastPosted: string;
    lastSynced: string;
    channelId: string;
    previouslyNamed: string;
    openOriginalArchive: string;
    channelRssFeed: string;
  };
  messageList: {
    showing: string;
    messagesUnit: string;
    msgsShort: string;
    inRange: (range: string) => string;
    toggleOrderTitle: string;
    oldestShort: string;
    latestShort: string;
    oldestToLatest: string;
    latestToOldest: string;
    scrollToLatestTitle: string;
    latestJumpBtn: string;
    threadRepliesTooltip: string;
    hidingReplies: (count: number) => string;
    plusReplies: (count: number) => string;
    filterMessagesLabel: string;
    filterPlaceholder: string;
    loadingMonth: (month: string) => string;
    loadEarlierMonth: (month: string) => string;
    loadNewerMonth: (month: string) => string;
    beginningHistory: string;
    latestMessages: string;
    endHistoryLatest: string;
    noMessagesTitle: string;
    noMessagesHint: string;
  };
  messageItem: {
    viewThread: string;
    thread: string;
    inspect: string;
    copyPermalink: string;
    viewUpstream: string;
    edited: string;
    threadReplyBadge: string;
    repliedToThread: string;
    postedIn: (channelName: string) => string;
    forwardedMessage: string;
    replyCount: (count: number) => string;
    lastReply: (time: string) => string;
  };
  channelJoin: {
    joinedSingle: (userName: string, channelName: string) => {
      before: string;
      user: string;
      middle: string;
      channel: string;
      after: string;
    };
    joinedCollapsed: (
      leadUser: string,
      othersCount: number,
      channelName: string
    ) => {
      before: string;
      user: string;
      middle: string;
      others: string;
      toChannel: string;
      channel: string;
      after: string;
    };
    showAll: (count: number) => string;
    collapse: string;
  };
  threadPanel: {
    title: string;
    backToChannel: string;
    closeThread: string;
    replyCount: (count: number) => string;
    noReplies: string;
  };
  commandPalette: {
    quickSwitcherTab: string;
    searchMessagesTab: string;
    jumpPlaceholder: string;
    searchPlaceholder: string;
    quickJumpLabel: string;
    openDirectoryAction: string;
    openDirectorySub: string;
    searchArchiveAction: (query: string) => string;
    searchArchiveActionEmpty: string;
    searchArchiveSub: string;
    switchLangAction: string;
    switchLangSub: string;
    channelsHeading: (count: number) => string;
    noChannelsMatch: string;
    starredBadge: string;
    recentBadge: string;
    currentBadge: string;
    searchBtn: string;
    searchingBtn: string;
    searchingStatus: string;
    searchFailed: string;
    noResults: (query: string) => string;
    searchHintTitle: string;
    searchHintSub: string;
    allChannelsFilter: (count: number) => string;
    navigateHint: string;
    openHint: string;
    searchJumpHint: string;
    closeHint: string;
    shortcutHint: string;
  };
  themes: {
    title: string;
    themeLabel: (name: string) => string;
    items: Record<AppThemeId, { name: string; subtitle: string }>;
  };
  lightbox: {
    openOriginal: string;
    closePreview: string;
  };
  app: {
    loadingMessages: string;
    loading: string;
    failedLoadChannel: string;
    retry: string;
  };
}

export const zhTW: Translations = {
  langLabel: '繁體中文',
  langShort: '繁中',
  switchLangTitle: '切換語言 (繁體中文 / English)',
  appTitle: 'g0v.tw | Slack 對話紀錄',
  topBar: {
    subtitle: 'Slack 對話紀錄',
    jumpOrSearchShort: '跳轉或搜尋…',
    jumpOrSearchLong: '跳轉至頻道或搜尋 g0v.tw 對話紀錄…',
    archiveLink: '原始封存站',
    archiveLinkTitle: 'g0v-slack-archive',
    githubTitle: 'GitHub 專案原始碼',
  },
  sidebar: {
    closeSidebar: '關閉側邊欄',
    stats: (msgs, chs) => `${msgs} 則訊息 · ${chs} 個頻道`,
    channelDirectory: '頻道目錄',
    jumpTo: '快速跳轉…',
    searchMessages: '搜尋訊息',
    filterPlaceholder: '篩選側邊欄頻道…',
    starred: '已加星號',
    recent: '最近瀏覽',
    popularChannels: '熱門頻道',
    matchingChannels: '符合的頻道',
    browseAll: (count) => `瀏覽全部 ${count} 個頻道…`,
    themeBtn: '主題',
    langBtn: 'EN',
    repo: '原始碼',
    archive: '封存站',
  },
  channelHeader: {
    openSidebar: '開啟側邊欄',
    directoryTitle: '頻道目錄',
    unstarChannel: '取消星號',
    starChannel: '加入星號',
    jumpOrSearch: '跳轉頻道或搜尋',
    channelDetails: '頻道資訊',
    detailsShort: '詳情',
    previousMonth: '上個月',
    nextMonth: '下個月',
    latest: '最新',
    oldestMonth: '最早月份',
    latestMonth: '最新月份',
    messagesCount: (count) => `${count} 則訊息`,
    membersCount: (count) => `${count} 位成員`,
  },
  channelDirectory: {
    title: '頻道目錄',
    summary: (channels, messages, users) =>
      `${channels} 個公開頻道 · ${messages} 則封存訊息 · ${users} 位成員`,
    searchPlaceholder: '搜尋頻道名稱、主題…',
    sortMembers: '最多成員',
    sortMessages: '最多訊息',
    sortRecent: '近期活躍',
    sortName: '名稱 (A–Z)',
    archived: '已封存',
    lastPost: (date) => `最後發言 ${date}`,
    noMatches: (query) => `找不到符合「${query}」的頻道。`,
  },
  channelInfo: {
    title: '頻道資訊',
    closeInfo: '關閉頻道資訊',
    topic: '主題',
    noTopic: '尚未設定主題',
    description: '頻道說明',
    noDescription: '尚未提供說明',
    archiveMetadata: '封存資訊',
    members: '成員數',
    archivedMessages: '封存訊息數',
    created: '建立時間',
    lastPosted: '最後發言',
    lastSynced: '最後同步',
    channelId: '頻道 ID',
    previouslyNamed: '曾用名稱',
    openOriginalArchive: '在原始封存站開啟',
    channelRssFeed: '頻道 RSS 訂閱',
  },
  messageList: {
    showing: '顯示 ',
    messagesUnit: '則訊息',
    msgsShort: '則',
    inRange: (range) => `於 ${range}`,
    toggleOrderTitle: '切換時間排序',
    oldestShort: '最舊',
    latestShort: '最新',
    oldestToLatest: '由舊到新',
    latestToOldest: '由新到舊',
    scrollToLatestTitle: '捲動至最新已載入訊息',
    latestJumpBtn: '最新',
    threadRepliesTooltip:
      '討論串回覆預設折疊於原訊息下方；點此切換顯示原訊息位於較早月份的回覆',
    hidingReplies: (count) => `隱藏 ${count} 則討論串回覆`,
    plusReplies: (count) => `+${count} 則討論串回覆`,
    filterMessagesLabel: '篩選訊息',
    filterPlaceholder: '篩選已載入的訊息…',
    loadingMonth: (month) => `載入 ${month} 中…`,
    loadEarlierMonth: (month) => `載入較早月份 (${month})`,
    loadNewerMonth: (month) => `載入較新月份 (${month})`,
    beginningHistory: '已顯示最早的頻道紀錄',
    latestMessages: '已顯示最新的封存訊息',
    endHistoryLatest: '已顯示至最新封存紀錄',
    noMessagesTitle: '沒有符合條件的訊息',
    noMessagesHint: '請嘗試清除篩選條件或切換其他月份。',
  },
  messageItem: {
    viewThread: '檢視討論串',
    thread: '討論串',
    inspect: '詳情',
    copyPermalink: '複製永久連結',
    viewUpstream: '在 g0v-slack-archive 開啟',
    edited: '(已編輯)',
    threadReplyBadge: '討論串回覆',
    repliedToThread: '回覆了一則討論串：',
    postedIn: (channelName) => `發佈於 #${channelName}`,
    forwardedMessage: '轉寄的訊息',
    replyCount: (count) => `${count} 則回覆`,
    lastReply: (time) => `最後回覆 ${time}`,
  },
  channelJoin: {
    joinedSingle: (userName, channelName) => ({
      before: '',
      user: userName,
      middle: ' 加入了 ',
      channel: `#${channelName}`,
      after: '',
    }),
    joinedCollapsed: (leadUser, othersCount, channelName) => ({
      before: '',
      user: leadUser,
      middle: ' 與其他 ',
      others: `${othersCount} 人`,
      toChannel: '加入了 ',
      channel: `#${channelName}`,
      after: '',
    }),
    showAll: (count) => `顯示全部 ${count} 人`,
    collapse: '收合',
  },
  threadPanel: {
    title: '討論串',
    backToChannel: '返回頻道',
    closeThread: '關閉討論串',
    replyCount: (count) => `${count} 則回覆`,
    noReplies: '此討論串目前沒有回覆。',
  },
  commandPalette: {
    quickSwitcherTab: '快速切換',
    searchMessagesTab: '搜尋訊息',
    jumpPlaceholder: '跳轉頻道（輸入頻道名稱或關鍵字）…',
    searchPlaceholder: '搜尋全部封存訊息（按 Enter 送出）…',
    quickJumpLabel: '快速動作',
    openDirectoryAction: '開啟頻道目錄',
    openDirectorySub: '依成員數與訊息數瀏覽所有公開頻道',
    searchArchiveAction: (query) => `搜尋封存訊息：「${query}」`,
    searchArchiveActionEmpty: '搜尋全部封存訊息',
    searchArchiveSub: '全文搜尋所有頻道的歷史對話',
    switchLangAction: 'Switch to English',
    switchLangSub: '切換介面語言為英文 (English)',
    channelsHeading: (count) => `頻道 (${count})`,
    noChannelsMatch: '找不到符合的頻道。',
    starredBadge: '已加星號',
    recentBadge: '最近',
    currentBadge: '目前',
    searchBtn: '搜尋',
    searchingBtn: '搜尋中…',
    searchingStatus: '正在搜尋 g0v-slack-archive…',
    searchFailed: '搜尋失敗',
    noResults: (query) => `找不到包含「${query}」的訊息。`,
    searchHintTitle: '全文搜尋所有 g0v.tw 公開頻道',
    searchHintSub: '請輸入關鍵字並按 Enter 開始搜尋。',
    allChannelsFilter: (count) => `全部 (${count})`,
    navigateHint: '選擇',
    openHint: '開啟',
    searchJumpHint: '搜尋 / 跳轉',
    closeHint: '關閉',
    shortcutHint: '快捷鍵：',
  },
  themes: {
    title: 'g0v 佈景主題',
    themeLabel: (name) => `佈景主題：${name}`,
    items: {
      'g0v-light': {
        name: 'g0v 公民白',
        subtitle: '碳黑字體與 g0v 零時紅',
      },
      'g0v-dark': {
        name: 'g0v 暗夜黑',
        subtitle: '黑曜石深色駭客模式',
      },
      'g0v-jothon': {
        name: 'g0v 揪松綠',
        subtitle: '年會深青與溫潤紙感',
      },
      'slack-classic': {
        name: 'Slack 經典紫',
        subtitle: '傳統茄紫側邊欄與藍調',
      },
    },
  },
  lightbox: {
    openOriginal: '開啟原圖',
    closePreview: '關閉預覽',
  },
  app: {
    loadingMessages: '載入封存訊息中…',
    loading: '載入中…',
    failedLoadChannel: '無法載入頻道',
    retry: '重試',
  },
};

export const en: Translations = {
  langLabel: 'English',
  langShort: 'EN',
  switchLangTitle: 'Switch language (繁體中文 / English)',
  appTitle: 'g0v.tw | Slack Archive Viewer',
  topBar: {
    subtitle: 'Slack Archive',
    jumpOrSearchShort: 'Jump or search…',
    jumpOrSearchLong: 'Jump to channel or search g0v.tw...',
    archiveLink: 'Archive',
    archiveLinkTitle: 'g0v-slack-archive',
    githubTitle: 'GitHub Repository',
  },
  sidebar: {
    closeSidebar: 'Close sidebar',
    stats: (msgs, chs) => `${msgs} msgs · ${chs} ch`,
    channelDirectory: 'Channel Directory',
    jumpTo: 'Jump to…',
    searchMessages: 'Search Messages',
    filterPlaceholder: 'Filter sidebar channels...',
    starred: 'Starred',
    recent: 'Recent',
    popularChannels: 'Popular Channels',
    matchingChannels: 'Matching Channels',
    browseAll: (count) => `Browse all ${count} channels…`,
    themeBtn: 'Theme',
    langBtn: '繁中',
    repo: 'Repo',
    archive: 'Archive',
  },
  channelHeader: {
    openSidebar: 'Open sidebar',
    directoryTitle: 'Channel Directory',
    unstarChannel: 'Unstar channel',
    starChannel: 'Star channel',
    jumpOrSearch: 'Jump to channel or search',
    channelDetails: 'Channel details',
    detailsShort: 'Details',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    latest: 'Latest',
    oldestMonth: 'Oldest month',
    latestMonth: 'Latest month',
    messagesCount: (count) => `${count} messages`,
    membersCount: (count) => `${count} members`,
  },
  channelDirectory: {
    title: 'Channel Directory',
    summary: (channels, messages, users) =>
      `${channels} public channels · ${messages} archived messages · ${users} users`,
    searchPlaceholder: 'Search channels, topics...',
    sortMembers: 'Most Members',
    sortMessages: 'Most Messages',
    sortRecent: 'Recently Active',
    sortName: 'Name (A–Z)',
    archived: 'Archived',
    lastPost: (date) => `Last post ${date}`,
    noMatches: (query) => `No channels matched "${query}".`,
  },
  channelInfo: {
    title: 'Channel Info',
    closeInfo: 'Close channel info',
    topic: 'Topic',
    noTopic: 'No topic set',
    description: 'Description',
    noDescription: 'No description provided',
    archiveMetadata: 'Archive Metadata',
    members: 'Members',
    archivedMessages: 'Archived Messages',
    created: 'Created',
    lastPosted: 'Last Posted',
    lastSynced: 'Last Synced',
    channelId: 'Channel ID',
    previouslyNamed: 'Previously named',
    openOriginalArchive: 'Open Original Archive Page',
    channelRssFeed: 'Channel RSS Feed',
  },
  messageList: {
    showing: 'Showing ',
    messagesUnit: 'messages',
    msgsShort: 'msgs',
    inRange: (range) => `in ${range}`,
    toggleOrderTitle: 'Toggle chronological order',
    oldestShort: 'Oldest',
    latestShort: 'Latest',
    oldestToLatest: 'Oldest → Latest',
    latestToOldest: 'Latest → Oldest',
    scrollToLatestTitle: 'Scroll to latest loaded message',
    latestJumpBtn: 'Latest',
    threadRepliesTooltip:
      'Thread replies are grouped under their parent message; toggle to also show replies whose parent was posted in an earlier month',
    hidingReplies: (count) => `Hiding ${count} thread replies`,
    plusReplies: (count) => `+${count} thread replies`,
    filterMessagesLabel: 'Filter messages',
    filterPlaceholder: 'Filter loaded messages...',
    loadingMonth: (month) => `Loading ${month}...`,
    loadEarlierMonth: (month) => `Load earlier month (${month})`,
    loadNewerMonth: (month) => `Load newer month (${month})`,
    beginningHistory: 'Beginning of archived channel history',
    latestMessages: 'Latest archived messages',
    endHistoryLatest: 'End of archived channel history (latest)',
    noMessagesTitle: 'No messages match this view',
    noMessagesHint: 'Try clearing the filter or loading another month.',
  },
  messageItem: {
    viewThread: 'View thread',
    thread: 'Thread',
    inspect: 'Inspect',
    copyPermalink: 'Copy permalink',
    viewUpstream: 'View on g0v-slack-archive',
    edited: '(edited)',
    threadReplyBadge: 'thread reply',
    repliedToThread: 'Replied to a thread:',
    postedIn: (channelName) => `Posted in #${channelName}`,
    forwardedMessage: 'Forwarded message',
    replyCount: (count) => `${count} ${count === 1 ? 'reply' : 'replies'}`,
    lastReply: (time) => `Last reply ${time}`,
  },
  channelJoin: {
    joinedSingle: (userName, channelName) => ({
      before: '',
      user: userName,
      middle: ' joined ',
      channel: `#${channelName}`,
      after: '',
    }),
    joinedCollapsed: (leadUser, othersCount, channelName) => ({
      before: '',
      user: leadUser,
      middle: ' and ',
      others: `${othersCount} ${othersCount === 1 ? 'other' : 'others'}`,
      toChannel: ' joined ',
      channel: `#${channelName}`,
      after: '',
    }),
    showAll: (count) => `Show all ${count}`,
    collapse: 'Collapse',
  },
  threadPanel: {
    title: 'Thread',
    backToChannel: 'Back to channel',
    closeThread: 'Close thread',
    replyCount: (count) => `${count} ${count === 1 ? 'reply' : 'replies'}`,
    noReplies: 'No replies in this thread yet.',
  },
  commandPalette: {
    quickSwitcherTab: 'Quick Switcher',
    searchMessagesTab: 'Search Messages',
    jumpPlaceholder: 'Jump to a channel (type channel name or topic)...',
    searchPlaceholder: 'Search across all archived messages (press Enter)...',
    quickJumpLabel: 'Quick Jump',
    openDirectoryAction: 'Open Channel Directory',
    openDirectorySub: 'Browse all public channels sorted by members & messages',
    searchArchiveAction: (query) => `Search archive for "${query}"`,
    searchArchiveActionEmpty: 'Search all archived messages',
    searchArchiveSub: 'Full-text search across every channel',
    switchLangAction: '切換為繁體中文',
    switchLangSub: 'Switch UI language to Traditional Chinese (zh-TW)',
    channelsHeading: (count) => `Channels (${count})`,
    noChannelsMatch: 'No channels match your filter.',
    starredBadge: 'Starred',
    recentBadge: 'Recent',
    currentBadge: 'Current',
    searchBtn: 'Search',
    searchingBtn: 'Searching...',
    searchingStatus: 'Searching g0v-slack-archive...',
    searchFailed: 'Search failed',
    noResults: (query) => `No archived messages matched "${query}".`,
    searchHintTitle: 'Full-text search across all g0v.tw public channels',
    searchHintSub: 'Type a keyword and press Enter to query the archive.',
    allChannelsFilter: (count) => `All (${count})`,
    navigateHint: 'Navigate',
    openHint: 'Open',
    searchJumpHint: 'Search / Jump',
    closeHint: 'Close',
    shortcutHint: 'Shortcut:',
  },
  themes: {
    title: 'g0v Themes',
    themeLabel: (name) => `Theme: ${name}`,
    items: {
      'g0v-light': {
        name: 'g0v Civic',
        subtitle: 'Carbon ink & g0v crimson',
      },
      'g0v-dark': {
        name: 'g0v Night',
        subtitle: 'Obsidian hacker dark mode',
      },
      'g0v-jothon': {
        name: 'g0v Jothon',
        subtitle: 'Summit jade & warm paper',
      },
      'slack-classic': {
        name: 'Slack Classic',
        subtitle: 'Traditional aubergine & blue',
      },
    },
  },
  lightbox: {
    openOriginal: 'Open',
    closePreview: 'Close preview',
  },
  app: {
    loadingMessages: 'Loading archived messages...',
    loading: 'Loading...',
    failedLoadChannel: 'Failed to load channel',
    retry: 'Retry',
  },
};

export const TRANSLATIONS: Record<Locale, Translations> = {
  'zh-TW': zhTW,
  en,
};
