"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { generateMeetCode } from "@/services";

export default function MeetHomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/login?returnUrl=/meet");
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#5c1520_0%,#250902_45%,#0a0506_100%)] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a0f10]/85 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container/20">
            <span className="material-symbols-outlined text-3xl text-[#e1bfbd]">
              videocam
            </span>
          </div>
          <h1 className="mt-4 font-hanken text-2xl font-extrabold text-white">
            Görüntülü arama
          </h1>
          <p className="mt-2 font-hanken text-sm text-white/60">
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
          <div className="h-px flex-1 bg-white/10" />
          <span className="font-hanken text-xs text-white/40">veya</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <label className="block space-y-2">
          <span className="font-hanken text-xs font-bold uppercase tracking-wider text-white/40">
            Kod ile katıl
          </span>
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="örn. a7Kx9mQ2"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 font-hanken text-sm text-white outline-none placeholder:text-white/30 focus:border-primary-container/50"
          />
        </label>
        <button
          type="button"
          disabled={!joinCode.trim()}
          onClick={joinExisting}
          className="mt-3 w-full rounded-xl border border-white/15 bg-white/10 py-3 font-hanken text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-40"
        >
          Katıl
        </button>

        <Link
          href="/app"
          className="mt-6 block text-center font-hanken text-sm text-white/45 hover:text-white/80"
        >
          Uygulamaya dön
        </Link>
      </div>
    </div>
  );
}
