"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FriendItem = {
  friendshipId: string;
  userId: string;
  username: string;
  status: string;
  isIncoming: boolean;
};

type FriendsListProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function FriendsList({ isOpen, onClose }: FriendsListProps) {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const loadFriends = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:5243/api/friends", {
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

  useEffect(() => {
    if (isOpen) {
      void loadFriends();
    }
  }, [isOpen, loadFriends]);

  if (!isOpen) return null;

  const handleAddFriend = async (e: FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setSending(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("http://localhost:5243/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: name }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(
          String(
            (data as { message?: string }).message ??
              "İstek gönderilemedi."
          )
        );
        return;
      }

      setUsername("");
      setSuccess(`@${name} kullanıcısına istek gönderildi.`);
      await loadFriends();
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5243/api/friends/accept", {
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

      await loadFriends();
    } catch {
      setError("Sunucuya bağlanılamadı.");
    }
  };

  const accepted = friends.filter((f) => f.status === "Accepted");
  const pending = friends.filter((f) => f.status === "Pending" && f.isIncoming);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside className="relative z-10 w-full max-w-sm h-full bg-white border-l border-stone-200 shadow-2xl flex flex-col">
        <header className="h-16 px-5 flex items-center justify-between border-b border-stone-200 shrink-0">
          <h2 className="font-libre text-lg text-stone-900">Arkadaşlar</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <form
          onSubmit={handleAddFriend}
          className="p-4 border-b border-stone-100 space-y-2"
        >
          <label className="block text-[10px] uppercase tracking-widest text-stone-400 font-hanken font-bold">
            Kullanıcı adı ile ara
          </label>
          <div className="flex gap-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ör. pinar_ery"
              disabled={sending}
              className="flex-1 rounded-xl bg-stone-50 border border-stone-200 px-3 py-2.5 text-sm text-stone-900 outline-none focus:ring-1 focus:ring-primary-container/40 font-hanken"
            />
            <button
              type="submit"
              disabled={sending || !username.trim()}
              className="rounded-xl bg-primary-container text-white px-4 text-sm font-hanken font-semibold hover:bg-[#8f1b1c] disabled:opacity-50 transition-colors"
            >
              Ekle
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-600 font-hanken">{error}</p>
          )}
          {success && (
            <p className="text-xs text-emerald-700 font-hanken">{success}</p>
          )}
        </form>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {loading && (
            <p className="text-sm text-stone-400 font-hanken">Yükleniyor...</p>
          )}

          {!loading && pending.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                Gelen İstekler
              </h3>
              {pending.map((f) => (
                <div
                  key={f.friendshipId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-container/10 flex items-center justify-center">
                    <span className="font-libre text-sm text-primary-container uppercase font-bold">
                      {f.username.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push(
                          `/profile/${encodeURIComponent(f.username)}`
                        );
                      }}
                      className="text-sm font-hanken text-stone-900 truncate hover:text-primary-container hover:underline text-left"
                    >
                      {f.username}
                    </button>
                    <p className="text-[10px] text-stone-400">Bekliyor</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAccept(f.friendshipId)}
                    className="text-xs font-hanken font-semibold text-primary-container hover:underline"
                  >
                    Kabul et
                  </button>
                </div>
              ))}
            </section>
          )}

          {!loading && (
            <section className="space-y-2">
              <h3 className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                Arkadaşlar ({accepted.length})
              </h3>
              {accepted.length === 0 && (
                <p className="text-sm text-stone-400 font-hanken">
                  Henüz arkadaşın yok. Yukarıdan kullanıcı adı ile iste
                  gönderebilirsin.
                </p>
              )}
              {accepted.map((f) => (
                <button
                  key={f.friendshipId}
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/profile/${encodeURIComponent(f.username)}`);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center">
                    <span className="font-libre text-sm text-stone-600 uppercase font-bold">
                      {f.username.charAt(0)}
                    </span>
                  </div>
                  <p className="text-sm font-hanken text-stone-900 truncate">
                    {f.username}
                  </p>
                </button>
              ))}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
