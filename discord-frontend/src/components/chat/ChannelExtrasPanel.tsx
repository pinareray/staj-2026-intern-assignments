"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@/services";
import type { ChatMessage } from "@/models";

type ServerMember = {
  userId: string;
  username: string;
  role: string;
};

type ChannelExtrasPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  channelId: string | null;
  channelName: string;
  serverId: string | null;
  initialTab?: "members" | "pins";
  onUnpin?: (messageId: string) => void;
};

function roleLabel(role: string) {
  if (role === "Owner") return "Sahip";
  if (role === "Admin") return "Yönetici";
  return "Üye";
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ChannelExtrasPanel({
  isOpen,
  onClose,
  channelId,
  channelName,
  serverId,
  initialTab = "members",
  onUnpin,
}: ChannelExtrasPanelProps) {
  const [tab, setTab] = useState<"members" | "pins">(initialTab);
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [pins, setPins] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      if (serverId) {
        const membersRes = await fetch(
          `${API_BASE_URL}/api/servers/${serverId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (membersRes.ok) {
          const data = await membersRes.json();
          const list = Array.isArray(data) ? data : [];
          setMembers(
            list.map((m: Record<string, unknown>) => ({
              userId: String(m.userId ?? m.UserId),
              username: String(m.username ?? m.Username ?? "Kullanıcı"),
              role: String(m.role ?? m.Role ?? "Member"),
            }))
          );
        }
      } else {
        setMembers([]);
      }

      if (channelId) {
        const pinsRes = await fetch(
          `${API_BASE_URL}/api/messages/pinned?channelId=${encodeURIComponent(channelId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (pinsRes.ok) {
          const data = await pinsRes.json();
          const list = Array.isArray(data) ? data : [];
          setPins(
            list.map((m: Record<string, unknown>) => ({
              id: String(m.id ?? m.Id),
              content: String(m.content ?? m.Content ?? ""),
              userId: String(m.userId ?? m.UserId),
              username: String(m.username ?? m.Username ?? "Kullanıcı"),
              channelId: String(m.channelId ?? m.ChannelId ?? channelId),
              createdAt: String(m.createdAt ?? m.CreatedAt ?? ""),
              editedAt: (m.editedAt ?? m.EditedAt ?? null) as string | null,
              attachmentUrl: (m.attachmentUrl ??
                m.AttachmentUrl ??
                null) as string | null,
              isPinned: true,
            }))
          );
        }
      } else {
        setPins([]);
      }
    } catch {
      setError("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [channelId, serverId]);

  useEffect(() => {
    if (!isOpen) return;
    const nextTab =
      !serverId && initialTab === "members" ? "pins" : initialTab;
    setTab(nextTab);
    void load();
  }, [isOpen, initialTab, load, serverId]);

  const handleUnpin = async (messageId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionId(messageId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/${messageId}/pin`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        setError(String(data.message ?? "Sabit kaldırılamadı."));
        return;
      }
      setPins((prev) => prev.filter((p) => p.id !== messageId));
      onUnpin?.(messageId);
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setActionId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-stone-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-stone-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate font-libre text-lg text-stone-900">
              #{channelName || "kanal"}
            </h2>
            <p className="font-hanken text-xs text-stone-500">
              {serverId ? "Üyeler ve sabit mesajlar" : "Sabit mesajlar"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="flex shrink-0 gap-1 border-b border-stone-200 px-3 pt-3">
          {(
            [
              ...(serverId
                ? [
                    {
                      id: "members" as const,
                      label: "Üyeler",
                      icon: "group",
                      count: members.length,
                    },
                  ]
                : []),
              {
                id: "pins" as const,
                label: "Sabit mesajlar",
                icon: "push_pin",
                count: pins.length,
              },
            ] as const
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-t-xl px-2 py-2.5 font-hanken text-xs font-semibold transition-colors ${
                  active
                    ? "bg-stone-50 text-primary-container"
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {t.icon}
                </span>
                <span className="truncate">{t.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                    active
                      ? "bg-primary-container/15 text-primary-container"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-stone-50 px-5 py-4 custom-scrollbar">
          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-hanken text-xs text-red-700">
              {error}
            </p>
          )}

          {loading && (
            <p className="py-8 text-center font-hanken text-sm text-stone-400">
              Yükleniyor...
            </p>
          )}

          {!loading && tab === "members" && (
            <>
              {!serverId ? (
                <p className="rounded-xl border border-dashed border-stone-200 bg-white px-3 py-6 text-center font-hanken text-sm text-stone-400">
                  Üye listesi sunucu kanallarında görünür.
                </p>
              ) : members.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-200 bg-white px-3 py-6 text-center font-hanken text-sm text-stone-400">
                  Üye bulunamadı.
                </p>
              ) : (
                members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container/10">
                      <span className="font-libre text-sm font-bold uppercase text-primary-container">
                        {m.username.charAt(0) || "?"}
                      </span>
                    </div>
                    <p className="min-w-0 flex-1 truncate font-hanken text-sm text-stone-800">
                      @{m.username}
                    </p>
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 font-hanken text-[10px] font-semibold text-stone-500">
                      {roleLabel(m.role)}
                    </span>
                  </div>
                ))
              )}
            </>
          )}

          {!loading && tab === "pins" && (
            <>
              {!channelId ? (
                <p className="rounded-xl border border-dashed border-stone-200 bg-white px-3 py-6 text-center font-hanken text-sm text-stone-400">
                  Sabit mesajlar için bir kanal seç.
                </p>
              ) : pins.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-200 bg-white px-3 py-6 text-center font-hanken text-sm text-stone-400">
                  Bu kanalda sabit mesaj yok. Mesajdaki iğne ikonuyla sabitle.
                </p>
              ) : (
                pins.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-stone-200 bg-white p-3"
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-base text-primary-container"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        push_pin
                      </span>
                      <button
                        type="button"
                        className="truncate font-hanken text-xs font-semibold text-primary-container hover:underline"
                      >
                        @{p.username}
                      </button>
                      <span className="ml-auto font-hanken text-[10px] text-stone-400">
                        {formatTime(p.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words font-hanken text-sm text-stone-800">
                      {p.content || (p.attachmentUrl ? "(dosya eki)" : "")}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={actionId === p.id}
                        onClick={() => void handleUnpin(p.id)}
                        className="rounded-lg px-2.5 py-1 font-hanken text-[11px] font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50"
                      >
                        {actionId === p.id ? "..." : "Sabiti kaldır"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
