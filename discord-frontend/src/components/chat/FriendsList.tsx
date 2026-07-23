"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/services";
import type { ChannelItem } from "@/models";

type FriendItem = {
  friendshipId: string;
  userId: string;
  username: string;
  status: string;
  isIncoming: boolean;
};

type ServerInviteItem = {
  inviteId: string;
  serverId: string;
  serverName: string;
  inviterUsername: string;
};

type SearchUser = {
  id: string;
  username: string;
};

type FriendsListProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenDm?: (channel: ChannelItem) => void;
  onDmAccepted?: () => void;
  onServersChanged?: () => void;
  /** Açılışta seçilecek sekme */
  initialTab?: "incoming" | "outgoing" | "friends" | "invites";
  onCollapse?: () => void;
};

function normalizeUsername(value: string) {
  return value.trim().replace(/^@+/, "");
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/15">
      <span className="font-libre text-sm font-bold uppercase text-primary-container">
        {name.charAt(0) || "?"}
      </span>
    </div>
  );
}

export default function FriendsList({
  isOpen,
  onClose,
  onOpenDm,
  onDmAccepted,
  onServersChanged,
  initialTab = "friends",
  onCollapse,
}: FriendsListProps) {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [serverInvites, setServerInvites] = useState<ServerInviteItem[]>([]);
  const [username, setUsername] = useState("@");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [tab, setTab] = useState<
    "incoming" | "outgoing" | "friends" | "invites"
  >("friends");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFriends = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        setError("Arkadaş listesi alınamadı.");
        return;
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setFriends(
        list.map((f: Record<string, unknown>) => ({
          friendshipId: String(f.friendshipId ?? f.FriendshipId),
          userId: String(f.userId ?? f.UserId),
          username: String(f.username ?? f.Username ?? ""),
          status: String(f.status ?? f.Status ?? ""),
          isIncoming: Boolean(f.isIncoming ?? f.IsIncoming),
        }))
      );
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadServerInvites = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/servers/invites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setServerInvites(
        list.map((i: Record<string, unknown>) => ({
          inviteId: String(i.inviteId ?? i.InviteId),
          serverId: String(i.serverId ?? i.ServerId),
          serverName: String(i.serverName ?? i.ServerName ?? "Sunucu"),
          inviterUsername: String(
            i.inviterUsername ?? i.InviterUsername ?? "Kullanıcı"
          ),
        }))
      );
    } catch {
      // ignore
    }
  }, []);

  const refreshSocial = useCallback(async () => {
    await Promise.all([loadFriends(), loadServerInvites()]);
  }, [loadFriends, loadServerInvites]);

  const searchUsers = useCallback(async (query: string) => {
    const token = localStorage.getItem("token");
    const q = normalizeUsername(query);
    if (!token || q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      let list: SearchUser[] = [];

      const response = await fetch(
        `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        const raw = Array.isArray(data) ? data : [];
        list = raw.map((u: Record<string, unknown>) => ({
          id: String(u.id ?? u.Id),
          username: String(u.username ?? u.Username ?? ""),
        }));
      }

      if (list.length === 0) {
        const exact = await fetch(
          `${API_BASE_URL}/api/users/${encodeURIComponent(q)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (exact.ok) {
          const u = await exact.json();
          list = [
            {
              id: String(u.id ?? u.Id),
              username: String(u.username ?? u.Username ?? q),
            },
          ];
        }
      }

      setSearchResults(list.filter((u) => Boolean(u.username)));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setUsername("@");
    setSearchResults([]);
    setError("");
    setSuccess("");
    setTab(initialTab);
    void refreshSocial();
  }, [isOpen, refreshSocial, initialTab]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleUsernameChange = (value: string) => {
    const withoutAt = value.replace(/^@*/, "");
    const next = `@${withoutAt}`;
    setUsername(next);
    setSuccess("");

    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      void searchUsers(next);
    }, 300);
  };

  const relationFor = (userId: string, uname: string) => {
    const byId = friends.find((f) => f.userId === userId);
    if (byId) return byId;
    return friends.find(
      (f) => f.username.toLowerCase() === uname.toLowerCase()
    );
  };

  const sendFriendRequest = async (name: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setSending(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: name }),
      });

      const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!response.ok) {
        setError(String(data.message ?? "İstek gönderilemedi."));
        return;
      }

      const uname = String(data.username ?? data.Username ?? name);

      setUsername("@");
      setSearchResults([]);
      const autoAccepted =
        data.autoAccepted === true || data.AutoAccepted === true;
      setSuccess(
        autoAccepted
          ? `@${uname} ile artık arkadaşsınız.`
          : `@${uname} kullanıcısına istek gönderildi.`
      );
      setTab(autoAccepted ? "friends" : "outgoing");
      await loadFriends();
      if (autoAccepted) {
        onDmAccepted?.();
      }
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setSending(false);
    }
  };

  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = normalizeUsername(username);
    if (!name) {
      setError("Aramak için kullanıcı adı gir.");
      return;
    }
    await searchUsers(name);
  };

  const handleAccept = async (friendshipId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionId(friendshipId);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendshipId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(
          String((data as { message?: string }).message ?? "Kabul edilemedi.")
        );
        return;
      }

      const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      const dmChannelId = String(data.dmChannelId ?? data.DmChannelId ?? "");

      setSuccess("Arkadaşlık isteği kabul edildi.");
      onDmAccepted?.();
      await loadFriends();

      if (dmChannelId && onOpenDm) {
        const friend = friends.find((f) => f.friendshipId === friendshipId);
        onOpenDm({
          id: dmChannelId,
          name: friend?.username ?? "dm",
          serverId: null,
          type: "DM",
        });
        onClose();
      }
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setActionId(null);
    }
  };

  const handleMessage = async (friend: FriendItem) => {
    const token = localStorage.getItem("token");
    if (!token || !onOpenDm) return;

    setActionId(friend.friendshipId);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/dms/${friend.userId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const fallback =
          response.status === 404
            ? "DM servisi bulunamadı. Backend'i yeniden başlatın."
            : "Mesaj açılamadı.";
        setError(
          String((data as { message?: string }).message ?? fallback)
        );
        return;
      }

      const data = (await response.json()) as Record<string, unknown>;
      const channelId = String(data.channelId ?? data.ChannelId);
      const uname = String(data.username ?? data.Username ?? friend.username);

      onOpenDm({
        id: channelId,
        name: uname,
        serverId: null,
        type: "DM",
      });
      onClose();
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (friendshipId: string, asCancel = false) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionId(friendshipId);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ friendshipId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(
          String(
            (data as { message?: string }).message ??
              (asCancel ? "İptal edilemedi." : "Reddedilemedi.")
          )
        );
        return;
      }

      setSuccess(asCancel ? "İstek iptal edildi." : "İstek reddedildi.");
      await loadFriends();
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setActionId(null);
    }
  };

  const handleAcceptServerInvite = async (inviteId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionId(inviteId);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/servers/invites/${inviteId}/accept`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!response.ok) {
        setError(String(data.message ?? "Davet kabul edilemedi."));
        return;
      }

      const serverName = String(data.serverName ?? data.ServerName ?? "Sunucu");
      setSuccess(`“${serverName}” sunucusuna katıldın.`);
      await loadServerInvites();
      onServersChanged?.();
      setTab("invites");
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setActionId(null);
    }
  };

  const handleRejectServerInvite = async (inviteId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionId(inviteId);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/servers/invites/${inviteId}/reject`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!response.ok) {
        setError(String(data.message ?? "Davet reddedilemedi."));
        return;
      }

      setSuccess("Davet reddedildi.");
      await loadServerInvites();
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setActionId(null);
    }
  };

  const openProfile = (name: string) => {
    onClose();
    router.push(`/profile/${encodeURIComponent(name)}`);
  };

  const accepted = friends.filter((f) => f.status === "Accepted");
  const acceptedIds = new Set(accepted.map((f) => f.userId));
  const incoming = friends.filter((f) => f.status === "Pending" && f.isIncoming);
  const outgoing = friends.filter(
    (f) =>
      f.status === "Pending" &&
      !f.isIncoming &&
      !acceptedIds.has(f.userId)
  );
  const queryLen = normalizeUsername(username).length;
  const showSearchPanel = queryLen >= 2 || searchResults.length > 0 || searching;

  const panel = (
    <aside className="flex h-full min-w-0 flex-1 flex-col bg-surface-container-low">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-stone-200 px-4">
        <div className="min-w-0">
          <h2 className="font-libre text-lg text-stone-900">Arkadaşlar</h2>
        </div>
        <div className="flex items-center gap-1">
          {onCollapse && (
            <button
              type="button"
              title="Paneli gizle"
              onClick={onCollapse}
              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 md:hidden"
            >
              <span className="material-symbols-outlined text-xl">
                expand_more
              </span>
            </button>
          )}
          <button
            type="button"
            title="Kapat"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
      </header>

      <form
        onSubmit={handleSearchSubmit}
        className="shrink-0 space-y-2 border-b border-stone-200 px-4 py-3"
      >
        <label className="block font-hanken text-[10px] font-bold uppercase tracking-widest text-stone-500">
          Kullanıcı ara
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-stone-400">
              search
            </span>
            <input
              value={username}
              onFocus={() => {
                if (!username.startsWith("@")) {
                  setUsername(`@${username}`);
                }
              }}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="@kullanici_adi"
              disabled={sending}
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-3 font-hanken text-sm text-stone-900 outline-none focus:ring-1 focus:ring-primary-container/40"
            />
          </div>
          <button
            type="submit"
            disabled={sending || queryLen < 2}
            className="rounded-xl bg-primary-container px-3 font-hanken text-sm font-semibold text-white transition-colors hover:bg-[#8f1b1c] disabled:opacity-50"
          >
            Ara
          </button>
        </div>
        {error && <p className="font-hanken text-xs text-red-600">{error}</p>}
        {success && (
          <p className="font-hanken text-xs text-emerald-700">{success}</p>
        )}

        {showSearchPanel && (
          <div className="custom-scrollbar max-h-36 space-y-1.5 overflow-y-auto rounded-xl border border-stone-200 bg-white p-2">
            {searching && (
              <p className="px-2 py-1.5 font-hanken text-xs text-stone-500">
                Aranıyor...
              </p>
            )}
            {!searching && searchResults.length === 0 && queryLen >= 2 && (
              <p className="px-2 py-1.5 font-hanken text-xs text-stone-500">
                &quot;{normalizeUsername(username)}&quot; için sonuç yok.
              </p>
            )}
            {!searching &&
              searchResults.map((u) => {
                const rel = relationFor(u.id, u.username);
                const isFriend = rel?.status === "Accepted";
                const isPending = rel?.status === "Pending";
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-stone-50"
                  >
                    <Avatar name={u.username} />
                    <button
                      type="button"
                      onClick={() => openProfile(u.username)}
                      className="min-w-0 flex-1 truncate text-left font-hanken text-sm text-stone-800 hover:text-primary-container hover:underline"
                    >
                      @{u.username}
                    </button>
                    {isFriend ? (
                      <span className="font-hanken text-[10px] font-semibold text-emerald-700">
                        Arkadaş
                      </span>
                    ) : isPending ? (
                      <span className="font-hanken text-[10px] text-stone-500">
                        Bekliyor
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={sending}
                        onClick={() => void sendFriendRequest(u.username)}
                        className="rounded-lg bg-primary-container px-2.5 py-1 font-hanken text-[11px] font-semibold text-white hover:bg-[#8f1b1c] disabled:opacity-50"
                      >
                        Ekle
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </form>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-stone-200 px-2 pt-2">
          <div className="flex gap-0.5">
            {(
              [
                {
                  id: "incoming" as const,
                  label: "Gelen",
                  count: incoming.length,
                },
                {
                  id: "outgoing" as const,
                  label: "Giden",
                  count: outgoing.length,
                },
                {
                  id: "invites" as const,
                  label: "Davetler",
                  count: serverInvites.length,
                },
                {
                  id: "friends" as const,
                  label: "Arkadaşlar",
                  count: accepted.length,
                },
              ] as const
            ).map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex flex-1 flex-col items-center gap-0.5 rounded-t-lg px-1 py-2 font-hanken text-[10px] font-semibold transition-colors sm:flex-row sm:justify-center sm:gap-1 sm:text-xs ${
                    active
                      ? "bg-white text-primary-container"
                      : "text-stone-500 hover:bg-white/60 hover:text-stone-800"
                  }`}
                >
                  <span className="truncate">{t.label}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                      active
                        ? "bg-primary-container/15 text-primary-container"
                        : "bg-stone-200/80 text-stone-500"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {loading && (
            <p className="font-hanken text-sm text-stone-500">Yükleniyor...</p>
          )}

          {!loading && tab === "incoming" && (
            <>
              {incoming.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-200 px-3 py-6 text-center font-hanken text-sm text-stone-500">
                  Gelen istek yok.
                </p>
              ) : (
                incoming.map((f) => (
                  <div
                    key={f.friendshipId}
                    className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3"
                  >
                    <Avatar name={f.username} />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openProfile(f.username)}
                        className="truncate text-left font-hanken text-sm font-medium text-stone-900 hover:text-primary-container hover:underline"
                      >
                        @{f.username}
                      </button>
                      <p className="text-[10px] text-stone-500">
                        Seni arkadaş olarak eklemek istiyor
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <button
                        type="button"
                        disabled={actionId === f.friendshipId}
                        onClick={() => void handleAccept(f.friendshipId)}
                        className="rounded-lg bg-primary-container px-2.5 py-1.5 font-hanken text-xs font-semibold text-white hover:bg-[#8f1b1c] disabled:opacity-50"
                      >
                        Kabul
                      </button>
                      <button
                        type="button"
                        disabled={actionId === f.friendshipId}
                        onClick={() => void handleReject(f.friendshipId)}
                        className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-hanken text-xs font-semibold text-stone-500 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                      >
                        Reddet
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {!loading && tab === "outgoing" && (
            <>
              {outgoing.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-200 px-3 py-6 text-center font-hanken text-sm text-stone-500">
                  Bekleyen giden istek yok.
                </p>
              ) : (
                outgoing.map((f) => (
                  <div
                    key={f.friendshipId}
                    className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3"
                  >
                    <Avatar name={f.username} />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openProfile(f.username)}
                        className="truncate text-left font-hanken text-sm font-medium text-stone-900 hover:text-primary-container hover:underline"
                      >
                        @{f.username}
                      </button>
                      <p className="text-[10px] text-stone-500">
                        Yanıt bekleniyor
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={actionId === f.friendshipId}
                      onClick={() => void handleReject(f.friendshipId, true)}
                      className="shrink-0 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-hanken text-xs font-semibold text-stone-500 hover:text-stone-800 disabled:opacity-50"
                    >
                      İptal
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {!loading && tab === "invites" && (
            <>
              {serverInvites.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-200 px-3 py-6 text-center font-hanken text-sm text-stone-500">
                  Bekleyen sunucu daveti yok.
                </p>
              ) : (
                serverInvites.map((invite) => (
                  <div
                    key={invite.inviteId}
                    className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container/15">
                      <span className="font-libre text-sm font-bold uppercase text-primary-container">
                        {invite.serverName.charAt(0) || "S"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-hanken text-sm font-medium text-stone-900">
                        {invite.serverName}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        @{invite.inviterUsername} davet etti
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <button
                        type="button"
                        disabled={actionId === invite.inviteId}
                        onClick={() =>
                          void handleAcceptServerInvite(invite.inviteId)
                        }
                        className="rounded-lg bg-primary-container px-2.5 py-1.5 font-hanken text-xs font-semibold text-white hover:bg-[#8f1b1c] disabled:opacity-50"
                      >
                        Kabul
                      </button>
                      <button
                        type="button"
                        disabled={actionId === invite.inviteId}
                        onClick={() =>
                          void handleRejectServerInvite(invite.inviteId)
                        }
                        className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-hanken text-xs font-semibold text-stone-500 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                      >
                        Reddet
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {!loading && tab === "friends" && (
            <>
              {accepted.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-200 px-3 py-6 text-center font-hanken text-sm text-stone-500">
                  Henüz arkadaşın yok. Yukarıdan kullanıcı adı ile ara.
                </p>
              ) : (
                accepted.map((f) => (
                  <div
                    key={f.friendshipId}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-stone-200 hover:bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => openProfile(f.username)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <Avatar name={f.username} />
                      <p className="truncate font-hanken text-sm text-stone-900">
                        @{f.username}
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={actionId === f.friendshipId}
                      onClick={() => void handleMessage(f)}
                      className="shrink-0 rounded-lg bg-primary-container/15 px-3 py-1.5 font-hanken text-xs font-semibold text-primary-container transition-colors hover:bg-primary-container/25 disabled:opacity-50"
                    >
                      Mesaj
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );

  return panel;
}
