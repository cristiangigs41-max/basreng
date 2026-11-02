export const rupiah = (n) => 'Rp' + Number(n || 0).toLocaleString('id-ID')
export const STATUS = ['Pending', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan']
export const go = (p) => { location.hash = p }
export const fdate = (d) => new Date(d).toLocaleDateString('id-ID')

// Kelompok kemasan: 'pack' (5K/10K) atau 'kilo' (1/2 Kg, 1 Kg)
export const inGroup = (label, group) => (group === 'kilo' ? /kg/i.test(label) : /pack/i.test(label))

// Kecilkan foto bukti bayar (maks 900px) menjadi data-URL JPEG agar muat di penyimpanan browser.
export function fileToDataUrl(file, max = 900) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.75))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('File bukan gambar yang valid.')) }
    img.src = url
  })
}

// Alur status pesanan (admin): tombol tindakan berikutnya
export const NEXT_STEP = { Pending: ['Diproses', 'Proses pesanan'], Diproses: ['Dikirim', 'Kirim pesanan'], Dikirim: ['Selesai', 'Selesaikan'] }
export const isCod = (o) => o.payment_method === 'COD (Bayar di Tempat)'
