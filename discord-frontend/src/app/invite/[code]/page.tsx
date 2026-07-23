"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/services";
import { saveAppNavigation } from "@/lib/appNavigation";

type InvitePreview = {
  code: string;
  serverId: string;
  serverName: string;
  alreadyMember: boolean;
};

export default function InviteJoinPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params.code ?? "");

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem("token")));
  }, []);

  useEffect(() => {
    if (!code) {
      setError("Geçersiz davet linki.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/invite/${code}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            String(data.message ?? data.Message ?? "Davet bulunamadı.")
          );
        }
        const data = await response.json();
        if (cancelled) return;
        setPreview({
          code: String(data.code ?? data.Code ?? code),
          serverId: String(data.serverId ?? data.ServerId),
          serverName: String(data.serverName ?? data.ServerName ?? "Sunucu"),
          alreadyMember: Boolean(data.alreadyMember ?? data.AlreadyMember),
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Davet yüklenemedi.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const goToServer = (serverId: string, serverName: string) => {
    saveAppNavigation({
      viewMode: "server",
      server: { id: serverId, name: serverName, iconUrl: null },
      channel: null,
    });
    router.replace("/app");
  };

  const handleJoin = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push(`/login?returnUrl=${encodeURIComponent(`/invite/${code}`)}`);
      return;
    }

    setJoining(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/invite/${code}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          String(data.message ?? data.Message ?? "Sunucuya katılınamadı.")
        );
      }
      const data = await response.json();
      goToServer(
        String(data.serverId ?? data.ServerId),
        String(data.serverName ?? data.ServerName ?? preview?.serverName ?? "Sunucu")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sunucuya katılınamadı.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#5c1520_0%,#250902_45%,#0a0506_100%)] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a0f10]/80 p-8 text-center shadow-2xl backdrop-blur-md">
        <p className="font-libre text-xl text-white">micodex</p>
        <p className="mt-1 font-hanken text-xs uppercase tracking-[0.2em] text-[#e1bfbd]/60">
          Sunucu daveti
        </p>

        {loading ? (
          <p className="mt-8 font-hanken text-sm text-white/60">Yükleniyor...</p>
        ) : error && !preview ? (
          <>
            <p className="mt-8 font-hanken text-sm text-red-300">{error}</p>
            <Link
              href="/app"
              className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 font-hanken text-sm font-semibold text-stone-900"
            >
              Uygulamaya dön
            </Link>
          </>
        ) : preview ? (
          <>
            <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container/20">
              <span className="font-libre text-2xl font-bold text-[#e1bfbd]">
                {preview.serverName.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="mt-4 font-hanken text-2xl font-extrabold text-white">
              {preview.serverName}
            </h1>
            <p className="mt-2 font-hanken text-sm text-white/60">
              {preview.alreadyMember
                ? "Bu sunucunun zaten üyesisin."
                : "Bu sunucuya katılmak için davet edildin."}
            </p>
            {error && (
              <p className="mt-4 font-hanken text-sm text-red-300">{error}</p>
            )}
            <div className="mt-8 flex flex-col gap-3">
              {preview.alreadyMember ? (
                <button
                  type="button"
                  onClick={() =>
                    goToServer(preview.serverId, preview.serverName)
                  }
                  className="rounded-full bg-white px-5 py-3 font-hanken text-sm font-semibold text-stone-900 transition hover:bg-[#f5f0ea]"
                >
                  Sunucuya git
                </button>
              ) : (
                <button
                  type="button"
                  disabled={joining}
                  onClick={() => void handleJoin()}
                  className="rounded-full bg-primary-container px-5 py-3 font-hanken text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {joining
                    ? "Katılıyor..."
                    : hasToken
                      ? "Sunucuya katıl"
                      : "Giriş yap ve katıl"}
                </button>
              )}
              <Link
                href="/app"
                className="font-hanken text-sm text-white/50 hover:text-white/80"
              >
                Vazgeç
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
