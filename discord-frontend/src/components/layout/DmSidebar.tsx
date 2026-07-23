"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, cacheCurrentUserProfile, markDmRead } from "@/services";
import { chatHub } from "@/services";
import type { ChannelItem } from "@/models";

export type DmListItem = {
  channelId: string | null;
  userId: string;
  username: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
};

type DmSidebarProps = {
  selectedChannelId: string | null;
  onDmSelect: (channel: ChannelItem) => void;
  refreshKey?: number;
  onUnreadTotalChange?: (total: number) => void;
  onCollapse?: () => void;
};

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container/15">
      <span className="font-libre text-sm font-bold uppercase text-primary-container">
        {name.charAt(0) || "?"}
      </span>
    </div>
  );
}

function mapDmRow(d: Record<string, unknown>): DmListItem {
  const rawChannelId = d.channelId ?? d.ChannelId;
  return {
    channelId:
      rawChannelId != null && String(rawChannelId) !== "00000000-0000-0000-0000-000000000000"
        ? String(rawChannelId)
        : null,
    userId: String(d.userId ?? d.UserId),
    username: String(d.username ?? d.Username ?? ""),
    lastMessage: (d.lastMessage ?? d.LastMessage ?? null) as string | null,
    lastMessageAt: (d.lastMessageAt ?? d.LastMessageAt ?? null) as string | null,
    unreadCount: Number(d.unreadCount ?? d.UnreadCount ?? 0),
  };
}

export default function DmSidebar({
  selectedChannelId,
  onDmSelect,
  refreshKey = 0,
  onUnreadTotalChange,
  onCollapse,
}: DmSidebarProps) {
  const router = useRouter();
  const [dms, setDms] = useState<DmListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const cached = localStorage.getItem("username");
      if (cached) setUsername(cached);

      const profile = await cacheCurrentUserProfile();
      if (profile?.username) {
        setUsername(profile.username);
      }
    };

    void loadProfile();
  }, []);

  const loadFriendsFallback = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return [];

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      return list
        .filter((f: Record<string, unknown>) => String(f.status ?? f.Status) === "Accepted")
        .map((f: Record<string, unknown>) => ({
          channelId: null,
          userId: String(f.userId ?? f.UserId),
          username: String(f.username ?? f.Username ?? ""),
          lastMessage: null,
          lastMessageAt: null,
        }));
    } catch {
      return [];
    }
  }, []);

  const loadDms = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dms`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        router.push("/login");
        return;
      }

      if (response.status === 404) {
        const friends = await loadFriendsFallback(token);
        setDms(friends);
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      const mapped = list.map((d: Record<string, unknown>) => mapDmRow(d));
      setDms(mapped);
      onUnreadTotalChange?.(
        mapped.reduce((sum, dm) => sum + (dm.unreadCount ?? 0), 0)
      );
    } catch {
      const token = localStorage.getItem("token");
      if (token) {
        const friends = await loadFriendsFallback(token);
        setDms(friends);
      } else {
        setDms([]);
      }
    } finally {
      setLoading(false);
    }
  }, [router, loadFriendsFallback, onUnreadTotalChange]);

  useEffect(() => {
    void loadDms();
  }, [loadDms, refreshKey]);

  useEffect(() => {
    const unsub = chatHub.subscribe("DmUnreadUpdated", () => {
      void loadDms();
    });
    return unsub;
  }, [loadDms]);

  useEffect(() => {
    if (!selectedChannelId) return;
    void markDmRead(selectedChannelId).then(() => loadDms());
  }, [selectedChannelId, loadDms]);

  const openConversation = async (dm: DmListItem) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (dm.channelId) {
      await markDmRead(dm.channelId);
      onDmSelect({
        id: dm.channelId,
        name: dm.username,
        serverId: null,
        type: "DM",
      });
      void loadDms();
      return;
    }

    setOpeningId(dm.userId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dms/${dm.userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as Record<string, unknown>;
      const channelId = String(data.channelId ?? data.ChannelId);
      const uname = String(data.username ?? data.Username ?? dm.username);

      onDmSelect({
        id: channelId,
        name: uname,
        serverId: null,
        type: "DM",
      });
      await markDmRead(channelId);
      void loadDms();
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <aside className="w-64 flex flex-col border-r border-stone-200 bg-surface-container-low shrink-0">
      <div className="h-16 px-4 flex items-center justify-between border-b border-stone-200">
        <h2 className="font-libre text-lg text-stone-900">Mesajlar</h2>
        <button
          type="button"
          title="Mesaj panelini gizle"
          onClick={onCollapse}
          className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
        >
          <span className="material-symbols-outlined text-xl">expand_more</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        {loading && dms.length === 0 && (
          <p className="px-2 py-6 text-center font-hanken text-xs text-stone-400">
            Yükleniyor...
          </p>
        )}

        {!loading && dms.length === 0 && (
          <p className="px-2 py-6 text-center font-hanken text-xs text-stone-400 leading-relaxed">
            Henüz arkadaşın yok. Arkadaşlar panelinden kullanıcı ekle.
          </p>
        )}

        {dms.map((dm) => {
          const isActive = dm.channelId != null && selectedChannelId === dm.channelId;
          const isOpening = openingId === dm.userId;
          const unread = dm.unreadCount ?? 0;

          return (
            <button
              key={dm.userId}
              type="button"
              disabled={isOpening}
              onClick={() => void openConversation(dm)}
              className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-60 ${
                isActive
                  ? "bg-primary-container/15 text-primary-container"
                  : unread > 0
                    ? "bg-primary-container/5 hover:bg-white text-stone-800"
                    : "hover:bg-white text-stone-700"
              }`}
            >
              <Avatar name={dm.username} />
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-hanken text-sm ${
                    unread > 0 ? "font-bold" : "font-medium"
                  }`}
                >
                  @{dm.username}
                </p>
                {isOpening ? (
                  <p className="truncate font-hanken text-xs text-stone-400">
                    Açılıyor...
                  </p>
                ) : dm.lastMessage ? (
                  <p className="truncate font-hanken text-xs text-stone-400">
                    {dm.lastMessage}
                  </p>
                ) : (
                  <p className="truncate font-hanken text-xs text-stone-400">
                    Sohbete başla
                  </p>
                )}
              </div>
              {unread > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-container px-1.5 font-hanken text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-stone-200">
        <button
          type="button"
          onClick={() =>
            username
              ? router.push(`/profile/${encodeURIComponent(username)}`)
              : undefined
          }
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 hover:bg-white transition-colors"
        >
          <Avatar name={username || "?"} />
          <span className="truncate font-hanken text-sm text-stone-700">
            {username ? `@${username}` : "Profil"}
          </span>
        </button>
      </div>
    </aside>
  );
}
