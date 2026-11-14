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
    hideSidebar: string;
    showSidebar: string;
    selectYear: string;
    directoryTitle: string;
    unstarChannel: string;
    starChannel: string;
    jumpOrSearch: string;
    channelDetails: string;
    detailsShort: string;
    viewMembers: string;
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
    aboutTab: string;
    membersTab: string;
    topic: string;
    noTopic: string;
    description: string;
    noDescription: string;
    archiveMetadata: string;
    members: string;
    membersCountTitle: (count: string) => string;
    participantsHint: (loaded: number, months: string) => string;
    searchMembersPlaceholder: string;
    noMembersYet: string;
    noMemberMatches: (query: string) => string;
    memberPosts: (count: number) => string;
    botBadge: string;
    jumpToLatestPost: string;
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
  langLabel: '正體中文',
  langShort: '正體中文',
  switchLangTitle: '切換語言 (正體中文 / English / 日本語)',
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
    hideSidebar: '隱藏側邊欄',
    showSidebar: '顯示側邊欄',
    selectYear: '選擇年份',
    directoryTitle: '頻道目錄',
    unstarChannel: '取消星號',
    starChannel: '加入星號',
    jumpOrSearch: '跳轉頻道或搜尋',
    channelDetails: '頻道資訊',
    detailsShort: '詳情',
    viewMembers: '查看頻道成員',
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
    aboutTab: '關於',
    membersTab: '成員',
    topic: '主題',
    noTopic: '尚未設定主題',
    description: '頻道說明',
    noDescription: '尚未提供說明',
    archiveMetadata: '封存資訊',
    members: '成員數',
    membersCountTitle: (count) => `此頻道共有 ${count} 位成員`,
    participantsHint: (loaded, months) =>
      `公開封存僅提供成員總數；以下列出已載入月份（${months}）中曾發言或互動的 ${loaded} 位成員。`,
    searchMembersPlaceholder: '搜尋成員名稱或職稱…',
    noMembersYet: '目前載入的月份尚無可顯示的發言成員。',
    noMemberMatches: (query) => `找不到符合「${query}」的成員。`,
    memberPosts: (count) => `${count} 則`,
    botBadge: '機器人',
    jumpToLatestPost: '跳至最新發言',
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
  switchLangTitle: 'Switch language (正體中文 / English / 日本語)',
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
    langBtn: '日本語',
    repo: 'Repo',
    archive: 'Archive',
  },
  channelHeader: {
    openSidebar: 'Open sidebar',
    hideSidebar: 'Hide sidebar',
    showSidebar: 'Show sidebar',
    selectYear: 'Select year',
    directoryTitle: 'Channel Directory',
    unstarChannel: 'Unstar channel',
    starChannel: 'Star channel',
    jumpOrSearch: 'Jump to channel or search',
    channelDetails: 'Channel details',
    detailsShort: 'Details',
    viewMembers: 'View channel members',
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
    aboutTab: 'About',
    membersTab: 'Members',
    topic: 'Topic',
    noTopic: 'No topic set',
    description: 'Description',
    noDescription: 'No description provided',
    archiveMetadata: 'Archive Metadata',
    members: 'Members',
    membersCountTitle: (count) => `${count} members in channel`,
    participantsHint: (loaded, months) =>
      `The public archive only publishes total member count; showing ${loaded} active participants from loaded months (${months}).`,
    searchMembersPlaceholder: 'Search members by name or title...',
    noMembersYet: 'No message authors found in the loaded months.',
    noMemberMatches: (query) => `No members matched "${query}".`,
    memberPosts: (count) => `${count} ${count === 1 ? 'post' : 'posts'}`,
    botBadge: 'BOT',
    jumpToLatestPost: 'Jump to latest message',
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
    switchLangAction: '切換為正體中文',
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

export const ja: Translations = {
  langLabel: '日本語',
  langShort: '日本語',
  switchLangTitle: '言語を切り替え (正體中文 / English / 日本語)',
  appTitle: 'g0v.tw | Slack ログアーカイブ',
  topBar: {
    subtitle: 'Slack ログ',
    jumpOrSearchShort: '移動・検索…',
    jumpOrSearchLong: 'チャンネルへ移動または g0v.tw ログを検索…',
    archiveLink: 'アーカイブ元',
    archiveLinkTitle: 'g0v-slack-archive',
    githubTitle: 'GitHub リポジトリ',
  },
  sidebar: {
    closeSidebar: 'サイドバーを閉じる',
    stats: (msgs, chs) => `${msgs} 件の投稿 · ${chs} チャンネル`,
    channelDirectory: 'チャンネル一覧',
    jumpTo: 'クイック移動…',
    searchMessages: 'メッセージ検索',
    filterPlaceholder: 'チャンネルを絞り込み…',
    starred: 'スター付き',
    recent: '最近見たチャンネル',
    popularChannels: '人気チャンネル',
    matchingChannels: '一致するチャンネル',
    browseAll: (count) => `全 ${count} チャンネルを表示…`,
    themeBtn: 'テーマ',
    langBtn: '正體中文',
    repo: 'コード',
    archive: 'アーカイブ元',
  },
  channelHeader: {
    openSidebar: 'サイドバーを開く',
    hideSidebar: 'サイドバーを非表示',
    showSidebar: 'サイドバーを表示',
    selectYear: '年を選択',
    directoryTitle: 'チャンネル一覧',
    unstarChannel: 'スターを外す',
    starChannel: 'スターを付ける',
    jumpOrSearch: 'チャンネル移動または検索',
    channelDetails: 'チャンネル詳細',
    detailsShort: '詳細',
    viewMembers: 'チャンネルメンバーを表示',
    previousMonth: '前の月',
    nextMonth: '次の月',
    latest: '最新',
    oldestMonth: '最初の月',
    latestMonth: '最新の月',
    messagesCount: (count) => `${count} 件のメッセージ`,
    membersCount: (count) => `${count} 人のメンバー`,
  },
  channelDirectory: {
    title: 'チャンネル一覧',
    summary: (channels, messages, users) =>
      `${channels} パブリックチャンネル · ${messages} 件のメッセージ · ${users} ユーザー`,
    searchPlaceholder: 'チャンネル名やトピックを検索…',
    sortMembers: 'メンバー数順',
    sortMessages: '投稿数順',
    sortRecent: '最近の投稿順',
    sortName: '名前順 (A–Z)',
    archived: 'アーカイブ済み',
    lastPost: (date) => `最終投稿 ${date}`,
    noMatches: (query) => `「${query}」に一致するチャンネルは見つかりませんでした。`,
  },
  channelInfo: {
    title: 'チャンネル情報',
    closeInfo: 'チャンネル情報を閉じる',
    aboutTab: '概要',
    membersTab: 'メンバー',
    topic: 'トピック',
    noTopic: 'トピックは設定されていません',
    description: '説明',
    noDescription: '説明はありません',
    archiveMetadata: 'アーカイブ情報',
    members: 'メンバー数',
    membersCountTitle: (count) => `チャンネルメンバー ${count} 人`,
    participantsHint: (loaded, months) =>
      `公開アーカイブではメンバー総数のみ提供されています。読み込み済みの月（${months}）で投稿した ${loaded} 人のメンバーを表示しています。`,
    searchMembersPlaceholder: 'メンバー名や肩書で検索…',
    noMembersYet: '読み込まれた月には投稿メンバーがいません。',
    noMemberMatches: (query) => `「${query}」に一致するメンバーは見つかりませんでした。`,
    memberPosts: (count) => `${count} 件`,
    botBadge: 'BOT',
    jumpToLatestPost: '最新の投稿へ移動',
    archivedMessages: 'アーカイブ投稿数',
    created: '作成日時',
    lastPosted: '最終投稿',
    lastSynced: '最終同期',
    channelId: 'チャンネル ID',
    previouslyNamed: '以前のチャンネル名',
    openOriginalArchive: '元のアーカイブページを開く',
    channelRssFeed: 'チャンネル RSS フィード',
  },
  messageList: {
    showing: '',
    messagesUnit: '件のメッセージを表示',
    msgsShort: '件',
    inRange: (range) => `（${range}）`,
    toggleOrderTitle: '並び順を切り替え',
    oldestShort: '古い順',
    latestShort: '新しい順',
    oldestToLatest: '古い順',
    latestToOldest: '新しい順',
    scrollToLatestTitle: '読み込み済みの最新メッセージへ移動',
    latestJumpBtn: '最新へ',
    threadRepliesTooltip:
      'スレッドの返信は親メッセージの下に折りたたまれます。クリックして別の月の親メッセージへの返信を表示切替します',
    hidingReplies: (count) => `${count} 件のスレッド返信を非表示中`,
    plusReplies: (count) => `+${count} 件のスレッド返信`,
    filterMessagesLabel: 'メッセージを絞り込み',
    filterPlaceholder: '読み込み済みメッセージを絞り込み…',
    loadingMonth: (month) => `${month} を読み込み中…`,
    loadEarlierMonth: (month) => `前の月を読み込む (${month})`,
    loadNewerMonth: (month) => `次の月を読み込む (${month})`,
    beginningHistory: 'チャンネル履歴の最初です',
    latestMessages: '最新のアーカイブメッセージです',
    endHistoryLatest: '最新のアーカイブ履歴まで表示済みです',
    noMessagesTitle: '一致するメッセージがありません',
    noMessagesHint: 'フィルターをクリアするか、別の月を選択してください。',
  },
  messageItem: {
    viewThread: 'スレッドを表示',
    thread: 'スレッド',
    inspect: '詳細',
    copyPermalink: 'パーマリンクをコピー',
    viewUpstream: 'g0v-slack-archive で開く',
    edited: '(編集済み)',
    threadReplyBadge: 'スレッド返信',
    repliedToThread: 'スレッドに返信しました:',
    postedIn: (channelName) => `#${channelName} に投稿`,
    forwardedMessage: '転送されたメッセージ',
    replyCount: (count) => `${count} 件の返信`,
    lastReply: (time) => `最終返信 ${time}`,
  },
  channelJoin: {
    joinedSingle: (userName, channelName) => ({
      before: '',
      user: userName,
      middle: 'さんが ',
      channel: `#${channelName}`,
      after: ' に参加しました。',
    }),
    joinedCollapsed: (leadUser, othersCount, channelName) => ({
      before: '',
      user: leadUser,
      middle: 'さんとほか ',
      others: `${othersCount} 人`,
      toChannel: 'が ',
      channel: `#${channelName}`,
      after: ' に参加しました。',
    }),
    showAll: (count) => `すべて表示 (${count} 人)`,
    collapse: '折りたたむ',
  },
  threadPanel: {
    title: 'スレッド',
    backToChannel: 'チャンネルに戻る',
    closeThread: 'スレッドを閉じる',
    replyCount: (count) => `${count} 件の返信`,
    noReplies: 'このスレッドにはまだ返信がありません。',
  },
  commandPalette: {
    quickSwitcherTab: 'クイック切替',
    searchMessagesTab: 'メッセージ検索',
    jumpPlaceholder: 'チャンネルへ移動（名前やキーワードを入力）…',
    searchPlaceholder: '全アーカイブメッセージを検索（Enter で実行）…',
    quickJumpLabel: 'クイック操作',
    openDirectoryAction: 'チャンネル一覧を開く',
    openDirectorySub: 'メンバー数や投稿数で全パブリックチャンネルを閲覧',
    searchArchiveAction: (query) => `アーカイブから「${query}」を検索`,
    searchArchiveActionEmpty: '全アーカイブメッセージを検索',
    searchArchiveSub: '全チャンネルの履歴を全文検索',
    switchLangAction: 'Switch Language / 言語を切り替え',
    switchLangSub: '正體中文 / English / 日本語 を切り替え',
    channelsHeading: (count) => `チャンネル (${count})`,
    noChannelsMatch: '一致するチャンネルがありません。',
    starredBadge: 'スター付き',
    recentBadge: '最近',
    currentBadge: '現在',
    searchBtn: '検索',
    searchingBtn: '検索中…',
    searchingStatus: 'g0v-slack-archive を検索中…',
    searchFailed: '検索に失敗しました',
    noResults: (query) => `「${query}」に一致するメッセージはありません。`,
    searchHintTitle: 'g0v.tw の全パブリックチャンネルを全文検索',
    searchHintSub: 'キーワードを入力して Enter キーで検索を実行します。',
    allChannelsFilter: (count) => `すべて (${count})`,
    navigateHint: '移動',
    openHint: '開く',
    searchJumpHint: '検索 / 移動',
    closeHint: '閉じる',
    shortcutHint: 'ショートカット: ',
  },
  themes: {
    title: 'g0v テーマ',
    themeLabel: (name) => `テーマ: ${name}`,
    items: {
      'g0v-light': {
        name: 'g0v シビックライト',
        subtitle: '墨黒テキスト & g0v クリムゾン',
      },
      'g0v-dark': {
        name: 'g0v ナイト',
        subtitle: '黒曜石ハッカーダークモード',
      },
      'g0v-jothon': {
        name: 'g0v 揪松グリーン',
        subtitle: 'サミット深緑 & 温かみのある紙面',
      },
      'slack-classic': {
        name: 'Slack クラシック',
        subtitle: '伝統的なオーバージーン & ブルー',
      },
    },
  },
  lightbox: {
    openOriginal: '元の画像を開く',
    closePreview: 'プレビューを閉じる',
  },
  app: {
    loadingMessages: 'アーカイブメッセージを読み込み中…',
    loading: '読み込み中…',
    failedLoadChannel: 'チャンネルを読み込めませんでした',
    retry: '再試行',
  },
};

export const TRANSLATIONS: Record<Locale, Translations> = {
  'zh-TW': zhTW,
  en,
  ja,
};
