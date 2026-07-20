"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreateServerModal from "@/components/CreateServerModal";
import type { ServerItem } from "@/types/chat";

type ServerSidebarProps = {
  currentServerId: string | null;
  messagesActive?: boolean;
  onMessagesHome?: () => void;
  onServerSelect: (server: ServerItem) => void;
};

export default function ServerSidebar({
  currentServerId,
  messagesActive = false,
  onMessagesHome,
  onServerSelect,
}: ServerSidebarProps) {
  const router = useRouter();
  const [servers, setServers] = useState<ServerItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadServers = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5243/api/servers", {
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
  }, [loadServers, refreshKey]);

  const handleServerCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      <aside className="w-20 flex flex-col items-center py-6 space-y-6 border-r border-stone-200 bg-mahogany-dark shrink-0">
        <button
          type="button"
          title="Mesajlar"
          onClick={() => onMessagesHome?.()}
          className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all duration-300 hover:rounded-xl shadow-sm bg-white ${
            messagesActive
              ? "border-white ring-2 ring-white/80 rounded-xl scale-105"
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
        </button>

        <div className="w-10 h-px bg-stone-300 mx-auto" />

        <div className="space-y-4">
          {servers.map((server) => {
            const isActive = !messagesActive && currentServerId === server.id;
            return (
              <button
                type="button"
                key={server.id}
                title={server.name}
                onClick={() => onServerSelect(server)}
                className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all duration-300 hover:rounded-xl group shadow-sm overflow-hidden bg-white ${
                  isActive
                    ? "border-white ring-2 ring-white/80 rounded-xl scale-105"
                    : "border-stone-200 hover:bg-primary-container/10"
                }`}
              >
                {server.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={server.iconUrl}
                    alt={server.name}
                    className="w-full h-full object-cover"
                  />
                ) : server.name ? (
                  <span
                    className={`font-libre text-sm font-semibold uppercase ${
                      isActive
                        ? "text-primary-container"
                        : "text-stone-600 group-hover:text-primary-container"
                    }`}
                  >
                    {server.name.charAt(0)}
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-stone-500 group-hover:text-primary-container text-lg">
                    dns
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            title="Sunucu ekle"
            onClick={() => setIsModalOpen(true)}
            className="w-12 h-12 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:border-primary-container/60 transition-colors bg-white/50"
          >
            <span className="material-symbols-outlined text-stone-400">add</span>
          </button>
        </div>
      </aside>

      <CreateServerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleServerCreated}
      />
    </>
  );
}
