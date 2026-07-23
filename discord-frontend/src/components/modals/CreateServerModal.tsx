"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, uploadMessageFile } from "@/services";
import type { ServerItem } from "@/models";

type Step = "start" | "audience" | "customize" | "join";

type TemplateId = "custom" | "gaming" | "friends" | "study" | "school";

type CreateServerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (server: ServerItem) => void;
};

const TEMPLATES: {
  id: TemplateId;
  label: string;
  icon: string;
}[] = [
  { id: "gaming", label: "Oyun", icon: "sports_esports" },
  { id: "friends", label: "Arkadaşlar", icon: "favorite" },
  { id: "study", label: "Çalışma Grubu", icon: "school" },
  { id: "school", label: "Okul Kulübü", icon: "desktop_windows" },
];

export default function CreateServerModal({
  isOpen,
  onClose,
  onCreated,
}: CreateServerModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("start");
  const [template, setTemplate] = useState<TemplateId>("custom");
  const [serverName, setServerName] = useState("");
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const username = localStorage.getItem("username") || "Sen";
    setStep("start");
    setTemplate("custom");
    setServerName(`${username} kullanıcısının sunucusu`);
    setIconPreview(null);
    setIconFile(null);
    setInviteCode("");
    setError("");
    setLoading(false);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (iconPreview?.startsWith("blob:")) URL.revokeObjectURL(iconPreview);
    };
  }, [iconPreview]);

  if (!isOpen) return null;

  const resetAndClose = () => {
    onClose();
  };

  const pickTemplate = (id: TemplateId) => {
    setTemplate(id);
    setError("");
    setStep("audience");
  };

  const handleIconPick = (file: File | null) => {
    if (iconPreview?.startsWith("blob:")) URL.revokeObjectURL(iconPreview);
    if (!file) {
      setIconFile(null);
      setIconPreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Lütfen bir görsel dosyası seç.");
      return;
    }
    setIconFile(file);
    setIconPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const name = serverName.trim();
    if (!name) {
      setError("Sunucu adı zorunludur.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Oturum bulunamadı. Tekrar giriş yap.");
      return;
    }

    setLoading(true);
    try {
      let iconUrl: string | null = null;
      if (iconFile) {
        const uploaded = await uploadMessageFile(iconFile);
        iconUrl = uploaded.url || null;
      }

      const response = await fetch(`${API_BASE_URL}/api/servers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          iconUrl,
          template,
        }),
      });

      if (!response.ok) {
        let message = "Sunucu oluşturulamadı.";
        try {
          const errData = await response.json();
          message =
            errData.title || errData.message || errData.detail || message;
        } catch {
          // ignore
        }
        setError(message);
        return;
      }

      const data = await response.json();
      const server: ServerItem = {
        id: String(data.id ?? data.Id),
        name: String(data.name ?? data.Name ?? name),
        iconUrl: (data.iconUrl ?? data.IconUrl ?? iconUrl) as string | null,
      };

      try {
        localStorage.setItem(`micodex_setup_${server.id}`, "pending");
      } catch {
        // ignore
      }

      onCreated(server);
      onClose();
    } catch {
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = (e: FormEvent) => {
    e.preventDefault();
    const code = inviteCode.trim().replace(/^.*\//, "");
    if (!code) {
      setError("Davet kodu veya linki gir.");
      return;
    }
    onClose();
    router.push(`/invite/${encodeURIComponent(code)}`);
  };

  const optionButtonClass =
    "flex w-full items-center gap-3 rounded-xl bg-[#1c1c16] border border-[#594140]/30 px-4 py-3.5 text-left transition-colors hover:bg-[#2a2420] hover:border-[#ad2831]/35";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={resetAndClose}
      />

      <div className="relative w-full max-w-[440px] rounded-2xl bg-[#250902] border border-[#594140]/40 shadow-2xl p-7 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={resetAndClose}
          className="absolute right-4 top-4 text-[#e1bfbd]/70 hover:text-[#e6e2d9] transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {step === "start" && (
          <div className="space-y-5">
            <div className="pr-8 space-y-2 text-center">
              <h2 className="font-libre text-2xl text-[#e6e2d9]">
                Sunucunu Oluştur
              </h2>
              <p className="text-sm text-[#e1bfbd]/80 font-hanken leading-relaxed">
                Sunucun, arkadaşlarınla takıldığınız yerdir. Kendi sunucunu
                oluştur ve konuşmaya başla.
              </p>
            </div>

            <button
              type="button"
              onClick={() => pickTemplate("custom")}
              className={`${optionButtonClass} justify-between`}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2d6a4f]/30 text-[#95d5b2]">
                  <span className="material-symbols-outlined">add</span>
                </span>
                <span className="font-hanken font-medium text-[#e6e2d9]">
                  Kendim Oluşturayım
                </span>
              </span>
              <span className="material-symbols-outlined text-[#e1bfbd]/60">
                chevron_right
              </span>
            </button>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-[#e1bfbd]/55 font-hanken">
                Bir şablon kullanarak başla
              </p>
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTemplate(t.id)}
                  className={`${optionButtonClass} justify-between`}
                >
                  <span className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#e1bfbd]">
                      {t.icon}
                    </span>
                    <span className="font-hanken text-[#e6e2d9]">{t.label}</span>
                  </span>
                  <span className="material-symbols-outlined text-[#e1bfbd]/60">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2 space-y-3 border-t border-[#594140]/30">
              <p className="text-center text-sm font-hanken text-[#e1bfbd]/80">
                Zaten davetin var mı?
              </p>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep("join");
                }}
                className="w-full rounded-xl bg-[#594140]/40 text-[#e6e2d9] py-3 font-hanken font-medium hover:bg-[#594140]/55 transition-colors"
              >
                Bir Sunucuya Katıl
              </button>
            </div>
          </div>
        )}

        {step === "audience" && (
          <div className="space-y-5">
            <div className="pr-8 space-y-2 text-center">
              <h2 className="font-libre text-2xl text-[#e6e2d9]">
                Bize Sunucundan Biraz Bahset
              </h2>
              <p className="text-sm text-[#e1bfbd]/80 font-hanken leading-relaxed">
                Kurulumuna yardımcı olmak istiyoruz. Sunucun birkaç arkadaş için
                mi yoksa daha büyük bir topluluk için mi?
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStep("customize")}
              className={`${optionButtonClass} justify-between`}
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#c77dff]">
                  videogame_asset
                </span>
                <span className="font-hanken text-[#e6e2d9]">
                  Benim ve arkadaşlarım için
                </span>
              </span>
              <span className="material-symbols-outlined text-[#e1bfbd]/60">
                chevron_right
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStep("customize")}
              className={`${optionButtonClass} justify-between`}
            >
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#52b788]">
                  public
                </span>
                <span className="font-hanken text-[#e6e2d9]">
                  Bir kulüp veya topluluk için
                </span>
              </span>
              <span className="material-symbols-outlined text-[#e1bfbd]/60">
                chevron_right
              </span>
            </button>

            <p className="text-center text-sm font-hanken text-[#e1bfbd]/70">
              Emin değil misin? Şimdilik{" "}
              <button
                type="button"
                onClick={() => setStep("customize")}
                className="text-[#7eb8ff] hover:underline"
              >
                bu soruyu geçebilirsin
              </button>
              .
            </p>

            <button
              type="button"
              onClick={() => setStep("start")}
              className="font-hanken text-sm text-[#e1bfbd] hover:text-[#e6e2d9]"
            >
              Geri
            </button>
          </div>
        )}

        {step === "customize" && (
          <form className="space-y-5" onSubmit={handleCreate}>
            <div className="pr-8 space-y-2 text-center">
              <h2 className="font-libre text-2xl text-[#e6e2d9]">
                Sunucunu Özelleştir
              </h2>
              <p className="text-sm text-[#e1bfbd]/80 font-hanken leading-relaxed">
                Yeni sunucuna bir isim ve simge ekleyerek ona kişilik kat.
                Bunları istediğin zaman değiştirebilirsin.
              </p>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full border-2 border-dashed border-[#594140]/60 bg-[#1c1c16] text-[#e1bfbd]/70 hover:border-[#ad2831]/50 transition-colors overflow-hidden"
              >
                {iconPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={iconPreview}
                    alt="Sunucu simgesi"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl">
                      photo_camera
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-hanken mt-0.5">
                      Yükle
                    </span>
                  </>
                )}
                <span className="absolute -right-0.5 -top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#5865f2] text-white shadow">
                  <span className="material-symbols-outlined text-sm">add</span>
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleIconPick(e.target.files?.[0] ?? null)
                }
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="serverName"
                className="block text-xs uppercase tracking-widest text-[#e1bfbd] font-hanken"
              >
                Sunucu Adı <span className="text-[#ffb3b0]">*</span>
              </label>
              <input
                id="serverName"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                disabled={loading}
                className="w-full rounded-xl bg-[#1c1c16] text-[#e6e2d9] border border-[#5865f2]/50 px-4 py-3 outline-none focus:ring-1 focus:ring-[#5865f2]/60 transition-all font-hanken disabled:opacity-60"
              />
            </div>

            <p className="text-xs font-hanken text-[#e1bfbd]/55 leading-relaxed">
              Bir sunucu oluşturarak Micodex topluluk kurallarını kabul etmiş
              olursun.
            </p>

            {error && (
              <p className="text-sm text-[#ffb3b0] bg-[#ad2831]/15 border border-[#ad2831]/30 rounded-lg px-4 py-3 font-hanken">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep("audience")}
                disabled={loading}
                className="font-hanken text-sm text-[#e1bfbd] hover:text-[#e6e2d9] disabled:opacity-60"
              >
                Geri
              </button>
              <button
                type="submit"
                disabled={loading || !serverName.trim()}
                className="rounded-xl bg-[#5865f2] text-white px-6 py-2.5 font-hanken font-semibold hover:bg-[#4752c4] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Oluşturuluyor..." : "Oluştur"}
              </button>
            </div>
          </form>
        )}

        {step === "join" && (
          <form className="space-y-5" onSubmit={handleJoin}>
            <div className="pr-8 space-y-2 text-center">
              <h2 className="font-libre text-2xl text-[#e6e2d9]">
                Bir Sunucuya Katıl
              </h2>
              <p className="text-sm text-[#e1bfbd]/80 font-hanken leading-relaxed">
                Davet linkini veya kodunu aşağıya yapıştır.
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="inviteCode"
                className="block text-xs uppercase tracking-widest text-[#e1bfbd] font-hanken"
              >
                Davet linki
              </label>
              <input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="https://.../invite/abc123 veya abc123"
                className="w-full rounded-xl bg-[#1c1c16] text-[#e6e2d9] placeholder:text-[#e1bfbd]/40 border border-[#594140]/30 px-4 py-3 outline-none focus:ring-1 focus:ring-[#ad2831]/50 font-hanken"
              />
            </div>

            {error && (
              <p className="text-sm text-[#ffb3b0] bg-[#ad2831]/15 border border-[#ad2831]/30 rounded-lg px-4 py-3 font-hanken">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep("start");
                }}
                className="font-hanken text-sm text-[#e1bfbd] hover:text-[#e6e2d9]"
              >
                Geri
              </button>
              <button
                type="submit"
                disabled={!inviteCode.trim()}
                className="rounded-xl bg-[#ad2831] text-[#e6e2d9] px-6 py-2.5 font-hanken font-semibold hover:bg-[#8f1b1c] disabled:opacity-60"
              >
                Katıl
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
