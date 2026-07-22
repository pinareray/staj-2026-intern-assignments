"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, authFetch, logoutToLanding } from "@/services";

type PublicServer = {
  id: string;
  name: string;
  iconUrl?: string | null;
};

type PublicFriend = {
  userId: string;
  username: string;
};

type PublicProfile = {
  id: string;
  username: string;
  createdAt: string;
  avatarUrl?: string | null;
  bio?: string | null;
  status?: string | null;
  friendCount: number;
  serverCount: number;
  isOwnProfile: boolean;
  email?: string | null;
  servers: PublicServer[];
  friends: PublicFriend[];
};

function bannerGradient(username: string) {
  const seed = username.charCodeAt(0) + (username.charCodeAt(1) ?? 0);
  const hue = 350 + (seed % 25);
  return `linear-gradient(135deg, hsl(${hue} 55% 88%) 0%, hsl(${hue} 45% 78%) 40%, hsl(${hue} 40% 68%) 100%)`;
}

function Avatar({
  username,
  size = "lg",
}: {
  username: string;
  size?: "lg" | "xl";
}) {
  const dim = size === "xl" ? 120 : 96;
  return (
    <div
      className="flex items-center justify-center rounded-full border-[5px] border-white bg-primary-container/10 shadow-lg ring-1 ring-stone-200/80"
      style={{ width: dim, height: dim }}
    >
      <span
        className={`font-libre font-bold uppercase text-primary-container ${
          size === "xl" ? "text-5xl" : "text-4xl"
        }`}
      >
        {username.charAt(0) || "?"}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const usernameParam = decodeURIComponent(params.username ?? "");

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"about" | "friends" | "servers" | "settings">(
    "about"
  );
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

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
          { headers: { Authorization: `Bearer ${token}` } }
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
        const mapped: PublicProfile = {
          id: String(data.id ?? data.Id),
          username: String(data.username ?? data.Username ?? usernameParam),
          createdAt: String(data.createdAt ?? data.CreatedAt ?? ""),
          avatarUrl: (data.avatarUrl ?? data.AvatarUrl ?? null) as string | null,
          bio: (data.bio ?? data.Bio ?? null) as string | null,
          status: (data.status ?? data.Status ?? null) as string | null,
          friendCount: Number(data.friendCount ?? data.FriendCount ?? 0),
          serverCount: Number(data.serverCount ?? data.ServerCount ?? 0),
          isOwnProfile: Boolean(data.isOwnProfile ?? data.IsOwnProfile),
          email: (data.email ?? data.Email ?? null) as string | null,
          servers: Array.isArray(data.servers ?? data.Servers)
            ? (data.servers ?? data.Servers).map((s: Record<string, unknown>) => ({
                id: String(s.id ?? s.Id),
                name: String(s.name ?? s.Name ?? "Sunucu"),
                iconUrl: (s.iconUrl ?? s.IconUrl ?? null) as string | null,
              }))
            : [],
          friends: Array.isArray(data.friends ?? data.Friends)
            ? (data.friends ?? data.Friends).map((f: Record<string, unknown>) => ({
                userId: String(f.userId ?? f.UserId),
                username: String(f.username ?? f.Username ?? ""),
              }))
            : [],
        };
        setProfile(mapped);
        setEditUsername(mapped.username);
        setEditBio(mapped.bio ?? "");
        setEditStatus(mapped.status ?? "");
      } catch {
        setError("Sunucuya bağlanılamadı.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [usernameParam, router]);

  const joinedLabel = useMemo(() => {
    if (!profile?.createdAt) return "—";
    const date = new Date(profile.createdAt);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [profile]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile?.isOwnProfile) return;

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await authFetch("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({
          username: editUsername.trim(),
          bio: editBio.trim() || null,
          status: editStatus.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setSaveError(
          String((data as { message?: string }).message ?? "Kaydedilemedi.")
        );
        return;
      }

      const data = await response.json();
      const newUsername = String(data.username ?? data.Username);
      localStorage.setItem("username", newUsername);
      setSaveSuccess("Profil güncellendi.");
      setEditing(false);

      if (newUsername !== profile.username) {
        router.replace(`/profile/${encodeURIComponent(newUsername)}`);
        return;
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              username: newUsername,
              bio: (data.bio ?? data.Bio ?? null) as string | null,
              status: (data.status ?? data.Status ?? null) as string | null,
            }
          : prev
      );
    } catch {
      setSaveError("Sunucuya bağlanılamadı.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.isOwnProfile) return;
    if (deleteConfirm !== profile.username) {
      setDeleteError("Onaylamak için kullanıcı adını aynen yaz.");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await authFetch("/api/users/me", { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setDeleteError(
          String((data as { message?: string }).message ?? "Hesap silinemedi.")
        );
        return;
      }
      logoutToLanding();
    } catch {
      setDeleteError("Sunucuya bağlanılamadı.");
    } finally {
      setDeleting(false);
    }
  };

  const tabs = useMemo(() => {
    const items: { id: typeof tab; label: string }[] = [
      { id: "about", label: "Hakkında" },
      { id: "friends", label: "Arkadaşlar" },
      { id: "servers", label: "Sunucular" },
    ];
    if (profile?.isOwnProfile) {
      items.push({ id: "settings", label: "Ayarlar" });
    }
    return items;
  }, [profile?.isOwnProfile]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <header className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-stone-200 bg-white/90 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 font-hanken text-sm text-stone-500 transition-colors hover:text-primary-container"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Sohbete Dön
        </Link>
        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-libre text-lg tracking-tight text-primary-container sm:text-xl">
          micodex
        </span>
        <div className="w-[88px]" aria-hidden />
      </header>

      <main className="relative flex-1 overflow-y-auto px-4 py-8 sm:px-6 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(173,40,49,0.08), transparent 60%)",
          }}
        />

        {loading && (
          <p className="relative z-10 py-20 text-center font-hanken text-sm text-stone-400">
            Profil yükleniyor...
          </p>
        )}

        {!loading && error && (
          <div className="relative z-10 mx-auto mt-8 max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <span className="material-symbols-outlined text-4xl text-primary-container">
              person_off
            </span>
            <p className="mt-3 font-hanken text-stone-500">{error}</p>
            <Link
              href="/app"
              className="mt-4 inline-block font-hanken text-sm text-primary-container hover:underline"
            >
              Sohbete dön
            </Link>
          </div>
        )}

        {!loading && profile && (
          <article className="relative z-10 mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_8px_30px_rgba(28,25,23,0.06)]">
            {/* Banner */}
            <div
              className="relative h-40 sm:h-48"
              style={{ background: bannerGradient(profile.username) }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/10" />
              {profile.isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setEditing((v) => !v)}
                  className="absolute right-4 top-4 rounded-xl border border-white/60 bg-white/90 px-3 py-1.5 font-hanken text-xs font-semibold text-stone-700 shadow-sm transition-colors hover:bg-white hover:text-primary-container"
                >
                  {editing ? "İptal" : "Profili Düzenle"}
                </button>
              )}
            </div>

            {/* Avatar + header */}
            <div className="relative px-6 pb-0 sm:px-8">
              <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
                <Avatar username={profile.username} size="xl" />
                <div className="flex flex-wrap gap-2 pb-1 sm:justify-end">
                  <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 font-hanken text-xs text-stone-600">
                    {profile.friendCount} arkadaş
                  </div>
                  <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 font-hanken text-xs text-stone-600">
                    {profile.serverCount} sunucu
                  </div>
                </div>
              </div>

              <div className="mt-4 border-b border-stone-100 pb-5">
                <h1 className="font-libre text-3xl tracking-tight text-stone-900 sm:text-4xl">
                  {profile.username}
                </h1>
                <p className="mt-0.5 font-hanken text-sm text-stone-400">
                  @{profile.username}
                </p>
                {profile.status ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-hanken text-sm text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {profile.status}
                  </p>
                ) : (
                  <p className="mt-3 font-hanken text-sm text-stone-400">
                    Özel durum ayarlanmadı
                  </p>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-stone-100 px-6 sm:px-8">
              <nav className="flex gap-6 overflow-x-auto custom-scrollbar">
                {tabs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`shrink-0 border-b-2 pb-3 font-hanken text-sm font-semibold transition-colors ${
                      tab === item.id
                        ? "border-primary-container text-primary-container"
                        : "border-transparent text-stone-400 hover:text-stone-600"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="space-y-4 bg-gradient-to-b from-white to-[#faf8f5] px-6 py-6 sm:px-8">
              {editing && profile.isOwnProfile && (
                <form
                  onSubmit={handleSave}
                  className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                >
                  <h2 className="font-libre text-lg text-stone-900">
                    Profili Düzenle
                  </h2>
                  <label className="block space-y-1">
                    <span className="font-hanken text-xs font-bold uppercase tracking-wider text-stone-400">
                      Kullanıcı adı
                    </span>
                    <input
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-hanken text-sm text-stone-900 outline-none focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-hanken text-xs font-bold uppercase tracking-wider text-stone-400">
                      Özel durum
                    </span>
                    <input
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      placeholder="Ne yapıyorsun?"
                      maxLength={100}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-hanken text-sm text-stone-900 outline-none focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-hanken text-xs font-bold uppercase tracking-wider text-stone-400">
                      Hakkında
                    </span>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Kendinden bahset..."
                      rows={4}
                      maxLength={500}
                      className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-hanken text-sm text-stone-900 outline-none focus:border-primary-container/40 focus:ring-1 focus:ring-primary-container/20"
                    />
                  </label>
                  {saveError && (
                    <p className="font-hanken text-sm text-red-600">{saveError}</p>
                  )}
                  {saveSuccess && (
                    <p className="font-hanken text-sm text-emerald-600">
                      {saveSuccess}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-primary-container px-4 py-2 font-hanken text-sm font-semibold text-white transition-colors hover:bg-[#8f1b1c] disabled:opacity-60"
                  >
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </form>
              )}

              {tab === "about" && (
                <div className="space-y-3">
                  <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <h3 className="font-hanken text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      Hakkında
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap font-hanken text-sm leading-relaxed text-stone-700">
                      {profile.bio?.trim() ||
                        "Bu kullanıcı henüz bir biyografi eklemedi."}
                    </p>
                  </section>

                  <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <h3 className="font-hanken text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      Üyelik
                    </h3>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary-container">
                          calendar_month
                        </span>
                        <div>
                          <p className="font-hanken text-xs text-stone-400">
                            MiCodex&apos;e katılım
                          </p>
                          <p className="font-hanken text-sm text-stone-800">
                            {joinedLabel}
                          </p>
                        </div>
                      </div>
                      {profile.isOwnProfile && profile.email && (
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary-container">
                            mail
                          </span>
                          <div>
                            <p className="font-hanken text-xs text-stone-400">
                              E-posta
                            </p>
                            <p className="font-hanken text-sm text-stone-800">
                              {profile.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <h3 className="font-hanken text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      Notlar
                    </h3>
                    <p className="mt-2 font-hanken text-sm text-stone-500">
                      Bu profil MiCodex üyesidir. Sunucu ve kanal geçmişi
                      hesabına bağlıdır.
                    </p>
                  </section>
                </div>
              )}

              {tab === "friends" && (
                <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h3 className="font-hanken text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Arkadaşlar ({profile.friends.length})
                  </h3>
                  {profile.friends.length === 0 ? (
                    <p className="mt-3 font-hanken text-sm text-stone-400">
                      Henüz arkadaş yok.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {profile.friends.map((friend) => (
                        <li key={friend.userId}>
                          <Link
                            href={`/profile/${encodeURIComponent(friend.username)}`}
                            className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5 transition-colors hover:border-primary-container/20 hover:bg-white"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container/10 font-libre text-sm font-bold uppercase text-primary-container">
                              {friend.username.charAt(0)}
                            </div>
                            <span className="font-hanken text-sm text-stone-800">
                              @{friend.username}
                            </span>
                            <span className="material-symbols-outlined ml-auto text-base text-stone-300">
                              chevron_right
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {tab === "servers" && (
                <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                  <h3 className="font-hanken text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Sunucular
                  </h3>
                  {profile.servers.length === 0 ? (
                    <p className="mt-3 font-hanken text-sm text-stone-400">
                      Görüntülenecek sunucu yok.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {profile.servers.map((server) => (
                        <li
                          key={server.id}
                          className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container/10 font-libre text-sm font-bold uppercase text-primary-container">
                            {server.name.charAt(0)}
                          </div>
                          <span className="font-hanken text-sm text-stone-800">
                            {server.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {tab === "settings" && profile.isOwnProfile && (
                <div className="space-y-3">
                  <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                    <h3 className="font-hanken text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      Gizlilik ve Güvenlik Koşulları
                    </h3>
                    <div className="mt-3 space-y-3 font-hanken text-sm leading-relaxed text-stone-600">
                      <p>
                        MiCodex hesabın yalnızca senin oturumunla erişilebilir.
                        Mesajların ve sunucu üyeliklerin hesabına bağlıdır; başka
                        kullanıcılar profilinde yalnızca herkese açık bilgileri
                        görür.
                      </p>
                      <p>
                        Arkadaşlık istekleri karşılıklı onay gerektirir. Özel
                        mesajlar yalnızca ilgili sohbet üyeleri tarafından
                        okunabilir. Verilerin güvenliği için güçlü bir şifre
                        kullanmanı ve oturumunu paylaşmamanı öneririz.
                      </p>
                      <p>
                        Hesabını sildiğinde mesajların, sunucu üyeliklerin ve
                        arkadaşlık bağlantıların kalıcı olarak kaldırılır. Bu
                        işlem geri alınamaz.
                      </p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm">
                    <h3 className="font-hanken text-[10px] font-bold uppercase tracking-widest text-red-700">
                      Hesap Silme
                    </h3>
                    <p className="mt-2 font-hanken text-sm text-stone-600">
                      Hesabını kalıcı olarak silmek için kullanıcı adını yaz:{" "}
                      <strong className="text-stone-800">{profile.username}</strong>
                    </p>
                    <input
                      value={deleteConfirm}
                      onChange={(e) => {
                        setDeleteConfirm(e.target.value);
                        setDeleteError("");
                      }}
                      placeholder={profile.username}
                      className="mt-3 w-full rounded-xl border border-red-200 bg-white px-3 py-2 font-hanken text-sm text-stone-900 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
                    />
                    {deleteError && (
                      <p className="mt-2 font-hanken text-sm text-red-600">
                        {deleteError}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => void handleDeleteAccount()}
                      className="mt-4 rounded-xl bg-red-600 px-4 py-2 font-hanken text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                    >
                      {deleting ? "Siliniyor..." : "Hesabımı Kalıcı Olarak Sil"}
                    </button>
                  </section>
                </div>
              )}

              {profile.isOwnProfile && (
                <button
                  type="button"
                  onClick={() => logoutToLanding()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary-container/25 bg-primary-container/5 py-3 font-hanken text-sm font-semibold text-primary-container transition-colors hover:bg-primary-container hover:text-white"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Çıkış Yap
                </button>
              )}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
