"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/services";

type ReportItem = {
  id: string;
  reporterUsername: string;
  reportedUsername: string;
  reportedUserId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  adminNote: string | null;
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [filter, setFilter] = useState<"Pending" | "Reviewed" | "Dismissed" | "">("Pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const qs = filter ? `?status=${encodeURIComponent(filter)}` : "";
      const response = await fetch(
        `${API_BASE_URL}/api/moderation/reports${qs}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 401) {
        setError("Platform admin yetkisi gerekli. Yeniden giriş yap.");
        setReports([]);
        return;
      }
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        setError(String(data.message ?? "Şikayetler alınamadı."));
        return;
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setReports(
        list.map((r: Record<string, unknown>) => ({
          id: String(r.id ?? r.Id),
          reporterUsername: String(
            r.reporterUsername ?? r.ReporterUsername ?? ""
          ),
          reportedUsername: String(
            r.reportedUsername ?? r.ReportedUsername ?? ""
          ),
          reportedUserId: String(r.reportedUserId ?? r.ReportedUserId ?? ""),
          reason: String(r.reason ?? r.Reason ?? ""),
          details: (r.details ?? r.Details ?? null) as string | null,
          status: String(r.status ?? r.Status ?? ""),
          createdAt: String(r.createdAt ?? r.CreatedAt ?? ""),
          adminNote: (r.adminNote ?? r.AdminNote ?? null) as string | null,
        }))
      );
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (reportId: string, status: "Reviewed" | "Dismissed") => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setActionId(reportId);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/moderation/reports/${reportId}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status, adminNote: note.trim() || null }),
        }
      );
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        setError(String(data.message ?? "Güncellenemedi."));
        return;
      }
      setNote("");
      await load();
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div>
            <p className="font-hanken text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Platform
            </p>
            <h1 className="font-libre text-2xl text-stone-900">
              Şikayet paneli
            </h1>
          </div>
          <Link
            href="/app"
            className="rounded-xl border border-stone-200 px-3 py-2 font-hanken text-sm text-stone-600 hover:bg-stone-50"
          >
            Sohbete dön
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "Pending" as const, label: "Bekleyen" },
              { id: "Reviewed" as const, label: "İncelenen" },
              { id: "Dismissed" as const, label: "Reddedilen" },
              { id: "" as const, label: "Tümü" },
            ] as const
          ).map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 font-hanken text-xs font-semibold transition ${
                filter === f.id
                  ? "bg-primary-container text-white"
                  : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-hanken text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="block space-y-1">
          <span className="font-hanken text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Admin notu (inceleme için)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opsiyonel not..."
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-hanken text-sm outline-none focus:border-primary-container/40"
          />
        </label>

        {loading ? (
          <p className="py-10 text-center font-hanken text-sm text-stone-400">
            Yükleniyor...
          </p>
        ) : reports.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-10 text-center font-hanken text-sm text-stone-400">
            Bu filtrede şikayet yok.
          </p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-hanken text-sm font-semibold text-stone-900">
                      @{r.reportedUsername}
                      <span className="font-normal text-stone-400">
                        {" "}
                        ← @{r.reporterUsername}
                      </span>
                    </p>
                    <p className="mt-1 font-hanken text-xs text-stone-500">
                      {r.reason} ·{" "}
                      {new Date(r.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 font-hanken text-[10px] font-bold uppercase tracking-wide text-stone-600">
                    {r.status}
                  </span>
                </div>
                {r.details && (
                  <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 font-hanken text-sm text-stone-700">
                    {r.details}
                  </p>
                )}
                {r.adminNote && (
                  <p className="mt-2 font-hanken text-xs text-stone-500">
                    Not: {r.adminNote}
                  </p>
                )}
                {r.status === "Pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actionId === r.id}
                      onClick={() => void review(r.id, "Reviewed")}
                      className="rounded-xl bg-primary-container px-3 py-1.5 font-hanken text-xs font-semibold text-white disabled:opacity-60"
                    >
                      İncelendi
                    </button>
                    <button
                      type="button"
                      disabled={actionId === r.id}
                      onClick={() => void review(r.id, "Dismissed")}
                      className="rounded-xl border border-stone-200 px-3 py-1.5 font-hanken text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-60"
                    >
                      Reddet
                    </button>
                    <Link
                      href={`/profile/${encodeURIComponent(r.reportedUsername)}`}
                      className="rounded-xl border border-stone-200 px-3 py-1.5 font-hanken text-xs font-semibold text-stone-600 hover:bg-stone-50"
                    >
                      Profil
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
