"use client";

import { useCallback, useEffect, useState } from "react";
import ServerSidebar from "@/components/ServerSidebar";
import ChannelSidebar from "@/components/ChannelSidebar";
import DmSidebar from "@/components/DmSidebar";
import ChatArea from "@/components/ChatArea";
import {
  getInitialAppState,
  saveAppNavigation,
} from "@/lib/appNavigation";
import {
  loadChannelPanelOpen,
  saveChannelPanelOpen,
} from "@/lib/sidebarLayout";
import type { ChannelItem, ServerItem } from "@/models";
import { chatHub, fetchDmUnreadTotal } from "@/services";

export default function AppShell() {
  const initial = getInitialAppState();

  const [viewMode, setViewMode] = useState<"dms" | "server">(initial.viewMode);
  const [selectedServer, setSelectedServer] = useState<ServerItem | null>(
    initial.selectedServer
  );
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(
    initial.selectedChannel
  );
  const [channelsReady, setChannelsReady] = useState(false);
  const [channelsEmpty, setChannelsEmpty] = useState(false);
  const [dmRefreshKey, setDmRefreshKey] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);

  useEffect(() => {
    setSidePanelOpen(loadChannelPanelOpen());
  }, []);

  useEffect(() => {
    saveAppNavigation({
      viewMode,
      server: selectedServer
        ? {
            id: selectedServer.id,
            name: selectedServer.name,
            iconUrl: selectedServer.iconUrl ?? null,
          }
        : null,
      channel: selectedChannel
        ? {
            id: selectedChannel.id,
            name: selectedChannel.name,
            serverId: selectedChannel.serverId,
            type: selectedChannel.type,
          }
        : null,
    });
  }, [viewMode, selectedServer, selectedChannel]);

  const refreshUnread = useCallback(async () => {
    const total = await fetchDmUnreadTotal();
    setTotalUnread(total);
  }, []);

  useEffect(() => {
    void refreshUnread();
    // Sunucu görünümündeyken DM bildirimi anında gelmeli; yedek poll daha sık.
    const pollMs = viewMode === "server" ? 5000 : 30000;
    const timer = setInterval(() => void refreshUnread(), pollMs);
    return () => clearInterval(timer);
  }, [refreshUnread, dmRefreshKey, viewMode]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const unsubInbox = chatHub.subscribe("DmUnreadUpdated", () => {
      setTotalUnread((prev) => prev + 1);
      setDmRefreshKey((k) => k + 1);
      void refreshUnread();
    });

    void chatHub.connect().then(() => chatHub.joinInbox());

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshUnread();
        void chatHub.joinInbox();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      unsubInbox();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshUnread]);

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

  const handleOpenDm = useCallback((channel: ChannelItem) => {
    setViewMode("dms");
    setSelectedServer(null);
    setSelectedChannel(channel);
    setDmRefreshKey((k) => k + 1);
  }, []);

  const handleChannelsLoaded = useCallback((channels: ChannelItem[]) => {
    setChannelsReady(true);
    setChannelsEmpty(channels.length === 0);

    if (channels.length === 0) {
      setSelectedChannel(null);
      return;
    }

    setSelectedChannel((prev) => {
      if (prev?.type === "DM") return prev;

      if (prev?.id) {
        const match = channels.find((c) => c.id === prev.id);
        if (match) return match;
      }

      return channels[0] ?? null;
    });
  }, []);

  const handleIncomingMessage = useCallback(() => {
    setDmRefreshKey((k) => k + 1);
    void refreshUnread();
  }, [refreshUnread]);

  const collapseSidePanel = useCallback(() => {
    setSidePanelOpen(false);
    saveChannelPanelOpen(false);
  }, []);

  const expandSidePanel = useCallback(() => {
    setSidePanelOpen(true);
    saveChannelPanelOpen(true);
  }, []);

  const isDmMode = viewMode === "dms";

  return (
    <main className="flex h-screen overflow-hidden bg-background text-on-surface">
      <ServerSidebar
        currentServerId={selectedServer?.id ?? null}
        messagesActive={isDmMode}
        totalUnread={totalUnread}
        onMessagesHome={handleMessagesHome}
        onServerSelect={handleServerSelect}
      />
      {isDmMode ? (
        sidePanelOpen ? (
          <DmSidebar
            selectedChannelId={selectedChannel?.id ?? null}
            onDmSelect={(channel) => handleDmSelect(channel)}
            refreshKey={dmRefreshKey}
            onUnreadTotalChange={setTotalUnread}
            onCollapse={collapseSidePanel}
          />
        ) : null
      ) : sidePanelOpen ? (
        <ChannelSidebar
          selectedServer={selectedServer}
          selectedChannelId={selectedChannel?.id ?? null}
          onChannelSelect={handleChannelSelect}
          onChannelsLoaded={handleChannelsLoaded}
          onCollapse={collapseSidePanel}
        />
      ) : null}
      <ChatArea
        selectedChannel={selectedChannel}
        hasServer={!isDmMode && !!selectedServer}
        channelsReady={isDmMode ? true : channelsReady}
        channelsEmpty={isDmMode ? false : channelsEmpty}
        isDmMode={isDmMode}
        sidePanelCollapsed={!sidePanelOpen}
        onExpandSidePanel={expandSidePanel}
        onOpenDm={handleOpenDm}
        onDmAccepted={() => setDmRefreshKey((k) => k + 1)}
        onIncomingMessage={handleIncomingMessage}
      />
    </main>
  );
}
