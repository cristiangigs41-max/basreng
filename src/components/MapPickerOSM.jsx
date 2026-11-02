import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

// Peta OpenStreetMap + Leaflet (gratis, tanpa key). Pencarian: Overpass (semua tempat bernama di kecamatan) + Photon + Nominatim.
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/'
let leafletP
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (leafletP) return leafletP
  leafletP = new Promise((res, rej) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = CDN + 'leaflet.min.css'; document.head.appendChild(css)
    const s = document.createElement('script'); s.src = CDN + 'leaflet.min.js'
    s.onload = () => res(window.L)
    s.onerror = () => { leafletP = null; rej(new Error('Peta gagal dimuat. Periksa koneksi internet.')) }
    document.head.appendChild(s)
  })
  return leafletP
}
const NOM = 'https://nominatim.openstreetmap.org/'
const OVP = 'https://overpass-api.de/api/interpreter'
const WIL = 'https://www.emsifa.com/api-wilayah-indonesia/api/'
const ID_BOUNDS = [[-11.5, 94.5], [6.5, 141.5]]
const TYPE = { hotel: 'Hotel', guest_house: 'Penginapan', hostel: 'Hostel', motel: 'Motel', apartments: 'Apartemen', dormitory: 'Asrama / Kost', house: 'Rumah', residential: 'Perumahan',
  restaurant: 'Restoran', cafe: 'Kafe', school: 'Sekolah', university: 'Kampus', hospital: 'Rumah sakit', mall: 'Mall', supermarket: 'Swalayan', bus_station: 'Terminal', station: 'Stasiun', mosque: 'Masjid', bank: 'Bank', office: 'Kantor' }
const GENERIC = /^(kost|kos|kosan|hotel|toko|mall|rumah|penginapan|homestay|villa|apartemen|warung|resto|restoran|cafe|kafe|indekos)\s+/i
const IN_ID = (la, lo) => la >= -11.5 && la <= 6.5 && lo >= 94.5 && lo <= 141.5

const ROMAN = /^(?:i{1,3}|iv|vi{0,3}|ix|xi{0,3})$/i
const title = (t) => t.toLowerCase().replace(/(^|[\s-])([a-z]+)/g, (m, a, w) => a + (ROMAN.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).replace(/\bDki\b/, 'DKI').replace(/\bDi\b/, 'DI')
const bare = (t) => t.replace(/^(kota|kabupaten|kab\.?|kecamatan|kec\.?)\s+/i, '').trim()
const RN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 }
const arabic = (t) => t.replace(/\s([IVX]+)$/, (m, r) => RN[r] ? ' ' + RN[r] : m)
const uniq = (a) => [...new Set(a.filter(Boolean))]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const esc = (t) => t.replace(/["\\]/g, '').replace(/[.*+?^${}()|[\]]/g, '\\\\$&')
const getList = (path) => fetch(WIL + path).then((r) => { if (!r.ok) throw new Error('wilayah'); return r.json() })

function parseMapsText(t) {
  const x = decodeURIComponent(String(t).trim().replace(/\+/g, '%20'))
  const pats = [/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/, /[?&](?:q|ll|query|destination|center)=(-?\d{1,3}\.\d+)[, ]+(-?\d{1,3}\.\d+)/, /^\s*(-?\d{1,3}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)\s*$/]
  for (const re of pats) { const m = x.match(re); if (m && IN_ID(+m[1], +m[2])) return { lat: +m[1], lng: +m[2], name: (x.match(/\/maps\/place\/([^/@]+)/) || [])[1] || '' } }
  return null
}

// ── Overpass: batas kecamatan + semua tempat bernama di dalamnya ──
async function ovp(ql) {
  const r = await fetch(OVP, { method: 'POST', body: 'data=' + encodeURIComponent(ql) })
  if (!r.ok) throw new Error('overpass')
  return r.json()
}
async function overpassBox(name, parent) {
  const base = bare(name)
  const re = '^(Kecamatan )?(' + uniq([esc(base), esc(arabic(base))]).join('|') + ')$'
  const bb = parent ? `(${parent.map((v, i) => v + (i < 2 ? -0.05 : 0.05)).join(',')})` : ''
  const d = await ovp(`[out:json][timeout:25];rel["boundary"="administrative"]["name"~"${re}",i]${bb};out bb 5;`)
  const e = (d.elements || []).find((x) => x.bounds)
  return e ? [e.bounds.minlat, e.bounds.minlon, e.bounds.maxlat, e.bounds.maxlon] : null
}
const CAT = { stasiun: ['railway=station', 'public_transport=station'], terminal: ['amenity=bus_station'], mall: ['shop=mall'], supermarket: ['shop=supermarket'], minimarket: ['shop=convenience'],
  masjid: ['amenity=place_of_worship][religion=muslim'], sekolah: ['amenity=school'], kampus: ['amenity=university'], universitas: ['amenity=university'], rumah_sakit: ['amenity=hospital'], hotel: ['tourism=hotel'], penginapan: ['tourism=guest_house'],
  kost: ['building=dormitory'], bank: ['amenity=bank'], atm: ['amenity=atm'], restoran: ['amenity=restaurant'], kafe: ['amenity=cafe'], pasar: ['amenity=marketplace'], spbu: ['amenity=fuel'], apotek: ['amenity=pharmacy'], bandara: ['aeroway=aerodrome'], toko: ['shop'] }
const kindOf = (t) => t.railway === 'station' ? 'Stasiun' : t.shop === 'mall' ? 'Mall' : TYPE[t.amenity] || TYPE[t.tourism] || TYPE[t.building] || (t.shop ? 'Toko' : '')
async function ovpPlaces(q, region) {
  const bb = region.join(','), term = q.trim()
  const key = term.toLowerCase().replace(/\s+/g, '_')
  const tags = CAT[key] || CAT[term.toLowerCase().split(/\s+/)[0]] || []
  const nm = esc(term)
  const parts = [`nwr["name"~"${nm}",i](${bb});`, `nwr["addr:street"~"${nm}",i](${bb});`, `nwr["addr:housename"~"${nm}",i](${bb});`]
  tags.forEach((t) => parts.push(`nwr[${t}]["name"](${bb});`))
  const d = await ovp(`[out:json][timeout:25];(${parts.join('')});out center 30;`)
  return (d.elements || []).map((e) => {
    const t = e.tags || {}, lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon
    if (lat == null) return null
    const addr = [t['addr:street'] && (t['addr:housenumber'] ? t['addr:street'] + ' ' + t['addr:housenumber'] : t['addr:street']), t['addr:suburb'] || t['addr:subdistrict'], t['addr:city']].filter(Boolean).join(', ')
    return { name: t.name || t['addr:housename'] || addr || term, sub: t.name ? addr : '', kind: kindOf(t), lat, lng }
  }).filter(Boolean)
}
async function photon(q, { c, region }) {
  const box = region ? `${region[1]},${region[0]},${region[3]},${region[2]}` : '94.5,-11.5,141.5,6.5'
  const bias = !region && c ? `&lat=${c.lat}&lon=${c.lng}` : ''
  const r = await fetch(`https://photon.komoot.io/api/?limit=10&bbox=${box}${bias}&q=${encodeURIComponent(q)}`)
  if (!r.ok) throw new Error('photon')
  const d = await r.json()
  return (d.features || []).filter((f) => (f.properties.countrycode || 'ID') === 'ID').map((f) => {
    const p = f.properties
    const sub = [p.street && (p.housenumber ? p.street + ' ' + p.housenumber : p.street), p.district || p.locality, p.city || p.county, p.state].filter(Boolean).join(', ')
    return { name: p.name || sub || q, sub: p.name ? sub : '', kind: TYPE[p.osm_value] || '', lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }
  })
}
async function nominatim(q, { c, region }) {
  const vb = region ? `&viewbox=${region[1]},${region[2]},${region[3]},${region[0]}&bounded=1` : c ? `&viewbox=${c.lng - 1},${c.lat + 1},${c.lng + 1},${c.lat - 1}` : ''
  const r = await fetch(`${NOM}search?format=jsonv2&accept-language=id&countrycodes=id&limit=10&addressdetails=0${vb}&q=${encodeURIComponent(q)}`)
  if (!r.ok) throw new Error('nominatim')
  const d = await r.json()
  return d.map((x) => { const [first, ...rest] = x.display_name.split(', '); return { name: first, sub: rest.join(', '), kind: TYPE[x.type] || '', lat: +x.lat, lng: +x.lon } })
}
async function searchPlaces(q, ctx) {
  const variants = [q]
  const b = q.replace(GENERIC, '').trim()
  if (b && b !== q) variants.push(b)
  const out = [], seen = new Set()
  const add = (list) => list.forEach((x) => { const k = x.lat.toFixed(4) + ',' + x.lng.toFixed(4); if (!seen.has(k)) { seen.add(k); out.push({ ...x, id: k }) } })
  for (const v of variants) {
    const rs = await Promise.allSettled([...(ctx.region ? [ovpPlaces(v, ctx.region)] : []), photon(v, ctx), nominatim(v, ctx)])
    rs.forEach((x) => x.status === 'fulfilled' && add(x.value))
    if (out.length >= 8) break
  }
  return out.slice(0, 15)
}

export default function MapPickerOSM({ value, onChange, onAddress }) {
  const box = useRef(null), map = useRef(null), marker = useRef(null), cb = useRef({}), zoomId = useRef(0), regBox = useRef(null)
  const [q, setQ] = useState(''), [results, setResults] = useState([]), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false), [open, setOpen] = useState(false)
  const [provs, setProvs] = useState([]), [regs, setRegs] = useState([]), [dists, setDists] = useState([])
  const [sel, setSel] = useState({ p: '', r: '', d: '' })
  const [gl, setGl] = useState('')
  const [region, setRegion] = useState(null) // [selatan, barat, utara, timur]
  cb.current = { onChange, onAddress }

  const place = async (lat, lng, fly = true, label = '') => {
    const L = window.L
    if (!map.current) return
    if (marker.current) marker.current.setLatLng([lat, lng])
    else {
      marker.current = L.marker([lat, lng], { draggable: true }).addTo(map.current)
      marker.current.on('dragend', () => { const p = marker.current.getLatLng(); place(p.lat, p.lng, false) })
    }
    if (fly) map.current.flyTo([lat, lng], 17, { duration: 1.4 })
    cb.current.onChange({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) })
    if (label) { cb.current.onAddress?.(label); return }
    try {
      const r = await fetch(`${NOM}reverse?format=jsonv2&accept-language=id&lat=${lat}&lon=${lng}`)
      const d = await r.json()
      if (d?.display_name) cb.current.onAddress?.(d.display_name)
    } catch { /* alamat otomatis opsional */ }
  }

  useEffect(() => {
    let dead = false
    loadLeaflet().then((L) => {
      if (dead || !box.current || map.current) return
      const m = L.map(box.current, { scrollWheelZoom: false, minZoom: 4, maxBounds: ID_BOUNDS, maxBoundsViscosity: 1 })
      if (value) m.setView([value.lat, value.lng], 16); else m.fitBounds(ID_BOUNDS)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { minZoom: 4, maxZoom: 19, bounds: ID_BOUNDS, attribution: '&copy; OpenStreetMap' }).addTo(m)
      m.on('click', (e) => place(e.latlng.lat, e.latlng.lng, false))
      map.current = m
      if (value) { marker.current = L.marker([value.lat, value.lng], { draggable: true }).addTo(m); marker.current.on('dragend', () => { const p = marker.current.getLatLng(); place(p.lat, p.lng, false) }) }
      setTimeout(() => m.invalidateSize(), 200)
    }).catch((e) => setMsg(e.message))
    return () => { dead = true; if (map.current) { map.current.remove(); map.current = null; marker.current = null } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { getList('provinces.json').then(setProvs).catch(() => setMsg('Daftar provinsi tidak bisa dimuat. Anda tetap bisa mencari langsung.')) }, [])

  // ── zoom ke wilayah: Overpass (kecamatan) → Nominatim → Photon → mundur ke induk ──
  const findBox = async (qq, parent) => {
    const vb = parent ? `&viewbox=${parent[1] - 0.05},${parent[2] + 0.05},${parent[3] + 0.05},${parent[0] - 0.05}&bounded=1` : ''
    const r = await fetch(`${NOM}search?format=jsonv2&countrycodes=id&limit=5${vb}&q=${encodeURIComponent(qq)}`)
    if (!r.ok) throw new Error('nominatim')
    const d = await r.json()
    const hit = d.find((x) => x.boundingbox && (x.category === 'boundary' || x.category === 'place')) || d.find((x) => x.boundingbox)
    if (!hit) return null
    const b = hit.boundingbox.map(Number)
    return [b[0], b[2], b[1], b[3]]
  }
  const photonBox = async (qq) => {
    const r = await fetch(`https://photon.komoot.io/api/?limit=3&bbox=94.5,-11.5,141.5,6.5&q=${encodeURIComponent(qq)}`)
    if (!r.ok) return null
    const d = await r.json()
    const f = (d.features || []).find((x) => x.properties?.extent) || (d.features || [])[0]
    if (!f) return null
    const e = f.properties.extent
    if (e) return [e[3], e[0], e[1], e[2]]
    const [lo, la] = f.geometry.coordinates
    return [la - 0.02, lo - 0.02, la + 0.02, lo + 0.02]
  }
  const fitRegion = (bb, maxZoom = 15) => { setRegion(bb); map.current?.flyToBounds([[bb[0], bb[1]], [bb[2], bb[3]]], { duration: 1.4, maxZoom }) }
  const zoomTo = async (cands, parent = null, ovName = '') => {
    const id = ++zoomId.current
    if (!cands || !cands.length) { setRegion(null); setMsg(''); map.current?.flyToBounds(ID_BOUNDS, { duration: 1.2 }); return null }
    let bb = null
    if (ovName) { try { bb = await overpassBox(ovName, parent) } catch { /* lanjut */ } }
    if (id !== zoomId.current) return null
    for (const c of bb ? [] : cands) {
      try { bb = await findBox(c, parent) } catch { /* variasi berikutnya */ }
      if (id !== zoomId.current) return null
      if (bb) break
      await sleep(350)
    }
    if (!bb) { try { bb = await photonBox(cands[cands.length > 1 ? 1 : 0]) } catch { /* abaikan */ } }
    if (id !== zoomId.current) return null
    if (!bb) {
      if (parent) { fitRegion(parent); setMsg('Batas kecamatan ini belum ada di peta, pencarian memakai wilayah kota/kabupaten. Ketik nama jalan atau klik peta.') }
      else setMsg('Wilayah tidak ditemukan di peta. Coba cari langsung.')
      return null
    }
    setMsg(''); fitRegion(bb)
    return bb
  }
  const nameOf = (list, id) => title(list.find((x) => x.id === id)?.name || '')
  const onProv = (id) => {
    setSel({ p: id, r: '', d: '' }); setRegs([]); setDists([]); setQ(''); setResults([]); regBox.current = null
    if (id) getList(`regencies/${id}.json`).then(setRegs).catch(() => setMsg('Daftar kabupaten/kota gagal dimuat.'))
    zoomTo(id ? [`${nameOf(provs, id)}, Indonesia`] : null)
  }
  const onReg = async (id) => {
    setSel((x) => ({ ...x, r: id, d: '' })); setDists([]); setQ(''); setResults([]); regBox.current = null
    if (id) getList(`districts/${id}.json`).then(setDists).catch(() => { /* opsional */ })
    const p = nameOf(provs, sel.p), r = nameOf(regs, id)
    regBox.current = await zoomTo(id ? uniq([`${r}, ${p}, Indonesia`, `${bare(r)}, ${p}`]) : [`${p}, Indonesia`])
  }
  const onDist = (id) => {
    setSel((x) => ({ ...x, d: id })); setQ(''); setResults([])
    const p = nameOf(provs, sel.p), r = nameOf(regs, sel.r), rb = bare(r)
    if (!id) return zoomTo(uniq([`${r}, ${p}, Indonesia`, `${rb}, ${p}`]))
    const d = nameOf(dists, id)
    zoomTo(uniq([`${d}, ${rb}, ${p}`, `Kecamatan ${d}, ${rb}`, `${d}, ${rb}`, `${arabic(d)}, ${rb}`]), regBox.current, d)
  }

  // ── pencarian otomatis (≥ 3 huruf) ──
  useEffect(() => {
    const term = q.trim()
    if (term.length < 3) return
    let dead = false
    const t = setTimeout(async () => {
      setBusy(true)
      try {
        const list = await searchPlaces(term, { c: map.current && map.current.getZoom() >= 9 ? map.current.getCenter() : null, region })
        if (dead) return
        setResults(list); setOpen(true)
        setMsg(list.length ? '' : 'Tempat tidak ditemukan. Coba nama jalan / kecamatan / kota, lalu geser pin ke titik yang tepat.')
      } catch { if (!dead) setMsg('Pencarian gagal. Klik langsung di peta untuk memilih lokasi.') }
      if (!dead) setBusy(false)
    }, 400)
    return () => { dead = true; clearTimeout(t) }
  }, [q, region])
  const shown = q.trim().length >= 3 ? results : []
  const pick = (r) => { setOpen(false); setResults([]); setQ(r.name); place(r.lat, r.lng, true, [r.name, r.sub].filter(Boolean).join(', ')) }
  const search = (e) => { e.preventDefault(); if (shown[0]) pick(shown[0]) }
  const useGoogle = async (e) => {
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
    if (!hit) return setMsg('Lokasi tidak terbaca. Di Google Maps tekan lama titiknya lalu salin koordinat, atau salin link dari kolom alamat browser.')
    setMsg(''); setGl(''); place(hit.lat, hit.lng, true, hit.name)
  }
  const gmapsQuery = q.trim() || [nameOf(dists, sel.d), nameOf(regs, sel.r), nameOf(provs, sel.p)].filter(Boolean).join(', ')
  const locate = () => {
    if (!navigator.geolocation) return setMsg('Browser tidak mendukung lokasi otomatis.')
    setMsg('Mencari lokasi Anda…')
    navigator.geolocation.getCurrentPosition(
      (p) => { setMsg(''); place(p.coords.latitude, p.coords.longitude) },
      () => setMsg('Izin lokasi ditolak. Cari alamat atau klik langsung di peta.'),
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
        <form onSubmit={search} className="map-search">
          <Icon n="search" s={16} />
          <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            placeholder={sel.p ? 'Cari tempat / alamat di wilayah terpilih…' : 'Cari tempat, toko, hotel, mall, atau alamat…'} aria-label="Cari lokasi" autoComplete="off" role="combobox" aria-expanded={open && shown.length > 0} />
          {busy && <span className="spin map-spin" aria-label="Mencari" />}
          {open && shown.length > 0 && (
            <ul className="map-res" role="listbox">{shown.map((r) => (
              <li key={r.id} role="option"><button type="button" onClick={() => pick(r)}><Icon n="pin" s={16} /><span><b>{r.name}</b>{r.kind && <em>{r.kind}</em>}<small>{r.sub}</small></span></button></li>))}
            </ul>)}
        </form>
        <button type="button" className="btn ghost sm" onClick={locate}><Icon n="pin" s={15} />Lokasi saya</button>
      </div>
      {msg && <small className="map-msg">{msg}</small>}
      <div className="mapbox" ref={box} />
      <div className="map-g">
        <b>Tempat tidak ketemu? Cari di Google Maps</b>
        <small>Buka Google Maps, pilih tempatnya, lalu salin <i>Bagikan</i> link atau koordinatnya ke sini.</small>
        <form onSubmit={useGoogle}>
          <a className="btn ghost sm" href={`https://www.google.com/maps/search/${encodeURIComponent(gmapsQuery || 'Indonesia')}`} target="_blank" rel="noreferrer"><Icon n="pin" s={15} />Buka Google Maps</a>
          <input value={gl} onChange={(e) => setGl(e.target.value)} placeholder="Tempel link atau koordinat (mis. -2.9761, 104.7754)" aria-label="Link atau koordinat Google Maps" />
          <button type="submit" className="btn sm" disabled={!gl.trim()}>Gunakan</button>
        </form>
      </div>
      <small className="map-hint">{value ? 'Titik antar dipilih. Geser pin untuk menyesuaikan.' : 'Klik peta, cari alamat, atau pakai "Lokasi saya" untuk menandai titik antar.'}</small>
    </div>
  )
}
