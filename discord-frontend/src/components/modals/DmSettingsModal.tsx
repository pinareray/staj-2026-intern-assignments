"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_BASE_URL } from "@/services";

type DmSettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  peerUsername: string;
  peerUserId: string | null;
};

const REPORT_REASONS = [
  "Spam / reklam",
  "Hakaret / taciz",
  "Uygunsuz içerik",
  "Sahte hesap",
  "Diğer",
];

export default function DmSettingsModal({
  isOpen,
  onClose,
  peerUsername,
  peerUserId,
}: DmSettingsModalProps) {
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!isOpen || !peerUserId) return;
    setError("");
    setSuccess("");
    setReportOpen(false);
    setDetails("");

    const token = localStorage.getItem("token");
    if (!token) return;

    void (async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/moderation/blocks/${peerUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) return;
        const data = (await response.json()) as Record<string, unknown>;
        setBlocked(Boolean(data.iBlockedThem ?? data.IBlockedThem));
      } catch {
        // ignore
      }
    })();
  }, [isOpen, peerUserId]);

  if (!isOpen) return null;

  const toggleBlock = async () => {
    if (!peerUserId) {
      setError("Kullanıcı kimliği bulunamadı.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/moderation/blocks/${peerUserId}`,
        {
          method: blocked ? "DELETE" : "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!response.ok) {
        setError(String(data.message ?? "İşlem başarısız."));
        return;
      }
      setBlocked(!blocked);
      setSuccess(
        blocked
          ? `@${peerUsername} engeli kaldırıldı.`
          : `@${peerUsername} engellendi. Artık mesajlaşamazsınız.`
      );
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setBusy(false);
    }
  };

  const submitReport = async (e: FormEvent) => {
    e.preventDefault();
    if (!peerUserId) {
      setError("Kullanıcı kimliği bulunamadı.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/moderation/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: peerUserId,
          reason,
          details: details.trim() || null,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!response.ok) {
        setError(String(data.message ?? "Şikayet gönderilemedi."));
        return;
      }
      setSuccess("Şikayetin alındı. Adminler inceleyecek.");
      setReportOpen(false);
      setDetails("");
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-libre text-xl text-stone-900">Sohbet ayarları</h2>
            <p className="mt-1 font-hanken text-sm text-stone-500">
              @{peerUsername}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 font-hanken text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-hanken text-sm text-emerald-700">
            {success}
          </p>
        )}

        <div className="space-y-3">
          <button
            type="button"
            disabled={busy || !peerUserId}
            onClick={() => void toggleBlock()}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition disabled:opacity-60 ${
              blocked
                ? "border-stone-200 bg-stone-50 hover:bg-stone-100"
                : "border-red-200 bg-red-50/50 hover:bg-red-50"
            }`}
          >
            <span
              className={`material-symbols-outlined ${
                blocked ? "text-stone-600" : "text-red-600"
              }`}
            >
              {blocked ? "lock_open" : "block"}
            </span>
            <div>
              <p className="font-hanken text-sm font-semibold text-stone-900">
                {blocked ? "Engeli kaldır" : "Kullanıcıyı engelle"}
              </p>
              <p className="font-hanken text-xs text-stone-500">
                Engellenince karşılıklı mesaj ve arkadaşlık isteği çalışmaz.
              </p>
            </div>
          </button>

          {!reportOpen ? (
            <button
              type="button"
              disabled={busy || !peerUserId}
              onClick={() => setReportOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-left transition hover:bg-amber-50 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-amber-700">
                flag
              </span>
              <div>
                <p className="font-hanken text-sm font-semibold text-stone-900">
                  Şikayet et
                </p>
                <p className="font-hanken text-xs text-stone-500">
                  Bildirim admin paneline düşer ve incelenir.
                </p>
              </div>
            </button>
          ) : (
            <form
              onSubmit={(e) => void submitReport(e)}
              className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4"
            >
              <p className="font-hanken text-sm font-semibold text-stone-900">
                Şikayet formu
              </p>
              <label className="block space-y-1">
                <span className="font-hanken text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Neden
                </span>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-hanken text-sm outline-none focus:border-primary-container/40"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="font-hanken text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Detay (isteğe bağlı)
                </span>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Kısaca anlat..."
                  className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-2 font-hanken text-sm outline-none focus:border-primary-container/40"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="flex-1 rounded-xl border border-stone-200 px-3 py-2 font-hanken text-sm text-stone-600 hover:bg-white"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 rounded-xl bg-primary-container px-3 py-2 font-hanken text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {busy ? "Gönderiliyor..." : "Gönder"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
