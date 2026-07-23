"use client";

import { useEffect, useRef, useState } from "react";
import InviteMemberModal from "@/components/modals/InviteMemberModal";
import { API_BASE_URL, uploadMessageFile } from "@/services";

type SetupFlags = {
  invite: boolean;
  icon: boolean;
  message: boolean;
  dismissed: boolean;
};

type ServerSetupChecklistProps = {
  serverId: string;
  serverName: string;
  hasIcon: boolean;
  hasFirstMessage: boolean;
  onServerUpdated?: (patch: { name?: string; iconUrl?: string | null }) => void;
  onFocusComposer?: () => void;
};

const STORAGE_PREFIX = "micodex_setup_";

export function isServerSetupPending(serverId: string): boolean {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${serverId}`);
    if (!raw || raw === "done" || raw === "dismissed") return false;
    if (raw === "pending") return true;
    const parsed = JSON.parse(raw) as Partial<SetupFlags>;
    return !parsed.dismissed;
  } catch {
    return false;
  }
}

function loadFlags(serverId: string): SetupFlags | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${serverId}`);
    if (!raw) return null;
    if (raw === "pending") {
      return { invite: false, icon: false, message: false, dismissed: false };
    }
    if (raw === "done" || raw === "dismissed") {
      return { invite: true, icon: true, message: true, dismissed: true };
    }
    const parsed = JSON.parse(raw) as Partial<SetupFlags>;
    return {
      invite: Boolean(parsed.invite),
      icon: Boolean(parsed.icon),
      message: Boolean(parsed.message),
      dismissed: Boolean(parsed.dismissed),
    };
  } catch {
    return null;
  }
}

function saveFlags(serverId: string, flags: SetupFlags) {
  try {
    if (flags.dismissed || (flags.invite && flags.icon && flags.message)) {
      localStorage.setItem(`${STORAGE_PREFIX}${serverId}`, "done");
      return;
    }
    localStorage.setItem(`${STORAGE_PREFIX}${serverId}`, JSON.stringify(flags));
  } catch {
    // ignore
  }
}

export default function ServerSetupChecklist({
  serverId,
  serverName,
  hasIcon,
  hasFirstMessage,
  onServerUpdated,
  onFocusComposer,
}: ServerSetupChecklistProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [flags, setFlags] = useState<SetupFlags | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFlags(loadFlags(serverId));
    setError("");
  }, [serverId]);

  useEffect(() => {
    if (!flags || flags.dismissed) return;
    if (hasIcon && !flags.icon) {
      const next = { ...flags, icon: true };
      setFlags(next);
      saveFlags(serverId, next);
    }
  }, [hasIcon, flags, serverId]);

  useEffect(() => {
    if (!flags || flags.dismissed) return;
    if (hasFirstMessage && !flags.message) {
      const next = { ...flags, message: true };
      setFlags(next);
      saveFlags(serverId, next);
    }
  }, [hasFirstMessage, flags, serverId]);

  useEffect(() => {
    if (!flags || flags.dismissed) return;
    if (flags.invite && flags.icon && flags.message) {
      const next = { ...flags, dismissed: true };
      setFlags(next);
      saveFlags(serverId, next);
    }
  }, [flags, serverId]);

  if (!flags || flags.dismissed) return null;

  const markInvite = () => {
    const next = { ...flags, invite: true };
    setFlags(next);
    saveFlags(serverId, next);
  };

  const dismiss = () => {
    const next = { ...flags, dismissed: true };
    setFlags(next);
    saveFlags(serverId, next);
  };

  const handleIconUpload = async (file: File | null) => {
    if (!file) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setUploadingIcon(true);
    setError("");
    try {
      const uploaded = await uploadMessageFile(file);
      const response = await fetch(`${API_BASE_URL}/api/servers/${serverId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ iconUrl: uploaded.url }),
      });
      if (!response.ok) {
        throw new Error("Simge güncellenemedi.");
      }
      onServerUpdated?.({ iconUrl: uploaded.url });
      const next = { ...flags, icon: true };
      setFlags(next);
      saveFlags(serverId, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simge yüklenemedi.");
    } finally {
      setUploadingIcon(false);
    }
  };

  const steps: {
    id: keyof Pick<SetupFlags, "invite" | "icon" | "message">;
    label: string;
    icon: string;
    iconColor: string;
    done: boolean;
    onClick: () => void;
  }[] = [
    {
      id: "invite",
      label: "Arkadaşlarını davet et",
      icon: "person_add",
      iconColor: "text-[#95d5b2]",
      done: flags.invite,
      onClick: () => setInviteOpen(true),
    },
    {
      id: "icon",
      label: "Sunucunu bir simgeyle kişiselleştir",
      icon: "image",
      iconColor: "text-[#7eb8ff]",
      done: flags.icon,
      onClick: () => fileInputRef.current?.click(),
    },
    {
      id: "message",
      label: "İlk mesajını gönder",
      icon: "send",
      iconColor: "text-[#ffd6a5]",
      done: flags.message,
      onClick: () => onFocusComposer?.(),
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-xl space-y-5 py-6">
        <div className="text-center space-y-2 px-2">
          <h3 className="font-libre text-2xl text-stone-900">
            {serverName} sunucusuna hoş geldin!
          </h3>
          <p className="font-hanken text-sm text-stone-500 leading-relaxed">
            Yeni sunucunu kurmana yardımcı olacak birkaç adım seçtik. İstediğin
            zaman atlayabilirsin.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="font-hanken text-xs text-stone-400 hover:text-primary-container underline-offset-2 hover:underline"
          >
            Kurulumu atla
          </button>
        </div>

        <div className="space-y-2.5">
          {steps
            .filter((s) => !s.done)
            .map((step) => (
              <button
                key={step.id}
                type="button"
                disabled={step.id === "icon" && uploadingIcon}
                onClick={step.onClick}
                className="flex w-full items-center gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-left shadow-sm transition-colors hover:border-primary-container/40 hover:bg-[#faf8f5] disabled:opacity-60"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 ${step.iconColor}`}
                >
                  <span className="material-symbols-outlined">{step.icon}</span>
                </span>
                <span className="flex-1 font-hanken text-sm font-medium text-stone-800">
                  {step.id === "icon" && uploadingIcon
                    ? "Simge yükleniyor..."
                    : step.label}
                </span>
                <span className="material-symbols-outlined text-stone-400">
                  chevron_right
                </span>
              </button>
            ))}
        </div>

        {error && (
          <p className="text-center font-hanken text-sm text-red-600">{error}</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void handleIconUpload(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </div>

      <InviteMemberModal
        isOpen={inviteOpen}
        serverId={serverId}
        serverName={serverName}
        onClose={() => {
          setInviteOpen(false);
          markInvite();
        }}
      />
    </>
  );
}
