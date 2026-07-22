export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5243";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  localStorage.removeItem("userId");
}

export function logoutToLanding() {
  clearAuthStorage();
  window.location.href = "/";
}

export function clearAuthAndRedirectToLogin() {
  clearAuthStorage();
  window.location.href = "/login";
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const token = getAuthToken();
  if (!token) {
    clearAuthAndRedirectToLogin();
    throw new Error("Token yok");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    clearAuthAndRedirectToLogin();
    throw new Error("Yetkisiz");
  }

  return response;
}

import type { CachedUserProfile, UserSearchHit } from "@/models/chat";

export type { CachedUserProfile, UserSearchHit };

export async function fetchCurrentUserProfile(): Promise<CachedUserProfile | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as Record<string, unknown>;
    return {
      id: String(data.id ?? data.Id ?? ""),
      username: String(data.username ?? data.Username ?? ""),
      email: String(data.email ?? data.Email ?? ""),
    };
  } catch {
    return null;
  }
}

export async function cacheCurrentUserProfile(): Promise<CachedUserProfile | null> {
  const profile = await fetchCurrentUserProfile();
  if (!profile || typeof window === "undefined") return profile;

  if (profile.username) localStorage.setItem("username", profile.username);
  if (profile.email) localStorage.setItem("email", profile.email);
  if (profile.id) localStorage.setItem("userId", profile.id);

  return profile;
}

export async function searchUsers(query: string): Promise<UserSearchHit[]> {
  const q = query.trim().replace(/^@+/, "");
  if (q.length < 2) return [];

  const token = getAuthToken();
  if (!token) return [];

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/users/search?q=${encodeURIComponent(q)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) return [];

    const data = await response.json();
    const list = Array.isArray(data) ? data : [];
    return list
      .map((row: Record<string, unknown>) => ({
        id: String(row.id ?? row.Id ?? ""),
        username: String(row.username ?? row.Username ?? ""),
        isFriend: Boolean(row.isFriend ?? row.IsFriend ?? false),
      }))
      .filter((u) => Boolean(u.username))
      .sort((a, b) => {
        if (a.isFriend !== b.isFriend) return a.isFriend ? -1 : 1;
        return a.username.localeCompare(b.username, "tr", { sensitivity: "base" });
      });
  } catch {
    return [];
  }
}

export async function fetchDmPeerReadAt(channelId: string): Promise<string | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/dms/read/${channelId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as Record<string, unknown>;
    const readAt = data.lastReadAt ?? data.LastReadAt;
    return readAt ? String(readAt) : null;
  } catch {
    return null;
  }
}

export async function markDmRead(channelId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) return;

  await fetch(`${API_BASE_URL}/api/dms/read/${channelId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchDmUnreadTotal(): Promise<number> {
  const token = getAuthToken();
  if (!token) return 0;

  try {
    const response = await fetch(`${API_BASE_URL}/api/dms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return 0;

    const data = await response.json();
    const list = Array.isArray(data) ? data : [];
    return list.reduce(
      (sum: number, row: Record<string, unknown>) =>
        sum + Number(row.unreadCount ?? row.UnreadCount ?? 0),
      0
    );
  } catch {
    return 0;
  }
}

export async function deleteChannel(channelId: string): Promise<void> {
  const response = await authFetch(`/api/channels/${channelId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let message = "Kanal silinemedi.";
    try {
      const errData = (await response.json()) as Record<string, unknown>;
      message = String(
        errData.title ?? errData.message ?? errData.detail ?? message
      );
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}

export async function leaveServer(serverId: string): Promise<void> {
  const response = await authFetch(`/api/servers/${serverId}/leave`, {
    method: "POST",
  });

  if (!response.ok) {
    let message = "Sunucudan ayrılılamadı.";
    try {
      const errData = (await response.json()) as Record<string, unknown>;
      message = String(
        errData.title ?? errData.message ?? errData.detail ?? message
      );
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}

export async function deleteMessage(messageId: string): Promise<void> {
  const response = await authFetch(`/api/messages/${messageId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    let message = "Mesaj silinemedi.";
    try {
      const errData = (await response.json()) as Record<string, unknown>;
      message = String(errData.message ?? errData.title ?? message);
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}

export async function editMessage(
  messageId: string,
  content: string
): Promise<Record<string, unknown>> {
  const response = await authFetch(`/api/messages/${messageId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    let message = "Mesaj düzenlenemedi.";
    try {
      const errData = (await response.json()) as Record<string, unknown>;
      message = String(errData.message ?? errData.title ?? message);
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return (await response.json()) as Record<string, unknown>;
}

export async function uploadMessageFile(
  file: File
): Promise<{ url: string; fileName: string }> {
  const token = getAuthToken();
  if (!token) {
    clearAuthAndRedirectToLogin();
    throw new Error("Token yok");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/messages/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (response.status === 401 || response.status === 403) {
    clearAuthAndRedirectToLogin();
    throw new Error("Yetkisiz");
  }

  if (!response.ok) {
    let message = "Dosya yüklenemedi.";
    try {
      const errData = (await response.json()) as Record<string, unknown>;
      message = String(errData.message ?? errData.title ?? message);
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = (await response.json()) as Record<string, unknown>;
  return {
    url: String(data.url ?? data.Url ?? ""),
    fileName: String(data.fileName ?? data.FileName ?? file.name),
  };
}
