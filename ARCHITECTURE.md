# Mimari Kararlar & Trade-off'lar

Bu doküman, Discord'un üretim yığını ile bizim MVP StackShare Replica yığınımız arasındaki bilinçli farkları özetler.

## Trade-off Tablosu

| Alan | Discord (üretim) | Bizim MVP | Gerekçe |
| --- | --- | --- | --- |
| **Backend** | Erlang / Elixir | **.NET Core + SignalR** | Yüksek eşzamanlılık ihtiyacını karşılamak ve SignalR'ın gerçek zamanlı hub modelinden yararlanmak |
| **Veritabanı** | Cassandra | **Supabase (PostgreSQL) + EF Core** | İlişkisel MVP modeli; hızlı şema, migration ve sorgulama |
| **İstemci (Web)** | Özel web istemcisi | **Next.js** | Modern React ekosistemi, SSR/App Router ve hızlı prototipleme |
| **İstemci (Mobil)** | Native / hibrit | **React Native** + Swift/Kotlin native modüller | Tek kod tabanı + Native Development Way ile platforma özgü güç |
| **AI** | — | CLI Code Generator + **@ÖzetleyiciBot** (RAG) | Geliştirme hızı ve sohbet özetleme deneyimi |

## Kararlar

### Backend: .NET Core + SignalR

Discord, milyonlarca eşzamanlı bağlantı için Erlang/Elixir tercih eder. Biz MVP ölçeğinde **yüksek eşzamanlılık** ve ekip aşinalığı dengesi için **.NET Core** seçtik. SignalR, WebSocket / long-polling soyutlaması ve hub tabanlı yayın modeli ile Discord benzeri kanal mesajlaşmasını doğrudan destekler.

### Veritabanı: Supabase PostgreSQL + EF Core

Discord, yazma-yoğun mesaj depolama için Cassandra kullanır. MVP'de sunucu, kanal, üyelik ve mesaj ilişkileri net olduğu için **ilişkisel** bir model daha uygundur. **Supabase (PostgreSQL)** yönetilen erişim ve Auth/Realtime seçenekleri sunar; **EF Core** ile tip güvenli erişim ve migration yönetimi sağlanır.

### İstemci: Next.js + React Native

- **Web:** Next.js ile kanal listesi, sohbet görünümü ve SignalR istemci entegrasyonu.
- **Mobil:** React Native ile paylaşılan iş mantığı; **Native Development Way** prensibi gereği performans veya platform API'leri gerektiren parçalar **Swift** (iOS) ve **Kotlin** (Android) native modülleri olarak yazılacaktır.

### AI Vizyonu

Repoya entegre edilecek AI bileşenleri:

1. **CLI Code Generator** — tekrarlayan scaffold / boilerplate üretimini hızlandırır.
2. **@ÖzetleyiciBot** — RAG tabanlı bir bot; sohbet geçmişini özetleyerek kanal bağlamını hızlıca sunar.

Bu bileşenler, 2026 staj programının "AI aracını üreten" hedefini projeye doğrudan bağlar.

## Yüksek Seviye Akış

```text
[Next.js] ──┐
            ├──► [.NET Core API + SignalR Hub] ──► [Supabase PostgreSQL]
[RN App]  ──┘              │
                           └──► [@ÖzetleyiciBot / RAG]
```

1. İstemci kimlik doğrulama ve REST ile sunucu/kanal verisini alır.
2. SignalR hub üzerinden kanala abone olur; mesajlar gerçek zamanlı yayınlanır.
3. Kalıcı veri EF Core üzerinden PostgreSQL'de tutulur.
4. (Planlanan) @ÖzetleyiciBot, kanal geçmişini RAG ile özetler.
