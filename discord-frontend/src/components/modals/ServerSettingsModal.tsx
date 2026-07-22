"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, leaveServer } from "@/services";

type ServerMember = {
  userId: string;
  username: string;
  role: string;
};

type ServerSettingsModalProps = {
  isOpen: boolean;
  serverId: string;
  serverName: string;
  onClose: () => void;
  onLeftServer?: () => void;
  onInvite: () => void;
  onChannelSettings: () => void;
};

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

export default function ServerSettingsModal({
  isOpen,
  serverId,
  serverName,
  onClose,
  onLeftServer,
  onInvite,
  onChannelSettings,
}: ServerSettingsModalProps) {
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const loadMembers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/servers/${serverId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        setError("Üyeler yüklenemedi.");
        setMembers([]);
        return;
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setMembers(
        list.map((m: Record<string, unknown>) => ({
          userId: String(m.userId ?? m.UserId ?? ""),
          username: String(m.username ?? m.Username ?? "?"),
          role: String(m.role ?? m.Role ?? "Member"),
        }))
      );
    } catch {
      setError("Üyeler yüklenemedi.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    if (!isOpen) return;
    setConfirmLeave(false);
    setError("");
    setLeaving(false);
    setCurrentUserId(localStorage.getItem("userId") ?? "");
    void loadMembers();
  }, [isOpen, loadMembers]);

  if (!isOpen) return null;

  const myRole =
    members.find((m) => m.userId === currentUserId)?.role ?? "";
  const isOwner = myRole.toLowerCase() === "owner";

  const handleLeave = async () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      setError("");
      return;
    }

    setLeaving(true);
    setError("");
    try {
      await leaveServer(serverId);
      onLeftServer?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sunucudan ayrılılamadı."
      );
      setConfirmLeave(false);
    } finally {
      setLeaving(false);
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
          <h2 className="font-libre text-2xl text-[#e6e2d9]">Sunucu Ayarları</h2>
          <p className="text-sm text-[#e1bfbd]/80 font-hanken">
            <span className="text-[#e6e2d9]">{serverName}</span> üyelerini ve
            ayarlarını yönet.
          </p>
        </div>

        <div className="flex gap-2 mb-5 shrink-0">
          <button
            type="button"
            onClick={onInvite}
            className="flex-1 rounded-xl bg-[#ad2831] text-[#e6e2d9] py-2.5 text-sm font-hanken font-semibold hover:bg-[#8f1b1c] transition-colors"
          >
            Davet Et
          </button>
          <button
            type="button"
            onClick={onChannelSettings}
            className="flex-1 rounded-xl border border-[#594140]/40 text-[#e1bfbd] py-2.5 text-sm font-hanken font-semibold hover:bg-white/5 transition-colors"
          >
            Kanallar
          </button>
        </div>

        <div className="mb-2 shrink-0">
          <h3 className="text-[10px] uppercase tracking-widest text-[#e1bfbd]/50 font-hanken font-bold">
            Üyeler
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-0">
          {loading && (
            <p className="text-sm text-[#e1bfbd]/70 font-hanken py-4 text-center">
              Yükleniyor...
            </p>
          )}

          {!loading && members.length === 0 && (
            <p className="text-sm text-[#e1bfbd]/70 font-hanken py-4 text-center">
              Üye bulunamadı.
            </p>
          )}

          {!loading &&
            members.map((member) => {
              const isMe = member.userId === currentUserId;
              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 rounded-xl border border-[#594140]/30 bg-[#1c1c16]/80 px-4 py-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ad2831]/20">
                    <span className="font-libre text-xs font-bold uppercase text-[#e1bfbd]">
                      {member.username.charAt(0) || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#e6e2d9] font-hanken truncate">
                      {member.username}
                      {isMe && (
                        <span className="ml-1.5 text-[10px] text-[#e1bfbd]/50">
                          (sen)
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider font-hanken font-semibold ${roleBadgeClass(member.role)}`}
                  >
                    {roleLabel(member.role)}
                  </span>
                </div>
              );
            })}
        </div>

        {error && (
          <p className="mt-4 text-sm text-[#ffb3b0] bg-[#ad2831]/15 border border-[#ad2831]/30 rounded-lg px-4 py-3 font-hanken shrink-0">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-2 shrink-0">
          {!isOwner && (
            <button
              type="button"
              disabled={leaving}
              onClick={() => void handleLeave()}
              className={`w-full rounded-xl py-3 font-hanken font-semibold transition-all disabled:opacity-60 ${
                confirmLeave
                  ? "bg-[#ad2831] text-[#e6e2d9] hover:bg-[#8f1b1c]"
                  : "border border-[#ad2831]/40 text-[#ffb3b0] hover:bg-[#ad2831]/15"
              }`}
            >
              {leaving
                ? "Ayrılıyor..."
                : confirmLeave
                  ? "Emin misin? Ayrıl"
                  : "Sunucudan Ayrıl"}
            </button>
          )}
          {isOwner && (
            <p className="text-xs text-[#e1bfbd]/50 font-hanken text-center py-1">
              Sunucu sahibi ayrılamaz.
            </p>
          )}
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
