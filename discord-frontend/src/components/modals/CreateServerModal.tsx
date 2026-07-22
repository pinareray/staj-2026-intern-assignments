"use client";

import { FormEvent, useState } from "react";
import { API_BASE_URL } from "@/services";

type CreateServerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateServerModal({
  isOpen,
  onClose,
  onCreated,
}: CreateServerModalProps) {
  const [serverName, setServerName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const name = serverName.trim();
    if (!name) {
      setError("Sunucu adı zorunludur.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Oturum bulunamadı. Tekrar giriş yap.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/servers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        let message = "Sunucu oluşturulamadı.";
        try {
          const errData = await response.json();
          message = errData.title || errData.message || errData.detail || message;
        } catch {
          // body okunamadı
        }
        setError(message);
        return;
      }

      setServerName("");
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

      <div className="relative w-full max-w-[400px] rounded-2xl bg-[#250902] border border-[#594140]/40 shadow-2xl p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-[#e1bfbd]/70 hover:text-[#e6e2d9] transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="mb-6 space-y-1">
          <h2 className="font-libre text-2xl text-[#e6e2d9]">Sunucu Oluştur</h2>
          <p className="text-sm text-[#e1bfbd]/80 font-hanken">
            Arkadaşlarınla sohbet edeceğin yeni bir alan aç.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              htmlFor="serverName"
              className="block text-xs uppercase tracking-widest text-[#e1bfbd] font-hanken"
            >
              Sunucu Adı
            </label>
            <input
              id="serverName"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              disabled={loading}
              placeholder="micodex HQ"
              className="w-full rounded-xl bg-[#1c1c16] text-[#e6e2d9] placeholder:text-[#e1bfbd]/40 border border-[#594140]/30 px-4 py-3 outline-none focus:ring-1 focus:ring-[#ad2831]/50 focus:border-[#ad2831]/40 transition-all font-hanken disabled:opacity-60"
            />
          </div>

          {error && (
            <p className="text-sm text-[#ffb3b0] bg-[#ad2831]/15 border border-[#ad2831]/30 rounded-lg px-4 py-3 font-hanken">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-[#594140]/40 text-[#e1bfbd] py-3 font-hanken hover:bg-white/5 transition-all disabled:opacity-60"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || !serverName.trim()}
              className="flex-1 rounded-xl bg-[#ad2831] text-[#e6e2d9] py-3 font-hanken font-semibold hover:bg-[#8f1b1c] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Oluşturuluyor..." : "Oluştur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
