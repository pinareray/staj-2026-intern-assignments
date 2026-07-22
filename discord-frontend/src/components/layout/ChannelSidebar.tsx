"use client";

import { useEffect, useState } from "react";
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

export default function ChannelSidebar({
  selectedServer,
  selectedChannelId,
  onChannelSelect,
  onChannelsLoaded,
  onCollapse,
  onServerLeft,
}: ChannelSidebarProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isServerSettingsOpen, setIsServerSettingsOpen] = useState(false);
  const [canManageChannels, setCanManageChannels] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
          }
          router.push("/login");
          return;
        }

        const data = await response.json();
        setUsername(data.username ?? data.Username ?? "");
        setEmail(String(data.email ?? data.Email ?? "").toLowerCase());
        const id = String(data.id ?? data.Id ?? "");
        if (id) localStorage.setItem("userId", id);
      } catch {
        router.push("/login");
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
          if (response.status === 401 || response.status === 403) {
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

  return (
    <>
      <nav className="w-72 flex flex-col border-r border-stone-200 bg-white shrink-0">
        <header className="h-16 px-6 flex items-center justify-between border-b border-stone-200">
          {selectedServer ? (
            <button
              type="button"
              title="Sunucu ayarları"
              onClick={() => setIsServerSettingsOpen(true)}
              className="min-w-0 flex-1 text-left font-libre text-lg tracking-tight text-stone-900 truncate hover:text-primary-container transition-colors"
            >
              {selectedServer.name}
            </button>
          ) : (
            <h1 className="font-libre text-lg tracking-tight text-stone-900 truncate">
              Sunucu Seçilmedi
            </h1>
          )}
          <div className="flex items-center gap-1 shrink-0">
            {selectedServer && (
              <button
                type="button"
                title="Üye davet et"
                onClick={() => setIsInviteOpen(true)}
                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-primary-container"
              >
                <span className="material-symbols-outlined text-xl">
                  person_add
                </span>
              </button>
            )}
            {selectedServer && onCollapse && (
              <button
                type="button"
                title="Kanal panelini gizle"
                onClick={onCollapse}
                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
              >
                <span className="material-symbols-outlined text-xl">
                  left_panel_close
                </span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-6">
          <div className="px-3">
            <div className="flex items-center justify-between px-3 py-1">
              <div className="flex items-center text-stone-400 uppercase tracking-widest text-[10px] font-bold">
                Kanallar
              </div>
              <div className="flex items-center gap-1">
                {selectedServer && (
                  <button
                    type="button"
                    title="Kanal ayarları"
                    onClick={() => setIsSettingsOpen(true)}
                    className="text-stone-400 hover:text-primary-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      settings
                    </span>
                  </button>
                )}
                {selectedServer && (
                  <button
                    type="button"
                    title="Kanal oluştur"
                    onClick={() => setIsCreateOpen(true)}
                    className="text-stone-400 hover:text-primary-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 space-y-1">
              {channels.length === 0 && (
                <div className="px-3 py-4 space-y-3">
                  <p className="text-xs text-stone-400 font-hanken">
                    {selectedServer
                      ? "Bu sunucuda henüz kanal yok."
                      : "Önce bir sunucu seç."}
                  </p>
                  {selectedServer && (
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(true)}
                      className="w-full rounded-lg bg-primary-container/10 text-primary-container py-2.5 text-sm font-hanken font-semibold hover:bg-primary-container/20 transition-colors"
                    >
                      Kanal Oluştur
                    </button>
                  )}
                </div>
              )}

              {channels.map((channel) => {
                const isActive = selectedChannelId === channel.id;
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => onChannelSelect(channel)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                      isActive
                        ? "bg-primary-container/10 text-stone-900"
                        : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined ${
                        isActive
                          ? "text-primary-container"
                          : "text-stone-400 group-hover:text-stone-700"
                      }`}
                      style={
                        isActive
                          ? { fontVariationSettings: "'FILL' 1" }
                          : undefined
                      }
                    >
                      {channel.type === "Announcement"
                        ? "campaign"
                        : channel.type === "Voice"
                          ? "volume_up"
                          : "tag"}
                    </span>
                    <span className="text-sm font-hanken">{channel.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (username) router.push(`/profile/${encodeURIComponent(username)}`);
          }}
          className="p-3 bg-stone-50 border-t border-stone-200 flex items-center gap-3 w-full text-left hover:bg-stone-100 transition-colors"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-primary-container/30 bg-primary-container/10 flex items-center justify-center">
              <span className="font-libre text-sm text-primary-container font-bold uppercase">
                {username ? username.charAt(0) : "?"}
              </span>
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-stone-900 truncate font-hanken">
              {username || "Yükleniyor..."}
            </div>
            <div className="text-[10px] text-stone-400 tracking-wider truncate lowercase">
              {email || "—"}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-stone-400 hover:text-stone-700 text-xl">
              settings
            </span>
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
