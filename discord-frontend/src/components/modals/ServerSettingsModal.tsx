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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
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
    setConfirmDelete(false);
    setError("");
    setLeaving(false);
    setDeleting(false);
    setActionId(null);
    setCurrentUserId(localStorage.getItem("userId") ?? "");
    void loadMembers();
  }, [isOpen, loadMembers]);

  if (!isOpen) return null;

  const myRole =
    members.find((m) => m.userId === currentUserId)?.role ?? "";
  const isOwner = myRole.toLowerCase() === "owner";
  const isAdmin = myRole.toLowerCase() === "admin";
  const canManageMembers = isOwner || isAdmin;

  const handleLeave = async () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      setConfirmDelete(false);
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

  const handleDeleteServer = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setConfirmLeave(false);
      setError("");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/servers/${serverId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          String((data as { message?: string }).message ?? "Sunucu silinemedi.")
        );
      }
      onLeftServer?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sunucu silinemedi.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionId(userId);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/servers/${serverId}/members/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          String((data as { message?: string }).message ?? "Üye çıkarılamadı.")
        );
      }
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Üye çıkarılamadı.");
    } finally {
      setActionId(null);
    }
  };

  const handleSetRole = async (userId: string, role: "Admin" | "Member") => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionId(userId);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/servers/${serverId}/members/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          String((data as { message?: string }).message ?? "Rol güncellenemedi.")
        );
      }
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rol güncellenemedi.");
    } finally {
      setActionId(null);
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

        <div className="mb-6 shrink-0 space-y-1">
          <h2 className="font-libre text-2xl text-[#e6e2d9]">Sunucu Ayarları</h2>
          <p className="font-hanken text-sm text-[#e1bfbd]/80">
            <span className="text-[#e6e2d9]">{serverName}</span> üyelerini ve
            ayarlarını yönet.
          </p>
        </div>

        <div className="mb-5 flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onInvite}
            className="flex-1 rounded-xl bg-[#ad2831] py-2.5 font-hanken text-sm font-semibold text-[#e6e2d9] transition-colors hover:bg-[#8f1b1c]"
          >
            Davet Et
          </button>
          <button
            type="button"
            onClick={onChannelSettings}
            className="flex-1 rounded-xl border border-[#594140]/40 py-2.5 font-hanken text-sm font-semibold text-[#e1bfbd] transition-colors hover:bg-white/5"
          >
            Kanallar
          </button>
        </div>

        <div className="mb-2 shrink-0">
          <h3 className="font-hanken text-[10px] font-bold uppercase tracking-widest text-[#e1bfbd]/50">
            Üyeler
          </h3>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto">
          {loading && (
            <p className="py-4 text-center font-hanken text-sm text-[#e1bfbd]/70">
              Yükleniyor...
            </p>
          )}

          {!loading && members.length === 0 && (
            <p className="py-4 text-center font-hanken text-sm text-[#e1bfbd]/70">
              Üye bulunamadı.
            </p>
          )}

          {!loading &&
            members.map((member) => {
              const isMe = member.userId === currentUserId;
              const role = member.role.toLowerCase();
              const targetIsOwner = role === "owner";
              const targetIsAdmin = role === "admin";
              const canKick =
                canManageMembers &&
                !isMe &&
                !targetIsOwner &&
                (isOwner || !targetIsAdmin);

              return (
                <div
                  key={member.userId}
                  className="rounded-xl border border-[#594140]/30 bg-[#1c1c16]/80 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ad2831]/20">
                      <span className="font-libre text-xs font-bold uppercase text-[#e1bfbd]">
                        {member.username.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-hanken text-sm text-[#e6e2d9]">
                        {member.username}
                        {isMe && (
                          <span className="ml-1.5 text-[10px] text-[#e1bfbd]/50">
                            (sen)
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 font-hanken text-[10px] font-semibold uppercase tracking-wider ${roleBadgeClass(member.role)}`}
                    >
                      {roleLabel(member.role)}
                    </span>
                  </div>

                  {(isOwner || canKick) && !targetIsOwner && !isMe && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {isOwner && !targetIsAdmin && (
                        <button
                          type="button"
                          disabled={actionId === member.userId}
                          onClick={() =>
                            void handleSetRole(member.userId, "Admin")
                          }
                          className="rounded-lg border border-[#594140]/40 px-2.5 py-1 font-hanken text-[11px] font-semibold text-[#e1bfbd] hover:bg-white/5 disabled:opacity-50"
                        >
                          Yönetici yap
                        </button>
                      )}
                      {isOwner && targetIsAdmin && (
                        <button
                          type="button"
                          disabled={actionId === member.userId}
                          onClick={() =>
                            void handleSetRole(member.userId, "Member")
                          }
                          className="rounded-lg border border-[#594140]/40 px-2.5 py-1 font-hanken text-[11px] font-semibold text-[#e1bfbd] hover:bg-white/5 disabled:opacity-50"
                        >
                          Yetkiyi al
                        </button>
                      )}
                      {canKick && (
                        <button
                          type="button"
                          disabled={actionId === member.userId}
                          onClick={() =>
                            void handleRemoveMember(member.userId)
                          }
                          className="rounded-lg border border-[#ad2831]/40 px-2.5 py-1 font-hanken text-[11px] font-semibold text-[#ffb3b0] hover:bg-[#ad2831]/15 disabled:opacity-50"
                        >
                          Çıkar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {error && (
          <p className="mt-4 shrink-0 rounded-lg border border-[#ad2831]/30 bg-[#ad2831]/15 px-4 py-3 font-hanken text-sm text-[#ffb3b0]">
            {error}
          </p>
        )}

        <div className="mt-6 shrink-0 space-y-2">
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
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleDeleteServer()}
              className={`w-full rounded-xl py-3 font-hanken font-semibold transition-all disabled:opacity-60 ${
                confirmDelete
                  ? "bg-[#ad2831] text-[#e6e2d9] hover:bg-[#8f1b1c]"
                  : "border border-[#ad2831]/40 text-[#ffb3b0] hover:bg-[#ad2831]/15"
              }`}
            >
              {deleting
                ? "Siliniyor..."
                : confirmDelete
                  ? "Emin misin? Sunucuyu sil"
                  : "Sunucuyu Sil"}
            </button>
          )}
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
