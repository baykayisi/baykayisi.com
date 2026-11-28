# Supabase şema doğrulama notları — 24.11.2026

Paket, mevcut `xeucxhuceqivlpthpifm` projesinin okunan şemasına göre hazırlandı.

## Kullanılan tablolar
- `profiles`: id, username, display_name, avatar_url, bio, whatsapp_number, created_at, updated_at
- `public_profiles`: id, username, display_name, avatar_url, bio, created_at
- `categories`: id, name, slug, description, is_active, sort_order, created_at
- `listings`: id, seller_id, category_id, title, description, price, currency, listing_type, status, whatsapp_contact_enabled, created_at, updated_at, event_start_at, registration_deadline, player_capacity, entry_fee, prize_description
- `conversations`: id, listing_id, buyer_id, seller_id, created_at, last_message_at
- `conversation_messages`: id, conversation_id, sender_id, message, created_at
- `service_requests`: id, listing_id, buyer_id, seller_id, conversation_id, request_note, status, created_at, updated_at
- `news_posts`: id, author_id, title, slug, summary, body, cover_image_url, status, published_at, created_at, updated_at

## Aktif kategoriler
- MLBB Boost
- Turnuva Lobisi
- MLBB Haber

## RLS gözlemleri
- Yayınlanmış ilanlar herkese açık; ilan sahibi kendi ilanlarını görebilir.
- İlan oluşturma sadece oturum açmış kullanıcıya ve `seller_id = auth.uid()` koşuluna açık.
- Alıcılar yalnızca yayınlanmış ilanlar için konuşma başlatabilir.
- Mesaj okuma/yazma konuşmanın alıcı/satıcı taraflarıyla sınırlandırılmış.
- İlanlar ilk kayıt anında `draft` durumuna eklenir. Otomatik yayınlama yapılmaz.
- Admin paneli tarayıcı tarafında rol ataması yapmaz.

## Dikkat
Bu notlar veritabanına yeni migration uygulamaz. Şema veya RLS değişikliği gerekiyorsa önce ayrı bir migration hazırlanıp güvenlik incelemesi yapılmalıdır.
