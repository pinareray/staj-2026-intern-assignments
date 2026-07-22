"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "Beklenmeyen bir hata oluştu.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-on-surface">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/10">
            <span className="material-symbols-outlined text-2xl text-primary-container">
              error
            </span>
          </div>
          <h1 className="font-libre text-2xl text-stone-900">Bir hata oluştu</h1>
          <p className="mt-2 font-hanken text-sm text-stone-500">
            Sayfa beklenmedik şekilde durdu. Yenilemeyi dene; sorun sürerse
            tekrar giriş yap.
          </p>
          {this.state.message && (
            <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2 font-hanken text-xs text-stone-400 break-words">
              {this.state.message}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex-1 rounded-xl border border-stone-200 py-3 font-hanken text-sm text-stone-600 hover:bg-stone-50"
            >
              Tekrar dene
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="flex-1 rounded-xl bg-primary-container py-3 font-hanken text-sm font-semibold text-white hover:opacity-90"
            >
              Sayfayı yenile
            </button>
          </div>
        </div>
      </div>
    );
  }
}
