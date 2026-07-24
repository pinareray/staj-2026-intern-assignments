"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CreateChannelModal from "@/components/modals/CreateChannelModal";
import ChannelSettingsModal from "@/components/modals/ChannelSettingsModal";
import InviteMemberModal from "@/components/modals/InviteMemberModal";
import ServerSettingsModal from "@/components/modals/ServerSettingsModal";
import { API_BASE_URL } from "@/services";
import type { ChannelItem, ServerItem } from "@/models";

type ChannelSidebarProps = {
  selectedServer: ServerItem | null;
  selectedChannelId: string | null;
  onChannelSelect: (channel: ChannelItem) => void;
  onChannelsLoaded: (channels: ChannelItem[]) => void;
  onCollapse?: () => void;
  onServerLeft?: () => void;
};

type ChannelCategory = {
  id: string;
  label: string;
  icon: string;
  channels: ChannelItem[];
};

function channelIcon(type: string) {
  if (type === "Announcement") return "campaign";
  if (type === "Voice") return "volume_up";
  return "tag";
}

export default function ChannelSidebar({
  selectedServer,
  selectedChannelId,
  onChannelSelect,
  onChannelsLoaded,
  onCollapse,
  onServerLeft,
}: ChannelSidebarProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [serverMenuOpen, setServerMenuOpen] = useState(false);
  const [canManageChannels, setCanManageChannels] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
          }
          return;
        }

        const data = await response.json();
        setUsername(data.username ?? data.Username ?? "");
        setEmail(String(data.email ?? data.Email ?? "").toLowerCase());
        const id = String(data.id ?? data.Id ?? "");
        if (id) localStorage.setItem("userId", id);
      } catch {
        // Backend kapalıysa oturumu düşürme
      }
    };

    loadProfile();
  }, [router]);

  useEffect(() => {
    const loadMembership = async () => {
      if (!selectedServer) {
        setCanManageChannels(false);
        return;
      }

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) {
        setCanManageChannels(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/servers/${selectedServer.id}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) {
          setCanManageChannels(false);
          return;
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        const me = list.find(
          (m: Record<string, unknown>) =>
            String(m.userId ?? m.UserId) === userId
        );
        const role = String(me?.role ?? me?.Role ?? "").toLowerCase();
        setCanManageChannels(role === "owner" || role === "admin");
      } catch {
        setCanManageChannels(false);
      }
    };

    void loadMembership();
  }, [selectedServer, refreshKey]);

  useEffect(() => {
    const loadChannels = async () => {
      if (!selectedServer) {
        setChannels([]);
        onChannelsLoaded([]);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/servers/${selectedServer.id}/channels`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
          }
          setChannels([]);
          onChannelsLoaded([]);
          return;
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        const mapped: ChannelItem[] = list.map((c: Record<string, unknown>) => ({
          id: String(c.id ?? c.Id),
          name: String(c.name ?? c.Name ?? "kanal"),
          serverId: String(c.serverId ?? c.ServerId ?? selectedServer.id),
          type: String(c.type ?? c.Type ?? "Text"),
        }));

        setChannels(mapped);
        onChannelsLoaded(mapped);
      } catch {
        setChannels([]);
        onChannelsLoaded([]);
      }
    };

    loadChannels();
  }, [selectedServer, router, onChannelsLoaded, refreshKey]);

  useEffect(() => {
    setServerMenuOpen(false);
  }, [selectedServer?.id]);

  useEffect(() => {
    if (!serverMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-server-menu]")) return;
      setServerMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [serverMenuOpen]);

  const categories = useMemo<ChannelCategory[]>(() => {
    const info = channels.filter((c) => c.type === "Announcement");
    const text = channels.filter(
      (c) => c.type !== "Announcement" && c.type !== "Voice"
    );
    const voice = channels.filter((c) => c.type === "Voice");

    const groups: ChannelCategory[] = [];
    if (info.length > 0) {
      groups.push({
        id: "info",
        label: "Bilgi",
        icon: "campaign",
        channels: info,
      });
    }
    groups.push({
      id: "text",
      label: "Metin Kanalları",
      icon: "tag",
      channels: text,
    });
    groups.push({
      id: "voice",
      label: "Ses Kanalları",
      icon: "volume_up",
      channels: voice,
    });
    return groups;
  }, [channels]);

  const toggleCategory = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <nav className="flex w-72 shrink-0 flex-col border-r border-stone-200 bg-white">
        <header
          className="relative z-30 h-14 shrink-0 border-b border-stone-200"
          data-server-menu
          ref={menuRef}
        >
          <div className="flex h-full items-center gap-1 px-3">
            {selectedServer ? (
              <button
                type="button"
                onClick={() => setServerMenuOpen((v) => !v)}
                className="group flex min-w-0 flex-1 items-center gap-1 rounded-lg px-2 py-2 text-left transition-colors hover:bg-stone-100"
              >
                <span className="min-w-0 flex-1 truncate font-libre text-base tracking-tight text-stone-900">
                  {selectedServer.name}
                </span>
                <span
                  className={`material-symbols-outlined shrink-0 text-xl text-stone-400 transition-transform group-hover:text-stone-700 ${
                    serverMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>
            ) : (
              <h1 className="px-2 font-libre text-base tracking-tight text-stone-900 truncate">
                Sunucu Seçilmedi
              </h1>
            )}
            {selectedServer && onCollapse && (
              <button
                type="button"
                title="Kanal panelini gizle"
                onClick={onCollapse}
                className="shrink-0 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
              >
                <span className="material-symbols-outlined text-xl">
                  left_panel_close
                </span>
              </button>
            )}
          </div>

          {selectedServer && serverMenuOpen && (
            <div className="absolute left-3 right-3 top-[calc(100%-0.25rem)] z-40 overflow-hidden rounded-xl border border-stone-200 bg-white py-1.5 shadow-[0_12px_32px_rgba(28,25,23,0.12)]">
              <button
                type="button"
                onClick={() => {
                  setServerMenuOpen(false);
                  setIsInviteOpen(true);
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-hanken text-sm text-stone-700 transition-colors hover:bg-stone-50"
              >
                <span className="material-symbols-outlined text-lg text-primary-container">
                  person_add
                </span>
                Sunucuya davet et
              </button>
              <button
                type="button"
                onClick={() => {
                  setServerMenuOpen(false);
                  setIsServerSettingsOpen(true);
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-hanken text-sm text-stone-700 transition-colors hover:bg-stone-50"
              >
                <span className="material-symbols-outlined text-lg text-stone-400">
                  settings
                </span>
                Sunucu ayarları
              </button>
              {canManageChannels && (
                <>
                  <div className="my-1.5 border-t border-stone-100" />
                  <button
                    type="button"
                    onClick={() => {
                      setServerMenuOpen(false);
                      setIsCreateOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-hanken text-sm text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    <span className="material-symbols-outlined text-lg text-stone-400">
                      add_circle
                    </span>
                    Kanal oluştur
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setServerMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left font-hanken text-sm text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    <span className="material-symbols-outlined text-lg text-stone-400">
                      tune
                    </span>
                    Kanalları yönet
                  </button>
                </>
              )}
            </div>
          )}
        </header>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto py-3">
          {!selectedServer && (
            <p className="px-5 py-4 font-hanken text-xs text-stone-400">
              Önce bir sunucu seç.
            </p>
          )}

          {selectedServer && channels.length === 0 && (
            <div className="space-y-3 px-5 py-4">
              <p className="font-hanken text-xs text-stone-400">
                Bu sunucuda henüz kanal yok.
              </p>
              {canManageChannels && (
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="w-full rounded-lg bg-primary-container/10 py-2.5 font-hanken text-sm font-semibold text-primary-container transition-colors hover:bg-primary-container/20"
                >
                  Kanal Oluştur
                </button>
              )}
            </div>
          )}

          {selectedServer &&
            categories.map((category) => {
              const isCollapsed = Boolean(collapsed[category.id]);
              const showEmpty =
                category.channels.length === 0 &&
                (category.id === "text" || category.id === "voice");

              if (category.channels.length === 0 && category.id === "info") {
                return null;
              }

              return (
                <div key={category.id} className="px-2">
                  <div className="group mb-1 flex items-center gap-0.5 px-1">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className="flex min-w-0 flex-1 items-center gap-0.5 rounded-md px-1 py-1 text-left transition-colors hover:bg-stone-50"
                    >
                      <span
                        className={`material-symbols-outlined text-base text-stone-400 transition-transform ${
                          isCollapsed ? "-rotate-90" : ""
                        }`}
                      >
                        expand_more
                      </span>
                      <span className="truncate font-hanken text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
                        {category.label}
                      </span>
                    </button>
                    {canManageChannels && (
                      <button
                        type="button"
                        title={`${category.label} — kanal oluştur`}
                        onClick={() => setIsCreateOpen(true)}
                        className="rounded-md p-1 text-stone-300 opacity-0 transition-all hover:bg-stone-100 hover:text-primary-container group-hover:opacity-100"
                      >
                        <span className="material-symbols-outlined text-base">
                          add
                        </span>
                      </button>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="space-y-0.5">
                      {showEmpty && (
                        <p className="px-3 py-2 font-hanken text-[11px] text-stone-400">
                          Bu kategoride kanal yok.
                        </p>
                      )}
                      {category.channels.map((channel) => {
                        const isActive = selectedChannelId === channel.id;
                        return (
                          <button
                            key={channel.id}
                            type="button"
                            onClick={() => onChannelSelect(channel)}
                            className={`group/ch flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 transition-all ${
                              isActive
                                ? "bg-primary-container/10 text-stone-900"
                                : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[18px] ${
                                isActive
                                  ? "text-primary-container"
                                  : "text-stone-400 group-hover/ch:text-stone-600"
                              }`}
                              style={
                                isActive
                                  ? { fontVariationSettings: "'FILL' 1" }
                                  : undefined
                              }
                            >
                              {channelIcon(channel.type)}
                            </span>
                            <span className="truncate font-hanken text-sm">
                              {channel.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <button
          type="button"
          onClick={() => {
            if (username) router.push(`/profile/${encodeURIComponent(username)}`);
          }}
          className="flex w-full items-center gap-3 border-t border-stone-200 bg-stone-50 p-3 text-left transition-colors hover:bg-stone-100"
        >
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-primary-container/30 bg-primary-container/10">
              <span className="font-libre text-sm font-bold uppercase text-primary-container">
                {username ? username.charAt(0) : "?"}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-hanken text-sm text-stone-900">
              {username || "Yükleniyor..."}
            </div>
            <div className="truncate font-hanken text-[10px] lowercase tracking-wider text-stone-400">
              {email || "—"}
            </div>
          </div>
        </button>
      </nav>

      {selectedServer && (
        <>
          <CreateChannelModal
            isOpen={isCreateOpen}
            serverId={selectedServer.id}
            onClose={() => setIsCreateOpen(false)}
            onCreated={() => setRefreshKey((k) => k + 1)}
          />
          <ChannelSettingsModal
            isOpen={isSettingsOpen}
            serverId={selectedServer.id}
            serverName={selectedServer.name}
            channels={channels}
            canManage={canManageChannels}
            onClose={() => setIsSettingsOpen(false)}
            onChanged={() => setRefreshKey((k) => k + 1)}
          />
          <InviteMemberModal
            isOpen={isInviteOpen}
            serverId={selectedServer.id}
            serverName={selectedServer.name}
            onClose={() => setIsInviteOpen(false)}
          />
          <ServerSettingsModal
            isOpen={isServerSettingsOpen}
            serverId={selectedServer.id}
            serverName={selectedServer.name}
            onClose={() => setIsServerSettingsOpen(false)}
            onLeftServer={() => {
              setIsServerSettingsOpen(false);
              onServerLeft?.();
            }}
            onInvite={() => {
              setIsServerSettingsOpen(false);
              setIsInviteOpen(true);
            }}
            onChannelSettings={() => {
              setIsServerSettingsOpen(false);
              setIsSettingsOpen(true);
            }}
          />
        </>
      )}
    </>
  );
}
