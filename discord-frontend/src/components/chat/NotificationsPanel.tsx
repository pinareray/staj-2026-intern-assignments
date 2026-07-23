"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "@/services";

export type MentionNotificationItem = {
  id: string;
  type: string;
  actorUserId: string;
  actorUsername: string;
  serverId: string | null;
  channelId: string;
  messageId: string;
  channelName: string;
  preview: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  inviteCount: number;
  onOpenInvites: () => void;
  onOpenMention: (item: MentionNotificationItem) => void;
  refreshKey?: number;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPanel({
  isOpen,
  onClose,
  inviteCount,
  onOpenInvites,
  onOpenMention,
  refreshKey = 0,
}: NotificationsPanelProps) {
  const [items, setItems] = useState<MentionNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError("Bildirimler yüklenemedi.");
        setItems([]);
        return;
      }
      const data = (await response.json()) as Record<string, unknown>;
      const list = Array.isArray(data.items)
        ? data.items
        : Array.isArray(data.Items)
          ? data.Items
          : [];
      setItems(
        list.map((n: Record<string, unknown>) => ({
          id: String(n.id ?? n.Id ?? ""),
          type: String(n.type ?? n.Type ?? "mention"),
          actorUserId: String(n.actorUserId ?? n.ActorUserId ?? ""),
          actorUsername: String(n.actorUsername ?? n.ActorUsername ?? "Kullanıcı"),
          serverId: (n.serverId ?? n.ServerId ?? null) as string | null,
          channelId: String(n.channelId ?? n.ChannelId ?? ""),
          messageId: String(n.messageId ?? n.MessageId ?? ""),
          channelName: String(n.channelName ?? n.ChannelName ?? "kanal"),
          preview: (n.preview ?? n.Preview ?? null) as string | null,
          isRead: Boolean(n.isRead ?? n.IsRead),
          createdAt: String(n.createdAt ?? n.CreatedAt ?? ""),
        }))
      );
    } catch {
      setError("Bildirimler yüklenemedi.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void load();
  }, [isOpen, load, refreshKey]);

  if (!isOpen) return null;

  const markRead = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <h3 className="font-libre text-base text-stone-900">Bildirimler</h3>
        <div className="flex items-center gap-1">
          {items.some((n) => !n.isRead) && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="rounded-lg px-2 py-1 font-hanken text-[11px] text-stone-500 hover:bg-stone-50 hover:text-primary-container"
            >
              Tümünü oku
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-50 hover:text-stone-700"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto custom-scrollbar">
        {inviteCount > 0 && (
          <button
            type="button"
            onClick={() => {
              onOpenInvites();
              onClose();
            }}
            className="flex w-full items-start gap-3 border-b border-stone-100 bg-amber-50/60 px-4 py-3 text-left transition hover:bg-amber-50"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <span className="material-symbols-outlined text-lg">mail</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-hanken text-sm font-semibold text-stone-900">
                {inviteCount} sunucu daveti
              </p>
              <p className="font-hanken text-xs text-stone-500">
                Davetleri görüntülemek için dokun
              </p>
            </div>
          </button>
        )}

        {loading && (
          <p className="px-4 py-8 text-center font-hanken text-sm text-stone-400">
            Yükleniyor...
          </p>
        )}

        {!loading && error && (
          <p className="px-4 py-6 text-center font-hanken text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && inviteCount === 0 && (
          <p className="px-4 py-8 text-center font-hanken text-sm text-stone-400">
            Henüz bildirimin yok.
          </p>
        )}

        {!loading &&
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                void markRead(item.id);
                onOpenMention(item);
                onClose();
              }}
              className={`flex w-full items-start gap-3 border-b border-stone-50 px-4 py-3 text-left transition hover:bg-stone-50 ${
                item.isRead ? "opacity-75" : "bg-primary-container/[0.04]"
              }`}
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container/15 font-libre text-sm font-bold uppercase text-primary-container">
                {item.actorUsername.charAt(0) || "?"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-hanken text-sm text-stone-900">
                  <span className="font-semibold">@{item.actorUsername}</span>{" "}
                  <span className="text-stone-600">sizden bahsetti</span>
                  {!item.isRead && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary-container align-middle" />
                  )}
                </p>
                <p className="mt-0.5 truncate font-hanken text-xs text-stone-500">
                  #
                  {item.channelName}
                  {item.preview ? ` · ${item.preview}` : ""}
                </p>
                <p className="mt-1 font-hanken text-[10px] text-stone-400">
                  {formatTime(item.createdAt)}
                </p>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
