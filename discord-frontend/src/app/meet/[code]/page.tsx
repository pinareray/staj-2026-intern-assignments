"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  MeetSession,
  chatHub,
  type MeetSessionState,
  type MeetSessionStreams,
} from "@/services";
import { readUserFromToken } from "@/lib/jwtUser";

type Participant = { userId: string; username: string };

function Tile({
  stream,
  muted,
  label,
  showVideo,
  isMe,
}: {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
  showVideo: boolean;
  isMe?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (showVideo && stream) {
      el.srcObject = stream;
      void el.play().catch(() => undefined);
    } else {
      el.srcObject = null;
    }
  }, [stream, showVideo]);

  // Ses-only: gizli audio; video açıksa <video> zaten sesi çalar
  useEffect(() => {
    if (isMe || !stream || showVideo) return;
    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.srcObject = stream;
    document.body.appendChild(audio);
    void audio.play().catch(() => undefined);
    return () => {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
    };
  }, [stream, isMe, showVideo]);

  const initial = label.replace(/^@/, "").charAt(0).toUpperCase() || "?";

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-stone-900">
      {showVideo ? (
        <video
          ref={ref}
          autoPlay
          playsInline
          muted={muted ?? false}
          className={`h-full w-full object-cover ${isMe ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container/30">
            <span className="font-libre text-2xl font-bold text-[#e1bfbd]">
              {initial}
            </span>
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8">
        <p className="truncate font-hanken text-xs font-semibold text-white">
          {label}
          {isMe ? " (sen)" : ""}
        </p>
      </div>
    </div>
  );
}

export default function MeetRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = String(params.code ?? "");

  const [user, setUser] = useState<{ id: string; username: string } | null>(
    null
  );
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessionState, setSessionState] = useState<MeetSessionState>({
    muted: false,
    cameraOn: true,
    peerStates: {},
    peerHasVideo: {},
    error: null,
  });
  const [streams, setStreams] = useState<MeetSessionStreams>({
    local: null,
    remotes: {},
  });

  const sessionRef = useRef<MeetSession | null>(null);
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/meet/${roomCode}`
      : `/meet/${roomCode}`;

  useEffect(() => {
    const u = readUserFromToken();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router, roomCode]);

  useEffect(() => {
    if (!roomCode || !user) return;

    const unsub = chatHub.subscribe("MeetRosterUpdated", (raw: unknown) => {
      const payload = raw as Record<string, unknown>;
      const code = String(payload.roomCode ?? payload.RoomCode ?? "");
      if (code !== roomCode) return;
      const list = Array.isArray(payload.participants)
        ? payload.participants
        : Array.isArray(payload.Participants)
          ? payload.Participants
          : [];
      setParticipants(
        list.map((row: Record<string, unknown>) => ({
          userId: String(row.userId ?? row.UserId ?? ""),
          username: String(row.username ?? row.Username ?? "Kullanıcı"),
        }))
      );
    });

    void chatHub.connect();

    return () => {
      unsub();
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) void session.stop();
    };
  }, [roomCode, user]);

  const handleJoin = async () => {
    if (!user) return;
    setBusy(true);
    setSessionState((p) => ({ ...p, error: null }));
    try {
      await sessionRef.current?.stop();
      const session = new MeetSession({
        roomCode,
        localUserId: user.id,
        onStateChange: setSessionState,
        onStreamsChange: setStreams,
      });
      sessionRef.current = session;
      await session.start();
      setJoined(true);
    } catch (err) {
      sessionRef.current = null;
      setJoined(false);
      setSessionState((p) => ({
        ...p,
        error:
          err instanceof Error ? err.message : "Görüşmeye katılınamadı.",
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
      setJoined(false);
      setStreams({ local: null, remotes: {} });
      setSessionState({
        muted: false,
        cameraOn: true,
        peerStates: {},
        peerHasVideo: {},
        error: null,
      });
      router.push("/meet");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setSessionState((p) => ({
        ...p,
        error: "Link kopyalanamadı.",
      }));
    }
  };

  const gridList =
    joined && participants.length === 0 && user
      ? [{ userId: user.id, username: user.username }]
      : participants;

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-stone-900">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(173,40,49,0.12),transparent_55%)]"
        aria-hidden
      />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/meet")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 font-hanken text-sm font-medium text-stone-600 shadow-sm transition hover:border-primary-container/40 hover:text-primary-container"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Geri
          </button>
          <div>
            <p className="font-libre text-lg text-stone-900">micodex</p>
            <p className="font-hanken text-xs text-stone-500">
              Toplantı · {roomCode}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 font-hanken text-xs font-semibold text-stone-700 shadow-sm transition hover:border-primary-container/40 hover:text-primary-container"
        >
          <span className="material-symbols-outlined text-base">
            {copied ? "check" : "link"}
          </span>
          {copied ? "Kopyalandı" : "Linki kopyala"}
        </button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        {sessionState.error && (
          <p className="max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center font-hanken text-sm text-red-700">
            {sessionState.error}
          </p>
        )}

        {!joined ? (
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xl shadow-stone-200/60">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container/10">
              <span className="material-symbols-outlined text-3xl text-primary-container">
                videocam
              </span>
            </div>
            <h1 className="mt-4 font-hanken text-xl font-bold text-stone-900">
              Toplantıya katıl
            </h1>
            <p className="mt-2 font-hanken text-sm text-stone-500">
              Kameranı açıp görüşmeye başlayabilirsin. Linki arkadaşlarınla
              paylaşmak için sağ üstteki butonu kullan.
            </p>
            <button
              type="button"
              disabled={busy || !user}
              onClick={() => void handleJoin()}
              className="mt-6 w-full rounded-xl bg-primary-container py-3 font-hanken text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Bağlanıyor..." : "Kamerayı aç ve katıl"}
            </button>
          </div>
        ) : (
          <>
            <div
              className={`grid w-full max-w-5xl gap-3 ${
                gridList.length <= 1
                  ? "grid-cols-1"
                  : gridList.length === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {gridList.map((p) => {
                const isMe = user && p.userId === user.id;
                const showVideo = isMe
                  ? sessionState.cameraOn
                  : Boolean(sessionState.peerHasVideo[p.userId]);
                return (
                  <Tile
                    key={p.userId}
                    stream={isMe ? streams.local : streams.remotes[p.userId] ?? null}
                    muted={Boolean(isMe)}
                    label={`@${p.username}`}
                    showVideo={showVideo}
                    isMe={Boolean(isMe)}
                  />
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() =>
                  sessionRef.current?.setMuted(!sessionState.muted)
                }
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 font-hanken text-sm font-semibold shadow-sm ${
                  sessionState.muted
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-stone-200 bg-white text-stone-700"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {sessionState.muted ? "mic_off" : "mic"}
                </span>
                {sessionState.muted ? "Sesi aç" : "Sustur"}
              </button>
              <button
                type="button"
                onClick={() =>
                  void sessionRef.current?.setCameraOn(!sessionState.cameraOn)
                }
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 font-hanken text-sm font-semibold shadow-sm ${
                  sessionState.cameraOn
                    ? "border-stone-200 bg-white text-stone-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {sessionState.cameraOn ? "videocam" : "videocam_off"}
                </span>
                {sessionState.cameraOn ? "Kamerayı kapat" : "Kamerayı aç"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleLeave()}
                className="rounded-full bg-red-600 px-5 py-2.5 font-hanken text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                Ayrıl
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
