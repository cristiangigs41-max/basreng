# Basreng Ibu A3 – Frontend (React + Vite)

    npm install
    npm run dev

Bisa langsung jalan tanpa backend (data disimpan di browser).
Login admin: admin@basrengibua3.com / admin123  -> buka /#/admin

Pakai backend Laravel + MySQL: lihat INSTALL.md, lalu isi
VITE_API_URL=http://localhost:8000/api di file .env dan restart npm run dev.

## Mengganti foto & video (slider otomatis)

Semua media diatur di SATU file: `src/media.js`.

- `HERO_SLIDES`  : isi slider di halaman utama (foto + video). Berpindah sendiri tiap 6 detik;
                   video diputar tanpa suara sampai selesai, lalu lanjut ke slide berikutnya.
                   Berhenti saat kursor di atasnya / tab tidak aktif / tombol jeda ditekan.
- `PRODUCT_PHOTOS`: foto bawaan kartu produk (foto unggahan admin tetap diutamakan).
- `GALLERY`      : tiga foto di bagian "Tentang".
- `CONTACT`      : nomor WhatsApp & email (tombol WhatsApp melayang + footer).

Sumber media boleh file lokal (`/media/foto.jpg`, simpan di `public/media/`) atau link langsung https.
- Foto Google Photos: klik kanan foto -> "Salin alamat gambar" (lh3.googleusercontent.com/...=w1600).
- Video Google Photos: link share photos.app.goo.gl tidak bisa diputar langsung di website;
  unduh videonya, taruh di `public/media/`, lalu isi `src: '/media/namafile.mp4'`.
- Foto dari pencarian Google: unduh dan simpan lokal (hotlink sering diblokir, dan pastikan
  Anda berhak memakai fotonya).
Setiap slide boleh punya `fallback` (gambar cadangan bila link gagal dimuat).

## Desain
Token warna/tipografi ada di bagian atas `src/index.css` (variabel `:root`).
Font: Bricolage Grotesque + Plus Jakarta Sans (Google Fonts, butuh internet saat dibuka).

## Cara cepat
Windows: klik dua kali `JALANKAN.bat` (Mac/Linux: `./jalankan.sh`). Otomatis install, jalan, dan membuka browser.
Buka chat "Tanya AI"; bila diminta, tempel kunci API Anthropic sekali saja (tersimpan di .env).

## Chatbot AI (Asisten A3)
Tombol merah "Tanya AI" di pojok kanan bawah membuka chat yang tersambung ke AI (Claude). Asisten menjawab
semua pertanyaan (topik apa pun); untuk soal toko ia memakai data produk & harga yang sedang tampil.

1. Buat kunci API di https://console.anthropic.com
2. Isi di file `.env`:  `ANTHROPIC_API_KEY=sk-ant-...`  (model bisa diganti lewat `ANTHROPIC_MODEL`)
3. Restart `npm run dev`. Selesai — kunci hanya dibaca server, tidak masuk ke browser.

- Tanpa kunci API, chatbot otomatis memakai AI gratis (layanan Pollinations) sehingga tetap menjawab semua pertanyaan; dengan kunci Anthropic jawabannya lebih bagus dan stabil.
- Mode demo: endpoint `/ai-chat` disediakan otomatis oleh Vite (`server/chat.js`).
- Produksi tanpa Laravel: `npm run build` lalu `node --env-file=.env server/chat-server.js`.
- Mode Laravel: endpoint `POST /api/chat` (`ChatController`); isi `ANTHROPIC_API_KEY` di `.env` Laravel.

## Peta lokasi antar
Di Checkout pelanggan bisa menandai titik antar: cari alamat, klik peta, geser pin, atau tombol "Lokasi saya".
Memakai OpenStreetMap + Leaflet, dibatasi wilayah Indonesia; pencarian otomatis (kost/hotel/alamat) lewat Photon (gratis, tanpa API key, butuh internet). Koordinat tersimpan di pesanan dan
tampil sebagai link "Lihat lokasi di peta" (Google Maps) di admin dan "Pesanan saya".
Mode Laravel: jalankan `php artisan migrate` (kolom latitude/longitude).

### Peta: Google Maps (dengan key) atau OpenStreetMap (tanpa key)
Peta, pencarian tempat, dan pin memakai Google Maps. Buat API key di console.cloud.google.com, aktifkan **Maps JavaScript API**,
**Places API (New)**, dan **Geocoding API** (billing harus aktif; ada kuota gratis bulanan), batasi key ke domain situs Anda,
isi `VITE_GOOGLE_MAPS_KEY=` di `.env`, lalu restart `npm run dev`. Tanpa key, otomatis memakai embed Google Maps yang bisa dicari langsung dari kolom cari.

### Pilih wilayah dulu
Di atas peta ada pilihan Provinsi → Kabupaten/Kota → Kecamatan (data api-wilayah-indonesia, gratis). Setelah dipilih, peta terbang
ke wilayah itu dan pencarian tempat hanya mencari di dalam wilayah tersebut.

### Memakai data Google Maps tanpa API key
Di bawah peta ada "Tempat tidak ketemu? Cari di Google Maps": buka Google Maps, pilih tempat (toko/kost/hotel/mall apa pun),
salin link Bagikan atau koordinatnya, tempel lalu klik Gunakan. Pin langsung pindah ke titik itu. Link pendek maps.app.goo.gl
dibaca lewat server lokal (`npm run dev`).

### Hosting di GitHub Pages
`index.html` di root adalah file sumber. Hasil siap-hosting dibuat oleh `npm run build` di folder `dist/` (`dist/index.html`).
Cara otomatis: push ke branch `main`, lalu di GitHub buka **Settings → Pages → Source: GitHub Actions**. Workflow `.github/workflows/deploy.yml` akan build & publish.
Catatan: GitHub Pages hanya hosting statis, jadi berjalan dalam mode demo (data di browser). Laravel (database sungguhan), chatbot AI, dan `/maps-resolve` tidak aktif di sana.
