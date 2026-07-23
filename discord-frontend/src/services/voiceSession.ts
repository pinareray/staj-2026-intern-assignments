import { chatHub } from "@/services/chatHub";

export type VoicePeerState = "connecting" | "connected" | "failed";

export type VoiceSessionStreams = {
  local: MediaStream | null;
  remotes: Record<string, MediaStream>;
};

export type VoiceSessionState = {
  muted: boolean;
  deafened: boolean;
  cameraOn: boolean;
  peerStates: Record<string, VoicePeerState>;
  peerHasVideo: Record<string, boolean>;
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
  remoteStream: MediaStream;
  makingOffer: boolean;
  ignoreOffer: boolean;
  polite: boolean;
};

type VoiceSessionOptions = {
  channelId: string;
  localUserId: string;
  onStateChange?: (state: VoiceSessionState) => void;
  onStreamsChange?: (streams: VoiceSessionStreams) => void;
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

/**
 * Mesh WebRTC ses + MVP görüntü oturumu.
 * Kamera açılınca mevcut peer bağlantılarına video track eklenir ve renegotiate edilir.
 */
export class VoiceSession {
  private readonly channelId: string;
  private readonly localUserId: string;
  private readonly onStateChange?: (state: VoiceSessionState) => void;
  private readonly onStreamsChange?: (streams: VoiceSessionStreams) => void;

  private localStream: MediaStream | null = null;
  private peers = new Map<string, PeerSlot>();
  private muted = false;
  private deafened = false;
  private cameraOn = false;
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
    this.onStreamsChange = options.onStreamsChange;
  }

  getState(): VoiceSessionState {
    const peerStates: Record<string, VoicePeerState> = {};
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
      deafened: this.deafened,
      cameraOn: this.cameraOn,
      peerStates,
      peerHasVideo,
      error: this.error,
    };
  }

  getStreams(): VoiceSessionStreams {
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
    this.cameraOn = false;

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
    this.emitStreams();

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
    this.cameraOn = false;

    try {
      await chatHub.invoke("LeaveVoice", this.channelId);
    } catch {
      // ignore
    }

    this.emitStreams();
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

  async setCameraOn(on: boolean): Promise<void> {
    if (this.stopped || !this.localStream) return;
    if (on === this.cameraOn) return;

    if (on) {
      try {
        const cam = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        });
        const track = cam.getVideoTracks()[0];
        if (!track) {
          cam.getTracks().forEach((t) => t.stop());
          throw new Error("Kamera bulunamadı.");
        }

        this.localStream.addTrack(track);
        this.cameraOn = true;

        const peerIds = [...this.peers.keys()];
        for (const peerId of peerIds) {
          const slot = this.peers.get(peerId);
          if (!slot) continue;
          slot.pc.addTrack(track, this.localStream);
          await this.createAndSendOffer(peerId);
        }
      } catch {
        this.error =
          "Kamera izni alınamadı. Tarayıcı ayarlarından kameraya izin ver.";
        this.emit();
        throw new Error(this.error);
      }
    } else {
      const videoTracks = this.localStream.getVideoTracks();
      for (const track of videoTracks) {
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
    remoteAudio.style.display = "none";
    document.body.appendChild(remoteAudio);

    const remoteStream = new MediaStream();

    const slot: PeerSlot = {
      pc,
      remoteAudio,
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
      track.onmute = () => this.emit();
      track.onunmute = () => this.emit();

      if (track.kind === "audio") {
        remoteAudio.srcObject = slot.remoteStream;
        void remoteAudio.play().catch(() => {
          // Autoplay may need a prior user gesture; join button counts.
        });
      }

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
    slot.remoteAudio.pause();
    slot.remoteAudio.srcObject = null;
    slot.remoteAudio.remove();
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

  private async sendSignal(targetUserId: string, payload: VoiceSignalPayload) {
    await chatHub.invoke(
      "SendVoiceSignal",
      this.channelId,
      targetUserId,
      payload
    );
  }

  /** Yeni katılan / kamera açılınca: peer'a offer atar. */
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
