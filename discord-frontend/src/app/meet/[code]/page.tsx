"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  MeetSession,
  chatHub,
  type MeetSessionState,
  type MeetSessionStreams,
} from "@/services";

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

function readUserFromToken(): { id: string; username: string } | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    const id = String(
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ??
        payload.sub ??
        ""
    );
    const username = String(
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
      ] ??
        payload.unique_name ??
        payload.name ??
        localStorage.getItem("username") ??
        "Sen"
    );
    if (!id) return null;
    return { id, username };
  } catch {
    return null;
  }
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
      router.replace(
        `/login?returnUrl=${encodeURIComponent(`/meet/${roomCode}`)}`
      );
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
    <div className="flex min-h-screen flex-col bg-[#0a0506] text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <div>
          <p className="font-libre text-lg">micodex</p>
          <p className="font-hanken text-xs text-white/45">
            Görüşme · {roomCode}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-hanken text-xs font-semibold transition hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-base">
              {copied ? "check" : "link"}
            </span>
            {copied ? "Kopyalandı" : "Linki kopyala"}
          </button>
          <Link
            href="/app"
            className="rounded-full px-3 py-1.5 font-hanken text-xs text-white/50 hover:text-white"
          >
            Uygulama
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        {sessionState.error && (
          <p className="max-w-md rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center font-hanken text-sm text-red-200">
            {sessionState.error}
          </p>
        )}

        {!joined ? (
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-[#e1bfbd]">
              videocam
            </span>
            <h1 className="mt-4 font-hanken text-xl font-bold">
              Görüşmeye katıl
            </h1>
            <p className="mt-2 break-all font-hanken text-xs text-white/50">
              {inviteUrl}
            </p>
            <button
              type="button"
              disabled={busy || !user}
              onClick={() => void handleJoin()}
              className="mt-6 w-full rounded-xl bg-primary-container py-3 font-hanken text-sm font-semibold text-white disabled:opacity-50"
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
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-hanken text-sm font-semibold ${
                  sessionState.muted
                    ? "bg-red-500/20 text-red-200"
                    : "bg-white/10 text-white"
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
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-hanken text-sm font-semibold ${
                  sessionState.cameraOn
                    ? "bg-white/10 text-white"
                    : "bg-red-500/20 text-red-200"
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
