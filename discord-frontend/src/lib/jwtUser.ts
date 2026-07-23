/** JWT payload'dan oturum kullanıcı bilgisini okur. */
export function readUserFromToken(): { id: string; username: string } | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const segment = token.split(".")[1] ?? "";
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;

    const id = String(
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ] ??
        payload.nameid ??
        payload.sub ??
        payload[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid"
        ] ??
        ""
    );

    const username = String(
      payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"
      ] ??
        payload.unique_name ??
        payload.name ??
        payload.email ??
        localStorage.getItem("username") ??
        "Sen"
    );

    if (!id) return null;
    return { id, username };
  } catch {
    return null;
  }
}
