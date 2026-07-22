const SERVER_WIDTH_KEY = "micodex_server_sidebar_w";
const CHANNEL_PANEL_KEY = "micodex_channel_panel_open";

export const SERVER_SIDEBAR_MIN = 72;
export const SERVER_SIDEBAR_MAX = 260;
export const SERVER_SIDEBAR_DEFAULT = 80;
export const SERVER_SIDEBAR_LABEL_THRESHOLD = 112;

export function loadServerSidebarWidth(): number {
  if (typeof window === "undefined") return SERVER_SIDEBAR_DEFAULT;
  try {
    const raw = sessionStorage.getItem(SERVER_WIDTH_KEY);
    if (!raw) return SERVER_SIDEBAR_DEFAULT;
    const n = Number(raw);
    if (Number.isNaN(n)) return SERVER_SIDEBAR_DEFAULT;
    return Math.min(SERVER_SIDEBAR_MAX, Math.max(SERVER_SIDEBAR_MIN, n));
  } catch {
    return SERVER_SIDEBAR_DEFAULT;
  }
}

export function saveServerSidebarWidth(width: number): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SERVER_WIDTH_KEY, String(width));
}

export function loadChannelPanelOpen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = sessionStorage.getItem(CHANNEL_PANEL_KEY);
    if (raw === null) return true;
    return raw === "1";
  } catch {
    return true;
  }
}

export function saveChannelPanelOpen(open: boolean): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CHANNEL_PANEL_KEY, open ? "1" : "0");
}

export function useDragResize(
  width: number,
  onWidthChange: (next: number) => void,
  min: number,
  max: number
) {
  const startDrag = (clientX: number) => {
    const startX = clientX;
    const startW = width;

    const onMove = (e: MouseEvent) => {
      const next = Math.min(max, Math.max(min, startW + (e.clientX - startX)));
      onWidthChange(next);
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return { startDrag };
}
