import { useEffect, useState } from 'react'
import { api } from '../api'
import { go, rupiah } from '../utils'
import { useApp } from '../context'
import Icon from '../components/Icon'
import Steps from '../components/Steps'
import MapPicker from '../components/MapPicker'
import { PAYMENT } from '../media'

const PAY = [['Transfer Bank', 'card', 'Transfer ke rekening toko'], ['QRIS', 'qr', 'Scan dengan e-wallet atau m-banking'], ['COD (Bayar di Tempat)', 'cash', 'Bayar tunai saat pesanan tiba']]

export default function Checkout() {
  const { user, cart, refreshCart, refreshProducts, notify } = useApp()
  const [f, setF] = useState({ phone: user.phone || '', address: '', payment_method: 'Transfer Bank' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [loc, setLoc] = useState(null)
  const [auto, setAuto] = useState('')
  const [proof, setProof] = useState(null)
  const [preview, setPreview] = useState('')
  const needProof = f.payment_method !== 'COD (Bayar di Tempat)'
  useEffect(() => { // pratinjau foto bukti bayar
    if (!proof) { setPreview(''); return }
    const u = URL.createObjectURL(proof); setPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [proof])
  const pick = (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setErr('Bukti pembayaran harus berupa gambar (JPG/PNG).')
    if (file.size > 3 * 1024 * 1024) return setErr('Ukuran bukti pembayaran maksimal 3 MB.')
    setErr(''); setProof(file)
  }
  if (!cart.items.length) return <div className="page"><div className="wrap"><h1>Checkout</h1><div className="empty" style={{ marginTop: 24 }}><Icon n="cart" s={36} /><h3>Keranjang kosong</h3><button className="btn" onClick={() => go('/produk')}>Lihat produk</button></div></div></div>
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (needProof && !proof) return setErr('Unggah bukti pembayaran dulu untuk melanjutkan.')
    setBusy(true)
    try {
      await api('/checkout', { method: 'POST', body: { ...f, ...(loc ? { latitude: loc.lat, longitude: loc.lng } : {}), ...(needProof ? { proof } : {}) } })
      await Promise.all([refreshCart(), refreshProducts()])
      notify('Pesanan berhasil dibuat'); go('/pesanan')
    } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className="page"><div className="wrap"><Steps now={1} /><h1>Checkout</h1><p className="lede">Isi data pengiriman dan pilih cara bayar.</p>
      <form className="two" onSubmit={submit}>
        <div className="fcard">
          {err && <div className="err" role="alert">{err}</div>}
          <h3>Pengiriman</h3>
          <label htmlFor="ph">Nomor WhatsApp</label><input id="ph" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required />
          <label htmlFor="ad">Alamat lengkap</label><textarea id="ad" rows={4} placeholder="Jalan, nomor rumah, kelurahan, kota" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} required />
          <label>Lokasi antar di peta <span className="opt">(opsional, memudahkan kurir)</span></label>
          <MapPicker value={loc} onChange={setLoc} onAddress={(a) => { if (!f.address.trim() || f.address === auto) { setAuto(a); setF((x) => ({ ...x, address: a })) } }} />
          <h3 style={{ marginTop: 28 }}>Metode pembayaran</h3>
          <div className="pay" role="radiogroup">{PAY.map(([v, ic, d]) => (
            <label key={v} className={f.payment_method === v ? 'on' : ''}>
              <input type="radio" name="pay" checked={f.payment_method === v} onChange={() => setF({ ...f, payment_method: v })} />
              <Icon n={ic} s={22} /><span>{v}<small>{d}</small></span><span className="dot">{f.payment_method === v && <Icon n="check" s={12} w={3.4} />}</span>
            </label>))}</div>
          {needProof ? (
            <div className="proof">
              {f.payment_method === 'Transfer Bank' ? (
                <div className="proof-info"><b>Transfer ke:</b><span>{PAYMENT.bank.name} {PAYMENT.bank.number}</span><small>a.n. {PAYMENT.bank.holder} · Total {rupiah(cart.total)}</small></div>
              ) : (
                <div className="proof-info"><b>Scan QRIS:</b><img src={PAYMENT.qris} alt="QRIS toko" className="proof-qr" onError={(e) => { e.currentTarget.style.display = 'none' }} /><small>Total {rupiah(cart.total)}</small></div>
              )}
              <label htmlFor="pf">Bukti pembayaran <span className="req">(wajib)</span></label>
              <input id="pf" type="file" accept="image/*" onChange={pick} />
              {preview && <div className="proof-prev"><img src={preview} alt="Pratinjau bukti bayar" /><button type="button" className="btn ghost sm" onClick={() => setProof(null)}>Ganti / hapus</button></div>}
            </div>
          ) : <p className="proof-cod">Bayar tunai saat pesanan tiba, tidak perlu unggah bukti.</p>}
        </div>
        <div className="sum"><h3>Pesanan Anda</h3>
          {cart.items.map((l) => <div className="row" key={l.id}><span>{l.qty}× {l.product_name} {l.size_label}<br /><small style={{ color: 'var(--mut)' }}>{l.flavor}</small></span><span>{rupiah(l.subtotal)}</span></div>)}
          <div className="row tot"><span>Total</span><span>{rupiah(cart.total)}</span></div>
          <button className="btn block lg" style={{ marginTop: 18 }} disabled={busy || (needProof && !proof)}>{busy ? 'Memproses…' : 'Buat pesanan'}</button>
          {needProof && !proof && <small style={{ display: 'block', marginTop: 8, color: 'var(--red)' }}>Unggah bukti pembayaran untuk melanjutkan.</small>}
          <div className="secure"><Icon n="shield" s={15} />Data Anda hanya dipakai untuk memproses pesanan</div>
        </div>
      </form>
    </div></div>
  )
}
