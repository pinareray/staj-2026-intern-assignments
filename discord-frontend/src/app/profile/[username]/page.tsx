"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_BASE_URL, logoutToLanding } from "@/lib/api";

type PublicProfile = {
  id: string;
  username: string;
  createdAt: string;
  avatarUrl?: string | null;
};

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const usernameParam = decodeURIComponent(params.username ?? "");

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!usernameParam) return;

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/users/${encodeURIComponent(usernameParam)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(
            String(
              (data as { message?: string }).message ?? "Profil bulunamadı."
            )
          );
          setProfile(null);
          return;
        }

        const data = await response.json();
        setProfile({
          id: String(data.id ?? data.Id),
          username: String(data.username ?? data.Username ?? usernameParam),
          createdAt: String(data.createdAt ?? data.CreatedAt ?? ""),
          avatarUrl: (data.avatarUrl ?? data.AvatarUrl ?? null) as
            | string
            | null,
        });
      } catch {
        setError("Sunucuya bağlanılamadı.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [usernameParam, router]);

  const joinedLabel = (() => {
    if (!profile?.createdAt) return "—";
    const date = new Date(profile.createdAt);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  })();

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-outline-variant/60 bg-surface/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 font-hanken text-sm text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden>
            arrow_back
          </span>
          Sohbete Dön
        </Link>
        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-libre text-lg tracking-tight text-primary-container sm:text-xl">
          micodex
        </span>
        <button
          type="button"
          onClick={() => logoutToLanding()}
          className="inline-flex items-center gap-1.5 font-hanken text-sm text-on-surface-variant transition-colors hover:text-primary-container"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden>
            logout
          </span>
          <span className="hidden sm:inline">Çıkış Yap</span>
        </button>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(173,40,49,0.12), transparent 55%)",
          }}
        />

        {loading && (
          <p className="relative z-10 font-hanken text-sm text-on-surface-variant">
            Profil yükleniyor...
          </p>
        )}

        {!loading && error && (
          <div
            className="relative z-10 rounded-2xl border border-red-200 bg-surface p-8 text-center shadow-xl"
            style={{ width: "min(100%, 420px)" }}
          >
            <span className="material-symbols-outlined text-4xl text-primary-container">
              person_off
            </span>
            <p className="mt-3 font-hanken text-on-surface-variant">{error}</p>
            <Link
              href="/app"
              className="mt-4 inline-block font-hanken text-sm text-primary-container hover:underline"
            >
              Sohbete dön
            </Link>
          </div>
        )}

        {!loading && profile && (
          <article
            className="relative z-10 rounded-2xl border border-outline-variant bg-surface shadow-xl"
            style={{ width: "min(100%, 420px)", padding: "32px" }}
          >
            <div className="flex flex-col items-center text-center">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="rounded-full border-4 border-surface-container-high object-cover shadow-md"
                  style={{ width: 112, height: 112 }}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-full border-4 border-surface-container-high bg-primary-container/10 shadow-md"
                  style={{ width: 112, height: 112 }}
                >
                  <span className="font-libre text-4xl font-bold uppercase text-primary-container">
                    {profile.username.charAt(0)}
                  </span>
                </div>
              )}

              <h1 className="mt-5 font-libre text-2xl tracking-tight text-on-surface sm:text-3xl">
                @{profile.username}
              </h1>
              <p className="mt-1 font-hanken text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                MiCodex üyesi
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <div
                className="flex items-start gap-3 rounded-xl bg-surface-container-low text-left"
                style={{ padding: "14px 16px" }}
              >
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-primary-container">
                  calendar_month
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-hanken text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    MiCodex&apos;e katılım tarihi
                  </p>
                  <p className="mt-0.5 font-hanken text-sm text-on-surface">
                    {joinedLabel}
                  </p>
                </div>
              </div>

              <div
                className="flex items-start gap-3 rounded-xl bg-surface-container-low text-left"
                style={{ padding: "14px 16px" }}
              >
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-primary-container">
                  info
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-hanken text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Hakkında
                  </p>
                  <p className="mt-0.5 font-hanken text-sm text-on-surface-variant">
                    Bu kullanıcı henüz bir biyografi eklemedi.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => logoutToLanding()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-container/30 bg-primary-container/5 font-hanken text-sm font-semibold text-primary-container transition-colors hover:bg-primary-container hover:text-on-primary"
                style={{ padding: "12px 16px" }}
              >
                <span className="material-symbols-outlined text-lg" aria-hidden>
                  logout
                </span>
                Çıkış Yap
              </button>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
