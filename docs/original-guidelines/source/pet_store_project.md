# 3b. Upgrade Projesi: Pet Store (2026 Sürümü)

> **Min. Ekip:** 1–2 kişi
> **Takımlar:** Backend · Frontend (Web) · Mobil · AI · QA
> **Teknik Seviye:** ⭐⭐⭐ Orta (Çok teknolojili, AI dahil)

Geçen seneki "Pet Store" projesinin **2026 standartlarına yükseltilmiş** hali. CRUD'un ötesine geçip **AI özelliklerini, test otomasyonunu ve modern mimariyi** merkeze alıyoruz. Referans hâlâ [Swagger Petstore](https://petstore.swagger.io/), ama artık kendi tasarımınız ve kendi AI servisinizle.

---

## Geçen Seneye Göre Ne Değişti? (2026 Yenilikleri)

- Tasarım **Google Stitch + Claude** ile üretilen kendi design system'iniz.
- AI servisi 2026 modelleriyle (**Claude / Gemini**) ve daha akıllı: sadece metin üretimi değil, **RAG tabanlı öneri** ve **görsele göre tür tahmini** (bonus).
- **QA rolü** eklendi: API + E2E testleri.
- Backend'de OpenAPI-first, tutarlı hata formatı, Docker.
- Frontend/mobil tipleri OpenAPI'den otomatik.

---

## 1. Backend: Pet Store API

**Kaynaklar:** `pet`, `category`, `store/order`, `user` için CRUD + arama/filtre + sayfalama.

**Teknoloji:** Node.js (NestJS/Express + Prisma) · .NET (EF Core) · FastAPI.

**2026 Standartları:**
- OpenAPI 3.1 dokümanı gün 1'de; tutarlı hata formatı (Problem Details).
- Sayfalama/filtre/arama standardı; seed verisi.
- Dosya yükleme (pet fotoğrafı) desteği.
- Docker + `.env`.

**Beklenen Çıktı:** Swagger'lı, seed'li, Docker ile ayağa kalkan, AI servisinin de tüketebileceği API.

---

## 2. Frontend: Pet Store Web

**Tasarım:** Google Stitch + Claude ile design system. Ekranlar: liste (grid + filtre), detay, favoriler, sepet/sipariş, admin (pet ekle/düzenle).

**Teknoloji:** React (Vite/Next + TS + TanStack Query) veya Angular (Signals).

**2026 Standartları:** OpenAPI'den tip üretimi, skeleton/empty/error state, erişilebilirlik, optimistic favori ekleme.

**Beklenen Çıktı:** API entegre, tasarıma sadık, AI özelliklerini (açıklama/öneri) gösteren web uygulaması.

---

## 3. Mobil: Pet Store Uygulaması

**Teknoloji:** Flutter (Riverpod/BLoC + Dio) veya React Native.

**2026 Standartları:** Clean Architecture, tipli ağ katmanı, offline/hata durumları. Tekrar eden işleri kendi skill'inize dönüştürün ([`team_skills_agents.md`](./team_skills_agents.md)).

**Beklenen Çıktı:** Liste, detay, favori, arama; AI önerilerini gösteren, API entegre mobil uygulama.

---

## 4. AI: Akıllı Evcil Hayvan Asistanı (2026)

**Endpoint'ler:**
- `POST /generate-description` — türe/yaşa/cinse göre sıcak tanıtım metni.
- `POST /recommend-pet` — yaşam tarzına göre öneri (örn. "apartmanda yaşıyorum, sakin bir kedi").
- **Bonus:** `POST /classify-image` — fotoğraftan tür/cins tahmini (vision model).

**Teknoloji:** Python + FastAPI; **Claude** veya **Gemini** API.

**2026 Standartları:**
- **RAG:** Öneriyi backend'deki gerçek pet verisine dayandırın (rastgele uydurmasın) — pet listesini bağlam olarak modele verin veya basit bir vektör arama ekleyin.
- Prompt'ları versiyonlayın; çıktıyı **yapılandırılmış (JSON) formatta** isteyin ve doğrulayın.
- API anahtarlarını `.env`'de tutun; hız/hata yönetimi (retry).

**Beklenen Çıktı:** Frontend/mobilin çağırabileceği, gerçek veriye dayalı, test edilebilir AI servisi.

---

## 5. QA: Test Seti

- Backend API testleri + Postman/Newman.
- Web E2E (Playwright/Cypress): pet ara → detay → favori/sipariş.
- Mobil: Maestro flow.
- AI: çıktı doğrulama testleri (JSON şeması, boş/uç girdiler).

**Beklenen Çıktı:** Test planı + kritik akış otomasyonu, CI yeşil.

---

## Definition of Done

- [ ] API Swagger'lı, seed'li, Docker ile çalışıyor.
- [ ] Web + mobil gerçek API'yi tüketiyor.
- [ ] AI servisi gerçek pet verisine dayalı, JSON çıktı veriyor.
- [ ] QA: en az bir kritik akış otomatik test edilmiş.
- [ ] Her takımın `README`'si (kurulum + gerekçe + ekran görüntüsü).
- [ ] **Demo videosu** kendi YouTube kanalınızda; link `README`'de.
- [ ] Teslim: repo clone/fork → **PR veya issue** ile proje anlatıldı.
- [ ] Kendi skill/command/agent'ınız — bkz. [`team_skills_agents.md`](./team_skills_agents.md).
