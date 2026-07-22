"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreateServerModal from "@/components/modals/CreateServerModal";
import { API_BASE_URL } from "@/services";
import {
  SERVER_SIDEBAR_LABEL_THRESHOLD,
  SERVER_SIDEBAR_MAX,
  SERVER_SIDEBAR_MIN,
  loadServerSidebarWidth,
  saveServerSidebarWidth,
  useDragResize,
} from "@/lib/sidebarLayout";
import type { ServerItem } from "@/models";

type ServerSidebarProps = {
  currentServerId: string | null;
  messagesActive?: boolean;
  totalUnread?: number;
  onMessagesHome?: () => void;
  onServerSelect: (server: ServerItem) => void;
  refreshKey?: number;
};

export default function ServerSidebar({
  currentServerId,
  messagesActive = false,
  totalUnread = 0,
  onMessagesHome,
  onServerSelect,
  refreshKey: externalRefreshKey = 0,
}: ServerSidebarProps) {
  const router = useRouter();
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [width, setWidth] = useState(() => loadServerSidebarWidth());

  const handleWidthChange = useCallback((next: number) => {
    setWidth(next);
    saveServerSidebarWidth(next);
  }, []);

  const { startDrag } = useDragResize(
    width,
    handleWidthChange,
    SERVER_SIDEBAR_MIN,
    SERVER_SIDEBAR_MAX
  );

  const showLabels = width >= SERVER_SIDEBAR_LABEL_THRESHOLD;
  const compact = !showLabels;

  const loadServers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/servers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
        }
        router.push("/login");
        return;
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : [];

      const mapped: ServerItem[] = list.map((s: Record<string, unknown>) => ({
        id: String(s.id ?? s.Id),
        name: String(s.name ?? s.Name ?? "Sunucu"),
        iconUrl: (s.iconUrl ?? s.IconUrl ?? null) as string | null,
      }));

      setServers(mapped);

      if (!messagesActive && !currentServerId && mapped.length > 0) {
        onServerSelect(mapped[0]);
      }
    } catch {
      router.push("/login");
    }
  }, [router, currentServerId, onServerSelect, messagesActive]);

  useEffect(() => {
    loadServers();
  }, [loadServers, refreshKey, externalRefreshKey]);

  const handleServerCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const serverIcon = (server: ServerItem, isActive: boolean) => {
    if (server.iconUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={server.iconUrl}
          alt={server.name}
          className="h-full w-full object-cover"
        />
      );
    }

    if (server.name) {
      return (
        <span
          className={`font-libre text-sm font-semibold uppercase ${
            isActive
              ? "text-primary-container"
              : "text-stone-600 group-hover:text-primary-container"
          }`}
        >
          {server.name.charAt(0)}
        </span>
      );
    }

    return (
      <span className="material-symbols-outlined text-lg text-stone-500 group-hover:text-primary-container">
        dns
      </span>
    );
  };

  return (
    <>
      <aside
        className="relative flex shrink-0 flex-col border-r border-stone-200 bg-mahogany-dark py-4 transition-[width] duration-150 ease-out"
        style={{ width }}
      >
        <div
          className={`flex flex-col gap-4 px-2 ${compact ? "items-center" : ""}`}
        >
          <button
            type="button"
            title="Mesajlar"
            onClick={() => onMessagesHome?.()}
            className={`group relative flex shrink-0 items-center rounded-2xl border-2 bg-white shadow-sm transition-all duration-300 hover:rounded-xl ${
              compact ? "h-12 w-12 justify-center" : "h-12 w-full gap-3 px-3"
            } ${
              messagesActive
                ? "border-white ring-2 ring-white/80"
                : "border-stone-200 hover:bg-primary-container/10"
            }`}
          >
            <span
              className={`material-symbols-outlined text-xl ${
                messagesActive
                  ? "text-primary-container"
                  : "text-stone-500 group-hover:text-primary-container"
              }`}
              style={
                messagesActive
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              forum
            </span>
            {showLabels && (
              <span
                className={`truncate font-hanken text-sm font-semibold ${
                  messagesActive ? "text-primary-container" : "text-stone-600"
                }`}
              >
                Mesajlar
              </span>
            )}
            {!messagesActive && totalUnread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-container px-1 font-hanken text-[10px] font-bold text-white ring-2 ring-mahogany-dark">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </button>

          <div
            className={`h-px bg-stone-300 ${compact ? "w-10" : "mx-2 w-auto"}`}
          />

          <div className={`space-y-2 ${compact ? "" : "w-full"}`}>
            {servers.map((server) => {
              const isActive =
                !messagesActive && currentServerId === server.id;
              return (
                <button
                  type="button"
                  key={server.id}
                  title={server.name}
                  onClick={() => onServerSelect(server)}
                  className={`group flex cursor-pointer items-center overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all duration-300 hover:rounded-xl ${
                    compact
                      ? "h-12 w-12 justify-center"
                      : "h-12 w-full gap-3 px-3"
                  } ${
                    isActive
                      ? "border-white ring-2 ring-white/80"
                      : "border-stone-200 hover:bg-primary-container/10"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                    {serverIcon(server, isActive)}
                  </div>
                  {showLabels && (
                    <span
                      className={`min-w-0 truncate text-left font-hanken text-sm font-medium ${
                        isActive
                          ? "text-primary-container"
                          : "text-stone-700 group-hover:text-stone-900"
                      }`}
                    >
                      {server.name}
                    </span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              title="Sunucu ekle"
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center justify-center rounded-full border-2 border-dashed border-stone-300 bg-white/50 transition-colors hover:border-primary-container/60 ${
                compact ? "mx-auto h-12 w-12" : "h-12 w-full gap-2 px-3"
              }`}
            >
              <span className="material-symbols-outlined text-stone-400">
                add
              </span>
              {showLabels && (
                <span className="font-hanken text-sm text-stone-500">
                  Sunucu ekle
                </span>
              )}
            </button>
          </div>
        </div>

        <button
          type="button"
          aria-label="Sunucu paneli genişliğini ayarla"
          className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize bg-transparent hover:bg-primary-container/20"
          onMouseDown={(e) => {
            e.preventDefault();
            startDrag(e.clientX);
          }}
        />
      </aside>

      <CreateServerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleServerCreated}
      />
    </>
  );
}
