"use client";

import { useCallback, useEffect, useState } from "react";
import ServerSidebar from "@/components/layout/ServerSidebar";
import ChannelSidebar from "@/components/layout/ChannelSidebar";
import DmSidebar from "@/components/layout/DmSidebar";
import ChatArea from "@/components/chat/ChatArea";
import FriendsList from "@/components/chat/FriendsList";
import {
  getInitialAppState,
  saveAppNavigation,
} from "@/lib/appNavigation";
import {
  loadChannelPanelOpen,
  saveChannelPanelOpen,
} from "@/lib/sidebarLayout";
import type { ChannelItem, ServerItem } from "@/models";
import { chatHub, fetchDmUnreadTotal, API_BASE_URL } from "@/services";
import type { MentionNotificationItem } from "@/components/chat/NotificationsPanel";
import {
  ensureNotificationPermission,
  setBrowserNotificationsEnabled,
  showDmBrowserNotification,
} from "@/lib/browserNotifications";

export default function AppShell() {
  const [viewMode, setViewMode] = useState<"dms" | "server" | "friends">(
    "server"
  );
  const [selectedServer, setSelectedServer] = useState<ServerItem | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelItem | null>(
    null
  );
  const [channelsReady, setChannelsReady] = useState(false);
  const [channelsEmpty, setChannelsEmpty] = useState(false);
  const [dmRefreshKey, setDmRefreshKey] = useState(0);
  const [totalUnread, setTotalUnread] = useState(0);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [serversRefreshKey, setServersRefreshKey] = useState(0);
  const [friendsInitialTab, setFriendsInitialTab] = useState<
    "incoming" | "outgoing" | "friends" | "invites"
  >("friends");
  const [navReady, setNavReady] = useState(false);
  const [focusMessageId, setFocusMessageId] = useState<string | null>(null);

  useEffect(() => {
    const initial = getInitialAppState();
    setViewMode(initial.viewMode);
    setSelectedServer(initial.selectedServer);
    setSelectedChannel(initial.selectedChannel);
    setSidePanelOpen(loadChannelPanelOpen());
    setNavReady(true);
  }, []);

  useEffect(() => {
    if (!navReady) return;
    saveAppNavigation({
      viewMode: viewMode === "friends" ? "dms" : viewMode,
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
  }, [viewMode, selectedServer, selectedChannel, navReady]);

  const refreshUnread = useCallback(async () => {
    const total = await fetchDmUnreadTotal();
    setTotalUnread(total);
  }, []);

  useEffect(() => {
    void refreshUnread();
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
      showDmBrowserNotification("Yeni mesaj", "Micodex'te yeni bir DM'in var.");
    });

    void chatHub.connect().then(() => chatHub.joinInbox());
    void ensureNotificationPermission().then((ok) => {
      if (ok) setBrowserNotificationsEnabled(true);
    });

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
    setSidePanelOpen(true);
    saveChannelPanelOpen(true);
  }, []);

  const handleOpenFriends = useCallback(
    (tab: "incoming" | "outgoing" | "friends" | "invites" = "friends") => {
      setFriendsInitialTab(tab);
      setViewMode("friends");
      setSelectedServer(null);
      setSelectedChannel(null);
      setChannelsReady(false);
      setChannelsEmpty(false);
      setSidePanelOpen(true);
      saveChannelPanelOpen(true);
    },
    []
  );

  const handleOpenMention = useCallback(
    async (item: MentionNotificationItem) => {
      setFocusMessageId(item.messageId);
      setSidePanelOpen(true);
      saveChannelPanelOpen(true);

      if (!item.serverId) {
        setViewMode("dms");
        setSelectedServer(null);
        setSelectedChannel({
          id: item.channelId,
          name: item.channelName || "DM",
          serverId: null,
          type: "DM",
        });
        setDmRefreshKey((k) => k + 1);
        return;
      }

      setViewMode("server");
      let serverName = "Sunucu";
      let iconUrl: string | null = null;
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/servers`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            const list = Array.isArray(data) ? data : [];
            const match = list.find(
              (s: Record<string, unknown>) =>
                String(s.id ?? s.Id) === item.serverId
            );
            if (match) {
              serverName = String(match.name ?? match.Name ?? serverName);
              iconUrl = (match.iconUrl ?? match.IconUrl ?? null) as string | null;
            }
          }
        } catch {
          // ignore
        }
      }

      setSelectedServer({
        id: item.serverId,
        name: serverName,
        iconUrl,
      });
      setSelectedChannel({
        id: item.channelId,
        name: item.channelName || "kanal",
        serverId: item.serverId,
        type: "Text",
      });
      setChannelsReady(false);
      setChannelsEmpty(false);
      setServersRefreshKey((k) => k + 1);
    },
    []
  );

  const handleServerSelect = useCallback((server: ServerItem) => {
    setViewMode("server");
    setSelectedServer(server);
    setSelectedChannel(null);
    setChannelsReady(false);
    setChannelsEmpty(false);
  }, []);

  const handleChannelSelect = useCallback((channel: ChannelItem) => {
    setSelectedChannel(channel);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidePanelOpen(false);
      saveChannelPanelOpen(false);
    }
  }, []);

  const handleDmSelect = useCallback((channel: ChannelItem) => {
    setViewMode("dms");
    setSelectedServer(null);
    setSelectedChannel(channel);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidePanelOpen(false);
      saveChannelPanelOpen(false);
    }
  }, []);

  const handleOpenDm = useCallback((channel: ChannelItem) => {
    setViewMode("dms");
    setSelectedServer(null);
    setSelectedChannel(channel);
    setDmRefreshKey((k) => k + 1);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidePanelOpen(false);
      saveChannelPanelOpen(false);
    }
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

  const handleServerLeft = useCallback(() => {
    setSelectedServer(null);
    setSelectedChannel(null);
    setChannelsReady(false);
    setChannelsEmpty(false);
    setServersRefreshKey((k) => k + 1);
  }, []);

  const collapseSidePanel = useCallback(() => {
    setSidePanelOpen(false);
    saveChannelPanelOpen(false);
  }, []);

  const expandSidePanel = useCallback(() => {
    setSidePanelOpen(true);
    saveChannelPanelOpen(true);
  }, []);

  const isDmMode = viewMode === "dms";
  const isFriendsMode = viewMode === "friends";

  return (
    <main className="relative flex h-screen overflow-hidden bg-background text-on-surface">
      <ServerSidebar
        currentServerId={selectedServer?.id ?? null}
        messagesActive={isDmMode}
        friendsActive={isFriendsMode}
        totalUnread={totalUnread}
        onMessagesHome={handleMessagesHome}
        onOpenFriends={() => handleOpenFriends("friends")}
        onServerSelect={(server) => {
          handleServerSelect(server);
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            setSidePanelOpen(true);
            saveChannelPanelOpen(true);
          }
        }}
        refreshKey={serversRefreshKey}
      />

      {sidePanelOpen && (
        <button
          type="button"
          aria-label="Paneli kapat"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={collapseSidePanel}
        />
      )}

      <div
        className={`z-40 flex h-full transition-transform duration-200 ease-out max-md:fixed max-md:inset-y-0 max-md:left-[4.5rem] max-md:shadow-xl ${
          isFriendsMode
            ? "min-w-0 flex-1 max-md:right-0"
            : "shrink-0"
        } ${
          sidePanelOpen
            ? "max-md:translate-x-0"
            : "max-md:pointer-events-none max-md:-translate-x-[120%] md:hidden"
        }`}
      >
        {isFriendsMode ? (
          <FriendsList
            key={`friends-${friendsInitialTab}`}
            isOpen
            onClose={handleMessagesHome}
            onOpenDm={handleOpenDm}
            onDmAccepted={() => setDmRefreshKey((k) => k + 1)}
            onServersChanged={() => setServersRefreshKey((k) => k + 1)}
            initialTab={friendsInitialTab}
            onCollapse={collapseSidePanel}
          />
        ) : isDmMode ? (
          <DmSidebar
            selectedChannelId={selectedChannel?.id ?? null}
            onDmSelect={(channel) => handleDmSelect(channel)}
            refreshKey={dmRefreshKey}
            onUnreadTotalChange={setTotalUnread}
            onCollapse={collapseSidePanel}
          />
        ) : (
          <ChannelSidebar
            selectedServer={selectedServer}
            selectedChannelId={selectedChannel?.id ?? null}
            onChannelSelect={handleChannelSelect}
            onChannelsLoaded={handleChannelsLoaded}
            onCollapse={collapseSidePanel}
            onServerLeft={handleServerLeft}
          />
        )}
      </div>

      {!isFriendsMode && (
        <ChatArea
          selectedChannel={selectedChannel}
          selectedServer={isDmMode ? null : selectedServer}
          hasServer={!isDmMode && !!selectedServer}
          channelsReady={isDmMode ? true : channelsReady}
          channelsEmpty={isDmMode ? false : channelsEmpty}
          isDmMode={isDmMode}
          sidePanelCollapsed={!sidePanelOpen}
          onExpandSidePanel={expandSidePanel}
          onIncomingMessage={handleIncomingMessage}
          onOpenInvites={() => handleOpenFriends("invites")}
          onOpenMention={(item) => void handleOpenMention(item)}
          focusMessageId={focusMessageId}
          onFocusMessageConsumed={() => setFocusMessageId(null)}
          onServerUpdated={(patch) => {
            setSelectedServer((prev) =>
              prev
                ? {
                    ...prev,
                    ...(patch.name !== undefined ? { name: patch.name } : {}),
                    ...(patch.iconUrl !== undefined
                      ? { iconUrl: patch.iconUrl }
                      : {}),
                  }
                : prev
            );
            setServersRefreshKey((k) => k + 1);
          }}
        />
      )}
    </main>
  );
}
