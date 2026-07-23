"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import ChannelExtrasPanel from "@/components/chat/ChannelExtrasPanel";
import NotificationsPanel, {
  type MentionNotificationItem,
} from "@/components/chat/NotificationsPanel";
import ServerSetupChecklist, {
  isServerSetupPending,
} from "@/components/chat/ServerSetupChecklist";
import DmSettingsModal from "@/components/modals/DmSettingsModal";
import VoiceLobby from "@/components/chat/VoiceLobby";
import {
  API_BASE_URL,
  deleteMessage,
  editMessage,
  fetchDmPeerReadAt,
  markDmRead,
  uploadMessageFile,
} from "@/services";
import { chatHub } from "@/services";
import type { ChannelItem, ChatMessage, ServerItem } from "@/models";
import { readUserFromToken } from "@/lib/jwtUser";
import {
  filterMentionCandidates,
  getActiveMention,
  insertMention,
  isMentionToken,
  splitMentionTokens,
  type MentionCandidate,
} from "@/lib/mentions";

type ChatAreaProps = {
  selectedChannel: ChannelItem | null;
  selectedServer?: ServerItem | null;
  hasServer?: boolean;
  channelsReady?: boolean;
  channelsEmpty?: boolean;
  isDmMode?: boolean;
  isFriendsMode?: boolean;
  sidePanelCollapsed?: boolean;
  onExpandSidePanel?: () => void;
  onIncomingMessage?: () => void;
  onOpenInvites?: () => void;
  onOpenMention?: (item: MentionNotificationItem) => void;
  focusMessageId?: string | null;
  onFocusMessageConsumed?: () => void;
  onServerUpdated?: (patch: {
    name?: string;
    iconUrl?: string | null;
  }) => void;
};

function mapMessage(
  m: Record<string, unknown>,
  fallbackChannelId?: string
): ChatMessage {
  const editedRaw = m.editedAt ?? m.EditedAt;
  const attachmentRaw = m.attachmentUrl ?? m.AttachmentUrl;
  return {
    id: String(m.id ?? m.Id),
    content: String(m.content ?? m.Content ?? ""),
    userId: String(m.userId ?? m.UserId ?? ""),
    username: String(m.username ?? m.Username ?? "Kullanıcı"),
    channelId: String(
      m.channelId ?? m.ChannelId ?? fallbackChannelId ?? ""
    ),
    createdAt: String(m.createdAt ?? m.CreatedAt ?? ""),
    editedAt: editedRaw ? String(editedRaw) : null,
    attachmentUrl: attachmentRaw ? String(attachmentRaw) : null,
    isStarred: Boolean(m.isStarred ?? m.IsStarred ?? false),
    isPinned: Boolean(m.isPinned ?? m.IsPinned ?? false),
  };
}

function isImageAttachment(url: string) {
  return /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(url);
}

function resolveAttachmentUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
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
  selectedServer = null,
  hasServer = false,
  channelsReady = false,
  channelsEmpty = false,
  isDmMode = false,
  isFriendsMode = false,
  sidePanelCollapsed = false,
  onExpandSidePanel,
  onIncomingMessage,
  onOpenInvites,
  onOpenMention,
  focusMessageId = null,
  onFocusMessageConsumed,
  onServerUpdated,
}: ChatAreaProps) {
  const router = useRouter();
  const selectedChannelId = selectedChannel?.id ?? null;
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState(() => {
    if (typeof window === "undefined") return "Sen";
    return localStorage.getItem("username") || "Sen";
  });
  const [inviteBadge, setInviteBadge] = useState(0);
  const [mentionUnread, setMentionUnread] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRefreshKey, setNotificationsRefreshKey] = useState(0);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(
    null
  );
  const [messageMenuId, setMessageMenuId] = useState<string | null>(null);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [extrasTab, setExtrasTab] = useState<"members" | "pins">("members");
  const [dmSettingsOpen, setDmSettingsOpen] = useState(false);
  const [dmPeerUserId, setDmPeerUserId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [starredOnly, setStarredOnly] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [pendingAttachmentUrl, setPendingAttachmentUrl] = useState<string | null>(
    null
  );
  const [pendingAttachmentName, setPendingAttachmentName] = useState<string | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [mentionCandidates, setMentionCandidates] = useState<MentionCandidate[]>(
    []
  );
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(0);
  const [mentionEnd, setMentionEnd] = useState(0);

  const selectedChannelIdRef = useRef<string | null>(null);
  const selectedChannelTypeRef = useRef<string | null>(null);
  const onIncomingMessageRef = useRef(onIncomingMessage);
  const currentUsernameRef = useRef(currentUsername);
  const currentUserIdRef = useRef(currentUserId);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNearBottomRef = useRef(true);
  const shouldAutoScrollRef = useRef(false);

  useEffect(() => {
    selectedChannelIdRef.current = selectedChannelId;
    selectedChannelTypeRef.current = selectedChannel?.type ?? null;
    onIncomingMessageRef.current = onIncomingMessage;
    currentUsernameRef.current = currentUsername;
    currentUserIdRef.current = currentUserId;
  }, [
    selectedChannelId,
    selectedChannel?.type,
    onIncomingMessage,
    currentUsername,
    currentUserId,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadBadges = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const [invitesRes, notifRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/servers/invites`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!cancelled && invitesRes.ok) {
          const data = await invitesRes.json();
          setInviteBadge(Array.isArray(data) ? data.length : 0);
        }

        if (!cancelled && notifRes.ok) {
          const data = (await notifRes.json()) as Record<string, unknown>;
          setMentionUnread(Number(data.unreadCount ?? data.UnreadCount ?? 0));
        }
      } catch {
        // ignore
      }
    };

    void loadBadges();
    const timer = window.setInterval(() => void loadBadges(), 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const unsub = chatHub.subscribe("MentionNotification", () => {
      setMentionUnread((n) => n + 1);
      setNotificationsRefreshKey((k) => k + 1);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!focusMessageId || loading) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`msg-${focusMessageId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightMessageId(focusMessageId);
      onFocusMessageConsumed?.();
      window.setTimeout(() => setHighlightMessageId(null), 2800);
    }, 120);
    return () => window.clearTimeout(timer);
  }, [focusMessageId, loading, messages, onFocusMessageConsumed]);

  useEffect(() => {
    setMessageMenuId(null);
  }, [selectedChannelId]);

  useEffect(() => {
    if (!messageMenuId) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-message-menu]")) return;
      setMessageMenuId(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [messageMenuId]);

  useEffect(() => {
    let cancelled = false;
    setMentionOpen(false);

    const loadMentionCandidates = async () => {
      const serverId = selectedChannel?.serverId ?? selectedServer?.id ?? null;

      if (selectedChannel?.type === "DM") {
        if (!dmPeerUserId) {
          if (!cancelled) setMentionCandidates([]);
          return;
        }
        if (!cancelled) {
          setMentionCandidates([
            {
              userId: dmPeerUserId,
              username: selectedChannel.name.replace(/^@/, ""),
            },
          ]);
        }
        return;
      }

      if (!serverId) {
        if (!cancelled) setMentionCandidates([]);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/servers/${serverId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok || cancelled) return;
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        if (!cancelled) {
          setMentionCandidates(
            list.map((m: Record<string, unknown>) => ({
              userId: String(m.userId ?? m.UserId ?? ""),
              username: String(m.username ?? m.Username ?? ""),
            })).filter((m: MentionCandidate) => m.username)
          );
        }
      } catch {
        if (!cancelled) setMentionCandidates([]);
      }
    };

    void loadMentionCandidates();
    return () => {
      cancelled = true;
    };
  }, [
    selectedChannel?.id,
    selectedChannel?.serverId,
    selectedChannel?.type,
    selectedChannel?.name,
    selectedServer?.id,
    dmPeerUserId,
  ]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fromToken = readUserFromToken();
    if (fromToken?.id) {
      queueMicrotask(() => setCurrentUserId(fromToken.id));
    }
    if (fromToken?.username) {
      queueMicrotask(() => setCurrentUsername(fromToken.username));
    }

    const loadMe = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
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

    const unsubMessage = chatHub.subscribe("ReceiveMessage", (raw: unknown) => {
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

    const unsubTyping = chatHub.subscribe("UserTyping", (raw: unknown) => {
      const payload = raw as Record<string, unknown>;
      const channelId = String(payload.channelId ?? payload.ChannelId ?? "");
      const username = String(payload.username ?? payload.Username ?? "");
      if (!channelId || channelId !== selectedChannelIdRef.current) return;
      if (username === currentUsernameRef.current) return;

      setTypingUser(username);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
    });

    const unsubRead = chatHub.subscribe("ReadReceipt", (raw: unknown) => {
      const payload = raw as Record<string, unknown>;
      const channelId = String(payload.channelId ?? payload.ChannelId ?? "");
      const readerId = String(payload.userId ?? payload.UserId ?? "");
      const readAt = payload.readAt ?? payload.ReadAt;
      if (!channelId || channelId !== selectedChannelIdRef.current) return;
      if (readerId === currentUserIdRef.current) return;
      if (readAt) setPeerLastReadAt(String(readAt));
    });

    const unsubDeleted = chatHub.subscribe("MessageDeleted", (raw: unknown) => {
      const payload = raw as Record<string, unknown>;
      const channelId = String(payload.channelId ?? payload.ChannelId ?? "");
      const messageId = String(payload.messageId ?? payload.MessageId ?? "");
      if (!channelId || channelId !== selectedChannelIdRef.current) return;
      if (!messageId) return;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      setEditingMessageId((prev) => (prev === messageId ? null : prev));
    });

    const unsubEdited = chatHub.subscribe("MessageEdited", (raw: unknown) => {
      const message = mapMessage(raw as Record<string, unknown>);
      if (
        !message.channelId ||
        message.channelId !== selectedChannelIdRef.current
      ) {
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, ...message } : m))
      );
    });

    void chatHub.connect();

    return () => {
      unsubMessage();
      unsubTyping();
      unsubRead();
      unsubDeleted();
      unsubEdited();
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

  useEffect(() => {
    setDmSettingsOpen(false);
    setDmPeerUserId(null);

    if (selectedChannel?.type !== "DM" || !selectedChannel.name) return;

    const fromMessages = messages.find(
      (m) => currentUserId && m.userId !== currentUserId
    );
    if (fromMessages) {
      setDmPeerUserId(fromMessages.userId);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/users/${encodeURIComponent(selectedChannel.name)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as Record<string, unknown>;
        const id = String(data.id ?? data.Id ?? "");
        if (id && !cancelled) setDmPeerUserId(id);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedChannel?.id, selectedChannel?.type, selectedChannel?.name, messages, currentUserId]);

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
          if (messagesResponse.status === 401) {
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
    setEditingMessageId(null);
    setEditDraft("");
    setPendingAttachmentUrl(null);
    setPendingAttachmentName(null);
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
      if (
        q &&
        !message.content.toLowerCase().includes(q) &&
        !(message.attachmentUrl ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
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

  const mentionSuggestions = useMemo(
    () => filterMentionCandidates(mentionCandidates, mentionQuery),
    [mentionCandidates, mentionQuery]
  );

  useEffect(() => {
    if (mentionIndex >= mentionSuggestions.length) {
      setMentionIndex(0);
    }
  }, [mentionIndex, mentionSuggestions.length]);

  const highlightContent = (content: string, mine = false) => {
    const q = searchQuery.trim();
    const parts = splitMentionTokens(content);

    return (
      <>
        {parts.map((part, i) => {
          if (isMentionToken(part)) {
            const name = part.slice(1);
            const isKnown = mentionCandidates.some(
              (c) => c.username.toLowerCase() === name.toLowerCase()
            );
            const isSelf =
              currentUsername.toLowerCase() === name.toLowerCase();
            const className = mine
              ? isSelf
                ? "rounded px-0.5 font-semibold bg-white/25 text-white"
                : "rounded px-0.5 font-semibold text-white/95"
              : isSelf
                ? "rounded px-0.5 font-semibold bg-primary-container/15 text-primary-container"
                : isKnown
                  ? "rounded px-0.5 font-semibold text-primary-container"
                  : "font-semibold text-primary-container/80";

            return (
              <button
                key={`${i}-${part}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/profile/${encodeURIComponent(name)}`);
                }}
                className={`${className} hover:underline`}
              >
                {part}
              </button>
            );
          }

          if (!q) return <span key={`${i}-t`}>{part}</span>;

          const lower = part.toLowerCase();
          const idx = lower.indexOf(q.toLowerCase());
          if (idx === -1) return <span key={`${i}-t`}>{part}</span>;

          return (
            <span key={`${i}-t`}>
              {part.slice(0, idx)}
              <mark className="rounded bg-amber-200/80 px-0.5 text-stone-900">
                {part.slice(idx, idx + q.length)}
              </mark>
              {part.slice(idx + q.length)}
            </span>
          );
        })}
      </>
    );
  };

  const renderAttachment = (url: string, mine: boolean) => {
    const href = resolveAttachmentUrl(url);
    if (isImageAttachment(url)) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block overflow-hidden rounded-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={href}
            alt="Ek"
            className="max-h-64 max-w-full rounded-lg object-contain"
          />
        </a>
      );
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`mt-2 inline-flex items-center gap-1.5 text-sm font-hanken underline break-all ${
          mine ? "text-white/90 hover:text-white" : "text-primary-container"
        }`}
      >
        <span className="material-symbols-outlined text-base">attach_file</span>
        {url.split("/").pop() || "Dosya"}
      </a>
    );
  };

  const renderMessageBody = (message: ChatMessage, mine: boolean) => {
    const isEditing = editingMessageId === message.id;

    if (isEditing) {
      return (
        <div className="space-y-2">
          <textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void saveEdit(message.id);
              }
              if (e.key === "Escape") cancelEdit();
            }}
            rows={3}
            className="w-full min-w-[220px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-sm text-stone-900 outline-none focus:border-primary-container/40 font-hanken"
            disabled={editSaving}
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={cancelEdit}
              disabled={editSaving}
              className="rounded-lg px-2.5 py-1 font-hanken text-xs text-stone-500 hover:bg-stone-100"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={() => void saveEdit(message.id)}
              disabled={editSaving || !editDraft.trim()}
              className="rounded-lg bg-primary-container px-2.5 py-1 font-hanken text-xs text-white disabled:opacity-50"
            >
              Kaydet
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {message.content ? (
          <p className="text-sm font-hanken leading-relaxed">
            {highlightContent(message.content, mine)}
            {message.editedAt ? (
              <span
                className={`ml-1 text-[10px] ${
                  mine ? "text-white/70" : "text-stone-400"
                }`}
              >
                (düzenlendi)
              </span>
            ) : null}
          </p>
        ) : message.editedAt ? (
          <p
            className={`text-[10px] font-hanken ${
              mine ? "text-white/70" : "text-stone-400"
            }`}
          >
            (düzenlendi)
          </p>
        ) : null}
        {message.attachmentUrl
          ? renderAttachment(message.attachmentUrl, mine)
          : null}
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

  const togglePin = async (message: ChatMessage) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const next = !message.isPinned;
    setMessages((prev) =>
      prev.map((m) => (m.id === message.id ? { ...m, isPinned: next } : m))
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/${message.id}/pin`,
        {
          method: next ? "POST" : "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id ? { ...m, isPinned: !next } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, isPinned: !next } : m
        )
      );
    }
  };

  const startEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditDraft(message.content);
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditDraft("");
    setEditSaving(false);
  };

  const saveEdit = async (messageId: string) => {
    const content = editDraft.trim();
    if (!content || editSaving) return;

    setEditSaving(true);
    try {
      const data = await editMessage(messageId, content);
      const updated = mapMessage(data);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                content: updated.content,
                editedAt: updated.editedAt ?? new Date().toISOString(),
              }
            : m
        )
      );
      cancelEdit();
    } catch {
      setEditSaving(false);
    }
  };

  const handleDelete = async (message: ChatMessage) => {
    if (
      !window.confirm("Bu mesajı silmek istediğine emin misin?")
    ) {
      return;
    }

    try {
      await deleteMessage(message.id);
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      if (editingMessageId === message.id) cancelEdit();
    } catch {
      // ignore
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !selectedChannelId) return;

    setUploading(true);
    try {
      const uploaded = await uploadMessageFile(file);
      if (!uploaded.url) throw new Error("Dosya URL alınamadı.");
      setPendingAttachmentUrl(uploaded.url);
      setPendingAttachmentName(uploaded.fileName || file.name);
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  };

  const clearPendingAttachment = () => {
    setPendingAttachmentUrl(null);
    setPendingAttachmentName(null);
  };

  const handleSend = async () => {
    const content = draft.trim();
    if (
      !selectedChannelId ||
      (!content && !pendingAttachmentUrl) ||
      !currentUserId ||
      sending ||
      uploading
    ) {
      return;
    }

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
          attachmentUrl: pendingAttachmentUrl ?? undefined,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
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
      setMentionOpen(false);
      clearPendingAttachment();
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

  const applyMention = (username: string) => {
    const mention = {
      start: mentionStart,
      end: mentionEnd,
      query: mentionQuery,
    };
    const { text, cursor } = insertMention(draft, mention, username);
    setDraft(text);
    setMentionOpen(false);
    requestAnimationFrame(() => {
      const el = composerRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  const syncMentionFromComposer = (value: string, cursor: number) => {
    const active = getActiveMention(value, cursor);
    if (!active || mentionCandidates.length === 0) {
      setMentionOpen(false);
      return;
    }
    setMentionStart(active.start);
    setMentionEnd(active.end);
    setMentionQuery(active.query);
    setMentionIndex(0);
    setMentionOpen(true);
  };

  const handleDraftChange = (value: string, cursor: number) => {
    setDraft(value);
    syncMentionFromComposer(value, cursor);

    if (!selectedChannelId) return;
    if (!value.trim()) return;

    const now = Date.now();
    if (now - lastTypingSentRef.current < 1200) return;

    lastTypingSentRef.current = now;
    void chatHub.invoke("SendTyping", selectedChannelId);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionOpen && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionSuggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(
          (i) => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const pick = mentionSuggestions[mentionIndex];
        if (pick) applyMention(pick.username);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionOpen(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const isVoiceChannel = selectedChannel?.type === "Voice";

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
            {isDmMode || selectedChannel?.type === "DM"
              ? "alternate_email"
              : isVoiceChannel
                ? "volume_up"
                : "tag"}
          </span>
          <div>
            <h2 className="font-libre text-lg text-stone-900">
              {selectedChannel?.name
                ? selectedChannel.type === "DM"
                  ? `@${selectedChannel.name}`
                  : selectedChannel.name
                : isFriendsMode
                  ? "Arkadaşlar"
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
                    : isVoiceChannel
                      ? "Ses kanalı"
                      : selectedChannel.type === "Announcement"
                        ? "Duyuru kanalı"
                        : "Sohbet kanalı"
                  : isFriendsMode
                    ? "İstekler, davetler ve arkadaş listesi"
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {selectedChannel?.type === "DM" && (
            <button
              type="button"
              title="Sohbet ayarları"
              aria-label="Sohbet ayarları"
              onClick={() => setDmSettingsOpen(true)}
              className="group relative rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-primary-container"
            >
              <span className="material-symbols-outlined text-xl">settings</span>
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 font-hanken text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                Sohbet ayarları
              </span>
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              title="Bildirimler"
              aria-label="Bildirimler"
              onClick={() => setNotificationsOpen((v) => !v)}
              className="group relative rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-primary-container"
            >
              <span className="material-symbols-outlined text-xl">
                notifications
              </span>
              {inviteBadge + mentionUnread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-container px-1 font-hanken text-[10px] font-bold text-white">
                  {inviteBadge + mentionUnread > 9
                    ? "9+"
                    : inviteBadge + mentionUnread}
                </span>
              )}
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 font-hanken text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                Bildirimler
              </span>
            </button>
            <NotificationsPanel
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
              inviteCount={inviteBadge}
              refreshKey={notificationsRefreshKey}
              onOpenInvites={() => onOpenInvites?.()}
              onOpenMention={(item) => {
                setMentionUnread((n) => Math.max(0, n - (item.isRead ? 0 : 1)));
                onOpenMention?.(item);
              }}
            />
          </div>
          {!isDmMode && selectedChannel?.type !== "DM" && (
            <button
              type="button"
              title="Üyeler"
              aria-label="Üyeler"
              disabled={!selectedChannel?.serverId}
              onClick={() => {
                setExtrasTab("members");
                setExtrasOpen(true);
              }}
              className="group relative rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-primary-container disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-xl">
                manage_accounts
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 font-hanken text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                Üyeler
              </span>
            </button>
          )}
          <button
            type="button"
            title="Sabit mesajlar"
            aria-label="Sabit mesajlar"
            disabled={!selectedChannel}
            onClick={() => {
              setExtrasTab("pins");
              setExtrasOpen(true);
            }}
            className="group relative rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-primary-container disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-xl">push_pin</span>
            <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 font-hanken text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Sabit mesajlar
            </span>
          </button>
          <button
            type="button"
            title="Ara"
            aria-label="Ara"
            onClick={() => setSearchOpen((v) => !v)}
            className={`group relative inline-flex items-center rounded-lg p-2 transition-colors ${
              searchOpen
                ? "bg-primary-container/10 text-primary-container"
                : "text-stone-400 hover:bg-stone-100 hover:text-primary-container"
            }`}
          >
            <span className="material-symbols-outlined text-xl">search</span>
            <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-1 font-hanken text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Ara
            </span>
          </button>
        </div>
      </header>

      {isVoiceChannel && selectedChannel ? (
        <VoiceLobby
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
        />
      ) : (
        <>
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
        {!selectedChannel && isFriendsMode && (
          <p className="text-center text-sm text-stone-400 font-hanken pt-10 w-full max-w-md mx-auto leading-relaxed">
            Soldaki Arkadaşlar panelinden birine Mesaj gönder — ya da istekleri
            ve davetleri yönet.
          </p>
        )}

        {!selectedChannel && isDmMode && !isFriendsMode && (
          <p className="text-center text-sm text-stone-400 font-hanken pt-10 w-full max-w-md mx-auto leading-relaxed">
            Soldan bir arkadaş sohbeti seç — ya da Arkadaşlar listesinden Mesaj
            ile yeni bir konuşma başlat.
          </p>
        )}

        {!selectedChannel && !isDmMode && !isFriendsMode && hasServer && !channelsReady && (
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

        {!selectedChannel && !isDmMode && !isFriendsMode && !hasServer && (
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

        {selectedChannel &&
          !loading &&
          !isDmMode &&
          selectedServer &&
          selectedChannel.type !== "Voice" &&
          selectedChannel.type !== "DM" && (
            <ServerSetupChecklist
              serverId={selectedServer.id}
              serverName={selectedServer.name}
              hasIcon={Boolean(selectedServer.iconUrl)}
              hasFirstMessage={messages.length > 0}
              onServerUpdated={onServerUpdated}
              onFocusComposer={() => composerRef.current?.focus()}
            />
          )}

        {selectedChannel &&
          !loading &&
          messages.length === 0 &&
          !(
            !isDmMode &&
            selectedServer &&
            selectedChannel.type !== "Voice" &&
            selectedChannel.type !== "DM" &&
            isServerSetupPending(selectedServer.id)
          ) && (
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
            const menuOpen = messageMenuId === message.id;

            const messageActions = (
              <div
                data-message-menu
                className={`absolute z-20 w-44 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg ${
                  isMine ? "right-0 top-full mt-1" : "left-0 top-full mt-1"
                }`}
              >
                {isMine && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMessageMenuId(null);
                        startEdit(message);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 font-hanken text-sm text-stone-700 hover:bg-stone-50"
                    >
                      <span className="material-symbols-outlined text-base text-stone-400">
                        edit
                      </span>
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMessageMenuId(null);
                        void handleDelete(message);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 font-hanken text-sm text-red-600 hover:bg-red-50"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                      Sil
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMessageMenuId(null);
                    void toggleStar(message);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 font-hanken text-sm text-stone-700 hover:bg-stone-50"
                >
                  <span
                    className={`material-symbols-outlined text-base ${
                      message.isStarred ? "text-amber-500" : "text-stone-400"
                    }`}
                    style={
                      message.isStarred
                        ? { fontVariationSettings: "'FILL' 1" }
                        : undefined
                    }
                  >
                    star
                  </span>
                  {message.isStarred ? "Yıldızı kaldır" : "Yıldızla"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageMenuId(null);
                    void togglePin(message);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 font-hanken text-sm text-stone-700 hover:bg-stone-50"
                >
                  <span
                    className={`material-symbols-outlined text-base ${
                      message.isPinned
                        ? "text-primary-container"
                        : "text-stone-400"
                    }`}
                    style={
                      message.isPinned
                        ? { fontVariationSettings: "'FILL' 1" }
                        : undefined
                    }
                  >
                    push_pin
                  </span>
                  {message.isPinned ? "Sabiti kaldır" : "Sabitle"}
                </button>
              </div>
            );

            if (isMine) {
              return (
                <div
                  id={`msg-${message.id}`}
                  key={message.id}
                  className={`flex gap-4 flex-row-reverse scroll-mt-24 rounded-xl transition-colors ${
                    highlightMessageId === message.id
                      ? "bg-primary-container/10 ring-2 ring-primary-container/30"
                      : ""
                  }`}
                >
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
                    <div className="group/msg relative inline-flex max-w-[85%] flex-row-reverse items-center gap-1">
                      <div className="rounded-xl rounded-tr-sm bg-primary-container p-4 text-left text-white shadow-md">
                        {renderMessageBody(message, true)}
                      </div>
                      <div className="relative shrink-0" data-message-menu>
                        <button
                          type="button"
                          title="Mesaj seçenekleri"
                          aria-label="Mesaj seçenekleri"
                          onClick={() =>
                            setMessageMenuId(menuOpen ? null : message.id)
                          }
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-all hover:bg-stone-200/80 hover:text-stone-700 ${
                            menuOpen
                              ? "bg-stone-200/80 text-stone-700 opacity-100"
                              : "opacity-40 hover:opacity-100 group-hover/msg:opacity-100 focus:opacity-100"
                          }`}
                        >
                          <span className="material-symbols-outlined text-lg">
                            expand_more
                          </span>
                        </button>
                        {menuOpen && messageActions}
                      </div>
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
              <div
                id={`msg-${message.id}`}
                key={message.id}
                className={`flex gap-4 scroll-mt-24 rounded-xl transition-colors ${
                  highlightMessageId === message.id
                    ? "bg-primary-container/10 ring-2 ring-primary-container/30"
                    : ""
                }`}
              >
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
                  <div className="group/msg relative inline-flex max-w-[85%] items-center gap-1">
                    <div className="rounded-xl rounded-tl-sm border border-stone-200 bg-white p-4 text-stone-800 shadow-sm">
                      {renderMessageBody(message, false)}
                    </div>
                    <div className="relative shrink-0" data-message-menu>
                      <button
                        type="button"
                        title="Mesaj seçenekleri"
                        aria-label="Mesaj seçenekleri"
                        onClick={() =>
                          setMessageMenuId(menuOpen ? null : message.id)
                        }
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-all hover:bg-stone-200/80 hover:text-stone-700 ${
                          menuOpen
                            ? "bg-stone-200/80 text-stone-700 opacity-100"
                            : "opacity-40 hover:opacity-100 group-hover/msg:opacity-100 focus:opacity-100"
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          expand_more
                        </span>
                      </button>
                      {menuOpen && messageActions}
                    </div>
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
          className="max-w-5xl mx-auto flex flex-col gap-2 bg-stone-50 rounded-2xl p-2 m-6 border border-stone-200 transition-all focus-within:border-primary-container/40"
        >
          {pendingAttachmentUrl && (
            <div className="flex items-center gap-2 px-2 pt-1">
              <span className="material-symbols-outlined text-base text-primary-container">
                attach_file
              </span>
              <span className="flex-1 truncate font-hanken text-xs text-stone-600">
                {pendingAttachmentName || "Dosya eklendi"}
              </span>
              <button
                type="button"
                onClick={clearPendingAttachment}
                className="material-symbols-outlined text-base text-stone-400 hover:text-red-500"
                title="Eki kaldır"
              >
                close
              </button>
            </div>
          )}
          <div className="flex items-end gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,image/png,image/jpeg,image/gif,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => void handleFileSelect(e)}
            />
            <button
              type="button"
              title="Dosya ekle"
              disabled={!selectedChannel || sending || uploading}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-stone-400 hover:text-primary-container transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">
                {uploading ? "hourglass_empty" : "add_circle"}
              </span>
            </button>
            <div className="relative flex-1">
              {mentionOpen && mentionSuggestions.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-48 overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
                  <p className="px-3 py-1.5 font-hanken text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Üyeler
                  </p>
                  {mentionSuggestions.map((m, i) => (
                    <button
                      key={m.userId || m.username}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyMention(m.username);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left font-hanken text-sm transition-colors ${
                        i === mentionIndex
                          ? "bg-primary-container/10 text-stone-900"
                          : "text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-container/10 font-libre text-xs font-bold uppercase text-primary-container">
                        {m.username.charAt(0) || "?"}
                      </span>
                      <span>@{m.username}</span>
                    </button>
                  ))}
                </div>
              )}
              <textarea
                ref={composerRef}
                value={draft}
                onChange={(e) =>
                  handleDraftChange(e.target.value, e.target.selectionStart)
                }
                onClick={(e) =>
                  syncMentionFromComposer(
                    e.currentTarget.value,
                    e.currentTarget.selectionStart
                  )
                }
                onKeyUp={(e) => {
                  if (
                    e.key === "ArrowLeft" ||
                    e.key === "ArrowRight" ||
                    e.key === "Home" ||
                    e.key === "End"
                  ) {
                    syncMentionFromComposer(
                      e.currentTarget.value,
                      e.currentTarget.selectionStart
                    );
                  }
                }}
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
                disabled={
                  !selectedChannel ||
                  (!draft.trim() && !pendingAttachmentUrl) ||
                  sending ||
                  uploading
                }
                className="w-10 h-10 bg-primary-container text-white rounded-xl flex items-center justify-center hover:bg-[#8f1b1c] transition-all active:scale-95 shadow-md disabled:opacity-50"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </form>
      </footer>
        </>
      )}

      <ChannelExtrasPanel
        isOpen={extrasOpen}
        onClose={() => setExtrasOpen(false)}
        channelId={selectedChannel?.id ?? null}
        channelName={selectedChannel?.name ?? ""}
        serverId={selectedChannel?.serverId ?? null}
        initialTab={extrasTab}
        onUnpin={(messageId) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId ? { ...m, isPinned: false } : m
            )
          );
        }}
      />

      {selectedChannel?.type === "DM" && (
        <DmSettingsModal
          isOpen={dmSettingsOpen}
          onClose={() => setDmSettingsOpen(false)}
          peerUsername={selectedChannel.name}
          peerUserId={dmPeerUserId}
        />
      )}
    </main>
  );
}
