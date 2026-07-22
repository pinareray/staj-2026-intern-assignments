"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthField from "@/components/auth/AuthField";
import AuthShell from "@/components/auth/AuthShell";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import {
  fetchWithTimeout,
  getAuthErrorMessage,
  isPasswordValid,
  validateEmail,
  validateUsername,
} from "@/lib/authValidation";
import { API_BASE_URL } from "@/services";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    confirmPassword: false,
  });

  const usernameError = useMemo(
    () => (touched.username ? validateUsername(username) : null),
    [username, touched.username]
  );
  const emailError = useMemo(
    () => (touched.email ? validateEmail(email) : null),
    [email, touched.email]
  );
  const confirmPasswordError = useMemo(() => {
    if (!touched.confirmPassword) return null;
    if (!confirmPassword) return "Şifre tekrarını gir.";
    if (password !== confirmPassword) return "Şifreler eşleşmiyor.";
    return null;
  }, [confirmPassword, password, touched.confirmPassword]);

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const canSubmit =
    !validateUsername(username) &&
    !validateEmail(email) &&
    isPasswordValid(password) &&
    passwordsMatch;

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setTouched({ username: true, email: true, confirmPassword: true });

    if (!canSubmit) {
      if (password !== confirmPassword) {
        setError("Şifreler eşleşmiyor.");
        return;
      }
      setError("Lütfen tüm alanları kurallara uygun doldur.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        }
      );

      if (!response.ok) {
        let message = "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.";
        try {
          const errData = await response.json();
          message =
            errData.title || errData.message || errData.detail || message;
        } catch {
          // body okunamadı
        }
        setError(getAuthErrorMessage(response.status, message));
        return;
      }

      router.push("/login");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(
          "İstek zaman aşımına uğradı. Veritabanı bağlantısını (Supabase/hotspot) kontrol et."
        );
      } else {
        setError("Sunucuya bağlanılamadı. Backend'in çalıştığından emin olun.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <header className="mb-8 space-y-1">
          <h1 className="font-libre text-4xl text-stone-900 tracking-tight">
            micodex
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-hanken">
            Üyelik oluştur
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleRegister}>
          <AuthField
            id="username"
            label="Kullanıcı Adı"
            type="text"
            autoComplete="username"
            placeholder="kullaniciadi"
            icon="person"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setTouched((t) => ({ ...t, username: true }));
            }}
            disabled={loading}
            error={usernameError}
          />

          <AuthField
            id="email"
            label="E-posta"
            type="email"
            autoComplete="email"
            placeholder="ornek@micodex.com"
            icon="mail"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setTouched((t) => ({ ...t, email: true }));
            }}
            disabled={loading}
            error={emailError}
          />

          <div className="space-y-2">
            <AuthField
              id="password"
              label="Şifre"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <PasswordRequirements password={password} />
          </div>

          <div className="space-y-2">
            <AuthField
              id="confirmPassword"
              label="Şifre Tekrar"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setTouched((t) => ({ ...t, confirmPassword: true }));
              }}
              disabled={loading}
              error={confirmPasswordError}
            />
            {passwordsMatch && (
              <p className="flex items-center gap-1.5 font-hanken text-xs text-emerald-700">
                <span className="material-symbols-outlined text-sm">
                  check_circle
                </span>
                Şifreler eşleşiyor
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-primary-container bg-red-50 border border-red-100 rounded-lg px-4 py-3 font-hanken">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full rounded-xl bg-primary-container text-white py-3.5 font-hanken font-semibold tracking-wide hover:bg-[#8f1b1c] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            {!loading && (
              <span className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-stone-500 font-hanken">
          Zaten hesabın var mı?{" "}
          <Link
            href="/login"
            className="text-stone-900 underline underline-offset-4 hover:text-primary-container transition-colors"
          >
            Giriş Yap
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
