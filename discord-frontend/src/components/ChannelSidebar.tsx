"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ChannelSidebar() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:5243/api/users/me", {
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
        setUsername(data.username ?? data.Username ?? "");
        setEmail(data.email ?? data.Email ?? "");
      } catch {
        router.push("/login");
      }
    };

    loadProfile();
  }, [router]);

  return (
    <nav className="w-72 flex flex-col border-r border-stone-200 bg-white shrink-0">
      <header className="h-16 px-6 flex items-center justify-between border-b border-stone-200">
        <h1 className="font-libre text-lg tracking-tight text-stone-900">
          micodex
        </h1>
        <span className="material-symbols-outlined text-stone-400 cursor-pointer hover:text-stone-700">
          expand_more
        </span>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-6">
        <div className="px-3">
          <div className="flex items-center px-3 py-1 text-stone-400 uppercase tracking-widest text-[10px] font-bold">
            <span className="material-symbols-outlined text-sm mr-1">
              keyboard_arrow_down
            </span>
            Kanallar
          </div>
          <div className="mt-2 space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-container/10 text-stone-900 group">
              <span
                className="material-symbols-outlined text-primary-container"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                tag
              </span>
              <span className="text-sm font-hanken">genel</span>
            </button>

            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-all group">
              <span className="material-symbols-outlined text-stone-400 group-hover:text-stone-700">
                campaign
              </span>
              <span className="text-sm font-hanken">duyurular</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-primary-container/30 bg-primary-container/10 flex items-center justify-center">
            <span className="font-libre text-sm text-primary-container font-bold uppercase">
              {username ? username.charAt(0) : "?"}
            </span>
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-stone-900 truncate font-hanken">
            {username || "Yükleniyor..."}
          </div>
          <div className="text-[10px] text-stone-400 uppercase tracking-wider truncate">
            {email || "—"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-stone-400 hover:text-stone-700 cursor-pointer text-xl">
            settings
          </span>
        </div>
      </div>
    </nav>
  );
}
