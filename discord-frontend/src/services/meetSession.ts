import { chatHub } from "@/services/chatHub";

export type MeetPeerState = "connecting" | "connected" | "failed";

export type MeetSessionStreams = {
  local: MediaStream | null;
  remotes: Record<string, MediaStream>;
};

export type MeetSessionState = {
  muted: boolean;
  cameraOn: boolean;
  peerStates: Record<string, MeetPeerState>;
  peerHasVideo: Record<string, boolean>;
  error: string | null;
};

type MeetSignalPayload = {
  type: "offer" | "answer" | "ice";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit | null;
};

type PeerSlot = {
  pc: RTCPeerConnection;
  remoteStream: MediaStream;
  makingOffer: boolean;
  ignoreOffer: boolean;
  polite: boolean;
};

type MeetSessionOptions = {
  roomCode: string;
  localUserId: string;
  onStateChange?: (state: MeetSessionState) => void;
  onStreamsChange?: (streams: MeetSessionStreams) => void;
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

/** Google Meet tarzı mesh WebRTC — ses + görüntü, link ile oda. */
export class MeetSession {
  private readonly roomCode: string;
  private readonly localUserId: string;
  private readonly onStateChange?: (state: MeetSessionState) => void;
  private readonly onStreamsChange?: (streams: MeetSessionStreams) => void;

  private localStream: MediaStream | null = null;
  private peers = new Map<string, PeerSlot>();
  private muted = false;
  private cameraOn = true;
  private error: string | null = null;
  private stopped = false;

  private unsubSignal: (() => void) | null = null;
  private unsubJoined: (() => void) | null = null;
  private unsubLeft: (() => void) | null = null;
  private unsubRoster: (() => void) | null = null;

  constructor(options: MeetSessionOptions) {
    this.roomCode = options.roomCode;
    this.localUserId = options.localUserId;
    this.onStateChange = options.onStateChange;
    this.onStreamsChange = options.onStreamsChange;
  }

  getState(): MeetSessionState {
    const peerStates: Record<string, MeetPeerState> = {};
    const peerHasVideo: Record<string, boolean> = {};

    this.peers.forEach((slot, peerId) => {
      const ice = slot.pc.iceConnectionState;
      if (ice === "connected" || ice === "completed") {
        peerStates[peerId] = "connected";
      } else if (ice === "failed") {
        peerStates[peerId] = "failed";
      } else {
        peerStates[peerId] = "connecting";
      }
      peerHasVideo[peerId] = slot.remoteStream
        .getVideoTracks()
        .some((t) => t.readyState === "live" && t.enabled);
    });

    return {
      muted: this.muted,
      cameraOn: this.cameraOn,
      peerStates,
      peerHasVideo,
      error: this.error,
    };
  }

  getStreams(): MeetSessionStreams {
    const remotes: Record<string, MediaStream> = {};
    this.peers.forEach((slot, peerId) => {
      remotes[peerId] = slot.remoteStream;
    });
    return { local: this.localStream, remotes };
  }

  private emit() {
    this.onStateChange?.(this.getState());
  }

  private emitStreams() {
    this.onStreamsChange?.(this.getStreams());
    this.emit();
  }

  async start(): Promise<void> {
    this.stopped = false;
    this.error = null;
    this.cameraOn = true;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
    } catch {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        this.cameraOn = false;
      } catch {
        this.error =
          "Mikrofon/kamera izni alınamadı. Tarayıcı ayarlarını kontrol et.";
        this.emit();
        throw new Error(this.error);
      }
    }

    this.applyMute();
    this.emitStreams();

    this.unsubSignal = chatHub.subscribe("MeetSignal", (raw) => {
      void this.onSignal(raw);
    });
    this.unsubJoined = chatHub.subscribe("MeetPeerJoined", (raw) => {
      void this.onPeerJoined(raw);
    });
    this.unsubLeft = chatHub.subscribe("MeetPeerLeft", (raw) => {
      this.onPeerLeft(raw);
    });
    this.unsubRoster = chatHub.subscribe("MeetRosterUpdated", (raw) => {
      void this.onRoster(raw);
    });

    await chatHub.invoke("JoinMeet", this.roomCode);
    this.emit();
  }

  async stop(): Promise<void> {
    if (this.stopped) return;
    this.stopped = true;

    this.unsubSignal?.();
    this.unsubJoined?.();
    this.unsubLeft?.();
    this.unsubRoster?.();
    this.unsubSignal = null;
    this.unsubJoined = null;
    this.unsubLeft = null;
    this.unsubRoster = null;

    [...this.peers.keys()].forEach((id) => this.closePeer(id));
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.cameraOn = false;

    try {
      await chatHub.invoke("LeaveMeet", this.roomCode);
    } catch {
      // ignore
    }

    this.emitStreams();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyMute();
    this.emit();
  }

  async setCameraOn(on: boolean): Promise<void> {
    if (this.stopped || !this.localStream) return;
    if (on === this.cameraOn) return;

    if (on) {
      try {
        const cam = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        const track = cam.getVideoTracks()[0];
        if (!track) throw new Error("Kamera yok");
        this.localStream.addTrack(track);
        this.cameraOn = true;
        for (const peerId of [...this.peers.keys()]) {
          const slot = this.peers.get(peerId);
          if (!slot) continue;
          slot.pc.addTrack(track, this.localStream);
          await this.createAndSendOffer(peerId);
        }
      } catch {
        this.error = "Kamera açılamadı.";
        this.emit();
        throw new Error(this.error);
      }
    } else {
      for (const track of this.localStream.getVideoTracks()) {
        this.peers.forEach((slot) => {
          slot.pc.getSenders().forEach((sender) => {
            if (sender.track === track) {
              try {
                slot.pc.removeTrack(sender);
              } catch {
                // ignore
              }
            }
          });
        });
        track.stop();
        this.localStream.removeTrack(track);
      }
      this.cameraOn = false;
      for (const peerId of [...this.peers.keys()]) {
        await this.createAndSendOffer(peerId);
      }
    }

    this.emitStreams();
  }

  private applyMute() {
    this.localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !this.muted;
    });
  }

  private isPoliteToward(peerId: string) {
    return this.localUserId < peerId;
  }

  private async ensurePeer(peerId: string): Promise<PeerSlot | null> {
    if (this.stopped || peerId === this.localUserId) return null;
    const existing = this.peers.get(peerId);
    if (existing) return existing;
    if (!this.localStream) return null;

    const polite = this.isPoliteToward(peerId);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const remoteStream = new MediaStream();
    const slot: PeerSlot = {
      pc,
      remoteStream,
      makingOffer: false,
      ignoreOffer: false,
      polite,
    };
    this.peers.set(peerId, slot);

    this.localStream.getTracks().forEach((track) => {
      pc.addTrack(track, this.localStream!);
    });

    pc.onicecandidate = (event) => {
      void this.sendSignal(peerId, {
        type: "ice",
        candidate: event.candidate ? event.candidate.toJSON() : null,
      });
    };

    pc.ontrack = (event) => {
      const track = event.track;
      if (!slot.remoteStream.getTracks().some((t) => t.id === track.id)) {
        slot.remoteStream.addTrack(track);
      }
      track.onended = () => {
        try {
          slot.remoteStream.removeTrack(track);
        } catch {
          // ignore
        }
        this.emitStreams();
      };
      this.emitStreams();
    };

    pc.onconnectionstatechange = () => this.emit();
    pc.oniceconnectionstatechange = () => this.emit();
    this.emitStreams();
    return slot;
  }

  private closePeer(peerId: string) {
    const slot = this.peers.get(peerId);
    if (!slot) return;
    slot.pc.onicecandidate = null;
    slot.pc.ontrack = null;
    slot.pc.close();
    slot.remoteStream.getTracks().forEach((t) => {
      try {
        slot.remoteStream.removeTrack(t);
      } catch {
        // ignore
      }
    });
    this.peers.delete(peerId);
    this.emitStreams();
  }

  private async sendSignal(targetUserId: string, payload: MeetSignalPayload) {
    await chatHub.invoke(
      "SendMeetSignal",
      this.roomCode,
      targetUserId,
      payload
    );
  }

  private async createAndSendOffer(peerId: string) {
    const slot = await this.ensurePeer(peerId);
    if (!slot || this.stopped) return;
    try {
      slot.makingOffer = true;
      const offer = await slot.pc.createOffer();
      await slot.pc.setLocalDescription(offer);
      await this.sendSignal(peerId, {
        type: "offer",
        sdp: slot.pc.localDescription ?? offer,
      });
    } catch (err) {
      console.warn("[MeetSession] offer failed", peerId, err);
      this.error = "Görüşme bağlantısı kurulamadı.";
      this.emit();
    } finally {
      slot.makingOffer = false;
    }
  }

  private async onRoster(raw: unknown) {
    if (this.stopped) return;
    const payload = asRecord(raw);
    const code = String(payload.roomCode ?? payload.RoomCode ?? "");
    if (code !== this.roomCode) return;

    const list = Array.isArray(payload.participants)
      ? payload.participants
      : Array.isArray(payload.Participants)
        ? payload.Participants
        : [];

    const remoteIds = new Set<string>();
    for (const row of list) {
      const rec = asRecord(row);
      const peerId = String(rec.userId ?? rec.UserId ?? "");
      if (!peerId || peerId === this.localUserId) continue;
      remoteIds.add(peerId);
      if (this.localUserId > peerId && !this.peers.has(peerId)) {
        await this.createAndSendOffer(peerId);
      } else {
        await this.ensurePeer(peerId);
      }
    }

    [...this.peers.keys()].forEach((peerId) => {
      if (!remoteIds.has(peerId)) this.closePeer(peerId);
    });
  }

  private async onPeerJoined(raw: unknown) {
    if (this.stopped) return;
    const payload = asRecord(raw);
    const code = String(payload.roomCode ?? payload.RoomCode ?? "");
    if (code !== this.roomCode) return;
    const peerId = String(payload.userId ?? payload.UserId ?? "");
    if (!peerId || peerId === this.localUserId) return;
    if (this.localUserId > peerId) await this.createAndSendOffer(peerId);
    else await this.ensurePeer(peerId);
  }

  private onPeerLeft(raw: unknown) {
    const payload = asRecord(raw);
    const code = String(payload.roomCode ?? payload.RoomCode ?? "");
    if (code !== this.roomCode) return;
    const peerId = String(payload.userId ?? payload.UserId ?? "");
    if (peerId) this.closePeer(peerId);
  }

  private async onSignal(raw: unknown) {
    if (this.stopped) return;
    const envelope = asRecord(raw);
    const code = String(envelope.roomCode ?? envelope.RoomCode ?? "");
    if (code !== this.roomCode) return;

    const fromUserId = String(
      envelope.fromUserId ?? envelope.FromUserId ?? ""
    );
    if (!fromUserId || fromUserId === this.localUserId) return;

    const payload = asRecord(envelope.payload ?? envelope.Payload);
    const type = String(payload.type ?? payload.Type ?? "") as
      | "offer"
      | "answer"
      | "ice"
      | "";

    const slot = await this.ensurePeer(fromUserId);
    if (!slot) return;

    try {
      if (type === "offer") {
        const sdp = (payload.sdp ?? payload.Sdp) as
          | RTCSessionDescriptionInit
          | undefined;
        if (!sdp) return;
        const offerCollision =
          slot.makingOffer || slot.pc.signalingState !== "stable";
        slot.ignoreOffer = !slot.polite && offerCollision;
        if (slot.ignoreOffer) return;
        await slot.pc.setRemoteDescription(sdp);
        const answer = await slot.pc.createAnswer();
        await slot.pc.setLocalDescription(answer);
        await this.sendSignal(fromUserId, {
          type: "answer",
          sdp: slot.pc.localDescription ?? answer,
        });
      } else if (type === "answer") {
        const sdp = (payload.sdp ?? payload.Sdp) as
          | RTCSessionDescriptionInit
          | undefined;
        if (!sdp) return;
        if (slot.pc.signalingState === "have-local-offer") {
          await slot.pc.setRemoteDescription(sdp);
        }
      } else if (type === "ice") {
        const candidate = (payload.candidate ?? payload.Candidate) as
          | RTCIceCandidateInit
          | null
          | undefined;
        if (candidate) {
          try {
            await slot.pc.addIceCandidate(candidate);
          } catch (err) {
            if (!slot.ignoreOffer) console.warn("[MeetSession] ice", err);
          }
        }
      }
    } catch (err) {
      console.warn("[MeetSession] signal failed", err);
      this.error = "Görüşme sinyali işlenemedi.";
      this.emit();
    }
  }
}

export function generateMeetCode(length = 8): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
