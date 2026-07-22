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
  const [searching, setSearching] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMembers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/servers/${serverId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) return;

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setMemberIds(
        new Set(
          list.map((m: Record<string, unknown>) => String(m.userId ?? m.UserId))
        )
      );
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
    void loadMembers();
  }, [isOpen, loadMembers]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const toggleInvite = async (user: UserSearchHit) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const isMember = memberIds.has(user.id);
    setActionUserId(user.id);
    setError("");

    try {
      if (isMember) {
        const response = await fetch(
          `${API_BASE_URL}/api/servers/${serverId}/members/${user.id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        if (!response.ok) {
          setError(String(data.message ?? "Davet geri çekilemedi."));
          return;
        }

        setMemberIds((prev) => {
          const next = new Set(prev);
          next.delete(user.id);
          return next;
        });
      } else {
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
          setError(String(data.message ?? "Davet edilemedi."));
          return;
        }

        setMemberIds((prev) => new Set(prev).add(user.id));
        onInvited?.();
      }
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
          sunucusuna kullanıcı ekle.
        </p>

        <div className="mt-5 space-y-4">
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
                  const invited = memberIds.has(user.id);
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
                        {user.isFriend && (
                          <p className="font-hanken text-[10px] text-emerald-700">
                            Arkadaş
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleInvite(user)}
                        className={`shrink-0 rounded-lg px-3 py-1.5 font-hanken text-[11px] font-semibold transition-colors disabled:opacity-60 ${
                          invited
                            ? "bg-stone-200 text-stone-700 hover:bg-stone-300"
                            : "bg-primary-container text-white hover:bg-[#8f1b1c]"
                        }`}
                      >
                        {busy
                          ? "..."
                          : invited
                            ? "Davet Edildi"
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
