import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import AuthDivider from "@/components/auth/AuthDivider";
import AuthField from "@/components/auth/AuthField";
import AuthShell from "@/components/auth/AuthShell";
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";

export default function LoginPage() {
  return (
    <AuthShell>
      <AuthCard>
        <header className="mb-8 space-y-1">
          <h1 className="font-libre text-4xl text-on-surface tracking-tight">
            L&apos;Atelier
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/70 font-hanken">
            The Archive Awaits
          </p>
        </header>

        <form className="space-y-5">
          <AuthField
            id="email"
            label="Codename or Email"
            type="email"
            autoComplete="email"
            placeholder="curator@latelier.com"
            icon="mail"
          />

          <AuthField
            id="password"
            label="Secret Key"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            labelAction={
              <Link
                href="/forgot-password"
                className="text-[11px] text-on-surface-variant/70 hover:text-primary transition-colors font-hanken"
              >
                Forgotten?
              </Link>
            }
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-primary-container text-on-primary py-3.5 font-hanken font-semibold tracking-wide hover:bg-[#8f1b1c] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2"
          >
            Enter The Great Hall
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </form>

        <div className="mt-6 space-y-5">
          <AuthDivider />
          <SocialLoginButtons />
        </div>

        <p className="mt-8 text-center text-sm text-on-surface-variant font-hanken">
          New to the circle?{" "}
          <Link
            href="/register"
            className="text-on-surface underline underline-offset-4 hover:text-primary transition-colors"
          >
            Request Membership
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
