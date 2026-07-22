# Micodex (Discord Clone) — Geliştirme Raporu

**Proje:** staj-2026-intern-assignments / micodex  
**Kapsam:** Frontend (Next.js) + Backend (.NET / SignalR / Supabase Postgres)  
**Rapor tarihi:** 22 Temmuz 2026  
**Durum notu:** Son özelliklerin büyük kısmı henüz commit edilmemiş (working tree’de)

---

## 1. Özet

Micodex, Discord benzeri bir sohbet uygulamasıdır. Auth, sunucu/kanal, arkadaşlık, DM, gerçek zamanlı mesajlaşma (SignalR), okunmamış bildirimleri, yazıyor göstergesi, okundu bilgisi, profil, kanal yönetimi ve UI düzeni üzerinde çalışıldı.

Bu rapor: **ne yapıldı**, **planda ne kaldı**, **SignalR nasıl kullanıldı**, **klasör yapısı** ve **kod kalitesi** değerlendirmesini içerir.

---

## 2. Tamamlanan Özellikler

### 2.1 Kimlik ve temel uygulama

| Özellik | Durum | Not |
|--------|--------|-----|
| Kayıt / giriş (JWT) | ✅ | Backend Auth + frontend login/register |
| Ana landing | ✅ | Bento / 3D görseller |
| Ana uygulama kabuğu (`/app`) | ✅ | Sunucu + kanal + sohbet |
| Profil sayfası | ✅ | Hakkında, arkadaşlar, sunucular, ayarlar |
| Hesap silme | ✅ | `DELETE /api/users/me` |

### 2.2 Sunucu ve kanal

| Özellik | Durum | Not |
|--------|--------|-----|
| Sunucu oluşturma / listeleme | ✅ | |
| Kanal oluşturma (Text / Duyuru / Ses) | ✅ | |
| Kanal silme | ✅ | Ayarlar modalı + `DELETE /api/channels/{id}` |
| Sunucuya üye davet | ✅ | Username arama, arkadaşlar öncelikli |
| Üye listesi / üye çıkarma | ✅ | Backend API mevcut |

### 2.3 Arkadaşlar ve DM

| Özellik | Durum | Not |
|--------|--------|-----|
| Arkadaşlık istekleri | ✅ | |
| DM listesi | ✅ | Okunmamış sayısı ile |
| DM okundu işaretleme | ✅ | `LastReadAt` + MarkDmRead |
| Peer okundu durumu (“Görüldü”) | ✅ | ReadReceipt SignalR |
| Okunmamış badge (Mesajlar ikonu) | ✅ | Inbox grubu + poll yedek |

### 2.4 Gerçek zamanlı (SignalR)

| Özellik | Durum | Not |
|--------|--------|-----|
| Anlık mesaj yayını | ✅ | `ReceiveMessage` |
| Yazıyor… | ✅ | `SendTyping` / `UserTyping` |
| DM unread push | ✅ | `DmUnreadUpdated` → `user-{id}` grubu |
| Okundu bildirimi | ✅ | `ReadReceipt` |
| Otomatik yeniden bağlanma | ✅ | Frontend singleton hub client |

### 2.5 UX / UI iyileştirmeleri

| Özellik | Durum | Not |
|--------|--------|-----|
| Refresh’te sayfada kalma | ✅ | `sessionStorage` navigation |
| Kanal paneli kapat/aç | ✅ | Sunucu adındaki aşağı ok |
| Sol sunucu sidebar resize | ✅ | İsimleri göstermek için genişletme |
| Davet modalı (inline Davet Et) | ✅ | |
| Mesaj arama + yıldızlama | ✅ | Önceki commit’te |
| Scroll zıplama düzeltmesi | ✅ | SignalR callback stabilize |

### 2.6 Frontend mimari düzenleme

| Özellik | Durum | Not |
|--------|--------|-----|
| `models/` katmanı | ✅ | Eski `types/` |
| `services/` katmanı | ✅ | API + SignalR |
| İnce route sayfaları | ✅ | `/app` → `AppShell` |
| `lib/` sadece yardımcılar | ✅ | validasyon, layout, nav |

---

## 3. Planda Kalan / Eksik Olabilecekler

Aşağıdakiler ya hiç yapılmadı ya da kısmen var; ürün olgunluğu için sıradaki adımlar olarak düşünülebilir.

### Yüksek öncelik

- [x] **Değişiklikleri commit / PR** — Ana özellikler commit’lendi; yeni sprint değişiklikleri ayrı commitlenecek
- [x] **Backend’in tek instance ile stabil çalışması** — `.dotnet` ignore + tek port notu (operasyonel)
- [x] **Sunucu görünümünde unread badge’in tutarlılığı** — Inbox + poll iyileştirildi
- [x] **Yetki modeli** — Kanal silme Owner/Admin (`ServerRoles`)

### Orta öncelik

- [ ] **Ses kanalları** — Tip seçilebilir ama gerçek ses/WebRTC yok (bilinçli olarak ertelendi)
- [x] **Mesaj düzenleme / silme** — API + UI + SignalR
- [x] **Dosya / görsel ekleme** — `POST /api/messages/upload` + attachmentUrl
- [x] **Bildirimler (browser push / ses)** — Sekme gizliyken DM Notification API
- [x] **Sunucu ayarları** — ServerSettingsModal (üyeler, davet, ayrıl)
- [x] **Mobil responsive** — Kanal/DM paneli drawer
- [x] **Test coverage** — `Application.Tests` / `ServerRolesTests` (7 test)

### Düşük / iyileştirme

- [x] Components alt klasörleme (`chat/`, `modals/`, `layout/`)
- [x] API base URL env (`NEXT_PUBLIC_API_URL`) — `.env.example` + `services/api.ts`
- [x] Error boundary / kullanıcı dostu global hata ekranı
- [ ] Production build + deploy pipeline (ertelendi)

---

## 4. SignalR Nasıl Kullanıldı?

### 4.1 Mimari

```
[Next.js client]
   services/chatHub.ts  (singleton HubConnection)
        │  JWT: access_token query
        ▼
[ASP.NET] MapHub<ChatHub>("/chatHub")
        │
        ├─ Groups: channelId          → mesaj, typing, read receipt
        └─ Groups: user-{userId}      → DM unread inbox
        ▲
[SendMessage handler]
   ChatNotificationService → Group’lara SendAsync
```

### 4.2 Hub metodları (`ChatHub.cs`)

| Client → Server | Açıklama |
|-----------------|----------|
| `JoinInbox()` | Kullanıcıyı `user-{id}` grubuna ekler |
| `JoinChannel(channelId)` | Aktif kanal grubuna katılır |
| `LeaveChannel(channelId)` | Gruptan çıkar |
| `SendTyping(channelId)` | Diğer üyelere `UserTyping` yayınlar |
| `SendMessage` (hub) | Alternatif yayın yolu (asıl kayıt REST + notification service) |

### 4.3 Server → Client event’leri

| Event | Ne zaman | Kim dinler |
|-------|----------|------------|
| `ReceiveMessage` | Mesaj DB’ye yazılınca | Açık kanal / ChatArea |
| `UserTyping` | Karşı taraf yazınca | Aynı kanal grubu |
| `ReadReceipt` | DM okundu işaretlenince | Aynı kanal |
| `DmUnreadUpdated` | DM mesajı gelince (alıcı) | AppShell / DmSidebar (inbox) |

### 4.4 Frontend client (`services/chatHub.ts`)

- **Singleton:** React Strict Mode remount’ta bağlantı kopmasın diye tek instance
- **`withAutomaticReconnect`:** 0 → 2s → 5s → 10s → 30s
- **Inbox loop:** Inbox grubuna katılım koparsa 15 sn’de bir yeniden dene
- **1006 log filtreleme:** Backend restart sırasında Next.js “Issues” gürültüsünü azaltır
- **Yedek poll:** SignalR kaçırırsa unread için 5s (sunucu görünümü) / 30s poll

### 4.5 Tipik akış örnekleri

**Mesaj:**

1. `POST /api/messages` → `SendMessageCommandHandler`
2. DB kayıt
3. `SendMessageToChannelAsync` → `ReceiveMessage`
4. DM ise alıcıya `NotifyDmUnreadAsync` → `DmUnreadUpdated`

**Yazıyor:**

1. Input change (throttle ~1.2s) → `chatHub.invoke("SendTyping", channelId)`
2. Hub → `OthersInGroup` → `UserTyping`
3. ChatArea başlığında `@user yazıyor...`

**Önemli sınır:** Yazıyor göstergesi yalnızca **aynı kanal grubuna katılmış** istemcilerde görünür. Alıcı sunucu kanalındayken DM yazıyor’unu görmez (beklenen davranış).

### 4.6 Bilinen SignalR sorunları

| Sorun | Neden | Çözüm / durum |
|-------|-------|----------------|
| WebSocket 1006 | Backend restart / port çakışması | Tek `dotnet run`; reconnect |
| Badge gecikmesi | Inbox’a katılmama + 60s poll | Inbox + hızlı poll + optimistic +1 |
| Negotiation stopped | Strict Mode `stop()` | Singleton; unmount’ta stop yok |

---

## 5. Klasörleme Yapısı

### 5.1 Frontend (`discord-frontend/src`)

```
src/
├── app/                      # Next.js App Router (sadece route)
│   ├── page.tsx              # Landing /
│   ├── layout.tsx
│   ├── login/
│   ├── register/
│   ├── profile/[username]/
│   └── app/                  # URL: /app  ← klasör adı = path segment
│       └── page.tsx          # ince: <AppShell />
│
├── components/
│   ├── app/AppShell.tsx      # Ana uygulama state + layout
│   ├── auth/                 # Login/register UI parçaları
│   ├── ChatArea.tsx
│   ├── *Sidebar.tsx
│   └── *Modal.tsx
│
├── models/                   # Domain tipleri
│   ├── chat.ts               # Server, Channel, Message, UserSearchHit…
│   └── index.ts
│
├── services/                 # Ağ katmanı
│   ├── api.ts                # REST helpers
│   ├── chatHub.ts            # SignalR client
│   └── index.ts
│
└── lib/                      # Saf yardımcılar (ağ yok / az yan etki)
    ├── appNavigation.ts      # sessionStorage nav persist
    ├── authValidation.ts
    └── sidebarLayout.ts      # resize + panel open state
```

**Neden `app/app`?**  
`src/app` Next.js routing köküdür. İçindeki `app` klasörü bilerek `localhost:3000/app` adresini üretir. Hata değildir; UI mantığı `components/app/AppShell`’e taşınmıştır.

### 5.2 Backend (`discord-backend`)

```
Application/
  Features/          # CQRS (MediatR): Auth, Channels, Dms, Friends, Messages, Servers, Users
  Interfaces/
  Repositories/
Domain/Entities/
Persistence/Repositories/
WebAPI/
  Controllers/
  Hubs/ChatHub.cs
  Services/ChatNotificationService.cs
  Program.cs         # JWT, CORS, SignalR, schema SQL
```

Clean Architecture + MediatR pattern’i tutarlı şekilde kullanılıyor.

---

## 6. Kod Temizliği ve Düzen Değerlendirmesi

### 6.1 Güçlü yanlar

- Backend feature klasörleri (Command/Query/Handler) okunabilir
- Frontend’de `models` / `services` / `lib` / `components` ayrımı netleşti
- SignalR tek yerde (`chatHub` singleton) — dağınık `new HubConnection` yok
- Auth helper’ları (`authFetch`, token clear) merkezi
- UI state’in bir kısmı `sessionStorage` ile kalıcı (nav, sidebar)

### 6.2 Orta / iyileştirilebilir noktalar

| Konu | Değerlendirme |
|------|----------------|
| Component boyutu | `ChatArea.tsx` (~880 satır), `FriendsList.tsx` (~730) — bölünebilir |
| Components klasörü | Çoğu dosya flat; `modals/`, `layout/`, `chat/` ayrımı yapılabilir |
| API çağrıları | Bazı component’lerde hâlâ inline `fetch` (ChannelSidebar, ServerSidebar); `services/api`’ye taşınabilir |
| Tip güvenliği | API JSON’da `id`/`Id` dual mapping tekrarlı; mapper helper eklenebilir |
| Env config | `API_BASE_URL` hardcoded |
| Hata yönetimi | Birçok yerde sessiz `catch`; kullanıcıya feedback eksik kalabiliyor |
| Test | Feature’lar için otomatik test zayıf |
| Commit disiplini | Büyük uncommitted diff — review zorlaşır |

### 6.3 Genel not (1–5)

| Kriter | Puan | Yorum |
|--------|------|-------|
| Çalışır özellik seti | 4.5 | Ana Discord akışı ayakta |
| Mimari tutarlılık (BE) | 4 | CQRS + hub net |
| Mimari tutarlılık (FE) | 3.5 | Yeni katmanlar iyi; büyük component’ler var |
| Okunabilirlik | 3.5 | Yapı düzeldi; bazı dosyalar hâlâ şişkin |
| Gerçek zamanlı sağlamlık | 3.5 | İyi tasarım; lokal restart’a duyarlı |
| Test / prod hazırlığı | 2.5 | Dev odaklı |

**Özet hüküm:** Kod düzeni staj projesi için **iyi seviyede** ve son refactor ile daha okunur hale geldi. Production kalitesi için: büyük component’leri bölmek, API çağrılarını servislere toplamak, env + test + commit hijyeni gerekir.

---

## 7. Önemli API Uçları (özet)

| Method | Path | Amaç |
|--------|------|------|
| POST | `/api/channels` | Kanal oluştur |
| DELETE | `/api/channels/{id}` | Kanal sil |
| GET/POST | `/api/dms`, `/api/dms/{userId}` | DM list / aç |
| POST | `/api/dms/read/{channelId}` | DM okundu |
| GET | `/api/dms/read/{channelId}/status` | Peer lastRead |
| POST | `/api/servers/{id}/members` | Üye davet |
| DELETE | `/api/users/me` | Hesap sil |
| Hub | `/chatHub` | SignalR |

---

## 8. Çalıştırma Notları

```bash
# Backend (tek instance!)
cd discord-backend
# gerekirse: kill $(lsof -t -i:5243)
dotnet run --project WebAPI --launch-profile http
# → http://localhost:5243

# Frontend
cd discord-frontend
npm run dev
# → http://localhost:3000
```

İki hesap testi: **normal Chrome + Incognito** (aynı tarayıcıda iki normal sekme `localStorage` paylaşır).

---

## 9. Sonuç

Şu ana kadar micodex; auth’tan gerçek zamanlı DM’e, sunucu yönetimine ve profil’e kadar **çekirdek Discord deneyimini** karşılıyor. SignalR mesaj, typing, unread ve read-receipt için kullanılıyor. Frontend klasörleme `models` / `services` / ince `app` route’ları ile temizlendi.

**En kritik sonraki adımlar:**

1. Uncommitted değişiklikleri anlamlı commit’lere bölmek  
2. Büyük UI dosyalarını parçalamak  
3. Owner yetkisi + mesaj CRUD + env config  
4. SignalR/backend’i tek süreçte stabil tutarak uçtan uca test checklist’i yazmak  

---

*Bu belge, staj sürecindeki konuşma özeti ve mevcut kod tabanına göre hazırlanmıştır.*
