# VBT 2026 Staj Programı — StackShare Replica

Discord'un gerçek zamanlı mesajlaşma mimarisini MVP ölçeğinde klonlayan bir StackShare Replica projesi.

Bu repository, [StackShare](https://stackshare.io) üzerinden seçilen Discord yığınını inceleyip çekirdek iletişim akışını (kanallar, mesajlar, anlık yayın) çalışan bir ürüne dönüştürmeyi hedefler. Amaç, üretim ölçeğindeki mimari kararları anlamak ve bunları staj sürecinde uygulanabilir trade-off'larla yeniden üretmektir.

## Amaç

Discord'un gerçek zamanlı mesajlaşma mimarisini **MVP ölçeğinde** klonlamak:

- Sunucu / kanal / mesaj modeli
- WebSocket tabanlı anlık mesajlaşma
- Web ve mobil istemciler üzerinden tutarlı deneyim
- Mimari kararların belgelenmesi (`ARCHITECTURE.md`)

## Teknoloji Yığını

| Katman | Teknoloji |
| --- | --- |
| **Backend** | .NET Core + SignalR |
| **Web** | Next.js |
| **Mobil** | React Native (+ Native Modules: Swift / Kotlin) |
| **Veritabanı** | Supabase (PostgreSQL) + EF Core |

## Proje Yapısı

```text
staj-2026-intern-assignments/
├── README.md                 # Bu dosya — proje girişi
├── ARCHITECTURE.md           # Mimari kararlar ve trade-off'lar
├── discord-backend/          # .NET Core + SignalR API & Hub
├── discord-frontend/         # Next.js web istemcisi
├── discord-mobile/           # React Native mobil istemci
└── docs/
    └── original-guidelines/  # Orijinal staj ödev yönergeleri
        ├── HOW-TO.md
        ├── resources.md
        └── source/
```

| Klasör | Rol |
| --- | --- |
| `discord-backend` | Kimlik, sunucu/kanal CRUD, SignalR hub, EF Core ile Supabase |
| `discord-frontend` | Next.js web UI — kanallar, sohbet, gerçek zamanlı güncellemeler |
| `discord-mobile` | React Native uygulama; Native Development Way ile Swift/Kotlin modüller |

## Dokümantasyon

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Discord vs. bizim yığın karşılaştırması ve AI vizyonu
- [Orijinal ödev yönergeleri](./docs/original-guidelines/) — HOW-TO, kaynaklar ve proje brief'leri
