"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_BASE_URL } from "@/services";

type ChannelTypeOption = "Text" | "Voice" | "Announcement";

type CreateChannelModalProps = {
  isOpen: boolean;
  serverId: string;
  onClose: () => void;
  onCreated: () => void;
};

const TYPE_OPTIONS: {
  value: ChannelTypeOption;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "Text",
    label: "Metin",
    description: "Mesajlar, dosyalar ve tartışmalar için sohbet alanı",
    icon: "tag",
  },
  {
    value: "Voice",
    label: "Ses",
    description: "Birlikte sesli veya görüntülü konuşun",
    icon: "volume_up",
  },
  {
    value: "Announcement",
    label: "Bilgi",
    description: "Duyuru ve bilgilendirme paylaşımları için kanal",
    icon: "campaign",
  },
];

export default function CreateChannelModal({
  isOpen,
  serverId,
  onClose,
  onCreated,
}: CreateChannelModalProps) {
  const [channelName, setChannelName] = useState("");
  const [channelType, setChannelType] = useState<ChannelTypeOption>("Text");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setChannelName("");
    setChannelType("Text");
    setError("");
    setLoading(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedType =
    TYPE_OPTIONS.find((t) => t.value === channelType) ?? TYPE_OPTIONS[0];

  const normalizeName = (raw: string) =>
    raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9çğıöşüÇĞİÖŞÜ._-]/gi, "");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const name = normalizeName(channelName) || channelName.trim();
    if (!name) {
      setError("Kanal adı zorunludur.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Oturum bulunamadı. Tekrar giriş yap.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/channels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          serverId,
          type: channelType,
        }),
      });

      if (!response.ok) {
        let message = "Kanal oluşturulamadı.";
        try {
          const errData = await response.json();
          message =
            errData.title || errData.message || errData.detail || message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      onCreated();
      onClose();
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
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

      <div className="relative w-full max-w-[440px] overflow-hidden rounded-2xl border border-[#594140]/40 bg-[#250902] shadow-2xl">
        <div className="flex items-start justify-between px-6 pb-2 pt-6">
          <div>
            <h2 className="font-libre text-2xl text-[#e6e2d9]">Kanal Oluştur</h2>
            <p className="mt-1 font-hanken text-sm text-[#e1bfbd]/75">
              Sunucuna yeni bir alan ekle.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#e1bfbd]/70 transition-colors hover:bg-white/5 hover:text-[#e6e2d9]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6 pt-2">
          <div className="space-y-2">
            <p className="font-hanken text-[11px] font-bold uppercase tracking-[0.14em] text-[#e1bfbd]/70">
              Kanal Türü
            </p>
            <div className="space-y-2">
              {TYPE_OPTIONS.map((option) => {
                const selected = channelType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={loading}
                    onClick={() => setChannelType(option.value)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all disabled:opacity-60 ${
                      selected
                        ? "border-[#ad2831]/50 bg-[#ad2831]/15"
                        : "border-[#594140]/35 bg-[#1c1c16]/80 hover:bg-[#1c1c16]"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        selected
                          ? "bg-[#ad2831]/25 text-[#ffb3b0]"
                          : "bg-white/5 text-[#e1bfbd]/80"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {option.icon}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-hanken text-sm font-semibold text-[#e6e2d9]">
                        {option.label}
                      </p>
                      <p className="mt-0.5 font-hanken text-xs leading-snug text-[#e1bfbd]/65">
                        {option.description}
                      </p>
                    </div>
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected
                          ? "border-[#ad2831] bg-[#ad2831]"
                          : "border-[#594140]/60"
                      }`}
                    >
                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-[#e6e2d9]" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="channelName"
              className="block font-hanken text-[11px] font-bold uppercase tracking-[0.14em] text-[#e1bfbd]/70"
            >
              Kanal Adı
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-[#594140]/30 bg-[#1c1c16] px-3 focus-within:border-[#ad2831]/40 focus-within:ring-1 focus-within:ring-[#ad2831]/40">
              <span className="material-symbols-outlined text-xl text-[#e1bfbd]/55">
                {selectedType.icon}
              </span>
              <input
                id="channelName"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                onBlur={() =>
                  setChannelName((prev) => normalizeName(prev) || prev)
                }
                disabled={loading}
                placeholder={
                  channelType === "Voice"
                    ? "genel-ses"
                    : channelType === "Announcement"
                      ? "duyurular"
                      : "yeni-kanal"
                }
                className="w-full bg-transparent py-3 font-hanken text-[#e6e2d9] outline-none placeholder:text-[#e1bfbd]/35 disabled:opacity-60"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-[#ad2831]/30 bg-[#ad2831]/15 px-4 py-3 font-hanken text-sm text-[#ffb3b0]">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-[#594140]/40 py-3 font-hanken text-[#e1bfbd] transition-all hover:bg-white/5 disabled:opacity-60"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || !channelName.trim()}
              className="flex-1 rounded-xl bg-[#ad2831] py-3 font-hanken font-semibold text-[#e6e2d9] transition-all hover:bg-[#8f1b1c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Oluşturuluyor..." : "Kanal Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
