import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { API_BASE_URL } from "@/services/api";

type HubHandler = (...args: unknown[]) => void;

class ChatHubClient {
  private connection: HubConnection | null = null;
  private startPromise: Promise<void> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers = new Map<string, Set<HubHandler>>();
  private bridgedEvents = new Set<string>();
  private joinedChannelId: string | null = null;
  private inboxJoined = false;
  private inboxLoopStarted = false;

  private getConnection(): HubConnection {
    if (!this.connection) {
      this.connection = new HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/chatHub`, {
          accessTokenFactory: () =>
            typeof window !== "undefined"
              ? localStorage.getItem("token") ?? ""
              : "",
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging({
          log: (logLevel, message) => {
            // 1006 = bağlantı beklenmedik kapandı; reconnect sırasında normal.
            if (
              message.includes("1006") ||
              message.includes("Connection disconnected")
            ) {
              return;
            }
            if (logLevel >= LogLevel.Warning) {
              console.warn(`[SignalR] ${message}`);
            }
          },
        })
        .build();

      this.connection.onreconnected(() => {
        this.inboxJoined = false;
        void this.joinInbox();
        void this.rejoinChannel();
      });

      this.connection.onclose(() => {
        this.inboxJoined = false;
      });
    }
    return this.connection;
  }

  /** Inbox grubuna katılım koparsa periyodik dene. */
  ensureInboxLoop(): void {
    if (this.inboxLoopStarted || typeof window === "undefined") return;
    this.inboxLoopStarted = true;

    const tick = () => {
      if (!this.inboxJoined) {
        void this.joinInbox();
      }
    };

    tick();
    window.setInterval(tick, 15000);
  }

  private bridgeEvent(event: string) {
    if (this.bridgedEvents.has(event)) return;
    this.bridgedEvents.add(event);

    this.getConnection().on(event, (...args: unknown[]) => {
      const set = this.handlers.get(event);
      if (!set) return;
      set.forEach((handler) => handler(...args));
    });
  }

  subscribe(event: string, handler: HubHandler): () => void {
    this.bridgeEvent(event);
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    void this.connect();

    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  private scheduleRetry() {
    if (this.retryTimer) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.connect();
    }, 3000);
  }

  async connect(): Promise<HubConnection | null> {
    const connection = this.getConnection();

    if (connection.state === HubConnectionState.Connected) {
      return connection;
    }

    if (connection.state === HubConnectionState.Connecting && this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        return null;
      }
      return this.getState() === HubConnectionState.Connected ? connection : null;
    }

    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        return null;
      }
      return this.getState() === HubConnectionState.Connected ? connection : null;
    }

    this.startPromise = connection
      .start()
      .then(async () => {
        await this.joinInbox();
        await this.rejoinChannel();
      })
      .catch(() => {
        this.scheduleRetry();
      })
      .finally(() => {
        this.startPromise = null;
      });

    try {
      await this.startPromise;
    } catch {
      return null;
    }

    return this.getState() === HubConnectionState.Connected ? connection : null;
  }

  getState(): HubConnectionState {
    return this.getConnection().state as HubConnectionState;
  }

  async invoke(method: string, ...args: unknown[]): Promise<void> {
    const connection = await this.connect();
    if (!connection) return;
    await connection.invoke(method, ...args);
  }

  async joinInbox(): Promise<void> {
    const connection = await this.connect();
    if (!connection || this.inboxJoined) return;

    try {
      await connection.invoke("JoinInbox");
      this.inboxJoined = true;
    } catch {
      this.inboxJoined = false;
    }
  }

  async joinChannel(channelId: string): Promise<void> {
    const connection = await this.connect();
    if (!connection) return;

    if (this.joinedChannelId && this.joinedChannelId !== channelId) {
      try {
        await connection.invoke("LeaveChannel", this.joinedChannelId);
      } catch {
        // ignore
      }
    }

    try {
      await connection.invoke("JoinChannel", channelId);
      this.joinedChannelId = channelId;
    } catch {
      // ignore
    }
  }

  async leaveChannel(channelId: string): Promise<void> {
    const connection = await this.connect();
    if (!connection) return;

    try {
      await connection.invoke("LeaveChannel", channelId);
      if (this.joinedChannelId === channelId) {
        this.joinedChannelId = null;
      }
    } catch {
      // ignore
    }
  }

  private async rejoinChannel(): Promise<void> {
    if (!this.joinedChannelId) return;
    const channelId = this.joinedChannelId;
    this.joinedChannelId = null;
    await this.joinChannel(channelId);
  }

  getJoinedChannelId(): string | null {
    return this.joinedChannelId;
  }
}

export const chatHub = new ChatHubClient();

if (typeof window !== "undefined") {
  chatHub.ensureInboxLoop();
}
