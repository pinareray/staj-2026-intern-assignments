"use client";

import { useCallback, useState } from "react";
import ServerSidebar from "@/components/ServerSidebar";
import ChannelSidebar from "@/components/ChannelSidebar";
import ChatArea from "@/components/ChatArea";
import type { ChannelItem, ServerItem } from "@/types/chat";

export default function Home() {
  const [selectedServer, setSelectedServer] = useState<ServerItem | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(null);
  const [channelsReady, setChannelsReady] = useState(false);
  const [channelsEmpty, setChannelsEmpty] = useState(false);

  const handleServerSelect = useCallback((server: ServerItem) => {
    setSelectedServer(server);
    setSelectedChannel(null);
    setChannelsReady(false);
    setChannelsEmpty(false);
  }, []);

  const handleChannelSelect = useCallback((channel: ChannelItem) => {
    setSelectedChannel(channel);
  }, []);

  const handleChannelsLoaded = useCallback(
    (channels: ChannelItem[]) => {
      setChannelsReady(true);
      setChannelsEmpty(channels.length === 0);

      if (channels.length === 0) {
        setSelectedChannel(null);
        return;
      }

      setSelectedChannel((prev) => {
        const stillSelected = prev
          ? channels.find((c) => c.id === prev.id)
          : undefined;
        return stillSelected ?? channels[0];
      });
    },
    []
  );

  return (
    <main className="flex h-screen overflow-hidden bg-background text-on-surface">
      <ServerSidebar
        currentServerId={selectedServer?.id ?? null}
        onServerSelect={handleServerSelect}
      />
      <ChannelSidebar
        selectedServer={selectedServer}
        selectedChannelId={selectedChannel?.id ?? null}
        onChannelSelect={handleChannelSelect}
        onChannelsLoaded={handleChannelsLoaded}
      />
      <ChatArea
        selectedChannel={selectedChannel}
        hasServer={!!selectedServer}
        channelsReady={channelsReady}
        channelsEmpty={channelsEmpty}
      />
    </main>
  );
}
