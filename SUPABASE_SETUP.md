# Supabase kurulum adımları

Bu uygulamayı Supabase ile çalıştırmak için yapılacaklar.

## 1. Supabase projesi oluştur

1. https://supabase.com adresine git → **Start your project**
2. GitHub ile giriş yap → **New project**
3. Project name: `butce` (veya istediğin isim)
4. Database password: güçlü bir şifre, kaydet (gerekirse sonra resetlersin)
5. Region: **West EU (Ireland)** veya **Frankfurt** (Türkiye'ye yakın)
6. **Create project** → 1-2 dakika sürer

## 2. Tabloları oluştur

1. Sol menüden **SQL Editor** → **New query**
2. Bu repodaki [`supabase/schema.sql`](supabase/schema.sql) dosyasının tamamını kopyala
3. SQL Editor'a yapıştır → **Run** (sağ üstte)
4. "Success. No rows returned" görmen lazım

Bu adım 4 tabloyu (accounts, transactions, recurring_rules, budget_goals), her birinin index'lerini ve RLS politikalarını kurar.

## 3. Auth ayarları (magic link için)

1. Sol menüden **Authentication** → **URL Configuration**
2. **Site URL** alanına:
   ```
   https://fabricpro.github.io/Butce/
   ```
3. **Redirect URLs** alanına ekle (her iki satırı da):
   ```
   https://fabricpro.github.io/Butce/
   http://localhost:5173/
   ```
4. **Save**

İsteğe bağlı: **Authentication → Providers → Email** kısmında **Confirm email** kapalı tutabilirsin (magic link kullanıyoruz, ayrı doğrulama gerekmiyor). Varsayılan ayar genellikle yeterli.

## 4. API anahtarlarını al

1. Sol menüden **Project Settings** (dişli ikonu altta) → **API**
2. İki değeri kaydet:
   - **Project URL** (örn. `https://abcdefghijkl.supabase.co`)
   - **anon public** key (uzun bir JWT)

## 5. GitHub'a secrets ekle

1. Repo: https://github.com/fabricPro/Butce/settings/secrets/actions
2. **New repository secret** → ikisini de ekle:
   - Name: `VITE_SUPABASE_URL`, Secret: (4. adımdaki Project URL)
   - Name: `VITE_SUPABASE_ANON_KEY`, Secret: (4. adımdaki anon key)

## 6. Yeniden deploy et

GitHub Actions sekmesinden son workflow'u **Re-run all jobs** ile yeniden çalıştır (veya boş bir commit push'la). Build sırasında env vars artık erişilebilir.

## 7. (Yerel geliştirme için)

`.env.example` dosyasını kopyala ve değerleri yaz:

```bash
cp .env.example .env.local
# Sonra .env.local içine VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değerlerini yaz
npm run dev
```

## Test

1. `https://fabricpro.github.io/Butce/` aç
2. Login ekranında e-postanı yaz → **Giriş linki gönder**
3. E-posta kutuna gelen linke tıkla → otomatik giriş
4. Hesap ekle, işlem ekle → veritabanına yazılıp yazılmadığını **Supabase → Table Editor → accounts/transactions**'tan kontrol edebilirsin
5. Farklı bir cihazdan/tarayıcıdan aynı e-posta ile giriş yap → aynı veriyi gör (multi-cihaz senkron)

## Sorun giderme

- **Login linkı maile gelmiyor:** Supabase'in default e-posta sağlayıcısı saatlik limitlidir (3-5 mail). Hızlı denemeler için SMTP ayarla (Project Settings → Auth → SMTP) veya birkaç dakika bekle.
- **Login yaptım ama veri yüklenmiyor:** Tarayıcı konsolunda hata var mı kontrol et. Çoğu durumda RLS politikası eksik olur — `schema.sql`'i yeniden çalıştır.
- **"Veri yüklenemedi" hatası:** Tablolar yok veya RLS eksik. `schema.sql`'i yeniden çalıştır.
- **Magic link tıklayınca yanlış sayfaya gidiyor:** Auth → URL Configuration'da Site URL ve Redirect URLs doğru olmalı.
