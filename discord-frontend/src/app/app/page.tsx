"use client";

import { useCallback, useState } from "react";
import ServerSidebar from "@/components/ServerSidebar";
import ChannelSidebar from "@/components/ChannelSidebar";
import DmSidebar from "@/components/DmSidebar";
import ChatArea from "@/components/ChatArea";
import type { ChannelItem, ServerItem } from "@/types/chat";

export default function AppHome() {
  const [viewMode, setViewMode] = useState<"dms" | "server">("server");
  const [selectedServer, setSelectedServer] = useState<ServerItem | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(
    null
  );
  const [channelsReady, setChannelsReady] = useState(false);
  const [channelsEmpty, setChannelsEmpty] = useState(false);
  const [dmRefreshKey, setDmRefreshKey] = useState(0);

  const handleMessagesHome = useCallback(() => {
    setViewMode("dms");
    setSelectedServer(null);
    setSelectedChannel(null);
    setChannelsReady(false);
    setChannelsEmpty(false);
    setDmRefreshKey((k) => k + 1);
  }, []);

  const handleServerSelect = useCallback((server: ServerItem) => {
    setViewMode("server");
    setSelectedServer(server);
    setSelectedChannel(null);
    setChannelsReady(false);
    setChannelsEmpty(false);
  }, []);

  const handleChannelSelect = useCallback((channel: ChannelItem) => {
    setSelectedChannel(channel);
  }, []);

  const handleDmSelect = useCallback((channel: ChannelItem) => {
    setViewMode("dms");
    setSelectedServer(null);
    setSelectedChannel(channel);
  }, []);

  const handleOpenDm = useCallback(
    (channel: ChannelItem) => {
      setViewMode("dms");
      setSelectedServer(null);
      setSelectedChannel(channel);
      setDmRefreshKey((k) => k + 1);
    },
    []
  );

  const handleChannelsLoaded = useCallback((channels: ChannelItem[]) => {
    setChannelsReady(true);
    setChannelsEmpty(channels.length === 0);

    if (channels.length === 0) {
      setSelectedChannel(null);
      return;
    }

    setSelectedChannel((prev) => {
      if (prev?.type === "DM") return prev;
      const stillSelected = prev
        ? channels.find((c) => c.id === prev.id)
        : undefined;
      return stillSelected ?? channels[0];
    });
  }, []);

  const isDmMode = viewMode === "dms";

  return (
    <main className="flex h-screen overflow-hidden bg-background text-on-surface">
      <ServerSidebar
        currentServerId={selectedServer?.id ?? null}
        messagesActive={isDmMode}
        onMessagesHome={handleMessagesHome}
        onServerSelect={handleServerSelect}
      />
      {isDmMode ? (
        <DmSidebar
          selectedChannelId={selectedChannel?.id ?? null}
          onDmSelect={(channel) => handleDmSelect(channel)}
          refreshKey={dmRefreshKey}
        />
      ) : (
        <ChannelSidebar
          selectedServer={selectedServer}
          selectedChannelId={selectedChannel?.id ?? null}
          onChannelSelect={handleChannelSelect}
          onChannelsLoaded={handleChannelsLoaded}
        />
      )}
      <ChatArea
        selectedChannel={selectedChannel}
        hasServer={!isDmMode && !!selectedServer}
        channelsReady={isDmMode ? true : channelsReady}
        channelsEmpty={isDmMode ? false : channelsEmpty}
        isDmMode={isDmMode}
        onOpenDm={handleOpenDm}
        onDmAccepted={() => setDmRefreshKey((k) => k + 1)}
      />
    </main>
  );
}
