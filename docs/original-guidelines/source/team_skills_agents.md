# Son Aşama (Tüm Projeler İçin): Kendi Skill, Command ve Agent'larınızı Üretin

> **Bu bölüm hangi projeyi seçerseniz seçin geçerlidir** (E-Ticaret, StackShare Replica, Login veya Pet Store).
> **Zorluk:** ⭐⭐⭐ · **Süre:** Proje boyunca biriktirilir, son 1-2 günde toparlanır.

2026'nın en önemli mühendislik becerisi sadece kod yazmak değil, **kendi geliştirme akışınızı otomatikleştirmek.** Bu aşamada, projeniz sırasında tekrar tekrar yaptığınız işleri birer **skill / slash command / agent** haline getireceksiniz. Yani "AI'ı kullanan kişi" olmaktan çıkıp **"AI aracını üreten kişi"** olacaksınız.

Amaç mükemmel araçlar yazmak değil; **kendi ihtiyacınızı fark edip onu otomatikleştirme refleksini** kazanmak. Aşağıdaki örnekler sadece fikir vermek içindir — siz kendi projenizin tekrarlarına bakıp kendi araçlarınızı tasarlayacaksınız.

---

## Terimler (Kısaca)

| Kavram | Nedir? | Ne zaman? |
|---|---|---|
| **Skill / Command** | Tekrarlanan bir işi tarif eden, `/isim` ile çağrılan hazır talimat seti | "Her seferinde aynı şeyi anlatıyorum" dediğinizde |
| **Agent (Subagent)** | Belirli bir uzmanlık için ayrı bir AI çalışanı (kendi promptu/araçları) | Bir işi delege edip arka planda yaptırmak istediğinizde |
| **Hook** | Belirli bir olayda otomatik çalışan komut (ör. commit öncesi test) | "Her X olduğunda otomatik Y olsun" dediğinizde |

---

## Her Rol İçin Fikir Örnekleri

**Backend**
- `/api-endpoint` — verilen kaynak için controller + service + DTO + test + Swagger dokümanını üreten skill.
- `/db-migration` — model değişikliğinden migration + seed üreten command.

**Frontend / Mobil**
- `/component` — design token'lara uygun yeni komponent + test + story üreten skill.
- `/api-hook` — OpenAPI'den veri çekme hook'u (ör. TanStack Query) üreten command.
- `/screen-scaffold` — yeni bir ekranın iskeletini (state + navigasyon + boş/hata durumları) kuran skill.

**Design**
- `/screen-from-prompt` — tasarım prompt'unu standartlaştıran, design token'ları ekleyen skill.

**QA**
- `/test-case` — bir user story'den test senaryoları + E2E test iskeleti üreten skill.
- `/bug-report` — hata raporunu standart şablona (adım/beklenen/gerçekleşen/severity) dökme command'i.

**PM**
- `/standup` — açık PR ve issue'lardan günlük stand-up özeti çıkaran command.
- `/release-notes` — merge edilen PR'lardan sürüm notu üreten agent.

---

## Nasıl Yapılır (Adımlar)

1. **Bir tekrarı yakalayın.** Proje sırasında 3+ kez yaptığınız bir işi not edin.
2. **Skill dosyası oluşturun.** `.claude/skills/<isim>/SKILL.md` içine ne yapacağını, adımlarını ve örneklerini yazın.
3. **Agent gerekiyorsa** `.claude/agents/<isim>.md` içinde uzmanlığı, kullanacağı araçları ve modelini tanımlayın.
4. **Deneyin ve iyileştirin.** Gerçek görevde çalıştırın; çıktı iyi değilse talimatı netleştirin.
5. **Dokümante edin.** `SKILLS.md` içinde: hangi skill/agent'ı neden yaptınız, nasıl çağrılır, örnek çıktı.

> 📚 Nasıl skill/command/agent yazılacağını öğrenmek için Claude Code (ve kullandığınız AI asistanının) resmi dokümanlarına bakın. Takıldığınızda AI'a "bu tekrarlayan işi bir skill haline getir" diye sorup çıkan sonucu inceleyerek de öğrenebilirsiniz.

---

## Beklenen Çıktı (Definition of Done)

- [ ] Her takım **en az 1** kendi skill/command'ini üretti ve gerçek görevde kullandı.
- [ ] En az bir takım bir **agent** tanımladı (opsiyonel ama teşvik edilir).
- [ ] `SKILLS.md`: her aracın amacı, çağrımı, örnek çıktısı ve "neden işe yaradı" notu.
- [ ] Demo'da en az bir skill'in canlı çalıştığı gösterildi.

**Değerlendirme kriteri:** Aracın gerçekten zaman kazandırıp kazandırmadığı ve tekrar kullanılabilir olup olmadığı. Süslü değil, **işe yarar** olsun.
