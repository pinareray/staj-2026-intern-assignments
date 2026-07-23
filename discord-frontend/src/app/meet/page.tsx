"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateMeetCode } from "@/services";

export default function MeetHomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/login");
    }
  }, [router]);

  const startNew = () => {
    const code = generateMeetCode();
    router.push(`/meet/${code}`);
  };

  const joinExisting = () => {
    const code = joinCode.trim();
    if (!code) return;
    router.push(`/meet/${code}`);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(173,40,49,0.12),transparent_55%)]"
        aria-hidden
      />

      <button
        type="button"
        onClick={() => router.push("/app")}
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 font-hanken text-sm font-medium text-stone-600 shadow-sm transition hover:border-primary-container/40 hover:text-primary-container"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Geri
      </button>

      <div className="relative w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-200/60">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container/10">
            <span className="material-symbols-outlined text-3xl text-primary-container">
              videocam
            </span>
          </div>
          <h1 className="mt-4 font-hanken text-2xl font-extrabold text-stone-900">
            Toplantı
          </h1>
          <p className="mt-2 font-hanken text-sm text-stone-500">
            Yeni bir görüşme başlat veya linkteki kodla katıl. Arkadaşlarına
            linki kopyalayıp atabilirsin.
          </p>
        </div>

        <button
          type="button"
          onClick={startNew}
          className="mt-8 w-full rounded-xl bg-primary-container py-3.5 font-hanken text-sm font-semibold text-white transition hover:opacity-90"
        >
          Yeni görüşme başlat
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="font-hanken text-xs text-stone-400">veya</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <label className="block space-y-2">
          <span className="font-hanken text-xs font-bold uppercase tracking-wider text-stone-400">
            Kod ile katıl
          </span>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="örn. a7Kx9mQ2"
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 font-hanken text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:border-primary-container/50 focus:ring-1 focus:ring-primary-container/30"
          />
        </label>
        <button
          type="button"
          disabled={!joinCode.trim()}
          onClick={joinExisting}
          className="mt-3 w-full rounded-xl border border-stone-200 bg-stone-100 py-3 font-hanken text-sm font-semibold text-stone-700 transition hover:bg-stone-200 disabled:opacity-40"
        >
          Katıl
        </button>
      </div>
    </div>
  );
}
