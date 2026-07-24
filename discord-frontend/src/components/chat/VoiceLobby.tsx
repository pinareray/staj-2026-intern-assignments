"use client";

import { useEffect, useRef, useState } from "react";
import { chatHub, VoiceSession } from "@/services";
import type { VoiceSessionState } from "@/services";

type VoiceParticipant = {
  userId: string;
  username: string;
};

type VoiceLobbyProps = {
  channelId: string;
  channelName: string;
  currentUserId: string | null;
  currentUsername: string;
};

function StatusDot({ tone }: { tone: "live" | "warn" | "off" | "error" }) {
  const color =
    tone === "live"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "error"
          ? "bg-red-500"
          : "bg-stone-300";
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${color} ${
        tone === "live" ? "animate-pulse" : ""
      }`}
    />
  );
}

export default function VoiceLobby({
  channelId,
  channelName,
  currentUserId,
  currentUsername,
}: VoiceLobbyProps) {
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [busy, setBusy] = useState(false);
  const [sessionState, setSessionState] = useState<VoiceSessionState>({
    muted: false,
    deafened: false,
    peerStates: {},
    error: null,
  });

  const sessionRef = useRef<VoiceSession | null>(null);

  useEffect(() => {
    setJoined(false);
    setParticipants([]);
    setSessionState({
      muted: false,
      deafened: false,
      peerStates: {},
      error: null,
    });

    const unsub = chatHub.subscribe("VoiceRosterUpdated", (raw: unknown) => {
      const payload = raw as Record<string, unknown>;
      const id = String(payload.channelId ?? payload.ChannelId ?? "");
      if (id !== channelId) return;

      const list = Array.isArray(payload.participants)
        ? payload.participants
        : Array.isArray(payload.Participants)
          ? payload.Participants
          : [];

      const mapped: VoiceParticipant[] = list.map(
        (row: Record<string, unknown>) => ({
          userId: String(row.userId ?? row.UserId ?? ""),
          username: String(row.username ?? row.Username ?? "Kullanıcı"),
        })
      );
      setParticipants(mapped);
    });

    void chatHub.connect();
    void chatHub.joinChannel(channelId);

    return () => {
      unsub();
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) void session.stop();
    };
  }, [channelId]);

  const handleJoin = async () => {
    if (!currentUserId) {
      setSessionState((prev) => ({
        ...prev,
        error: "Oturum bulunamadı. Yeniden giriş yap.",
      }));
      return;
    }

    setBusy(true);
    setSessionState((prev) => ({ ...prev, error: null }));
    try {
      await sessionRef.current?.stop();
      const session = new VoiceSession({
        channelId,
        localUserId: currentUserId,
        onStateChange: setSessionState,
      });
      sessionRef.current = session;
      await session.start();
      setJoined(true);
    } catch (err) {
      sessionRef.current = null;
      setJoined(false);
      setSessionState((prev) => ({
        ...prev,
        error:
          err instanceof Error
            ? err.message
            : "Sese katılırken bir hata oluştu.",
      }));
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) await session.stop();
      else await chatHub.invoke("LeaveVoice", channelId);
      setJoined(false);
      setSessionState({
        muted: false,
        deafened: false,
        peerStates: {},
        error: null,
      });
    } finally {
      setBusy(false);
    }
  };

  const inList =
    joined ||
    participants.some(
      (p) =>
        (currentUserId && p.userId === currentUserId) ||
        p.username === currentUsername
    );

  const peerMeta = (peerId: string) => {
    if (!joined) return { label: "Bekliyor", tone: "off" as const };
    const state = sessionState.peerStates[peerId];
    if (state === "connected") return { label: "Bağlı", tone: "live" as const };
    if (state === "failed")
      return { label: "Bağlantı hatası", tone: "error" as const };
    if (state === "connecting")
      return { label: "Bağlanıyor", tone: "warn" as const };
    return { label: "Bekliyor", tone: "off" as const };
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 20%, rgba(173,40,49,0.07), transparent 65%)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7 px-6 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-container/15 bg-white shadow-[0_8px_24px_rgba(28,25,23,0.06)]">
            <span className="material-symbols-outlined text-[28px] text-primary-container">
              headphones
            </span>
          </div>
          <p className="mb-1.5 font-hanken text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            Ses kanalı
          </p>
          <h2 className="font-libre text-[1.75rem] tracking-tight text-stone-900">
            {channelName}
          </h2>
          <p className="mt-2 max-w-xs font-hanken text-sm leading-relaxed text-stone-500">
            Kanala katıldığında mikrofonun açılır; odadaki herkesi canlı
            duyarsın.
          </p>
        </div>

        {sessionState.error && (
          <p className="max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center font-hanken text-sm text-red-700">
            {sessionState.error}
          </p>
        )}

        <section className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200/90 bg-white/90 shadow-[0_10px_30px_rgba(28,25,23,0.04)] backdrop-blur-sm">
          <header className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-stone-400">
                group
              </span>
              <h3 className="font-hanken text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
                Katılımcılar
              </h3>
            </div>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 font-hanken text-[11px] font-semibold tabular-nums text-stone-600">
              {participants.length}
            </span>
          </header>

          <div className="px-3 py-3">
            {participants.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="material-symbols-outlined text-3xl text-stone-300">
                  voice_selection
                </span>
                <p className="font-hanken text-sm text-stone-500">
                  Odada kimse yok
                </p>
                <p className="font-hanken text-xs text-stone-400">
                  İlk katılan sen ol.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {participants.map((p) => {
                  const isMe =
                    (currentUserId && p.userId === currentUserId) ||
                    p.username === currentUsername;
                  const meta = isMe
                    ? joined
                      ? sessionState.muted
                        ? { label: "Sessiz", tone: "off" as const }
                        : { label: "Aktif", tone: "live" as const }
                      : { label: "Lobide", tone: "off" as const }
                    : peerMeta(p.userId);

                  return (
                    <li
                      key={`${p.userId}-${p.username}`}
                      className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-stone-50"
                    >
                      <div className="relative">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 ring-1 ring-stone-200/80">
                          <span className="font-libre text-sm font-bold uppercase text-stone-600">
                            {p.username.charAt(0) || "?"}
                          </span>
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white bg-white p-[1px]">
                          <StatusDot tone={meta.tone} />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-hanken text-sm font-medium text-stone-800">
                          {p.username}
                          {isMe ? (
                            <span className="ml-1.5 font-normal text-stone-400">
                              sen
                            </span>
                          ) : null}
                        </p>
                        <p className="font-hanken text-[11px] text-stone-400">
                          {meta.label}
                        </p>
                      </div>
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          isMe && sessionState.muted
                            ? "text-stone-400"
                            : meta.tone === "live"
                              ? "text-primary-container"
                              : "text-stone-300"
                        }`}
                      >
                        {isMe && sessionState.muted ? "mic_off" : "mic"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {inList && joined ? (
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm">
            <button
              type="button"
              disabled={busy}
              title={sessionState.muted ? "Mikrofonu aç" : "Sustur"}
              onClick={() => sessionRef.current?.setMuted(!sessionState.muted)}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition disabled:opacity-60 ${
                sessionState.muted
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {sessionState.muted ? "mic_off" : "mic"}
              </span>
            </button>
            <button
              type="button"
              disabled={busy}
              title={
                sessionState.deafened ? "Sesleri aç" : "Kulaklığı kapat"
              }
              onClick={() =>
                sessionRef.current?.setDeafened(!sessionState.deafened)
              }
              className={`flex h-11 w-11 items-center justify-center rounded-full transition disabled:opacity-60 ${
                sessionState.deafened
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {sessionState.deafened ? "headset_off" : "headset"}
              </span>
            </button>
            <div className="mx-1 h-6 w-px bg-stone-200" />
            <button
              type="button"
              disabled={busy}
              title="Odadan ayrıl"
              onClick={() => void handleLeave()}
              className="flex h-11 items-center gap-2 rounded-full bg-stone-900 px-4 font-hanken text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[20px]">
                call_end
              </span>
              {busy ? "…" : "Ayrıl"}
            </button>
          </div>
        ) : inList ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleLeave()}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3 font-hanken text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            {busy ? "Çıkılıyor…" : "Odadan ayrıl"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || !currentUserId}
            onClick={() => void handleJoin()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-container px-7 py-3.5 font-hanken text-sm font-semibold text-white shadow-[0_8px_20px_rgba(173,40,49,0.25)] transition hover:bg-[#8f1b1c] disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[20px]">
              headphones
            </span>
            {busy ? "Bağlanıyor…" : "Sese katıl"}
          </button>
        )}
      </div>
    </div>
  );
}
