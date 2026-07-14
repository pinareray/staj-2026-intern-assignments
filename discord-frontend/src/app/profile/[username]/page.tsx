"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
          `http://localhost:5243/api/users/${encodeURIComponent(usernameParam)}`,
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
              (data as { message?: string }).message ??
                "Profil bulunamadı."
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
          avatarUrl: (data.avatarUrl ?? data.AvatarUrl ?? null) as string | null,
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
    <main className="min-h-screen relative overflow-hidden bg-[#1c1c16] text-[#e6e2d9]">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(173,40,49,0.35), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(89,65,64,0.25), transparent 50%)",
        }}
      />

      <div className="relative z-10 max-w-lg mx-auto px-6 py-10 min-h-screen flex flex-col">
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#e1bfbd]/80 hover:text-[#e6e2d9] transition-colors font-hanken text-sm"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Sohbete dön
          </Link>
          <span className="font-libre text-xl tracking-tight text-primary-container">
            micodex
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          {loading && (
            <p className="text-sm text-[#e1bfbd]/70 font-hanken">
              Profil yükleniyor...
            </p>
          )}

          {!loading && error && (
            <div className="w-full rounded-2xl border border-[#ad2831]/40 bg-[#250902]/80 p-8 text-center space-y-4">
              <span className="material-symbols-outlined text-4xl text-[#ad2831]">
                person_off
              </span>
              <p className="font-hanken text-[#e1bfbd]">{error}</p>
              <Link
                href="/"
                className="inline-block text-sm text-primary-container hover:underline font-hanken"
              >
                Ana sayfaya git
              </Link>
            </div>
          )}

          {!loading && profile && (
            <article className="w-full rounded-2xl border border-[#594140]/40 bg-[#250902]/90 shadow-2xl overflow-hidden">
              <div className="h-28 bg-gradient-to-br from-primary-container via-[#8f1b1c] to-[#250902]" />

              <div className="px-8 pb-8 -mt-12 space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt={profile.username}
                      className="w-24 h-24 rounded-full border-4 border-[#250902] object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-4 border-[#250902] bg-[#1c1c16] flex items-center justify-center shadow-lg">
                      <span className="font-libre text-4xl text-primary-container font-bold uppercase">
                        {profile.username.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h1 className="font-libre text-3xl text-[#e6e2d9] tracking-tight">
                      {profile.username}
                    </h1>
                    <p className="text-xs uppercase tracking-[0.2em] text-[#e1bfbd]/60 font-hanken">
                      MiCodex üyesi
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-xl bg-[#1c1c16]/80 border border-[#594140]/30 px-5 py-4 flex items-center gap-4">
                    <span className="material-symbols-outlined text-primary-container">
                      calendar_month
                    </span>
                    <div className="text-left min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-[#e1bfbd]/50 font-hanken">
                        Katılım tarihi
                      </p>
                      <p className="text-sm text-[#e6e2d9] font-hanken">
                        {joinedLabel}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-[#1c1c16]/80 border border-[#594140]/30 px-5 py-4 flex items-center gap-4">
                    <span className="material-symbols-outlined text-primary-container">
                      badge
                    </span>
                    <div className="text-left min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-[#e1bfbd]/50 font-hanken">
                        Kullanıcı adı
                      </p>
                      <p className="text-sm text-[#e6e2d9] font-hanken truncate">
                        @{profile.username}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </main>
  );
}
