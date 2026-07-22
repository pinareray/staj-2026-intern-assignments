const STORAGE_KEY = "micodex_app_nav";

export type SavedAppNavigation = {
  viewMode: "dms" | "server";
  server: {
    id: string;
    name: string;
    iconUrl?: string | null;
  } | null;
  channel: {
    id: string;
    name: string;
    serverId: string | null;
    type: string;
  } | null;
};

export function loadAppNavigation(): SavedAppNavigation | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedAppNavigation;
  } catch {
    return null;
  }
}

export function saveAppNavigation(state: SavedAppNavigation): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearAppNavigation(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getInitialAppState(): {
  viewMode: "dms" | "server";
  selectedServer: SavedAppNavigation["server"];
  selectedChannel: SavedAppNavigation["channel"];
} {
  const saved = loadAppNavigation();
  if (!saved) {
    return {
      viewMode: "server",
      selectedServer: null,
      selectedChannel: null,
    };
  }

  return {
    viewMode: saved.viewMode,
    selectedServer: saved.server,
    selectedChannel: saved.channel,
  };
}
