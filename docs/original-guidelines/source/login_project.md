# 3a. Upgrade Projesi: Login Sistemi (2026 Sürümü)

> **Min. Ekip:** 1–2 kişi
> **Takımlar:** Backend · Frontend (Web) · Mobil · QA
> **Teknik Seviye:** ⭐⭐ Başlangıç (İyi bir ısınma projesi)

Bu proje geçen seneki "Login Sistemi" projesinin **2026 standartlarına yükseltilmiş** halidir. Temel akış aynı (register / login / korumalı sayfa), ama bu sene odak **modern kimlik doğrulama pratikleri, güvenlik ve otomasyon** üzerine. Yeni başlayanlar için ısınma; ekiplerin çalışma modelini oturttuğu ilk proje olarak da kullanılabilir.

---

## Geçen Seneye Göre Ne Değişti? (2026 Yenilikleri)

- **Access + Refresh token** akışı (sadece tek JWT değil).
- Şifre hashleme için **argon2/bcrypt**, kaba kuvvete karşı **rate limiting**.
- Tasarım artık **Google Stitch + Claude** ile üretiliyor (hazır Figma kit yerine kendi design system'iniz).
- API tipleri **OpenAPI'den otomatik** üretiliyor (frontend/mobil elle tip yazmıyor).
- **QA rolü eklendi:** auth akışı için otomatik testler.
- Bonus: E-posta doğrulama / "şifremi unuttum" / OAuth (Google ile giriş) opsiyonel ileri hedefler.

---

## 1. Backend: Authentication API

**Endpoint'ler:**
- `POST /auth/register` — yeni kullanıcı
- `POST /auth/login` — access + refresh token döner
- `POST /auth/refresh` — refresh ile yeni access token
- `POST /auth/logout` — refresh token'ı geçersiz kıl
- `GET /auth/me` — korumalı; mevcut kullanıcıyı döner

**Teknoloji (birini seçin):** ASP.NET Core · NestJS/Express (TS) · FastAPI.

**2026 Standartları:**
- Access token kısa ömürlü (örn. 15 dk), refresh uzun ömürlü ve saklanabilir/iptal edilebilir.
- Şifreler **argon2id** veya **bcrypt** ile; asla düz metin.
- Login endpoint'inde **rate limiting** ve giriş denemesi loglama.
- Doğrulama (validation) + tutarlı hata formatı (Problem Details).
- Swagger/OpenAPI dokümanı; `.env` ile secret yönetimi; Docker.

**Beklenen Çıktı:** Swagger'lı, Docker ile ayağa kalkan, refresh token akışı çalışan API + Postman/Bruno koleksiyonu.

---

## 2. Frontend: Web Login Arayüzü

**Tasarım:** Google Stitch ile üretin, Claude ile design system'e (token + komponent) dönüştürün. Login, Register, korumalı Dashboard, ve "şifremi unuttum" ekranları.

**Teknoloji:** React (Vite/Next + TS) veya Angular (standalone + Signals).

**2026 Standartları:**
- Form doğrulama (react-hook-form + zod / Angular reactive forms).
- Token yönetimi: access token bellekte, refresh güvenli saklama; 401'de otomatik refresh (interceptor).
- API tiplerini OpenAPI'den üretin.
- Erişilebilir formlar (label, hata mesajları, klavye).

**Beklenen Çıktı:** API ile entegre, oturum yöneten (auto-refresh dahil), tasarıma sadık web uygulaması.

---

## 3. Mobil: Login Uygulaması

**Teknoloji:** Flutter (Riverpod/BLoC + Dio + go_router) veya React Native (Expo).

**2026 Standartları:**
- Katmanlı mimari; token'ı **secure storage**'da sakla.
- Dio interceptor ile otomatik token refresh.
- Yükleniyor/hata/başarı durumları net.

**Beklenen Çıktı:** Emülatörde çalışan, API entegre, Login + Register + korumalı ekran içeren uygulama.

---

## 4. QA: Auth Test Seti

- Test senaryoları: geçerli/geçersiz giriş, süresi dolmuş token, refresh akışı, tekrar eden kayıt.
- Backend: API entegrasyon testleri (xUnit/Jest/pytest).
- Web: Playwright/Cypress ile login akışı E2E.
- Mobil: Maestro flow.

**Beklenen Çıktı:** Test planı + en az bir otomatik E2E, CI'da çalışır durumda.

---

## Definition of Done

- [ ] Register → login → refresh → korumalı endpoint akışı çalışıyor.
- [ ] Şifreler hash'li, login rate-limited.
- [ ] Web ve/veya mobil client gerçek API'yi tüketiyor, oturumu yönetiyor.
- [ ] QA: en az bir otomatik test yeşil.
- [ ] Her takımın `README`'si (kurulum + teknoloji gerekçesi + ekran görüntüsü).
- [ ] **Demo videosu** kendi YouTube kanalınızda; link `README`'de.
- [ ] Teslim: repo clone/fork → **PR veya issue** ile proje anlatıldı.
- [ ] Kendi skill/command/agent'ınız — bkz. [`team_skills_agents.md`](./team_skills_agents.md).
