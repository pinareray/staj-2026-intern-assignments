import React from "react";

type AuthShellProps = {
  children: React.ReactNode;
};

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[#f7f4ef] px-6 py-12">
      {children}

      <footer className="absolute bottom-8 left-8 hidden sm:flex items-center gap-3 text-stone-500">
        <div className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center bg-white">
          <span className="material-symbols-outlined text-primary-container text-xl">
            menu_book
          </span>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-hanken opacity-70">
            Güncel Sürüm
          </p>
          <p className="font-libre text-sm text-stone-800">micodex v0.1</p>
        </div>
      </footer>
    </main>
  );
}
