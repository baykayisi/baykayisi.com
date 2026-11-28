# KayısıHub — Mobile-first başlangıç paketi

Bu paket, `baykayisi/baykayisi.com` deposuna manuel yükleme için hazırlanmış V1 başlangıç sürümüdür.

## İçerik
- `index.html`: Tek sayfalı, mobil uyumlu pazaryeri arayüzü.
- `assets/css/style.css`: Siyah / gümüş / turuncu tasarım.
- `assets/js/config.js`: Supabase URL ve **publishable** anahtar.
- `assets/js/app.js`: Auth, ilan listeleme/oluşturma, ilan detay, site içi konuşma ve Junior İsmail'in sabit SSS yanıtları.
- `admin/index.html`: Yetki kontrolleri tamamlanana kadar güvenli bekleme sayfası.
- `supabase/SCHEMA_NOTES.md`: Mevcut veritabanı şemasına dair doğrulama notları.

## GitHub'a iPhone üzerinden yükleme
1. ZIP'i Dosyalar uygulamasına kaydet ve arşivi aç.
2. GitHub'da `baykayisi/baykayisi.com` deposunu aç.
3. `Add file` → `Upload files` seç.
4. ZIP'in içindeki dosya ve klasörleri yükle. ZIP dosyasının kendisini değil, açılmış içeriği yükle.
5. Dosyaların depo kökünde şu yapıda olduğuna dikkat et:
   - `index.html`
   - `assets/css/style.css`
   - `assets/js/config.js`
   - `assets/js/app.js`
   - `admin/index.html`
6. Commit changes ile `main` dalına kaydet.
7. GitHub Pages ayarlarında Source olarak `Deploy from a branch`, Branch `main`, Folder `/(root)` seçili olmalı.

## Supabase güvenliği
- `config.js` yalnızca Supabase publishable key içerir. Bu anahtarın tarayıcıda bulunması normaldir.
- **service_role / secret key kesinlikle bu projeye veya GitHub'a eklenmemelidir.**
- Mevcut RLS politikaları tarayıcı erişimini sınırlar.
- Yeni ilanlar `draft` olarak kaydedilir; otomatik yayınlanmaz.
- Site içi konuşmalar, mevcut `conversations` ve `conversation_messages` tablolarını kullanır.
- İlk sürümde ödeme/emanet altyapısı yoktur.

## Sınırlar / henüz yapılmayanlar
- Bu paket henüz GitHub'a yüklenmedi ve canlı ortamda çalıştığı iddia edilmez.
- Gerçek Junior İsmail LLM entegrasyonu yoktur; mevcut sürüm sabit yardım yanıtları verir.
- Admin API ve yönetici paneli yoktur; admin sayfası özellikle kapalıdır.
- Resim yükleme, ödeme, moderasyon kuyruğu, gelişmiş arama ve bildirimler sonraki aşamadır.
- E-posta doğrulaması Supabase Auth ayarlarına bağlıdır.

## İlk test listesi
1. GitHub Pages adresini aç.
2. Supabase Auth üzerinden test kullanıcı kaydı oluştur.
3. E-posta doğrulaması gerekiyorsa doğrula ve giriş yap.
4. Test ilanı oluştur; `public.listings` tablosunda `draft` durumuyla göründüğünü doğrula.
5. Yönetici tarafından onaylanmış bir test ilanı `published` olduğunda ana sayfada listelendiğini doğrula.
6. İki ayrı test kullanıcıyla ilan sahibi konuşması başlatmayı dene.
