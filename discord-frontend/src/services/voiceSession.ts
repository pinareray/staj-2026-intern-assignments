import { chatHub } from "@/services/chatHub";

export type VoicePeerState = "connecting" | "connected" | "failed";

export type VoiceSessionState = {
  muted: boolean;
  deafened: boolean;
  peerStates: Record<string, VoicePeerState>;
  error: string | null;
};

type VoiceSignalPayload = {
  type: "offer" | "answer" | "ice";
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit | null;
};

type PeerSlot = {
  pc: RTCPeerConnection;
  remoteAudio: HTMLAudioElement;
  makingOffer: boolean;
  ignoreOffer: boolean;
  polite: boolean;
};

type VoiceSessionOptions = {
  channelId: string;
  localUserId: string;
  onStateChange?: (state: VoiceSessionState) => void;
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

/**
 * Mesh WebRTC ses oturumu.
 * Yeni katılan mevcut peer'lara offer yollar; glare için polite/impolite kuralı kullanılır.
 */
export class VoiceSession {
  private readonly channelId: string;
  private readonly localUserId: string;
  private readonly onStateChange?: (state: VoiceSessionState) => void;

  private localStream: MediaStream | null = null;
  private peers = new Map<string, PeerSlot>();
  private muted = false;
  private deafened = false;
  private error: string | null = null;
  private stopped = false;

  private unsubSignal: (() => void) | null = null;
  private unsubJoined: (() => void) | null = null;
  private unsubLeft: (() => void) | null = null;
  private unsubRoster: (() => void) | null = null;

  constructor(options: VoiceSessionOptions) {
    this.channelId = options.channelId;
    this.localUserId = options.localUserId;
    this.onStateChange = options.onStateChange;
  }

  getState(): VoiceSessionState {
    const peerStates: Record<string, VoicePeerState> = {};
    this.peers.forEach((slot, peerId) => {
      const ice = slot.pc.iceConnectionState;
      if (ice === "connected" || ice === "completed") {
        peerStates[peerId] = "connected";
      } else if (ice === "failed" || ice === "disconnected" || ice === "closed") {
        peerStates[peerId] = ice === "failed" ? "failed" : "connecting";
      } else {
        peerStates[peerId] = "connecting";
      }
    });

    return {
      muted: this.muted,
      deafened: this.deafened,
      peerStates,
      error: this.error,
    };
  }

  private emit() {
    this.onStateChange?.(this.getState());
  }

  async start(): Promise<void> {
    this.stopped = false;
    this.error = null;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
    } catch {
      this.error =
        "Mikrofon izni alınamadı. Tarayıcı ayarlarından mikrofona izin ver.";
      this.emit();
      throw new Error(this.error);
    }

    this.applyMuteToLocalTracks();

    this.unsubSignal = chatHub.subscribe("VoiceSignal", (raw) => {
      void this.onVoiceSignal(raw);
    });
    this.unsubJoined = chatHub.subscribe("VoicePeerJoined", (raw) => {
      void this.onPeerJoined(raw);
    });
    this.unsubLeft = chatHub.subscribe("VoicePeerLeft", (raw) => {
      this.onPeerLeft(raw);
    });
    this.unsubRoster = chatHub.subscribe("VoiceRosterUpdated", (raw) => {
      void this.onRoster(raw);
    });

    await chatHub.invoke("JoinVoice", this.channelId);
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

    const peerIds = [...this.peers.keys()];
    peerIds.forEach((id) => this.closePeer(id));

    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;

    try {
      await chatHub.invoke("LeaveVoice", this.channelId);
    } catch {
      // ignore
    }

    this.emit();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyMuteToLocalTracks();
    this.emit();
  }

  setDeafened(deafened: boolean) {
    this.deafened = deafened;
    this.peers.forEach((slot) => {
      slot.remoteAudio.muted = deafened;
    });
    this.emit();
  }

  private applyMuteToLocalTracks() {
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !this.muted;
    });
  }

  private isPoliteToward(peerId: string): boolean {
    return this.localUserId < peerId;
  }

  private async ensurePeer(peerId: string): Promise<PeerSlot | null> {
    if (this.stopped || peerId === this.localUserId) return null;

    const existing = this.peers.get(peerId);
    if (existing) return existing;

    if (!this.localStream) return null;

    const polite = this.isPoliteToward(peerId);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const remoteAudio = document.createElement("audio");
    remoteAudio.autoplay = true;
    remoteAudio.setAttribute("playsinline", "true");
    remoteAudio.muted = this.deafened;
    // Keep element in DOM for autoplay policies on some browsers
    remoteAudio.style.display = "none";
    document.body.appendChild(remoteAudio);

    const slot: PeerSlot = {
      pc,
      remoteAudio,
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
      const [stream] = event.streams;
      if (stream) {
        remoteAudio.srcObject = stream;
        void remoteAudio.play().catch(() => {
          // Autoplay may need a prior user gesture; join button counts.
        });
      }
    };

    pc.onconnectionstatechange = () => this.emit();
    pc.oniceconnectionstatechange = () => this.emit();

    this.emit();
    return slot;
  }

  private closePeer(peerId: string) {
    const slot = this.peers.get(peerId);
    if (!slot) return;

    slot.pc.onicecandidate = null;
    slot.pc.ontrack = null;
    slot.pc.close();
    slot.remoteAudio.pause();
    slot.remoteAudio.srcObject = null;
    slot.remoteAudio.remove();
    this.peers.delete(peerId);
    this.emit();
  }

  private async sendSignal(targetUserId: string, payload: VoiceSignalPayload) {
    await chatHub.invoke(
      "SendVoiceSignal",
      this.channelId,
      targetUserId,
      payload
    );
  }

  /** Yeni katılan: mevcut peer'lara offer atar. */
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
      console.warn("[VoiceSession] offer failed", peerId, err);
      this.error = "Ses bağlantısı kurulamadı.";
      this.emit();
    } finally {
      slot.makingOffer = false;
    }
  }

  private async onRoster(raw: unknown) {
    if (this.stopped) return;
    const payload = asRecord(raw);
    const id = String(payload.channelId ?? payload.ChannelId ?? "");
    if (id !== this.channelId) return;

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

      // Lexicographically greater id initiates → avoids glare with new-joiner-only offers
      // when both already present after reconnect. New joiner still offers everyone below.
      if (this.localUserId > peerId && !this.peers.has(peerId)) {
        await this.createAndSendOffer(peerId);
      } else {
        await this.ensurePeer(peerId);
      }
    }

    [...this.peers.keys()].forEach((peerId) => {
      if (!remoteIds.has(peerId)) {
        this.closePeer(peerId);
      }
    });
  }

  private async onPeerJoined(raw: unknown) {
    if (this.stopped) return;
    const payload = asRecord(raw);
    const id = String(payload.channelId ?? payload.ChannelId ?? "");
    if (id !== this.channelId) return;

    const peerId = String(payload.userId ?? payload.UserId ?? "");
    if (!peerId || peerId === this.localUserId) return;

    // Existing peers wait for offer from the new joiner (greater id) or prepare PC.
    if (this.localUserId > peerId) {
      await this.createAndSendOffer(peerId);
    } else {
      await this.ensurePeer(peerId);
    }
  }

  private onPeerLeft(raw: unknown) {
    const payload = asRecord(raw);
    const id = String(payload.channelId ?? payload.ChannelId ?? "");
    if (id !== this.channelId) return;

    const peerId = String(payload.userId ?? payload.UserId ?? "");
    if (peerId) this.closePeer(peerId);
  }

  private async onVoiceSignal(raw: unknown) {
    if (this.stopped) return;
    const envelope = asRecord(raw);
    const id = String(envelope.channelId ?? envelope.ChannelId ?? "");
    if (id !== this.channelId) return;

    const fromUserId = String(
      envelope.fromUserId ?? envelope.FromUserId ?? ""
    );
    if (!fromUserId || fromUserId === this.localUserId) return;

    const payloadRaw = envelope.payload ?? envelope.Payload;
    const payload = asRecord(payloadRaw);
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
            if (!slot.ignoreOffer) {
              console.warn("[VoiceSession] ice failed", err);
            }
          }
        }
      }
    } catch (err) {
      console.warn("[VoiceSession] signal handling failed", err);
      this.error = "Ses sinyali işlenemedi.";
      this.emit();
    }
  }
}
