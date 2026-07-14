export const API_BASE_URL = "http://localhost:5243";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function clearAuthAndRedirectToLogin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
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
