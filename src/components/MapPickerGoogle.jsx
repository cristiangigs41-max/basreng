import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

// ── Google Maps langsung (Maps JavaScript API + Places + Geocoding) ──
// Isi VITE_GOOGLE_MAPS_KEY di file .env. API yang harus diaktifkan di Google Cloud:
//   Maps JavaScript API, Places API (New), Geocoding API.
const GKEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
const ID_BOUNDS = { north: 6.5, south: -11.5, west: 94.5, east: 141.5 }

let gP
function loadGoogle() {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google)
  if (gP) return gP
  gP = new Promise((res, rej) => {
    window.__gmInit = () => res(window.google)
    window.gm_authFailure = () => rej(new Error('API key Google Maps ditolak. Cek key, penagihan (billing), dan API yang diaktifkan.'))
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GKEY)}&loading=async&v=weekly&language=id&region=ID&callback=__gmInit`
    s.async = true
    s.onerror = () => { gP = null; rej(new Error('Google Maps gagal dimuat. Periksa koneksi internet.')) }
    document.head.appendChild(s)
  })
  return gP
}

export const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`

// ── Tempel link / koordinat dari Google Maps (dipakai bila key belum diisi) ──
const IN_ID = (la, lo) => la >= -11.5 && la <= 6.5 && lo >= 94.5 && lo <= 141.5
function parseMapsText(t) {
  const x = decodeURIComponent(String(t).trim().replace(/\+/g, '%20'))
  const pats = [/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/, /[?&](?:q|ll|query|destination|center)=(-?\d{1,3}\.\d+)[, ]+(-?\d{1,3}\.\d+)/, /^\s*(-?\d{1,3}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)\s*$/]
  for (const re of pats) { const m = x.match(re); if (m && IN_ID(+m[1], +m[2])) return { lat: +m[1], lng: +m[2], name: (x.match(/\/maps\/place\/([^/@]+)/) || [])[1] || '' } }
  return null
}

// ── Pilih wilayah (provinsi → kabupaten/kota → kecamatan), data: api-wilayah-indonesia ──
const WIL = 'https://www.emsifa.com/api-wilayah-indonesia/api/'
const ROMAN = /^(?:i{1,3}|iv|vi{0,3}|ix|xi{0,3})$/i
const title = (t) => t.toLowerCase().replace(/(^|[\s-])([a-z]+)/g, (m, a, w) => a + (ROMAN.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1))).replace(/\bDki\b/, 'DKI').replace(/\bDi\b/, 'DI')
const bare = (t) => t.replace(/^(kota|kabupaten|kab\.?|kecamatan|kec\.?)\s+/i, '').trim()
const ROMAN_NUM = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 }
const arabic = (t) => t.replace(/\s([IVX]+)$/, (m, r) => ROMAN_NUM[r] ? ' ' + ROMAN_NUM[r] : m)
const uniq = (a) => [...new Set(a.filter(Boolean))]
const getList = (path) => fetch(WIL + path).then((r) => { if (!r.ok) throw new Error('wilayah'); return r.json() })

export default function MapPicker({ value, onChange, onAddress }) {
  const box = useRef(null)
  const acBox = useRef(null)
  const g = useRef({ map: null, marker: null, geocoder: null, ac: null, Place: null })
  const cb = useRef({})
  const zoomId = useRef(0)
  const [msg, setMsg] = useState('')
  const [ready, setReady] = useState(false)
  const [provs, setProvs] = useState([])
  const [regs, setRegs] = useState([])
  const [dists, setDists] = useState([])
  const [sel, setSel] = useState({ p: '', r: '', d: '' })
  const [gl, setGl] = useState('')
  const [frame, setFrame] = useState('') // peta tanpa key: pencarian untuk iframe Google Maps
  cb.current = { onChange, onAddress }

  // Letakkan pin, geser peta, isi koordinat + alamat.
  const place = async (lat, lng, fly = true, label = '') => {
    const { map, geocoder } = g.current
    const gm = window.google?.maps
    if (!map || !gm) return
    const pos = { lat, lng }
    if (g.current.marker) g.current.marker.setPosition(pos)
    else {
      g.current.marker = new gm.Marker({ position: pos, map, draggable: true })
      g.current.marker.addListener('dragend', () => { const p = g.current.marker.getPosition(); place(p.lat(), p.lng(), false) })
    }
    if (fly) { map.panTo(pos); if (map.getZoom() < 17) map.setZoom(17) }
    cb.current.onChange({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) })
    if (label) { cb.current.onAddress?.(label); return }
    try { // alamat dari titik peta
      const { results } = await geocoder.geocode({ location: pos })
      if (results?.[0]) cb.current.onAddress?.(results[0].formatted_address)
    } catch { /* alamat otomatis opsional */ }
  }

  // Muat peta Google + kotak pencarian Google Places.
  useEffect(() => {
    if (!GKEY) return
    let dead = false
    ;(async () => {
      try {
        const gg = await loadGoogle()
        const [{ Map }, places] = await Promise.all([gg.maps.importLibrary('maps'), gg.maps.importLibrary('places'), gg.maps.importLibrary('geocoding'), gg.maps.importLibrary('marker')])
        if (dead || !box.current) return
        const map = new Map(box.current, {
          center: value || { lat: -2.5, lng: 118 }, zoom: value ? 16 : 5, minZoom: 4,
          restriction: { latLngBounds: ID_BOUNDS, strictBounds: false },
          mapTypeControl: false, streetViewControl: false, fullscreenControl: false, gestureHandling: 'cooperative', clickableIcons: true,
        })
        g.current = { ...g.current, map, geocoder: new gg.maps.Geocoder(), Place: places.Place }
        if (value) place(value.lat, value.lng, false, '') // pin awal
        // klik titik kosong atau ikon tempat (toko, mall, stasiun, dst.) seperti Google Maps asli
        map.addListener('click', async (e) => {
          if (e.placeId) {
            e.stop()
            try {
              const pl = new places.Place({ id: e.placeId })
              await pl.fetchFields({ fields: ['location', 'displayName', 'formattedAddress'] })
              return place(pl.location.lat(), pl.location.lng(), false, [pl.displayName, pl.formattedAddress].filter(Boolean).join(', '))
            } catch { /* jatuh ke titik biasa */ }
          }
          place(e.latLng.lat(), e.latLng.lng(), false)
        })
        // kotak pencarian resmi Google (autocomplete: jalan, toko, rumah, mall, stasiun, dst.)
        const ac = new places.PlaceAutocompleteElement({ includedRegionCodes: ['id'] })
        ac.locationRestriction = ID_BOUNDS
        try { ac.placeholder = 'Cari tempat / alamat di wilayah terpilih…' } catch { /* versi lama */ }
        ac.style.colorScheme = 'light'
        const onSel = async (ev) => {
          try {
            const pl = ev.placePrediction ? ev.placePrediction.toPlace() : ev.place
            await pl.fetchFields({ fields: ['location', 'displayName', 'formattedAddress'] })
            place(pl.location.lat(), pl.location.lng(), true, [pl.displayName, pl.formattedAddress].filter(Boolean).join(', '))
            setMsg('')
          } catch { setMsg('Gagal membuka lokasi tersebut. Coba pilih yang lain.') }
        }
        ac.addEventListener('gmp-select', onSel)
        ac.addEventListener('gmp-placeselect', onSel)
        acBox.current?.appendChild(ac)
        g.current.ac = ac
        setReady(true)
      } catch (e) { if (!dead) setMsg(e.message) }
    })()
    return () => { dead = true; g.current.ac?.remove(); g.current = { map: null, marker: null, geocoder: null, ac: null, Place: null } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { getList('provinces.json').then(setProvs).catch(() => setMsg('Daftar provinsi tidak bisa dimuat. Anda tetap bisa mencari langsung.')) }, [])

  // Peta terbang ke wilayah terpilih dan pencarian Google dibatasi di dalamnya.
  const zoomTo = async (cands, fallback = null) => {
    const id = ++zoomId.current
    const { map, geocoder, ac } = g.current
    if (!GKEY) { setFrame((cands && cands[0]) || ''); return }
    if (!map) return
    if (!cands) { ac && (ac.locationRestriction = ID_BOUNDS); map.fitBounds(ID_BOUNDS); setMsg(''); return }
    for (const address of cands) {
      try {
        const { results } = await geocoder.geocode({ address, region: 'ID' })
        if (id !== zoomId.current) return
        const vp = results?.[0]?.geometry?.viewport
        if (vp) { map.fitBounds(vp); ac && (ac.locationRestriction = vp.toJSON()); setMsg(''); return }
      } catch { if (id !== zoomId.current) return }
    }
    if (fallback) { map.fitBounds(fallback); ac && (ac.locationRestriction = fallback.toJSON()) }
    setMsg('Wilayah tidak ditemukan di Google Maps. Coba ketik nama tempatnya langsung.')
  }
  const nameOf = (list, id) => title(list.find((x) => x.id === id)?.name || '')
  const onProv = (id) => {
    setSel({ p: id, r: '', d: '' }); setRegs([]); setDists([])
    if (id) getList(`regencies/${id}.json`).then(setRegs).catch(() => setMsg('Daftar kabupaten/kota gagal dimuat.'))
    zoomTo(id ? [`${nameOf(provs, id)}, Indonesia`] : null)
  }
  const onReg = (id) => {
    setSel((x) => ({ ...x, r: id, d: '' })); setDists([])
    if (id) getList(`districts/${id}.json`).then(setDists).catch(() => { /* kecamatan opsional */ })
    const p = nameOf(provs, sel.p), r = nameOf(regs, id)
    zoomTo(id ? uniq([`${r}, ${p}, Indonesia`, `${bare(r)}, ${p}, Indonesia`]) : [`${p}, Indonesia`])
  }
  const onDist = (id) => {
    setSel((x) => ({ ...x, d: id }))
    const p = nameOf(provs, sel.p), r = nameOf(regs, sel.r), rb = bare(r)
    if (!id) return zoomTo(uniq([`${r}, ${p}, Indonesia`, `${rb}, ${p}, Indonesia`]))
    const d = nameOf(dists, id)
    zoomTo(uniq([`Kecamatan ${d}, ${rb}, ${p}, Indonesia`, `${d}, ${rb}, ${p}, Indonesia`, `Kecamatan ${arabic(d)}, ${rb}, ${p}, Indonesia`, `${arabic(d)}, ${rb}, ${p}`]))
  }

  const locate = () => {
    if (!navigator.geolocation) return setMsg('Browser tidak mendukung lokasi otomatis.')
    setMsg('Mencari lokasi Anda…')
    navigator.geolocation.getCurrentPosition(
      (p) => { setMsg(''); place(p.coords.latitude, p.coords.longitude) },
      () => setMsg('Izin lokasi ditolak. Cari alamat atau klik langsung di peta.'),
      { enableHighAccuracy: true, timeout: 12000 })
  }

  // Tanpa key: tempel link/koordinat dari Google Maps.
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
      } catch { /* ditangani di bawah */ }
    }
    if (!hit) return setMsg('Lokasi tidak terbaca. Di Google Maps tekan lama titiknya lalu salin koordinat, atau salin link dari kolom alamat browser.')
    setMsg(''); setGl(''); cb.current.onChange({ lat: +hit.lat.toFixed(6), lng: +hit.lng.toFixed(6) }); setFrame(`${hit.lat},${hit.lng}`)
    cb.current.onAddress?.(hit.name ? decodeURIComponent(hit.name.replace(/\+/g, ' ')) : `${hit.lat}, ${hit.lng}`)
  }
  const gmapsQuery = [nameOf(dists, sel.d), nameOf(regs, sel.r), nameOf(provs, sel.p)].filter(Boolean).join(', ')

  return (
    <div className="mappick">
      <div className="map-reg">
        <select value={sel.p} onChange={(e) => onProv(e.target.value)} aria-label="Provinsi"><option value="">Pilih provinsi</option>{provs.map((x) => <option key={x.id} value={x.id}>{title(x.name)}</option>)}</select>
        <select value={sel.r} onChange={(e) => onReg(e.target.value)} disabled={!sel.p} aria-label="Kabupaten atau kota"><option value="">Kabupaten / Kota</option>{regs.map((x) => <option key={x.id} value={x.id}>{title(x.name)}</option>)}</select>
        <select value={sel.d} onChange={(e) => onDist(e.target.value)} disabled={!sel.r} aria-label="Kecamatan"><option value="">Kecamatan</option>{dists.map((x) => <option key={x.id} value={x.id}>{title(x.name)}</option>)}</select>
      </div>

      {GKEY ? (
        <>
          <div className="map-bar">
            <div className="map-search gsearch" ref={acBox} />
            <button type="button" className="btn ghost sm" onClick={locate}><Icon n="pin" s={15} />Lokasi saya</button>
          </div>
          {msg && <small className="map-msg">{msg}</small>}
          <div className="mapbox" ref={box}>{!ready && !msg && <span className="spin" style={{ margin: 20 }} aria-label="Memuat peta" />}</div>
        </>
      ) : (
        <>
          <div className="map-g">
            <b>Google Maps belum aktif penuh</b>
            <small>Isi <code>VITE_GOOGLE_MAPS_KEY</code> di file <code>.env</code> agar bisa mencari &amp; menandai titik langsung di peta Google. Sementara itu: pilih wilayah, buka Google Maps, lalu tempel link/koordinat.</small>
          </div>
          <iframe className="mapbox" title="Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade" style={{ border: 0, width: '100%' }}
            src={`https://www.google.com/maps?q=${encodeURIComponent(frame || gmapsQuery || 'Indonesia')}&hl=id&output=embed`} />
          {msg && <small className="map-msg">{msg}</small>}
          <div className="map-g">
            <form onSubmit={useGoogle}>
              <a className="btn ghost sm" href={`https://www.google.com/maps/search/${encodeURIComponent(gmapsQuery || 'Indonesia')}`} target="_blank" rel="noreferrer"><Icon n="pin" s={15} />Buka Google Maps</a>
              <input value={gl} onChange={(e) => setGl(e.target.value)} placeholder="Tempel link atau koordinat (mis. -2.9761, 104.7754)" aria-label="Link atau koordinat Google Maps" />
              <button type="submit" className="btn sm" disabled={!gl.trim()}>Gunakan</button>
            </form>
          </div>
        </>
      )}
      <small className="map-hint">{value ? <>Titik antar dipilih. {GKEY && 'Geser pin untuk menyesuaikan. '}<a href={mapsLink(value.lat, value.lng)} target="_blank" rel="noreferrer">Buka di Google Maps</a></> : 'Cari alamat, klik peta (termasuk ikon toko/mall/stasiun), atau pakai "Lokasi saya" untuk menandai titik antar.'}</small>
    </div>
  )
}
