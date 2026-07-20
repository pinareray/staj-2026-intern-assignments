"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import AuthCard from "@/components/auth/AuthCard";
import AuthDivider from "@/components/auth/AuthDivider";
import AuthField from "@/components/auth/AuthField";
import AuthShell from "@/components/auth/AuthShell";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";
import {
  fetchWithTimeout,
  getAuthErrorMessage,
  validateEmail,
} from "@/lib/authValidation";

const API_BASE_URL = "http://localhost:5243";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false });

  const emailError = useMemo(
    () => (touched.email ? validateEmail(email) : null),
    [email, touched.email]
  );

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setTouched({ email: true });

    const emailValidation = validateEmail(email);
    if (emailValidation || !password) {
      setError(emailValidation || "Şifre zorunludur.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let message = "Giriş başarısız. E-posta veya şifre hatalı olabilir.";
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

      const data = await response.json();
      const token = data.token ?? data.Token;

      if (!token) {
        setError("Sunucudan geçerli bir token alınamadı.");
        return;
      }

      localStorage.setItem("token", token);
      router.push("/app");
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
            Arşiv seni bekliyor
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleLogin}>
          <AuthField
            id="email"
            label="E-posta"
            type="email"
            autoComplete="email"
            placeholder="ornek@micodex.com"
            icon="mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            error={emailError}
          />

          <AuthField
            id="password"
            label="Şifre"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            labelAction={
              <Link
                href="/forgot-password"
                className="text-[11px] text-stone-400 hover:text-primary-container transition-colors font-hanken"
              >
                Şifremi Unuttum?
              </Link>
            }
          />

          {error && (
            <p className="text-sm text-primary-container bg-red-50 border border-red-100 rounded-lg px-4 py-3 font-hanken">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-container text-white py-3.5 font-hanken font-semibold tracking-wide hover:bg-[#8f1b1c] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            {!loading && (
              <span className="material-symbols-outlined text-lg">
                arrow_forward
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 space-y-5">
          <AuthDivider />
          <SocialLoginButtons />
        </div>

        <p className="mt-8 text-center text-sm text-stone-500 font-hanken">
          Hesabın yok mu?{" "}
          <Link
            href="/register"
            className="text-stone-900 underline underline-offset-4 hover:text-primary-container transition-colors"
          >
            Kayıt Ol
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
