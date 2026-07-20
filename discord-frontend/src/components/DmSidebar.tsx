"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, cacheCurrentUserProfile } from "@/lib/api";
import type { ChannelItem } from "@/types/chat";

export type DmListItem = {
  channelId: string | null;
  userId: string;
  username: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
};

type DmSidebarProps = {
  selectedChannelId: string | null;
  onDmSelect: (channel: ChannelItem) => void;
  refreshKey?: number;
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
  };
}

export default function DmSidebar({
  selectedChannelId,
  onDmSelect,
  refreshKey = 0,
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

      if (response.status === 401 || response.status === 403) {
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
      setDms(list.map((d: Record<string, unknown>) => mapDmRow(d)));
    } catch {
      const token = localStorage.getItem("token");
      if (token) {
        const friends = await loadFriendsFallback(token);
        setDms(friends);
      }
    } finally {
      setLoading(false);
    }
  }, [router, loadFriendsFallback]);

  useEffect(() => {
    void loadDms();
  }, [loadDms, refreshKey]);

  const openConversation = async (dm: DmListItem) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (dm.channelId) {
      onDmSelect({
        id: dm.channelId,
        name: dm.username,
        serverId: null,
        type: "DM",
      });
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
      void loadDms();
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <aside className="w-64 flex flex-col border-r border-stone-200 bg-surface-container-low shrink-0">
      <div className="h-16 px-4 flex items-center border-b border-stone-200">
        <h2 className="font-libre text-lg text-stone-900">Mesajlar</h2>
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

          return (
            <button
              key={dm.userId}
              type="button"
              disabled={isOpening}
              onClick={() => void openConversation(dm)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-60 ${
                isActive
                  ? "bg-primary-container/15 text-primary-container"
                  : "hover:bg-white text-stone-700"
              }`}
            >
              <Avatar name={dm.username} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-hanken text-sm font-medium">
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
