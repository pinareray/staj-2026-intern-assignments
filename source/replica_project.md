# 2. Proje: StackShare ile Gerçek Bir Sistemi Replicate Etme

> **Min. Ekip:** 3–4 kişi
> **Takım Yapısı:** E-Ticaret projesindeki roller (PM · Design · Backend · Frontend · Mobil · QA)
> **Teknik Seviye:** ⭐⭐⭐⭐⭐ İleri (Mimari düşünme ağırlıklı)

Bu projede sıfırdan bir ürün fikri bulmak yerine, **halihazırda var olan, gerçek dünyada kanıtlanmış bir sistemi** seçip onun küçük ama çalışan bir kopyasını (clone/MVP) üreteceksiniz. Amaç ürünü birebir taklit etmek değil; **büyük sistemlerin mimari kararlarını okumayı, anlamayı ve uygulanabilir bir parçaya indirgemeyi** öğrenmek.

---

## Neden StackShare?

[StackShare](https://stackshare.io) gerçek şirketlerin hangi teknolojileri kullandığını paylaştığı bir katalogdur. Örneğin:

- **Uber:** <https://stackshare.io/uber-technologies/uber>
- Airbnb, Netflix, Spotify, Shopify, Notion, Discord, Instacart...

Bir şirketin sayfasında; kullandıkları dil, framework, veritabanı, mesajlaşma kuyruğu, cache, CI/CD ve monitoring araçlarını görürsünüz. **Bu, bir sistemin "malzeme listesidir".** Sizin işiniz bu listeye bakıp "bu ürün neden bu teknolojiyi seçmiş?" sorusunu cevaplamak ve minimum bir versiyonunu kurmak.

---

## Adım Adım Süreç

1. **Sistem seçin.** Uber, Spotify, Airbnb gibi. Takımın ilgisini çeken, akışı net bir ürün olsun.
2. **StackShare stack'ini inceleyin.** Kullanılan teknolojileri kategorilere ayırın (backend / frontend / data / infra).
3. **Kapsamı daraltın (MVP).** Tüm ürünü değil, **tek bir çekirdek akışı** seçin. Örnekler:
   - **Uber → "Yolculuk isteği":** kullanıcı konum seçer → yakındaki sürücüleri görür → ride talep eder → sürücü kabul eder → durum canlı güncellenir.
   - **Spotify → "Çalma listesi & oynatıcı":** şarkı listesi → arama → playlist oluştur → oynatıcı (play/pause/next).
   - **Airbnb → "İlan & rezervasyon":** ilan listesi → detay → tarih seç → rezerve et.
4. **Mimari kararları belgeleyin.** Neden bu DB? Neden real-time için WebSocket? Neden bu cache? (`ARCHITECTURE.md`).
5. **Kendi stack'inizle inşa edin.** StackShare'deki teknolojileri birebir kullanmak zorunda değilsiniz — ekibinizin bildiği araçlarla **aynı problemi çözün**. Önemli olan mimari eşdeğerlik.
6. **QA + test + demo** ile kapatın.

---

## 💡 İpucu: "Malzeme Listesinden Mimariye"

Büyük sistemlerin ortak yapı taşlarını arayın ve **hangisini neden seçtiğinizi** yazın:

| İhtiyaç | Büyük sistemde | Sizin MVP karşılığınız (öneri) |
|---|---|---|
| Ana veri | Postgres/MySQL, Cassandra | PostgreSQL / SQLite |
| Real-time (konum, mesaj) | Kafka, WebSocket | WebSocket / Server-Sent Events |
| Cache | Redis | Redis / in-memory |
| Arama | Elasticsearch | DB full-text search |
| Konum (harita) | Google Maps, geohash | Leaflet + OpenStreetMap |
| Async iş | Kafka, RabbitMQ | Basit queue / cron |

**Kritik kural:** Her teknoloji seçiminin yanına "**neden**" yazın. Bir mimarı diğerinden ayıran şey teknoloji bilgisi değil, **trade-off (ödünleşim) muhakemesidir.** "Redis kullandım çünkü sürücü konumları saniyede güncelleniyor ve kalıcılık gerekmiyor" gibi.

---

## AI Destekli Araştırma İpucu

- Seçtiğiniz sistemin akışını anlamak için **Claude**'a "Uber'in ride-matching akışını yüksek seviyede bir sistem diyagramı olarak açıkla, hangi bileşenler var?" diye sorun.
- **Google Stitch** ile o ürünün ana ekranını hızlıca tasarlayıp kendi versiyonunuza uyarlayın.
- Sistem diagramı için Figma/FigJam `generate_diagram` kullanabilirsiniz.

---

## Beklenen Çıktı

- [ ] Seçilen sistemin StackShare stack analizi (`ARCHITECTURE.md`).
- [ ] Tek bir çekirdek akışı uçtan uca çalışan MVP (backend + en az bir client).
- [ ] Her teknoloji seçimi için gerekçe (trade-off notları).
- [ ] Sistem mimari diyagramı (bileşenler + veri akışı).
- [ ] QA: kritik akış için en az bir E2E test.
- [ ] **Demo videosu** kendi YouTube kanalınızda; link `README`'de.
- [ ] Teslim: repo clone/fork → **PR veya issue** ile proje anlatıldı.
- [ ] Kendi skill/command/agent'ınız — bkz. [`team_skills_agents.md`](./team_skills_agents.md).
