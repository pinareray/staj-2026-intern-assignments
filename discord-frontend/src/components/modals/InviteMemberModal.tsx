"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL, searchUsers, type UserSearchHit } from "@/services";

type InviteMemberModalProps = {
  isOpen: boolean;
  serverId: string;
  serverName: string;
  onClose: () => void;
  onInvited?: () => void;
};

function normalizeQuery(value: string) {
  return value.trim().replace(/^@+/, "");
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container/10">
      <span className="font-libre text-xs font-bold uppercase text-primary-container">
        {name.charAt(0) || "?"}
      </span>
    </div>
  );
}

export default function InviteMemberModal({
  isOpen,
  serverId,
  serverName,
  onClose,
  onInvited,
}: InviteMemberModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchHit[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [pendingByUserId, setPendingByUserId] = useState<Map<string, string>>(
    new Map()
  );
  const [searching, setSearching] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMembersAndInvites = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/servers/${serverId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/servers/${serverId}/invites`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        const list = Array.isArray(data) ? data : [];
        setMemberIds(
          new Set(
            list.map((m: Record<string, unknown>) =>
              String(m.userId ?? m.UserId)
            )
          )
        );
      }

      if (invitesRes.ok) {
        const data = await invitesRes.json();
        const list = Array.isArray(data) ? data : [];
        const map = new Map<string, string>();
        list.forEach((i: Record<string, unknown>) => {
          map.set(
            String(i.userId ?? i.UserId),
            String(i.inviteId ?? i.InviteId)
          );
        });
        setPendingByUserId(map);
      }
    } catch {
      // ignore
    }
  }, [serverId]);

  const runSearch = useCallback(async (value: string) => {
    const q = normalizeQuery(value);
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      const list = await searchUsers(q);
      setResults(list);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setResults([]);
    setError("");
    setSearching(false);
    setActionUserId(null);
    setInviteLink("");
    setLinkCopied(false);
    void loadMembersAndInvites();
  }, [isOpen, loadMembersAndInvites]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const ensureInviteLink = async () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    setLinkBusy(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/servers/${serverId}/invite-link`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          String(data.message ?? data.Message ?? "Davet linki oluşturulamadı.")
        );
      }
      const data = await response.json();
      const inviteCode = String(data.code ?? data.Code ?? "");
      if (!inviteCode) throw new Error("Davet kodu alınamadı.");
      const url = `${window.location.origin}/invite/${inviteCode}`;
      setInviteLink(url);
      return url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Davet linki oluşturulamadı."
      );
      return null;
    } finally {
      setLinkBusy(false);
    }
  };

  const handleCopyInviteLink = async () => {
    const url = inviteLink || (await ensureInviteLink());
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setError("Link kopyalanamadı. Manuel olarak seçip kopyala.");
    }
  };

  const toggleInvite = async (user: UserSearchHit) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const isMember = memberIds.has(user.id);
    const pendingInviteId = pendingByUserId.get(user.id);
    setActionUserId(user.id);
    setError("");

    try {
      if (isMember) {
        setError("Bu kullanıcı zaten sunucu üyesi.");
        return;
      }

      if (pendingInviteId) {
        const response = await fetch(
          `${API_BASE_URL}/api/servers/invites/${pendingInviteId}/reject`,
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
          setError(String(data.message ?? "Davet iptal edilemedi."));
          return;
        }

        setPendingByUserId((prev) => {
          const next = new Map(prev);
          next.delete(user.id);
          return next;
        });
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/servers/${serverId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username: user.username }),
        }
      );
      const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!response.ok) {
        setError(String(data.message ?? "Davet gönderilemedi."));
        return;
      }

      const inviteId = String(data.inviteId ?? data.InviteId ?? "");
      if (inviteId) {
        setPendingByUserId((prev) => new Map(prev).set(user.id, inviteId));
      }
      onInvited?.();
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setActionUserId(null);
    }
  };

  if (!isOpen) return null;

  const queryLen = normalizeQuery(query).length;
  const showResults = queryLen >= 2 || searching || results.length > 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        <h2 className="font-libre text-xl text-stone-900">Üye Davet Et</h2>
        <p className="mt-1 font-hanken text-sm text-stone-500">
          <span className="font-semibold text-stone-700">{serverName}</span>{" "}
          sunucusuna linkle veya kullanıcı arayarak davet et.
        </p>

        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <p className="font-hanken text-xs font-bold uppercase tracking-wider text-stone-400">
              Davet linki
            </p>
            <p className="mt-1 font-hanken text-xs text-stone-500">
              Linki kopyala ve paylaş. Açan kişi giriş yapınca sunucuya katılır.
            </p>
            {inviteLink && (
              <p className="mt-2 break-all rounded-lg bg-white px-2.5 py-2 font-hanken text-xs text-stone-700 ring-1 ring-stone-200">
                {inviteLink}
              </p>
            )}
            <button
              type="button"
              disabled={linkBusy}
              onClick={() => void handleCopyInviteLink()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary-container px-3 py-2 font-hanken text-xs font-semibold text-white transition hover:bg-[#8f1b1c] disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">
                {linkCopied ? "check" : "link"}
              </span>
              {linkBusy
                ? "Hazırlanıyor..."
                : linkCopied
                  ? "Kopyalandı"
                  : inviteLink
                    ? "Linki kopyala"
                    : "Link oluştur ve kopyala"}
            </button>
          </div>

          <label className="block space-y-1">
            <span className="font-hanken text-xs font-bold uppercase tracking-wider text-stone-400">
              Kullanıcı ara
            </span>
            <input
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                setError("");
                if (searchTimer.current) clearTimeout(searchTimer.current);
                searchTimer.current = setTimeout(() => {
                  void runSearch(value);
                }, 300);
              }}
              placeholder="kullaniciadi"
              autoComplete="off"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 font-hanken text-sm text-stone-900 outline-none focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20"
            />
          </label>

          {showResults && (
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-2 custom-scrollbar">
              {searching && (
                <p className="px-2 py-1.5 font-hanken text-xs text-stone-400">
                  Aranıyor...
                </p>
              )}
              {!searching && results.length === 0 && queryLen >= 2 && (
                <p className="px-2 py-1.5 font-hanken text-xs text-stone-400">
                  &quot;{normalizeQuery(query)}&quot; için sonuç yok.
                </p>
              )}
              {!searching &&
                results.map((user) => {
                  const isMember = memberIds.has(user.id);
                  const isPending = pendingByUserId.has(user.id);
                  const busy = actionUserId === user.id;

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-2 rounded-lg px-2 py-2 ${
                        user.isFriend ? "bg-white ring-1 ring-primary-container/10" : ""
                      }`}
                    >
                      <Avatar name={user.username} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-hanken text-sm text-stone-800">
                          @{user.username}
                        </p>
                        {isMember ? (
                          <p className="font-hanken text-[10px] text-stone-500">
                            Üye
                          </p>
                        ) : isPending ? (
                          <p className="font-hanken text-[10px] text-amber-700">
                            Davet bekliyor
                          </p>
                        ) : user.isFriend ? (
                          <p className="font-hanken text-[10px] text-emerald-700">
                            Arkadaş
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        disabled={busy || isMember}
                        onClick={() => void toggleInvite(user)}
                        className={`shrink-0 rounded-lg px-3 py-1.5 font-hanken text-[11px] font-semibold transition-colors disabled:opacity-60 ${
                          isMember
                            ? "bg-stone-100 text-stone-400"
                            : isPending
                              ? "bg-stone-200 text-stone-700 hover:bg-stone-300"
                              : "bg-primary-container text-white hover:bg-[#8f1b1c]"
                        }`}
                      >
                        {busy
                          ? "..."
                          : isMember
                            ? "Üye"
                            : isPending
                              ? "İptal"
                              : "Davet Et"}
                      </button>
                    </div>
                  );
                })}
            </div>
          )}

          {error && (
            <p className="font-hanken text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 font-hanken text-sm text-stone-600 hover:bg-stone-100"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
