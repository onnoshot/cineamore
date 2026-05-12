# CineAmore — Kurulum Rehberi

## 1. Supabase

1. [supabase.com](https://supabase.com)'da proje oluştur
2. **Storage** → New bucket → Name: `cineamore`, Public: ✅
3. Bucket Policy: authenticated & anon read/write (veya sadece service key ile yönet)
4. Dashboard'dan URL ve anahtarları al → `.env.local`'a yaz

## 2. OpenAI

1. [platform.openai.com](https://platform.openai.com) → API Keys
2. `gpt-image-1` modeline erişim için organizasyon onaylı olmalı
3. Key'i `.env.local`'a yaz: `OPENAI_API_KEY=sk-...`

## 3. Higgsfield

1. [higgsfield.ai](https://higgsfield.ai) → API anahtarı oluştur
2. Seedance 2.0 modeline erişim kontrol et
3. Key'i `.env.local`'a yaz: `HIGGSFIELD_API_KEY=hf-...`

## 4. Müzik dosyası

`public/audio/story_track.mp3` dosyasını ekle (12 saniye, telif hakkı serbest).
Öneri: [pixabay.com/music](https://pixabay.com/music) → "romantic", "cinematic"

## 5. Uygulama ikonları

`public/` klasörüne ekle:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)  
- `icon-180.png` (180×180 — Apple Touch Icon)
- `icon-32.png` (32×32 — favicon)

## 6. Çalıştırma

```bash
cp .env.example .env.local
# Yukarıdaki adımlardan anahtarları doldur

npm run dev
# → http://localhost:3000
```

## 7. Vercel Deploy

```bash
npm i -g vercel
vercel

# Environment variables'ı Vercel dashboard'dan ekle:
# OPENAI_API_KEY, HIGGSFIELD_API_KEY
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
```

## Akış Özeti

```
Landing → /create (upload 2 foto) → /api/prepare (Supabase'e yükle)
       → /create/generating (4 görsel paralel, sonra 4 video paralel)
       → /api/finalize (ffmpeg concat + müzik)
       → /create/[id] (video player + paylaş/indir)
```
