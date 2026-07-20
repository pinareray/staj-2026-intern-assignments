export const API_BASE_URL = "http://localhost:5243";

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

export type CachedUserProfile = {
  id: string;
  username: string;
  email: string;
};

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
