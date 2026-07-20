"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function FloatingDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <span className="absolute left-[8%] top-[18%] h-1.5 w-1.5 rounded-full bg-white/25 animate-float-slow" />
      <span className="absolute left-[22%] top-[72%] h-1 w-1 rounded-full bg-white/20 animate-float" />
      <span className="absolute right-[18%] top-[28%] h-1.5 w-1.5 rounded-full bg-[#ad2831]/40 animate-float-delayed" />
      <span className="absolute right-[12%] bottom-[22%] h-1 w-1 rounded-full bg-white/15 animate-float-slow" />
      <span className="absolute left-[48%] top-[12%] h-1 w-1 rounded-full bg-white/20 animate-pulse" />
      <span className="absolute left-[65%] bottom-[35%] h-1.5 w-1.5 rounded-full bg-white/10 animate-float" />

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
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/app");
      return;
    }
    setChecking(false);
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

        <section className="relative mx-auto w-full max-w-6xl px-5 pb-20 pt-4 sm:px-8 sm:pb-28">
          <div className="mb-8 max-w-xl">
            <p className="font-hanken text-xs font-semibold uppercase tracking-[0.22em] text-[#e1bfbd]/60">
              Neler sunuyoruz
            </p>
            <h2 className="mt-2 font-libre text-3xl tracking-tight text-white sm:text-4xl">
              Daha fazlası için tasarlandı
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 md:gap-5">
            {/* Büyük kart — sol */}
            <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#1a0f10]/70 p-6 shadow-[0_0_0_1px_rgba(173,40,49,0)] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-[#ad2831]/50 hover:shadow-[0_0_40px_rgba(173,40,49,0.25)] md:col-span-2 md:row-span-2 md:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#ad2831]/15 blur-3xl transition-opacity group-hover:opacity-100" />

              <Image
                src="/server-3d.png"
                alt=""
                width={512}
                height={512}
                aria-hidden
                className="pointer-events-none absolute bottom-2 right-2 z-0 h-64 w-64 select-none object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)] animate-float"
              />

              <span className="material-symbols-outlined relative z-10 text-3xl text-[#ad2831]">
                hub
              </span>
              <h3 className="relative z-10 mt-4 font-libre text-2xl text-white sm:text-3xl">
                Sınır Tanımayan Sunucular
              </h3>
              <p className="relative z-10 mt-2 max-w-md font-hanken text-sm leading-relaxed text-gray-400">
                Kanallar oluştur, roller paylaş ve topluluğunu kendi kurallarınla
                büyüt. Her sunucu senin sahnen.
              </p>

              <div className="pointer-events-none mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0c0708]/40 opacity-25">
                <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#ad2831]" />
                  <span className="font-hanken text-xs text-[#e1bfbd]/70">
                    # genel
                  </span>
                  <span className="ml-auto font-hanken text-[10px] text-white/30">
                    canlı
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ad2831]/25 font-libre text-xs font-bold text-[#ad2831]">
                      A
                    </div>
                    <div>
                      <p className="font-hanken text-xs font-semibold text-white">
                        ayse{" "}
                        <span className="font-normal text-white/30">
                          bugün 14:02
                        </span>
                      </p>
                      <p className="mt-0.5 rounded-xl rounded-tl-sm bg-white/5 px-3 py-2 font-hanken text-sm text-gray-300">
                        Yeni sunucu harika olmuş!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 font-libre text-xs font-bold text-white/70">
                      M
                    </div>
                    <div>
                      <p className="font-hanken text-xs font-semibold text-white">
                        mert{" "}
                        <span className="font-normal text-white/30">
                          bugün 14:03
                        </span>
                      </p>
                      <p className="mt-0.5 rounded-xl rounded-tl-sm bg-[#ad2831]/20 px-3 py-2 font-hanken text-sm text-gray-200">
                        #duyurular kanalına da bak 🔥
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    <span className="font-hanken text-xs text-white/35">
                      Mesaj yaz...
                    </span>
                  </div>
                </div>
              </div>
            </article>

            {/* Sağ üst */}
            <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#1a0f10]/70 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:border-[#ad2831]/50 hover:shadow-[0_0_36px_rgba(173,40,49,0.28)] md:col-span-1">
              <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#ad2831]/20 blur-2xl opacity-60 transition-opacity group-hover:opacity-100" />

              <Image
                src="/lightning-3d.png"
                alt=""
                width={256}
                height={256}
                aria-hidden
                className="pointer-events-none absolute -bottom-4 -right-4 z-0 h-32 w-32 select-none object-contain opacity-80 drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] animate-float"
              />

              <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ad2831]/15">
                <span className="material-symbols-outlined text-[#ad2831]">
                  bolt
                </span>
              </div>
              <h3 className="relative z-10 mt-4 font-libre text-xl text-white">
                Gerçek Zamanlı İletişim
              </h3>
              <p className="relative z-10 mt-2 font-hanken text-sm leading-relaxed text-gray-400">
                SignalR ile mesajlar anında akar. Gecikme yok, yenileme yok —
                sohbet canlı kalır.
              </p>
              <div className="relative z-10 mt-5 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="font-hanken text-xs font-medium text-emerald-400/90">
                  SignalR bağlı
                </span>
              </div>
            </article>

            {/* Sağ alt */}
            <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#1a0f10]/70 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:border-[#ad2831]/50 hover:shadow-[0_0_36px_rgba(173,40,49,0.28)] md:col-span-1">
              <div className="pointer-events-none absolute -right-8 -bottom-8 h-28 w-28 rounded-full bg-[#ad2831]/15 blur-2xl opacity-50 transition-opacity group-hover:opacity-100" />

              <Image
                src="/archive-3d.png"
                alt=""
                width={256}
                height={256}
                aria-hidden
                className="pointer-events-none absolute -bottom-3 -right-3 z-0 h-32 w-32 select-none object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)] animate-float"
              />

              <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ad2831]/15">
                <span className="material-symbols-outlined text-[#ad2831]">
                  person
                </span>
              </div>
              <h3 className="relative z-10 mt-4 font-libre text-xl text-white">
                Sana Özel Arşiv
              </h3>
              <p className="relative z-10 mt-2 font-hanken text-sm leading-relaxed text-gray-400">
                Profilini özelleştir, arkadaşlarını yönet ve kendi alanını
                oluştur. MiCodex seni hatırlar.
              </p>
              <div className="relative z-10 mt-5 flex -space-x-2">
                {["P", "D", "A", "M"].map((letter, i) => (
                  <div
                    key={letter}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1a0f10] font-libre text-xs font-bold text-white"
                    style={{
                      backgroundColor:
                        i % 2 === 0
                          ? "rgba(173,40,49,0.45)"
                          : "rgba(255,255,255,0.12)",
                    }}
                  >
                    {letter}
                  </div>
                ))}
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1a0f10] bg-white/10 font-hanken text-[10px] text-white/60">
                  +
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
