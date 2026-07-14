"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ServerItem = {
  id: string;
  name: string;
  iconUrl?: string | null;
};

export default function ServerSidebar() {
  const router = useRouter();
  const [servers, setServers] = useState<ServerItem[]>([]);

  useEffect(() => {
    const loadServers = async () => {
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

        setServers(
          list.map((s: Record<string, unknown>) => ({
            id: String(s.id ?? s.Id),
            name: String(s.name ?? s.Name ?? "Sunucu"),
            iconUrl: (s.iconUrl ?? s.IconUrl ?? null) as string | null,
          }))
        );
      } catch {
        router.push("/login");
      }
    };

    loadServers();
  }, [router]);

  return (
    <aside className="w-20 flex flex-col items-center py-6 space-y-6 border-r border-stone-200 bg-mahogany-dark shrink-0">
      <div className="relative group cursor-pointer" title="micodex">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container p-0.5 transition-transform duration-300 group-hover:scale-110 bg-white flex items-center justify-center">
          <span className="font-libre text-lg text-primary-container font-bold leading-none">
            m
          </span>
        </div>
      </div>

      <div className="w-10 h-px bg-stone-300 mx-auto" />

      <div className="space-y-4">
        {servers.map((server) => (
          <div
            key={server.id}
            title={server.name}
            className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center cursor-pointer transition-all duration-300 hover:rounded-xl hover:bg-primary-container/10 group shadow-sm overflow-hidden"
          >
            {server.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={server.iconUrl}
                alt={server.name}
                className="w-full h-full object-cover"
              />
            ) : server.name ? (
              <span className="font-libre text-sm text-stone-600 group-hover:text-primary-container font-semibold uppercase">
                {server.name.charAt(0)}
              </span>
            ) : (
              <span className="material-symbols-outlined text-stone-500 group-hover:text-primary-container text-lg">
                dns
              </span>
            )}
          </div>
        ))}

        <div
          title="Sunucu ekle"
          className="w-12 h-12 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:border-primary-container/60 transition-colors bg-white/50"
        >
          <span className="material-symbols-outlined text-stone-400">add</span>
        </div>
      </div>
    </aside>
  );
}
