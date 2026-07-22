const PREF_KEY = "micodex_browser_notifications";

export function browserNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREF_KEY) === "1";
}

export function setBrowserNotificationsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREF_KEY, enabled ? "1" : "0");
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showDmBrowserNotification(title: string, body?: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (!browserNotificationsEnabled()) return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  try {
    const n = new Notification(title, {
      body: body || "Yeni bir özel mesajın var.",
      icon: "/archive-3d.png",
      tag: "micodex-dm",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // ignore
  }
}
