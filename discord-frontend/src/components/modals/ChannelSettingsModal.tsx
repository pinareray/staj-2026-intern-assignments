"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, deleteChannel } from "@/services";
import type { ChannelItem } from "@/models";

type ServerMember = {
  userId: string;
  username: string;
  role: string;
};

type ChannelSettingsModalProps = {
  isOpen: boolean;
  serverId: string;
  serverName: string;
  channels: ChannelItem[];
  onClose: () => void;
  onChanged: () => void;
  canManage?: boolean;
};

function channelTypeLabel(type: string) {
  if (type === "Announcement") return "Duyuru";
  if (type === "Voice") return "Ses";
  return "Sohbet";
}

function channelTypeIcon(type: string) {
  if (type === "Announcement") return "campaign";
  if (type === "Voice") return "volume_up";
  return "tag";
}

function roleLabel(role: string) {
  if (role === "Owner") return "Sahip";
  if (role === "Admin") return "Yönetici";
  return "Üye";
}

function roleBadgeClass(role: string) {
  if (role === "Owner") return "bg-[#ad2831]/25 text-[#ffb3b0]";
  if (role === "Admin") return "bg-[#594140]/50 text-[#e1bfbd]";
  return "bg-white/5 text-[#e1bfbd]/70";
}

export default function ChannelSettingsModal({
  isOpen,
  serverId,
  serverName,
  channels,
  onClose,
  onChanged,
  canManage = false,
}: ChannelSettingsModalProps) {
  const [tab, setTab] = useState<"channels" | "members">("channels");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setMembersLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/servers/${serverId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) return;

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setMembers(
        list.map((m: Record<string, unknown>) => ({
          userId: String(m.userId ?? m.UserId),
          username: String(m.username ?? m.Username ?? "Kullanıcı"),
          role: String(m.role ?? m.Role ?? "Member"),
        }))
      );
    } catch {
      // ignore
    } finally {
      setMembersLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    if (!isOpen) return;
    setTab("channels");
    setConfirmId(null);
    setError("");
    void loadMembers();
  }, [isOpen, loadMembers]);

  if (!isOpen) return null;

  const handleDelete = async (channel: ChannelItem) => {
    if (confirmId !== channel.id) {
      setConfirmId(channel.id);
      setError("");
      return;
    }

    setDeletingId(channel.id);
    setError("");

    try {
      await deleteChannel(channel.id);
      setConfirmId(null);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kanal silinemedi.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative flex max-h-[80vh] w-full max-w-[440px] flex-col rounded-2xl border border-[#594140]/40 bg-[#250902] p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[#e1bfbd]/70 transition-colors hover:text-[#e6e2d9]"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-4 shrink-0 space-y-1">
          <h2 className="font-libre text-2xl text-[#e6e2d9]">Kanal Ayarları</h2>
          <p className="font-hanken text-sm text-[#e1bfbd]/80">
            <span className="text-[#e6e2d9]">{serverName}</span> · kanallar ve
            üyeler
          </p>
        </div>

        <div className="mb-4 flex shrink-0 gap-1 rounded-xl bg-black/20 p-1">
          {(
            [
              { id: "channels" as const, label: "Kanallar", icon: "tag" },
              { id: "members" as const, label: "Üyeler", icon: "group" },
            ] as const
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-hanken text-xs font-semibold transition-colors ${
                  active
                    ? "bg-[#ad2831]/30 text-[#e6e2d9]"
                    : "text-[#e1bfbd]/70 hover:bg-white/5 hover:text-[#e6e2d9]"
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {t.icon}
                </span>
                {t.label}
                {t.id === "members" && members.length > 0 && (
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px]">
                    {members.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {tab === "channels" && !canManage && (
          <p className="mb-4 shrink-0 rounded-lg border border-[#594140]/30 bg-white/5 px-4 py-3 font-hanken text-sm text-[#e1bfbd]/70">
            Kanal silmek için Owner/Admin olmalısın.
          </p>
        )}

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto custom-scrollbar">
          {tab === "channels" && (
            <>
              {channels.length === 0 && (
                <p className="py-4 text-center font-hanken text-sm text-[#e1bfbd]/70">
                  Bu sunucuda silinecek kanal yok.
                </p>
              )}

              {channels.map((channel) => {
                const isConfirming = confirmId === channel.id;
                const isDeleting = deletingId === channel.id;

                return (
                  <div
                    key={channel.id}
                    className="flex items-center gap-3 rounded-xl border border-[#594140]/30 bg-[#1c1c16]/80 px-4 py-3"
                  >
                    <span className="material-symbols-outlined shrink-0 text-xl text-[#e1bfbd]/70">
                      {channelTypeIcon(channel.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-hanken text-sm text-[#e6e2d9]">
                        {channel.name}
                      </div>
                      <div className="font-hanken text-[10px] uppercase tracking-wider text-[#e1bfbd]/50">
                        {channelTypeLabel(channel.type)}
                      </div>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => void handleDelete(channel)}
                        className={`shrink-0 rounded-lg px-3 py-1.5 font-hanken text-xs font-semibold transition-colors disabled:opacity-60 ${
                          isConfirming
                            ? "bg-[#ad2831] text-[#e6e2d9] hover:bg-[#8f1b1c]"
                            : "border border-[#594140]/40 text-[#e1bfbd] hover:bg-white/5"
                        }`}
                      >
                        {isDeleting
                          ? "Siliniyor..."
                          : isConfirming
                            ? "Emin misin?"
                            : "Sil"}
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {tab === "members" && (
            <>
              {membersLoading && (
                <p className="py-4 text-center font-hanken text-sm text-[#e1bfbd]/70">
                  Üyeler yükleniyor...
                </p>
              )}
              {!membersLoading && members.length === 0 && (
                <p className="py-4 text-center font-hanken text-sm text-[#e1bfbd]/70">
                  Bu sunucuda üye bulunamadı.
                </p>
              )}
              {!membersLoading &&
                members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 rounded-xl border border-[#594140]/30 bg-[#1c1c16]/80 px-4 py-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ad2831]/20">
                      <span className="font-libre text-sm font-bold uppercase text-[#ffb3b0]">
                        {member.username.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-hanken text-sm text-[#e6e2d9]">
                        @{member.username}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 font-hanken text-[10px] font-semibold ${roleBadgeClass(
                        member.role
                      )}`}
                    >
                      {roleLabel(member.role)}
                    </span>
                  </div>
                ))}
            </>
          )}
        </div>

        {error && (
          <p className="mt-4 shrink-0 rounded-lg border border-[#ad2831]/30 bg-[#ad2831]/15 px-4 py-3 font-hanken text-sm text-[#ffb3b0]">
            {error}
          </p>
        )}

        <div className="mt-6 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-[#594140]/40 py-3 font-hanken text-[#e1bfbd] transition-all hover:bg-white/5"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
