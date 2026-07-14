import React from "react";

type AuthShellProps = {
  children: React.ReactNode;
};

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-mahogany-dark px-6 py-12">
      {children}

      <footer className="absolute bottom-8 left-8 hidden sm:flex items-center gap-3 text-on-surface-variant">
        <div className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center bg-surface-container-low/40">
          <span className="material-symbols-outlined text-primary-container text-xl">
            menu_book
          </span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-hanken opacity-60">
            Current Volume
          </p>
          <p className="font-libre text-sm text-on-surface">
            The Socratic Method v2.4
          </p>
        </div>
      </footer>
    </main>
  );
}
