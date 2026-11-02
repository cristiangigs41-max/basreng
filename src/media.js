const BASE = import.meta.env.BASE_URL // '/' lokal, '/nama-repo/' di GitHub Pages
// ─────────────────────────────────────────────────────────────────────────────
//  PUSAT FOTO & VIDEO  —  edit file ini saja untuk mengganti media di seluruh toko.
//
//  type    : 'image' | 'video'
//  src     : alamat file. Bisa file lokal (/media/xxx.jpg) atau link langsung (https://...)
//  fallback: (opsional) dipakai otomatis bila src gagal dimuat
//  poster  : (khusus video) gambar sampul sebelum video jalan
//  caption : teks kecil di pojok slider
//
//  CARA PAKAI FOTO/VIDEO DARI GOOGLE:
//  • Foto Google Photos : buka foto → klik kanan gambar → "Salin alamat gambar"
//                         (link berawalan https://lh3.googleusercontent.com/...). Tambahkan =w1600 di akhir.
//  • Video Google Photos: link share photos.app.goo.gl TIDAK bisa diputar langsung di website.
//                         Unduh videonya, simpan ke public/media/ lalu isi src: BASE + 'media/namafile.mp4'
//                         (atau pakai link .mp4 langsung dari hosting/CDN Anda).
//  • Foto dari Google Search: unduh dulu & simpan di public/media/ (hotlink sering diblokir
//                         dan fotonya milik pihak lain — pastikan Anda berhak memakainya).
//
//  Slider berpindah sendiri tiap 6 detik. Video diputar tanpa suara sampai selesai, lalu lanjut.
// ─────────────────────────────────────────────────────────────────────────────

export const SLIDE_INTERVAL = 6000

export const HERO_SLIDES = [
  { type: 'image', src: BASE + 'media/foto-1.jpg', caption: 'Basreng pedas daun jeruk' },
  { type: 'image', src: BASE + 'media/foto-2.jpg', caption: 'Basreng bulat, renyah dan gurih' },
  { type: 'image', src: BASE + 'media/foto-4.jpg', caption: 'Basreng pedas dengan cabai pilihan' },
  { type: 'image', src: BASE + 'media/foto-5.jpg', caption: 'Aneka basreng dan keripik' },
  { type: 'image', src: BASE + 'media/foto-6.jpg', caption: 'Basreng original daun jeruk' },
  { type: 'image', src: BASE + 'media/foto-7.jpg', caption: 'Basreng bulat tipis dan garing' },
  { type: 'image', src: BASE + 'media/pangsit-3.jpg', caption: 'Keripik pangsit bumbu gurih' },
  { type: 'image', src: BASE + 'media/pangsit-1.jpg', caption: 'Keripik pangsit pedas' },
  { type: 'image', src: BASE + 'media/foto-3.jpg', caption: 'Bumbu meresap sampai ke dalam' },
  // Video: hapus tanda // di bawah dan ganti src dengan video Anda (taruh di public/media/).
  // { type: 'video', src: BASE + 'media/promo.mp4', poster: BASE + 'media/foto-1.jpg', caption: 'Baru digoreng, langsung dikemas' },
]

// Foto kartu produk (dipakai bila produk belum punya foto unggahan dari admin).
export const PRODUCT_PHOTOS = {
  balok: BASE + 'media/foto-1.jpg',
  bulat: BASE + 'media/foto-2.jpg',
  pangsit: BASE + 'media/pangsit-1.jpg',
  basreng: BASE + 'media/foto-1.jpg',
}
export const photoFor = (name = '') =>
  /pangsit/i.test(name) ? PRODUCT_PHOTOS.pangsit : /bulat/i.test(name) ? PRODUCT_PHOTOS.bulat
    : /balok/i.test(name) ? PRODUCT_PHOTOS.balok : /basreng/i.test(name) ? PRODUCT_PHOTOS.basreng : BASE + 'media/hero.jpg'

// Galeri di bagian "Tentang".
export const GALLERY = [BASE + 'media/foto-6.jpg', BASE + 'media/pangsit-3.jpg', BASE + 'media/foto-2.jpg']

// Kontak (dipakai di tombol WhatsApp & footer).
export const CONTACT = { wa: '6285267567133', waLabel: '0852-6756-7133', email: 'admin@basrengibua3.com' }
export const waLink = (text = 'Halo Basreng Ibu A3, saya mau pesan.') => `https://wa.me/${CONTACT.wa}?text=${encodeURIComponent(text)}`

// Data pembayaran (tampil di halaman Checkout). GANTI dengan rekening & QRIS toko yang asli.
export const PAYMENT = {
  bank: { name: 'BCA', number: '1234567890', holder: 'Basreng Ibu A3' },
  qris: BASE + 'media/qris.png', // simpan gambar QRIS toko di public/media/qris.png
}
