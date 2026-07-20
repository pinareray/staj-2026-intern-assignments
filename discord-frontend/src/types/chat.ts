export type ServerItem = {
  id: string;
  name: string;
  iconUrl?: string | null;
};

export type ChannelItem = {
  id: string;
  name: string;
  serverId: string | null;
  type: string;
};

export type ChatMessage = {
  id: string;
  content: string;
  userId: string;
  username: string;
  channelId: string;
  createdAt: string;
  isStarred?: boolean;
};
