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
      if (session) {
        void session.stop();
      }
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
      const message =
        err instanceof Error
          ? err.message
          : "Sese katılırken bir hata oluştu.";
      setSessionState((prev) => ({ ...prev, error: message }));
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) {
        await session.stop();
      } else {
        await chatHub.invoke("LeaveVoice", channelId);
      }
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

  const peerStatusLabel = (peerId: string) => {
    if (!joined) return "Lobide";
    const state = sessionState.peerStates[peerId];
    if (state === "connected") return "Bağlı";
    if (state === "failed") return "Bağlantı başarısız";
    if (state === "connecting") return "Bağlanıyor…";
    return "Lobide";
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10">
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container/10">
          <span
            className="material-symbols-outlined text-4xl text-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            volume_up
          </span>
        </div>
        <h2 className="font-libre text-2xl text-stone-900">{channelName}</h2>
        <p className="max-w-sm font-hanken text-sm text-stone-500">
          Sese katıl; mikrofonun açılır ve odadaki diğer kişileri gerçek zamanlı
          duyarsın (mesh WebRTC).
        </p>
      </div>

      {sessionState.error && (
        <p className="max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center font-hanken text-sm text-red-700">
          {sessionState.error}
        </p>
      )}

      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-hanken text-xs font-bold uppercase tracking-widest text-stone-400">
            Katılımcılar
          </p>
          <span className="font-hanken text-xs text-stone-400">
            {participants.length}
          </span>
        </div>

        {participants.length === 0 ? (
          <p className="py-6 text-center font-hanken text-sm text-stone-400">
            Henüz kimse yok. İlk sen katıl.
          </p>
        ) : (
          <ul className="space-y-2">
            {participants.map((p) => {
              const isMe =
                (currentUserId && p.userId === currentUserId) ||
                p.username === currentUsername;
              const status = isMe
                ? joined
                  ? sessionState.muted
                    ? "Sessizde"
                    : "Konuşuyor"
                  : "Lobide"
                : peerStatusLabel(p.userId);
              const statusColor =
                status === "Bağlı" || status === "Konuşuyor"
                  ? "text-emerald-600"
                  : status === "Bağlantı başarısız"
                    ? "text-red-600"
                    : status === "Bağlanıyor…"
                      ? "text-amber-600"
                      : "text-stone-500";

              return (
                <li
                  key={`${p.userId}-${p.username}`}
                  className="flex items-center gap-3 rounded-xl bg-stone-50 px-3 py-2.5"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container/15">
                    <span className="font-libre text-sm font-bold uppercase text-primary-container">
                      {p.username.charAt(0) || "?"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-hanken text-sm font-medium text-stone-800">
                      @{p.username}
                      {isMe ? " (sen)" : ""}
                    </p>
                    <p className={`font-hanken text-[10px] ${statusColor}`}>
                      {status}
                    </p>
                  </div>
                  <span
                    className={`material-symbols-outlined text-lg ${
                      status === "Bağlı" || status === "Konuşuyor"
                        ? "text-emerald-500"
                        : "text-stone-400"
                    }`}
                  >
                    {isMe && sessionState.muted ? "mic_off" : "hearing"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {inList && joined ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              sessionRef.current?.setMuted(!sessionState.muted)
            }
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 font-hanken text-sm font-semibold transition disabled:opacity-60 ${
              sessionState.muted
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {sessionState.muted ? "mic_off" : "mic"}
            </span>
            {sessionState.muted ? "Sesi aç" : "Sustur"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              sessionRef.current?.setDeafened(!sessionState.deafened)
            }
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 font-hanken text-sm font-semibold transition disabled:opacity-60 ${
              sessionState.deafened
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {sessionState.deafened ? "headset_off" : "headset"}
            </span>
            {sessionState.deafened ? "Sağırlığı kapat" : "Sağırlaştır"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleLeave()}
            className="rounded-xl bg-stone-900 px-6 py-2.5 font-hanken text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
          >
            {busy ? "Çıkılıyor..." : "Odadan ayrıl"}
          </button>
        </div>
      ) : inList ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleLeave()}
          className="rounded-xl bg-stone-900 px-8 py-3 font-hanken text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {busy ? "Çıkılıyor..." : "Odadan ayrıl"}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy || !currentUserId}
          onClick={() => void handleJoin()}
          className="rounded-xl bg-primary-container px-8 py-3 font-hanken text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Katılıyor..." : "Sese katıl"}
        </button>
      )}
    </div>
  );
}
