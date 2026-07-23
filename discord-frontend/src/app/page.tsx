"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function FloatingDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Yumuşak hareketli ışık lekeleri */}
      <div className="absolute left-[-10%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-[#ad2831]/20 blur-[100px] animate-glow-drift" />
      <div className="absolute right-[-8%] top-[42%] h-[24rem] w-[24rem] rounded-full bg-[#5c1520]/35 blur-[90px] animate-glow-drift-delayed" />
      <div className="absolute left-[20%] bottom-[5%] h-[20rem] w-[20rem] rounded-full bg-[#ad2831]/12 blur-[80px] animate-glow-drift" />

      <span className="absolute left-[8%] top-[18%] h-1.5 w-1.5 rounded-full bg-white/25 animate-float-slow" />
      <span className="absolute left-[22%] top-[72%] h-1 w-1 rounded-full bg-white/20 animate-float" />
      <span className="absolute right-[18%] top-[28%] h-1.5 w-1.5 rounded-full bg-[#ad2831]/40 animate-float-delayed" />
      <span className="absolute right-[12%] bottom-[22%] h-1 w-1 rounded-full bg-white/15 animate-float-slow" />
      <span className="absolute left-[48%] top-[12%] h-1 w-1 rounded-full bg-white/20 animate-pulse" />
      <span className="absolute left-[65%] bottom-[35%] h-1.5 w-1.5 rounded-full bg-white/10 animate-float" />
      <span className="absolute left-[12%] top-[55%] h-1 w-1 rounded-full bg-white/20 animate-float-delayed" />
      <span className="absolute right-[30%] top-[68%] h-1.5 w-1.5 rounded-full bg-[#e1bfbd]/25 animate-float-slow" />
      <span className="absolute left-[78%] top-[48%] h-1 w-1 rounded-full bg-white/15 animate-pulse" />
      <span className="absolute left-[40%] top-[88%] h-1.5 w-1.5 rounded-full bg-[#ad2831]/30 animate-float" />

      <svg
        className="absolute left-[14%] top-[42%] h-4 w-4 text-white/15 animate-float-slow"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2l1.8 5.5H19l-4.4 3.2 1.7 5.3L12 13.8 7.7 16l1.7-5.3L5 7.5h5.2L12 2z" />
      </svg>
      <svg
        className="absolute right-[28%] top-[16%] h-3.5 w-3.5 text-[#e1bfbd]/25 animate-float-delayed"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2l1.8 5.5H19l-4.4 3.2 1.7 5.3L12 13.8 7.7 16l1.7-5.3L5 7.5h5.2L12 2z" />
      </svg>
      <svg
        className="absolute left-[38%] bottom-[18%] h-5 w-5 text-white/10 animate-float"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      <svg
        className="absolute right-[8%] top-[55%] h-4 w-4 text-[#ad2831]/30 animate-float-slow"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      <svg
        className="absolute left-[6%] bottom-[28%] h-3 w-3 text-white/20 animate-pulse"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle cx="12" cy="12" r="4" />
      </svg>
      <svg
        className="absolute right-[15%] top-[82%] h-3.5 w-3.5 text-white/15 animate-float-delayed"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2l1.8 5.5H19l-4.4 3.2 1.7 5.3L12 13.8 7.7 16l1.7-5.3L5 7.5h5.2L12 2z" />
      </svg>
      <svg
        className="absolute left-[55%] top-[38%] h-4 w-4 text-[#ad2831]/20 animate-float"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(() => {
    if (typeof window === "undefined") return true;
    return Boolean(localStorage.getItem("token"));
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/app");
      return;
    }
    // Token yoksa landing'i göster (SSR hydration sonrası)
    queueMicrotask(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#14080a] text-[#e1bfbd]/70">
        <p className="font-hanken text-sm">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#5c1520_0%,#250902_45%,#0a0506_100%)] text-[#f5f0ea]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#3a0d14]/80 via-transparent to-black/70" />
      <FloatingDecor />

      <header className="relative z-20 w-full px-4 py-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <Link
            href="/"
            className="shrink-0 font-libre text-xl tracking-tight text-white sm:text-2xl"
          >
            micodex
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-5 font-hanken text-[13px] font-medium text-white lg:flex xl:gap-7">
            {(
              [
                { label: "İndir", chevron: false },
                { label: "Nitro", chevron: false },
                { label: "Keşfet", chevron: true },
                { label: "Emniyet", chevron: true },
                { label: "Görevler", chevron: true },
                { label: "Destek", chevron: true },
                { label: "Blog", chevron: true },
                { label: "Geliştiriciler", chevron: true },
                { label: "Kariyer", chevron: false },
              ] as const
            ).map((item) => (
              <button
                key={item.label}
                type="button"
                className="inline-flex items-center gap-0.5 whitespace-nowrap transition-opacity hover:opacity-80"
              >
                {item.label}
                {item.chevron && (
                  <span
                    className="material-symbols-outlined text-[16px] opacity-80"
                    style={{ fontVariationSettings: "'wght' 400" }}
                    aria-hidden
                  >
                    expand_more
                  </span>
                )}
              </button>
            ))}
          </nav>

          <Link
            href="/login"
            className="shrink-0 rounded-full bg-white px-4 py-2 font-hanken text-sm font-semibold text-stone-900 transition-transform hover:scale-[1.02] sm:px-5"
          >
            Open MiCodex
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl grid-cols-1 items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.2fr] lg:gap-10 lg:py-8">
          <div className="flex flex-col items-start">
            <p className="mb-4 font-hanken text-xs font-semibold uppercase tracking-[0.25em] text-[#e1bfbd]/70 animate-fade-in">
              Grup sohbeti · Sunucular · Anlık mesaj
            </p>
            <h1 className="max-w-xl font-hanken text-5xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl animate-fade-up">
              Arkadaşlarınla
              <br />
              bir arada ol
            </h1>
            <p className="mt-6 max-w-md font-hanken text-base leading-relaxed text-gray-300 sm:text-lg animate-fade-up-delayed">
              MiCodex ile sunucular kur, kanallar aç ve arkadaşlarınla gerçek
              zamanlı sohbet et. Mahogany temalı, sade ve odaklanmış bir sohbet
              deneyimi.
            </p>

            <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row animate-fade-up-delayed">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-hanken text-sm font-semibold text-stone-900 transition-all hover:bg-[#f5f0ea] hover:shadow-lg hover:shadow-white/10"
              >
                <span className="material-symbols-outlined text-lg">
                  person_add
                </span>
                Hemen katıl
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 font-hanken text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/15"
              >
                MiCodex&apos;i aç
              </Link>
            </div>
          </div>

          <div className="relative flex items-center justify-center lg:justify-end lg:-mr-4 xl:-mr-8">
            <div
              className="relative w-full animate-float-slow"
              style={{ maxWidth: "min(100%, 56rem)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero.png"
                alt="MiCodex masaüstü ve mobil arayüz önizlemesi"
                className="h-auto w-full select-none object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
                draggable={false}
              />
            </div>
          </div>
        </section>

        {/* Discord tarzı kayan şerit */}
        <div
          className="relative z-10 w-full overflow-hidden border-y border-white/10 bg-[#1a080a]/55 py-4 backdrop-blur-md sm:py-5"
          aria-hidden
        >
          <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap will-change-transform">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center gap-10 pr-10">
                {(
                  [
                    "SOHBET ET",
                    "VAKİT GEÇİR",
                    "KONUŞ",
                    "SUNUCU KUR",
                    "ARKADAŞ OL",
                    "SES AÇ",
                  ] as const
                ).map((label) => (
                  <span
                    key={`${copy}-${label}`}
                    className="inline-flex items-center gap-10"
                  >
                    <Image
                      src="/micodex_logo.png?v=2"
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      aria-hidden
                      className="h-8 w-8 shrink-0 rounded-lg object-contain sm:h-9 sm:w-9"
                    />
                    <span className="font-hanken text-lg font-extrabold italic uppercase tracking-wide text-white sm:text-xl md:text-2xl">
                      {label}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Discord tarzı feature bantları — hero ile aynı arka plan */}
        <section className="relative z-10 text-white">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 sm:px-10 sm:py-24 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1 animate-fade-up">
              <h2 className="font-hanken text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
                Kendi alanını kur,
                <br />
                topluluğunu büyüt
              </h2>
              <p className="mt-6 max-w-md font-hanken text-base leading-relaxed text-gray-300 sm:text-lg">
                Sunucular oluştur, kanallar aç ve rollerle düzeni sen belirle.
                Her sunucu senin sahnen — arkadaşlarınla veya tüm topluluğunla.
              </p>
            </div>
            <div className="order-1 relative mx-auto w-full max-w-lg lg:order-2 animate-float-slow">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#7a1a22]/90 via-[#4a0f14]/80 to-[#1a080a]/90 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-8">
                <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[#ad2831]/40 blur-3xl animate-glow-pulse" />
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#f2ebe6] shadow-xl">
                  <div className="flex items-center gap-2 border-b border-stone-200/80 bg-white px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ad2831]" />
                    <span className="font-hanken text-xs font-semibold text-stone-700">
                      # genel
                    </span>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ad2831]/20 font-hanken text-xs font-bold text-[#ad2831]">
                        A
                      </div>
                      <div>
                        <p className="font-hanken text-xs font-semibold text-stone-800">
                          ayse{" "}
                          <span className="font-normal text-stone-400">
                            bugün 14:02
                          </span>
                        </p>
                        <p className="mt-1 rounded-xl rounded-tl-sm bg-white px-3 py-2 font-hanken text-sm text-stone-700 shadow-sm">
                          Yeni sunucu harika olmuş!
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-200 font-hanken text-xs font-bold text-stone-600">
                        M
                      </div>
                      <div>
                        <p className="font-hanken text-xs font-semibold text-stone-800">
                          mert{" "}
                          <span className="font-normal text-stone-400">
                            bugün 14:03
                          </span>
                        </p>
                        <p className="mt-1 rounded-xl rounded-tl-sm bg-[#ad2831]/10 px-3 py-2 font-hanken text-sm text-stone-800">
                          #duyurular kanalına da bak
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2">
                      <span className="font-hanken text-xs text-stone-400">
                        Mesaj yaz...
                      </span>
                    </div>
                  </div>
                </div>
                <Image
                  src="/server-3d.png"
                  alt=""
                  width={280}
                  height={280}
                  aria-hidden
                  className="pointer-events-none absolute -bottom-6 -right-4 h-36 w-36 select-none object-contain drop-shadow-2xl animate-float sm:h-44 sm:w-44"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 text-white">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 sm:px-10 sm:py-24 lg:grid-cols-2 lg:gap-16">
            <div className="relative mx-auto w-full max-w-lg animate-float">
              <div className="relative overflow-visible rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#2a1216]/90 via-[#5c1520]/85 to-[#ad2831]/70 p-6 pb-10 shadow-[0_24px_60px_rgba(173,40,49,0.3)] backdrop-blur-sm sm:p-8 sm:pb-12">
                <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-white/10 blur-2xl animate-glow-pulse" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="flex w-full items-center justify-between rounded-2xl bg-white/95 px-4 py-3 shadow-lg">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      </span>
                      <span className="font-hanken text-sm font-semibold text-stone-800">
                        Bağlı
                      </span>
                    </div>
                    <span className="rounded-full bg-[#ad2831]/10 px-2.5 py-1 font-hanken text-[10px] font-bold uppercase tracking-wide text-[#ad2831]">
                      canlı
                    </span>
                  </div>
                  <div className="flex w-full flex-col gap-2 rounded-2xl bg-[#14080a]/50 p-4 backdrop-blur-sm">
                    {["ayse yazıyor...", "mert: selam!", "yeni mesaj · anında"].map(
                      (line, i) => (
                        <div
                          key={line}
                          className="flex items-center gap-3 rounded-xl bg-white/95 px-3 py-2.5 shadow-sm animate-fade-up"
                          style={{ animationDelay: `${i * 0.12}s` }}
                        >
                          <span className="material-symbols-outlined text-lg text-[#ad2831]">
                            {i === 0 ? "edit" : i === 1 ? "chat" : "bolt"}
                          </span>
                          <span className="font-hanken text-sm text-stone-700">
                            {line}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
                <Image
                  src="/lightning-3d.png"
                  alt=""
                  width={220}
                  height={220}
                  aria-hidden
                  className="pointer-events-none absolute -bottom-10 -right-8 z-20 h-36 w-36 select-none object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.55)] animate-float-delayed sm:-bottom-12 sm:-right-10 sm:h-44 sm:w-44"
                />
              </div>
            </div>
            <div className="animate-fade-up-delayed">
              <h2 className="font-hanken text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-5xl">
                Gerçek zamanlı
                <br />
                sohbet, sıfır gecikme
              </h2>
              <p className="mt-6 max-w-md font-hanken text-base leading-relaxed text-gray-300 sm:text-lg">
                SignalR ile mesajlar anında akar. Sayfa yenilemeye gerek yok —
                yazdığın anda arkadaşların görür, sohbet canlı kalır.
              </p>
            </div>
          </div>
        </section>

        <section className="relative z-10 px-5 py-16 sm:px-8 sm:py-24">
          <div className="relative mx-auto max-w-6xl overflow-visible rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#3a0d14]/80 via-[#1a080a]/70 to-[#2a1018]/80 px-6 py-12 shadow-[0_40px_80px_rgba(0,0,0,0.45)] backdrop-blur-md sm:px-10 sm:py-16 lg:px-14 animate-float-slow">
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#ad2831]/25 blur-3xl animate-glow-drift" />
            <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[#5c1520]/50 blur-3xl animate-glow-drift-delayed" />

            <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-10">
              <div className="relative mx-auto w-full max-w-md">
                <div className="relative overflow-visible rounded-[1.75rem] bg-gradient-to-b from-[#ad2831] to-[#5c1520] p-5 pb-10 pt-10 sm:p-6 sm:pb-12 sm:pt-12">
                  <div className="absolute left-1/2 top-0 z-20 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border-4 border-[#3a0d14] bg-[#e1bfbd] shadow-lg animate-float">
                    <span className="material-symbols-outlined text-2xl text-[#ad2831]">
                      groups
                    </span>
                  </div>

                  <div className="relative z-10 overflow-hidden rounded-2xl bg-[#f5f0ea] shadow-xl">
                    <div className="border-b border-stone-200 px-4 py-3">
                      <p className="font-hanken text-sm font-bold text-stone-800">
                        Arkadaşlar
                      </p>
                      <p className="font-hanken text-[11px] text-stone-400">
                        Çevrimiçi — 3
                      </p>
                    </div>
                    <div className="space-y-2 p-3">
                      {[
                        { l: "P", n: "pinar_ery", s: "Çevrimiçi" },
                        { l: "D", n: "defnesu", s: "Ses kanalında" },
                        { l: "A", n: "ayse", s: "Boşta" },
                      ].map((u, i) => (
                        <div
                          key={u.n}
                          className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm"
                        >
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full font-hanken text-xs font-bold text-white"
                            style={{
                              backgroundColor:
                                i === 1 ? "#ad2831" : "rgba(36,39,42,0.75)",
                            }}
                          >
                            {u.l}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-hanken text-sm font-semibold text-stone-800">
                              {u.n}
                            </p>
                            <p className="font-hanken text-[11px] text-stone-400">
                              {u.s}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="absolute -left-3 top-16 z-20 flex flex-col gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-[#ad2831] shadow-lg animate-float">
                      1
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-stone-700 shadow-lg animate-float-delayed">
                      3
                    </span>
                  </div>

                  <Image
                    src="/archive-3d.png"
                    alt=""
                    width={220}
                    height={220}
                    aria-hidden
                    className="pointer-events-none absolute -bottom-10 -right-8 z-20 h-36 w-36 select-none object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.55)] animate-float-slow sm:-bottom-12 sm:-right-10 sm:h-44 sm:w-44"
                  />
                </div>
              </div>

              <div className="text-white lg:pl-4">
                <h2 className="font-hanken text-3xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
                  Grup sohbetlerini
                  <br />
                  daha eğlenceli hâle getir
                </h2>
                <p className="mt-6 max-w-md font-hanken text-base leading-relaxed text-white/75 sm:text-lg">
                  Profilini özelleştir, arkadaşlarını yönet, DM’leş ve sunucu
                  davetleriyle kendi çemberini kur. MiCodex seni hatırlar.
                </p>
                <Link
                  href="/register"
                  className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 font-hanken text-sm font-semibold text-stone-900 transition-all hover:scale-[1.02] hover:bg-[#f5f0ea] hover:shadow-lg hover:shadow-white/10"
                >
                  Hemen katıl
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-white/5 px-6 py-10 text-center">
          <p className="font-libre text-lg text-white">micodex</p>
          <p className="mt-2 font-hanken text-xs text-white/40">
            Arkadaşlarınla bir arada ol.
          </p>
        </footer>
      </main>
    </div>
  );
}
