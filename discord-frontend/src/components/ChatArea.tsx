"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import FriendsList from "@/components/FriendsList";
import type { ChannelItem, ChatMessage } from "@/types/chat";

type ChatAreaProps = {
  selectedChannel: ChannelItem | null;
  hasServer?: boolean;
  channelsReady?: boolean;
  channelsEmpty?: boolean;
  isDmMode?: boolean;
  onOpenDm?: (channel: ChannelItem) => void;
  onDmAccepted?: () => void;
};

function mapMessage(
  m: Record<string, unknown>,
  fallbackChannelId?: string
): ChatMessage {
  return {
    id: String(m.id ?? m.Id),
    content: String(m.content ?? m.Content ?? ""),
    userId: String(m.userId ?? m.UserId ?? ""),
    username: String(m.username ?? m.Username ?? "Kullanıcı"),
    channelId: String(
      m.channelId ?? m.ChannelId ?? fallbackChannelId ?? ""
    ),
    createdAt: String(m.createdAt ?? m.CreatedAt ?? ""),
  };
}

export default function ChatArea({
  selectedChannel,
  hasServer = false,
  channelsReady = false,
  channelsEmpty = false,
  isDmMode = false,
  onOpenDm,
  onDmAccepted,
}: ChatAreaProps) {
  const router = useRouter();
  const selectedChannelId = selectedChannel?.id ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState("Sen");
  const [friendsOpen, setFriendsOpen] = useState(false);

  const connectionRef = useRef<HubConnection | null>(null);
  const joinedChannelRef = useRef<string | null>(null);
  const selectedChannelIdRef = useRef<string | null>(null);
  selectedChannelIdRef.current = selectedChannelId;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
      const id =
        payload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ] ?? payload.sub;
      if (id) setCurrentUserId(String(id));

      const name =
        payload[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
        ] ??
        payload.unique_name ??
        payload.name;
      if (name) setCurrentUsername(String(name));
    } catch {
      // ignore
    }

    const loadMe = async () => {
      try {
        const response = await fetch("http://localhost:5243/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        const name = data.username ?? data.Username;
        if (name) setCurrentUsername(String(name));
        const id = data.id ?? data.Id;
        if (id) setCurrentUserId(String(id));
      } catch {
        // ignore
      }
    };
    void loadMe();
  }, []);

  // SignalR bağlantısı (tek sefer)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl("http://localhost:5243/chatHub", {
        accessTokenFactory: () => localStorage.getItem("token") ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("ReceiveMessage", (raw: Record<string, unknown>) => {
      const message = mapMessage(raw);
      if (
        selectedChannelIdRef.current &&
        message.channelId !== selectedChannelIdRef.current
      ) {
        return;
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    connection
      .start()
      .then(async () => {
        connectionRef.current = connection;
        if (joinedChannelRef.current == null && selectedChannelId) {
          try {
            await connection.invoke("JoinChannel", selectedChannelId);
            joinedChannelRef.current = selectedChannelId;
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        connectionRef.current = null;
      });

    return () => {
      void connection.stop();
      connectionRef.current = null;
      joinedChannelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kanal değişince Join / Leave — bağlantı hazır olunca da yeniden dene
  useEffect(() => {
    let cancelled = false;

    const switchChannel = async () => {
      const connection = connectionRef.current;
      if (!connection) return;

      // Bağlantı henüz kurulmadıysa kısa bekleyip tekrar dene
      if ((connection.state as HubConnectionState) !== HubConnectionState.Connected) {
        await new Promise((r) => setTimeout(r, 400));
        if (
          cancelled ||
          (connection.state as HubConnectionState) !== HubConnectionState.Connected
        ) {
          return;
        }
      }

      const previous = joinedChannelRef.current;
      if (previous && previous !== selectedChannelId) {
        try {
          await connection.invoke("LeaveChannel", previous);
        } catch {
          // ignore
        }
      }

      if (selectedChannelId) {
        try {
          await connection.invoke("JoinChannel", selectedChannelId);
          joinedChannelRef.current = selectedChannelId;
        } catch {
          // ignore
        }
      } else {
        joinedChannelRef.current = null;
      }
    };

    void switchChannel();
    return () => {
      cancelled = true;
    };
  }, [selectedChannelId]);

  // Geçmiş mesajlar
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChannelId) {
        setMessages([]);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:5243/api/messages/${selectedChannelId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            router.push("/login");
          }
          setMessages([]);
          return;
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setMessages(list.map((m: Record<string, unknown>) => mapMessage(m, selectedChannelId)));
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    setDraft("");
    loadMessages();
  }, [selectedChannelId, router]);

  const formatTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (!selectedChannelId || !content || !currentUserId || sending) return;

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setSending(true);
    try {
      const response = await fetch("http://localhost:5243/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelId: selectedChannelId,
          content,
          senderId: currentUserId,
        }),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          router.push("/login");
        }
        return;
      }

      const data = await response.json();
      const created = mapMessage(
        {
          ...(data as Record<string, unknown>),
          username:
            (data as Record<string, unknown>).username ??
            (data as Record<string, unknown>).Username ??
            currentUsername,
        },
        selectedChannelId
      );

      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev;
        return [...prev, created];
      });
      setDraft("");

      const connection = connectionRef.current;
      if (
        connection &&
        (connection.state as HubConnectionState) === HubConnectionState.Connected
      ) {
        try {
          await connection.invoke("SendMessage", selectedChannelId, created);
        } catch {
          // REST zaten broadcast yapıyor olabilir
        }
      }
    } catch {
      // ağ hatası
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSend();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden relative bg-background">
      <header className="h-16 px-6 flex items-center justify-between border-b border-stone-200 z-10 bg-white">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isDmMode || selectedChannel?.type === "DM" ? "alternate_email" : "tag"}
          </span>
          <div>
            <h2 className="font-libre text-lg text-stone-900">
              {selectedChannel?.name
                ? selectedChannel.type === "DM"
                  ? `@${selectedChannel.name}`
                  : selectedChannel.name
                : isDmMode
                  ? "Bir sohbet seç"
                  : hasServer && !channelsReady
                    ? "Kanallar yükleniyor..."
                    : hasServer && channelsEmpty
                      ? "Kanal oluşturarak ilk adımı atın"
                      : "Bir kanal seçerek sohbete başlayın"}
            </h2>
            <p className="text-xs text-stone-400 font-hanken">
              {selectedChannel
                ? selectedChannel.type === "DM"
                  ? "Özel mesaj"
                  : `#${selectedChannel.name} sohbet kanalı`
                : isDmMode
                  ? "Soldan bir arkadaş sohbeti seç"
                  : hasServer && !channelsReady
                    ? "Biraz bekleyin"
                    : hasServer && channelsEmpty
                      ? "Soldan “Kanal Oluştur” ile yeni bir alan açabilirsin"
                      : "Önce bir sunucu seç, sonra kanal oluştur veya seç"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 text-stone-400">
            <button
              type="button"
              title="Arkadaşlar"
              onClick={() => setFriendsOpen(true)}
              className="flex items-center gap-1.5 hover:text-primary-container transition-colors"
            >
              <span className="material-symbols-outlined">group</span>
              <span className="text-xs font-hanken font-semibold uppercase tracking-wide">
                Arkadaşlar
              </span>
            </button>
            <span className="material-symbols-outlined hover:text-primary-container cursor-pointer">
              notifications
            </span>
          </div>
          <button
            type="button"
            title="Arkadaşlar"
            onClick={() => setFriendsOpen(true)}
            className="lg:hidden text-stone-400 hover:text-primary-container"
          >
            <span className="material-symbols-outlined">group</span>
          </button>
          <div className="relative">
            <input
              className="bg-stone-100 border border-stone-200 rounded-full py-1.5 px-4 text-sm w-40 focus:ring-1 focus:ring-primary-container/40 placeholder:text-stone-400 outline-none text-stone-900"
              placeholder="Ara..."
              type="text"
            />
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
              search
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8 inner-depth space-y-6 bg-gradient-to-br from-white to-[#f7f4ef]">
        {!selectedChannel && isDmMode && (
          <p className="text-center text-sm text-stone-400 font-hanken pt-10 w-full max-w-md mx-auto leading-relaxed">
            Soldan bir arkadaş sohbeti seç — ya da Arkadaşlar listesinden Mesaj
            ile yeni bir konuşma başlat.
          </p>
        )}

        {!selectedChannel && !isDmMode && hasServer && !channelsReady && (
          <p className="text-center text-sm text-stone-400 font-hanken pt-10 w-full">
            Kanallar yükleniyor...
          </p>
        )}

        {!selectedChannel && !isDmMode && hasServer && channelsReady && channelsEmpty && (
          <p className="text-center text-sm text-stone-400 font-hanken pt-10 w-full max-w-md mx-auto leading-relaxed">
            Henüz bir kanal yok gibi görünüyor. Sol panilden “Kanal Oluştur” ile
            ilk adımı at.
          </p>
        )}

        {!selectedChannel && !isDmMode && !hasServer && (
          <p className="text-center text-sm text-stone-400 font-hanken pt-10 w-full max-w-md mx-auto leading-relaxed">
            Bir kanal seçerek sohbete başlayın — ya da yeni bir kanal oluşturarak
            arşivi şekillendirin.
          </p>
        )}

        {selectedChannel && loading && (
          <p className="text-center text-sm text-stone-400 font-hanken pt-10 w-full">
            Mesajlar yükleniyor...
          </p>
        )}

        {selectedChannel && !loading && messages.length === 0 && (
          <p className="text-center text-sm text-stone-400 font-hanken pt-10 w-full">
            Bu kanalda henüz mesaj yok. İlk mesajı sen yaz!
          </p>
        )}

        {selectedChannel &&
          messages.map((message) => {
            const isMine =
              currentUserId !== null && message.userId === currentUserId;

            if (isMine) {
              return (
                <div key={message.id} className="flex gap-4 flex-row-reverse">
                  <div className="w-10 h-10 rounded-lg bg-primary-container/10 border border-primary-container/20 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary-container">
                      person
                    </span>
                  </div>
                  <div className="flex-1 space-y-1 text-right">
                    <div className="flex items-baseline gap-2 justify-end">
                      <span className="text-[10px] text-stone-400 font-medium">
                        {formatTime(message.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/profile/${encodeURIComponent(currentUsername)}`
                          )
                        }
                        className="text-sm font-semibold text-primary-container font-hanken hover:underline"
                      >
                        Sen
                      </button>
                    </div>
                    <div className="inline-block max-w-[85%] p-4 rounded-xl rounded-tr-sm bg-primary-container text-white shadow-md text-left">
                      <p className="text-sm font-hanken leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={message.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center flex-shrink-0 border border-stone-200">
                  <span className="font-libre text-sm text-stone-600 uppercase font-bold">
                    {message.username.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/profile/${encodeURIComponent(message.username)}`
                        )
                      }
                      className="text-sm font-semibold text-primary-container font-hanken hover:underline"
                    >
                      {message.username}
                    </button>
                    <span className="text-[10px] text-stone-400 font-medium">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <div className="inline-block max-w-[85%] p-4 rounded-xl rounded-tl-sm bg-white text-stone-800 shadow-sm border border-stone-200">
                    <p className="text-sm font-hanken leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <footer className="p-6 bg-white border-t border-stone-200">
        <form
          onSubmit={handleSubmit}
          className="max-w-5xl mx-auto flex items-end gap-3 bg-stone-50 rounded-2xl p-2 border border-stone-200 transition-all focus-within:border-primary-container/40"
        >
          <button
            type="button"
            className="p-2 text-stone-400 hover:text-primary-container transition-colors"
          >
            <span className="material-symbols-outlined">add_circle</span>
          </button>
          <div className="flex-1">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none focus:ring-0 text-stone-900 placeholder:text-stone-400 py-2 custom-scrollbar resize-none max-h-32 text-sm outline-none font-hanken"
              placeholder={
                selectedChannel
                  ? selectedChannel.type === "DM"
                    ? `@${selectedChannel.name} kullanıcısına mesaj yaz...`
                    : `#${selectedChannel.name} kanalına bir mesaj yaz...`
                  : isDmMode
                    ? "Önce bir sohbet seç..."
                    : "Önce bir kanal seç..."
              }
              rows={1}
              disabled={!selectedChannel || sending}
            />
          </div>
          <div className="flex items-center gap-2 p-1">
            <button
              type="button"
              className="p-2 text-stone-400 hover:text-stone-700 transition-colors"
            >
              <span className="material-symbols-outlined">mood</span>
            </button>
            <button
              type="submit"
              disabled={!selectedChannel || !draft.trim() || sending}
              className="w-10 h-10 bg-primary-container text-white rounded-xl flex items-center justify-center hover:bg-[#8f1b1c] transition-all active:scale-95 shadow-md disabled:opacity-50"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </form>
      </footer>

      <FriendsList
        isOpen={friendsOpen}
        onClose={() => setFriendsOpen(false)}
        onOpenDm={onOpenDm}
        onDmAccepted={onDmAccepted}
      />
    </main>
  );
}
