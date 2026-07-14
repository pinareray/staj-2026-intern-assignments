export type PasswordChecks = {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasSpecial: boolean;
};

export function getPasswordChecks(password: string): PasswordChecks {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-ZÇĞİÖŞÜ]/.test(password),
    hasLower: /[a-zçğıöşü]/.test(password),
    hasSpecial: /[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const c = getPasswordChecks(password);
  return c.minLength && c.hasUpper && c.hasLower && c.hasSpecial;
}

export function validateUsername(username: string): string | null {
  const value = username.trim();
  if (value.length < 3) return "Kullanıcı adı en az 3 karakter olmalı.";
  if (value.length > 24) return "Kullanıcı adı en fazla 24 karakter olabilir.";
  if (!/^[a-zA-Z0-9çğıöşüÇĞİÖŞÜ._-]+$/.test(value)) {
    return "Sadece harf, rakam, nokta, alt çizgi ve tire kullanılabilir.";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "E-posta zorunludur.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Geçerli bir e-posta adresi girin.";
  }
  return null;
}

export function getAuthErrorMessage(status: number, fallback: string): string {
  if (status === 500) {
    return "Sunucu şu an veritabanına bağlanamıyor. Biraz sonra tekrar dene veya internet/hotspot bağlantını kontrol et.";
  }
  if (status === 401 || status === 400) {
    return fallback;
  }
  return fallback;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
