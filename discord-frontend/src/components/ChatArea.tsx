"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import FriendsList from "@/components/FriendsList";
import { API_BASE_URL, fetchDmPeerReadAt, markDmRead } from "@/services";
import { chatHub } from "@/services";
import type { ChannelItem, ChatMessage } from "@/models";

type ChatAreaProps = {
  selectedChannel: ChannelItem | null;
  hasServer?: boolean;
  channelsReady?: boolean;
  channelsEmpty?: boolean;
  isDmMode?: boolean;
  sidePanelCollapsed?: boolean;
  onExpandSidePanel?: () => void;
  onOpenDm?: (channel: ChannelItem) => void;
  onDmAccepted?: () => void;
  onIncomingMessage?: () => void;
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
    isStarred: Boolean(m.isStarred ?? m.IsStarred ?? false),
  };
}

function getReadReceiptMessageId(
  messageList: ChatMessage[],
  userId: string | null,
  peerLastReadAt: string | null
): string | null {
  if (!userId || !peerLastReadAt) return null;

  const readTime = new Date(peerLastReadAt).getTime();
  if (Number.isNaN(readTime)) return null;

  let lastId: string | null = null;
  for (const message of messageList) {
    if (message.userId !== userId) continue;
    const created = new Date(message.createdAt).getTime();
    if (!Number.isNaN(created) && created <= readTime) {
      lastId = message.id;
    }
  }
  return lastId;
}

export default function ChatArea({
  selectedChannel,
  hasServer = false,
  channelsReady = false,
  channelsEmpty = false,
  isDmMode = false,
  sidePanelCollapsed = false,
  onExpandSidePanel,
  onOpenDm,
  onDmAccepted,
  onIncomingMessage,
}: ChatAreaProps) {
  const router = useRouter();
  const selectedChannelId = selectedChannel?.id ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState(() => {
    if (typeof window === "undefined") return "Sen";
    return localStorage.getItem("username") || "Sen";
  });
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [starredOnly, setStarredOnly] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(null);

  const selectedChannelIdRef = useRef<string | null>(null);
  const selectedChannelTypeRef = useRef<string | null>(null);
  const onIncomingMessageRef = useRef(onIncomingMessage);
  const currentUsernameRef = useRef(currentUsername);
  const currentUserIdRef = useRef(currentUserId);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const shouldAutoScrollRef = useRef(false);
  selectedChannelIdRef.current = selectedChannelId;
  selectedChannelTypeRef.current = selectedChannel?.type ?? null;
  onIncomingMessageRef.current = onIncomingMessage;
  currentUsernameRef.current = currentUsername;
  currentUserIdRef.current = currentUserId;

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

  // SignalR — singleton bağlantı (Strict Mode remount'ta kopmaz)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const unsubMessage = chatHub.subscribe("ReceiveMessage", (raw) => {
      const message = mapMessage(raw as Record<string, unknown>);
      const currentId = selectedChannelIdRef.current;

      if (currentId && message.channelId === currentId) {
        if (isNearBottomRef.current) {
          shouldAutoScrollRef.current = true;
        }
        setTypingUser((prev) =>
          prev && prev === message.username ? null : prev
        );
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        if (selectedChannelTypeRef.current === "DM") {
          void markDmRead(message.channelId).then(() =>
            onIncomingMessageRef.current?.()
          );
        }
        return;
      }

      onIncomingMessageRef.current?.();
    });

    const unsubTyping = chatHub.subscribe("UserTyping", (raw) => {
      const payload = raw as Record<string, unknown>;
      const channelId = String(payload.channelId ?? payload.ChannelId ?? "");
      const username = String(payload.username ?? payload.Username ?? "");
      if (!channelId || channelId !== selectedChannelIdRef.current) return;
      if (username === currentUsernameRef.current) return;

      setTypingUser(username);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
    });

    const unsubRead = chatHub.subscribe("ReadReceipt", (raw) => {
      const payload = raw as Record<string, unknown>;
      const channelId = String(payload.channelId ?? payload.ChannelId ?? "");
      const readerId = String(payload.userId ?? payload.UserId ?? "");
      const readAt = payload.readAt ?? payload.ReadAt;
      if (!channelId || channelId !== selectedChannelIdRef.current) return;
      if (readerId === currentUserIdRef.current) return;
      if (readAt) setPeerLastReadAt(String(readAt));
    });

    void chatHub.connect();

    return () => {
      unsubMessage();
      unsubTyping();
      unsubRead();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Kanal değişince gruba katıl
  useEffect(() => {
    if (!selectedChannelId) return;

    void chatHub.joinChannel(selectedChannelId);

    return () => {
      void chatHub.leaveChannel(selectedChannelId);
    };
  }, [selectedChannelId]);

  useEffect(() => {
    setTypingUser(null);
    setPeerLastReadAt(null);
    shouldAutoScrollRef.current = true;
    isNearBottomRef.current = true;
  }, [selectedChannelId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distance =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      isNearBottomRef.current = distance < 120;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [selectedChannelId]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  useEffect(() => {
    if (!selectedChannel || loading) return;
    if (!shouldAutoScrollRef.current && !isNearBottomRef.current) return;

    requestAnimationFrame(() => {
      scrollToBottom(shouldAutoScrollRef.current ? "auto" : "smooth");
      shouldAutoScrollRef.current = false;
    });
  }, [messages, loading, selectedChannel]);

  // Geçmiş mesajlar
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedChannelId) {
        setMessages([]);
        setPeerLastReadAt(null);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      setMessages([]);
      setPeerLastReadAt(null);
      setLoading(true);
      try {
        const [messagesResponse, peerReadAt] = await Promise.all([
          fetch(`${API_BASE_URL}/api/messages/${selectedChannelId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          selectedChannel?.type === "DM"
            ? fetchDmPeerReadAt(selectedChannelId)
            : Promise.resolve(null),
        ]);

        if (!messagesResponse.ok) {
          if (messagesResponse.status === 401 || messagesResponse.status === 403) {
            localStorage.removeItem("token");
            router.push("/login");
          }
          setMessages([]);
          return;
        }

        const data = await messagesResponse.json();
        const list = Array.isArray(data) ? data : [];
        setMessages(
          list.map((m: Record<string, unknown>) => mapMessage(m, selectedChannelId))
        );
        setPeerLastReadAt(peerReadAt);
        shouldAutoScrollRef.current = true;

        if (selectedChannel?.type === "DM") {
          void markDmRead(selectedChannelId).then(() =>
            onIncomingMessageRef.current?.()
          );
        }
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    setDraft("");
    setSearchQuery("");
    setAuthorFilter("");
    setStarredOnly(false);
    loadMessages();
  }, [selectedChannelId, selectedChannel?.type, router]);

  const formatTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const visibleMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const author = authorFilter.trim().toLowerCase().replace(/^@+/, "");

    return messages.filter((message) => {
      if (starredOnly && !message.isStarred) return false;
      if (author && !message.username.toLowerCase().includes(author)) return false;
      if (q && !message.content.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [messages, searchQuery, authorFilter, starredOnly]);

  const uniqueAuthors = useMemo(
    () => [...new Set(messages.map((m) => m.username))].sort(),
    [messages]
  );

  const readReceiptMessageId = useMemo(
    () =>
      selectedChannel?.type === "DM"
        ? getReadReceiptMessageId(messages, currentUserId, peerLastReadAt)
        : null,
    [messages, currentUserId, peerLastReadAt, selectedChannel?.type]
  );

  const highlightContent = (content: string) => {
    const q = searchQuery.trim();
    if (!q) return content;

    const lower = content.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) return content;

    return (
      <>
        {content.slice(0, idx)}
        <mark className="rounded bg-amber-200/80 px-0.5 text-stone-900">
          {content.slice(idx, idx + q.length)}
        </mark>
        {content.slice(idx + q.length)}
      </>
    );
  };

  const toggleStar = async (message: ChatMessage) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const next = !message.isStarred;
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, isStarred: next } : m))
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/${message.id}/star`,
        {
          method: next ? "POST" : "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id ? { ...m, isStarred: !next } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, isStarred: !next } : m
        )
      );
    }
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
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
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
      shouldAutoScrollRef.current = true;
      setDraft("");
      setTypingUser(null);
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

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!selectedChannelId) return;

    if (!value.trim()) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < 1200) return;

    lastTypingSentRef.current = now;
    void chatHub.invoke("SendTyping", selectedChannelId);
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
          {sidePanelCollapsed && onExpandSidePanel && (
            <button
              type="button"
              title={isDmMode ? "Mesajları göster" : "Kanalları göster"}
              onClick={onExpandSidePanel}
              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-primary-container"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          )}
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
            <p
              className={`text-xs font-hanken ${
                typingUser ? "text-primary-container italic" : "text-stone-400"
              }`}
            >
              {typingUser
                ? `@${typingUser} yazıyor...`
                : selectedChannel
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
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-hanken text-xs font-semibold transition-colors ${
                searchOpen
                  ? "border-primary-container/40 bg-primary-container/10 text-primary-container"
                  : "border-stone-200 bg-stone-100 text-stone-500 hover:text-primary-container"
              }`}
            >
              <span className="material-symbols-outlined text-base">search</span>
              Ara
            </button>
          </div>
        </div>
      </header>

      {searchOpen && selectedChannel && (
        <div className="border-b border-stone-200 bg-white px-6 py-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[180px] flex-1 space-y-1">
              <span className="font-hanken text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Kelime ara
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mesaj içeriğinde ara..."
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-hanken text-sm text-stone-900 outline-none focus:border-primary-container/40"
              />
            </label>
            <label className="min-w-[160px] flex-1 space-y-1">
              <span className="font-hanken text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Kişi
              </span>
              <input
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                list="chat-authors"
                placeholder="@kullanici"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-hanken text-sm text-stone-900 outline-none focus:border-primary-container/40"
              />
              <datalist id="chat-authors">
                {uniqueAuthors.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>
            <label className="flex items-center gap-2 pb-2 font-hanken text-sm text-stone-600">
              <input
                type="checkbox"
                checked={starredOnly}
                onChange={(e) => setStarredOnly(e.target.checked)}
                className="rounded border-stone-300 text-primary-container focus:ring-primary-container/40"
              />
              Sadece yıldızlı
            </label>
          </div>
          <p className="font-hanken text-xs text-stone-400">
            {visibleMessages.length} / {messages.length} mesaj gösteriliyor
          </p>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar px-6 py-8 inner-depth space-y-6 bg-gradient-to-br from-white to-[#f7f4ef]"
      >
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

        {selectedChannel && !loading && messages.length > 0 && visibleMessages.length === 0 && (
          <p className="text-center text-sm text-stone-400 font-hanken pt-10 w-full">
            Arama kriterlerine uygun mesaj bulunamadı.
          </p>
        )}

        {selectedChannel &&
          !loading &&
          visibleMessages.map((message) => {
            const isMine =
              currentUserId !== null && message.userId === currentUserId;
            const showReadReceipt =
              isMine &&
              selectedChannel.type === "DM" &&
              message.id === readReceiptMessageId;

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
                      <button
                        type="button"
                        title={message.isStarred ? "Yıldızı kaldır" : "Yıldızla"}
                        onClick={() => void toggleStar(message)}
                        className={`material-symbols-outlined text-base transition-colors ${
                          message.isStarred
                            ? "text-amber-500"
                            : "text-stone-300 hover:text-amber-500"
                        }`}
                        style={
                          message.isStarred
                            ? { fontVariationSettings: "'FILL' 1" }
                            : undefined
                        }
                      >
                        star
                      </button>
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
                        {highlightContent(message.content)}
                      </p>
                    </div>
                    {showReadReceipt && (
                      <p className="pr-1 font-hanken text-[11px] text-stone-400">
                        Görüldü
                      </p>
                    )}
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
                    <button
                      type="button"
                      title={message.isStarred ? "Yıldızı kaldır" : "Yıldızla"}
                      onClick={() => void toggleStar(message)}
                      className={`material-symbols-outlined ml-auto text-base transition-colors ${
                        message.isStarred
                          ? "text-amber-500"
                          : "text-stone-300 hover:text-amber-500"
                      }`}
                      style={
                        message.isStarred
                          ? { fontVariationSettings: "'FILL' 1" }
                          : undefined
                      }
                    >
                      star
                    </button>
                  </div>
                  <div className="inline-block max-w-[85%] p-4 rounded-xl rounded-tl-sm bg-white text-stone-800 shadow-sm border border-stone-200">
                    <p className="text-sm font-hanken leading-relaxed">
                      {highlightContent(message.content)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <footer className="bg-white border-t border-stone-200">
        {typingUser && selectedChannel && (
          <p className="max-w-5xl mx-auto px-6 pt-3 font-hanken text-xs italic text-primary-container">
            @{typingUser} yazıyor
            <span className="inline-flex w-4 animate-pulse">...</span>
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          className="max-w-5xl mx-auto flex items-end gap-3 bg-stone-50 rounded-2xl p-2 m-6 border border-stone-200 transition-all focus-within:border-primary-container/40"
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
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent border-none focus:ring-0 text-stone-900 placeholder:text-stone-400 py-2 custom-scrollbar resize-none max-h-32 text-sm outline-none font-hanken"
              placeholder={
                selectedChannel
                  ? "Mesaj yaz..."
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
