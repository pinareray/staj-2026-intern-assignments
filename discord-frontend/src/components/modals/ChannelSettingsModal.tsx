"use client";

import { useState } from "react";
import { deleteChannel } from "@/services";
import type { ChannelItem } from "@/models";

type ChannelSettingsModalProps = {
  isOpen: boolean;
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

export default function ChannelSettingsModal({
  isOpen,
  serverName,
  channels,
  onClose,
  onChanged,
  canManage = false,
}: ChannelSettingsModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");

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
      setError(
        err instanceof Error ? err.message : "Kanal silinemedi."
      );
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

      <div className="relative w-full max-w-[440px] rounded-2xl bg-[#250902] border border-[#594140]/40 shadow-2xl p-8 max-h-[80vh] flex flex-col">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[#e1bfbd]/70 hover:text-[#e6e2d9] transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-6 space-y-1 shrink-0">
          <h2 className="font-libre text-2xl text-[#e6e2d9]">Kanal Ayarları</h2>
          <p className="text-sm text-[#e1bfbd]/80 font-hanken">
            <span className="text-[#e6e2d9]">{serverName}</span> sunucusundaki
            kanalları yönet.
          </p>
        </div>

        {!canManage && (
          <p className="mb-4 text-sm text-[#e1bfbd]/70 bg-white/5 border border-[#594140]/30 rounded-lg px-4 py-3 font-hanken shrink-0">
            Kanal silmek için Owner/Admin olmalısın.
          </p>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-0">
          {channels.length === 0 && (
            <p className="text-sm text-[#e1bfbd]/70 font-hanken py-4 text-center">
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
                <span className="material-symbols-outlined text-[#e1bfbd]/70 text-xl shrink-0">
                  {channelTypeIcon(channel.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#e6e2d9] font-hanken truncate">
                    {channel.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[#e1bfbd]/50 font-hanken">
                    {channelTypeLabel(channel.type)}
                  </div>
                </div>
                {canManage && (
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void handleDelete(channel)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-hanken font-semibold transition-colors disabled:opacity-60 ${
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
        </div>

        {error && (
          <p className="mt-4 text-sm text-[#ffb3b0] bg-[#ad2831]/15 border border-[#ad2831]/30 rounded-lg px-4 py-3 font-hanken shrink-0">
            {error}
          </p>
        )}

        <div className="mt-6 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-[#594140]/40 text-[#e1bfbd] py-3 font-hanken hover:bg-white/5 transition-all"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
