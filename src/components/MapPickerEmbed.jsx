import { useEffect, useState } from 'react'
import Icon from './Icon'

// Google Maps yang tampil (embed resmi Google, tanpa API key). Ketik di kolom cari → peta Google langsung menampilkan hasilnya.
const WIL = 'https://www.emsifa.com/api-wilayah-indonesia/api/'
const ROMAN = /^(?:i{1,3}|iv|vi{0,3}|ix|xi{0,3})$/i
const title = (t) => t.toLowerCase().replace(/(^|[\s-])([a-z]+)/g, (m, a, w) => a + (ROMAN.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).replace(/\bDki\b/, 'DKI').replace(/\bDi\b/, 'DI')
const getList = (path) => fetch(WIL + path).then((r) => { if (!r.ok) throw new Error('wilayah'); return r.json() })
const IN_ID = (la, lo) => la >= -11.5 && la <= 6.5 && lo >= 94.5 && lo <= 141.5
function parseMapsText(t) {
  const x = decodeURIComponent(String(t).trim().replace(/\+/g, '%20'))
  const pats = [/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/, /[?&](?:q|ll|query|destination|center)=(-?\d{1,3}\.\d+)[, ]+(-?\d{1,3}\.\d+)/, /^\s*(-?\d{1,3}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)\s*$/]
  for (const re of pats) { const m = x.match(re); if (m && IN_ID(+m[1], +m[2])) return { lat: +m[1], lng: +m[2], name: (x.match(/\/maps\/place\/([^/@]+)/) || [])[1] || '' } }
  return null
}
export const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`

export default function MapPickerEmbed({ value, onChange, onAddress }) {
  const [provs, setProvs] = useState([]), [regs, setRegs] = useState([]), [dists, setDists] = useState([])
  const [sel, setSel] = useState({ p: '', r: '', d: '' })
  const [q, setQ] = useState(''), [term, setTerm] = useState(''), [gl, setGl] = useState(''), [msg, setMsg] = useState('')
  const nameOf = (list, id) => title(list.find((x) => x.id === id)?.name || '')
  const ctx = [nameOf(dists, sel.d) && 'Kecamatan ' + nameOf(dists, sel.d), nameOf(regs, sel.r), nameOf(provs, sel.p)].filter(Boolean).join(', ')

  useEffect(() => { getList('provinces.json').then(setProvs).catch(() => setMsg('Daftar provinsi tidak bisa dimuat. Anda tetap bisa mencari langsung.')) }, [])
  // ketik ≥ 3 huruf → Google Maps otomatis mencari (tertunda 600 ms)
  useEffect(() => { const t = setTimeout(() => setTerm(q.trim().length >= 3 ? q.trim() : ''), 600); return () => clearTimeout(t) }, [q])

  const onProv = (id) => { setSel({ p: id, r: '', d: '' }); setRegs([]); setDists([]); setQ(''); if (id) getList(`regencies/${id}.json`).then(setRegs).catch(() => setMsg('Daftar kabupaten/kota gagal dimuat.')) }
  const onReg = (id) => { setSel((x) => ({ ...x, r: id, d: '' })); setDists([]); setQ(''); if (id) getList(`districts/${id}.json`).then(setDists).catch(() => {}) }
  const onDist = (id) => { setSel((x) => ({ ...x, d: id })); setQ('') }

  const query = term ? (ctx ? `${term}, ${ctx}` : term) : (ctx || 'Indonesia')
  const submit = (e) => { e.preventDefault(); if (q.trim().length >= 2) { setTerm(q.trim()); onAddress?.(query === q.trim() ? q.trim() : `${q.trim()}, ${ctx}`.replace(/, $/, '')) } }
  const useLink = async (e) => {
    e.preventDefault()
    const text = gl.trim()
    if (!text) return
    let hit = parseMapsText(text)
    if (!hit && /^https?:\/\//i.test(text)) {
      setMsg('Membaca link Google Maps…')
      try {
        const r = await fetch('/maps-resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: text }) })
        const d = await r.json()
        hit = d.lat != null && IN_ID(d.lat, d.lng) ? { lat: d.lat, lng: d.lng, name: '' } : null
      } catch { /* di bawah */ }
    }
    if (!hit) return setMsg('Lokasi tidak terbaca. Di Google Maps pilih tempatnya → Bagikan → salin link, atau tekan lama titiknya lalu salin koordinat.')
    setMsg(''); setGl(''); onChange({ lat: +hit.lat.toFixed(6), lng: +hit.lng.toFixed(6) }); setTerm(`${hit.lat},${hit.lng}`)
    onAddress?.(hit.name ? decodeURIComponent(hit.name.replace(/\+/g, ' ')) : `${hit.lat}, ${hit.lng}`)
  }
  const locate = () => {
    if (!navigator.geolocation) return setMsg('Browser tidak mendukung lokasi otomatis.')
    setMsg('Mencari lokasi Anda…')
    navigator.geolocation.getCurrentPosition(
      (p) => { setMsg(''); onChange({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }); setTerm(`${p.coords.latitude},${p.coords.longitude}`) },
      () => setMsg('Izin lokasi ditolak. Cari alamat di kolom cari.'),
      { enableHighAccuracy: true, timeout: 12000 })
  }

  return (
    <div className="mappick">
      <div className="map-reg">
        <select value={sel.p} onChange={(e) => onProv(e.target.value)} aria-label="Provinsi"><option value="">Pilih provinsi</option>{provs.map((x) => <option key={x.id} value={x.id}>{title(x.name)}</option>)}</select>
        <select value={sel.r} onChange={(e) => onReg(e.target.value)} disabled={!sel.p} aria-label="Kabupaten atau kota"><option value="">Kabupaten / Kota</option>{regs.map((x) => <option key={x.id} value={x.id}>{title(x.name)}</option>)}</select>
        <select value={sel.d} onChange={(e) => onDist(e.target.value)} disabled={!sel.r} aria-label="Kecamatan"><option value="">Kecamatan</option>{dists.map((x) => <option key={x.id} value={x.id}>{title(x.name)}</option>)}</select>
      </div>
      <div className="map-bar">
        <form onSubmit={submit} className="map-search">
          <Icon n="search" s={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ctx ? 'Cari toko, rumah, mall, stasiun… di wilayah terpilih' : 'Cari tempat, toko, hotel, mall, atau alamat…'} aria-label="Cari lokasi" autoComplete="off" />
        </form>
        <button type="button" className="btn ghost sm" onClick={locate}><Icon n="pin" s={15} />Lokasi saya</button>
      </div>
      {msg && <small className="map-msg">{msg}</small>}
      <iframe className="mapbox" title="Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{ border: 0, width: '100%', height: 340 }}
        src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=id&output=embed`} />
      <div className="map-g">
        <b>Sudah ketemu tempatnya? Simpan titiknya</b>
        <small>Klik tempat di peta Google di atas, tekan <i>Bagikan</i>, salin link/koordinatnya ke sini supaya kurir dapat titik yang tepat.</small>
        <form onSubmit={useLink}>
          <a className="btn ghost sm" href={`https://www.google.com/maps/search/${encodeURIComponent(query)}`} target="_blank" rel="noreferrer"><Icon n="pin" s={15} />Buka di Google Maps</a>
          <input value={gl} onChange={(e) => setGl(e.target.value)} placeholder="Tempel link atau koordinat (mis. -2.9761, 104.7754)" aria-label="Link atau koordinat Google Maps" />
          <button type="submit" className="btn sm" disabled={!gl.trim()}>Gunakan</button>
        </form>
      </div>
      <small className="map-hint">{value ? <>Titik antar tersimpan. <a href={mapsLink(value.lat, value.lng)} target="_blank" rel="noreferrer">Buka di Google Maps</a></> : 'Cari alamat di atas (peta Google langsung berubah), lalu tempel link untuk menyimpan titik antar.'}</small>
    </div>
  )
}
