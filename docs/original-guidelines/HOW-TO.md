# HOW-TO: Hangi Projeyi Seçmelisin?

Bu rehberin amacı sana "nasıl yapılır" anlatmak değil — **neye göre seçeceğine** karar vermene yardım etmek. Aşağıdaki tabloya bak, kendi seviyene/ekibine/ilgi alanına göre projeni seç, sonra ilgili proje dosyasına geç.

---

## 1. Projeler Bir Bakışta (Seçim Tablosu)

| Proje | Teknik Seviye | Min. Ekip | Ne Kazandırır? (Kazanç) |
|---|---|---|---|
| 🛒 **[E-Ticaret](./source/ecommerce_project.md)** *(Ana)* | ⭐⭐⭐⭐ Orta–İleri | **3–4 kişi** | Uçtan uca gerçek ürün deneyimi; tasarımdan teste tüm döngü; çok rollü takım koordinasyonu; iş hayatına en yakın simülasyon. |
| 🧩 **[StackShare Replica](./source/replica_project.md)** *(Ana)* | ⭐⭐⭐⭐⭐ İleri | **3–4 kişi** | Sistem mimarisi düşüncesi; büyük şirketlerin teknoloji kararlarını okuma; trade-off muhakemesi; MVP'ye indirgeme becerisi. |
| 📋 **[Login Sistemi](./source/login_project.md)** *(Upgrade)* | ⭐⭐ Başlangıç | **1–2 kişi** | Modern kimlik doğrulama & güvenlik temelleri (refresh token, hashing, rate-limit); ekip ritmini oturtmak için ideal ısınma. |
| 🐾 **[Pet Store](./source/pet_store_project.md)** *(Upgrade)* | ⭐⭐⭐ Orta | **1–2 kişi** | CRUD + gerçek AI entegrasyonu (RAG, JSON çıktı); çok teknolojili (backend/web/mobil/AI) çalışmaya giriş. |

> Ekip küçükse bir kişi birden fazla rol üstlenebilir. Min. ekip sayısı, projenin akışının tıkanmadan ilerleyebileceği alt sınırdır.

---

## 2. Neye Göre Seçmeliyim? (Karar Rehberi)

Kendine şu soruları sor:

**a) Deneyim seviyen ne?**
- İlk ciddi projen / temelleri sağlamlaştırmak istiyorsun → **Login**.
- Rahatım, biraz zorlanmak istiyorum → **Pet Store** veya **E-Ticaret**.
- Mimari/sistem tasarımına kafa yormaya hazırım → **StackShare Replica**.

**b) Kaç kişisiniz?**
- 1–2 kişi → **Login** veya **Pet Store**.
- 3–4+ kişi ve farklı roller (biri backend sever, biri tasarım, biri mobil...) → **E-Ticaret** veya **StackShare Replica**.

**c) Ne öğrenmek istiyorsun?**
- Bir ürünü baştan sona çıkarmayı ve takım halinde çalışmayı → **E-Ticaret**.
- "Uber/Spotify nasıl çalışıyor?" tarzı sistem tasarımını → **StackShare Replica**.
- Güvenli auth ve modern web/mobil temellerini → **Login**.
- Yapay zekayı gerçek bir ürüne entegre etmeyi → **Pet Store**.

**Özet karar:** Yeni ekipseniz Login ile ısının → sonra E-Ticaret'e geçin. Deneyimli ve mimariye meraklıysanız doğrudan StackShare Replica.

> Hangi projeyi seçersen seç, **son aşama herkes için ortak:** kendi [skill / command / agent'larını](./source/team_skills_agents.md) üretmek. Bu 2026'nın en değerli becerisi.

---

## 3. Rolünü Seç

Ana projeler bir **ekip** işidir. Roller: **PM · Design · Backend · Frontend (Web) · Mobil · QA** (Pet Store'da ayrıca **AI**). Küçük ekipte bir kişi birden fazla rol alır.

İpucu: Rahat olduğun değil, **gelişmek istediğin** alanı seç. Her rolün detaylı görev tanımı ilgili proje dosyasında.

---

## 4. Başlamadan Önce: İhtiyaç Listesi

**Herkes:** GitHub hesabı + Git, bir IDE (VS Code önerilir) + AI asistanı erişimi, takım board'u (GitHub Projects/Trello), **kendi YouTube kanalı** (demo videosu için).

**Role göre:**
- **Design:** [Google Stitch](https://stitch.withgoogle.com) + Figma.
- **Backend:** .NET / Node.js / Python SDK + Docker.
- **Frontend / Mobil:** Node.js + paket yöneticisi / Flutter SDK + emülatör.
- **QA:** Playwright/Cypress veya Maestro; Postman/Bruno.
- **AI (Pet Store):** Claude veya Gemini API anahtarı, Python.

Teknoloji linkleri, videolar ve dokümanlar → [`resources.md`](./resources.md).

---

## 5. Projeyi Nasıl Teslim Ederim?

Her proje şu iki adımla tamamlanmış sayılır:

### 📹 a) Demo Videosu
- Projenin çalışan halini anlatan bir **demo videosu** çekilir.
- Video **kendi YouTube kanalınızda** yayınlanır (public veya "liste dışı").
- Videoda: ne yaptığınız, hangi teknolojileri neden seçtiğiniz ve ana akışın canlı çalışması yer alsın.
- Video linkini proje `README`'nize ve PR/issue açıklamanıza ekleyin.

### 🔀 b) Kod Teslimi (PR veya Issue)
1. Bu repoyu **clone** (veya fork) edin.
2. Projenizi tamamlayın; her takımın `README`'si olsun (kurulum + teknoloji gerekçesi + ekran görüntüsü + demo video linki).
3. Teslim için **iki seçenekten biri**:
   - **Pull Request açın** — yaptığınız işi PR açıklamasında anlatın. *(Farklar PR'da net görünür — önerilen yöntem.)*
   - **Issue açın** — kodunuzu, linklerinizi ve demo videosunu bir issue'da paylaşıp projeyi anlatın.

---

## 6. Nasıl Değerlendirileceksiniz?

- **Çalışıyor mu?** Ana akış uçtan uca gerçekten çalışıyor mu (mock değil)?
- **Kalite:** Kod düzeni, testler, tutarlı tasarım, dokümantasyon.
- **Muhakeme:** Teknoloji seçimlerinizi gerekçelendirdiniz mi? ("neden bu?" cevabınız var mı?)
- **Takım çalışması:** PR akışı, board kullanımı, entegrasyon.
- **2026 becerisi:** Kendi skill/command/agent'ınızı üretip kullandınız mı?
- **Anlatım:** Demo videosu net mi, `README`'ler anlaşılır mı?

**Başarılar! Sorunuz olursa GitHub Issues üzerinden sorun.**
