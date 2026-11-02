import { useEffect, useState } from 'react'
import { api } from '../api'
import { mediaUrl } from '../api'
import { go, fdate, rupiah, isCod } from '../utils'
import { useApp } from '../context'
import Icon from '../components/Icon'

export default function MyOrders() {
  const [orders, setOrders] = useState(null)
  const [err, setErr] = useState('')
  const [up, setUp] = useState(0)
  const { notify } = useApp()
  useEffect(() => { api('/orders').then(setOrders).catch((e) => setErr(e.message)) }, [])
  const upload = async (o, e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return notify('Bukti harus berupa gambar (JPG/PNG).', 'error')
    if (file.size > 3 * 1024 * 1024) return notify('Ukuran bukti maksimal 3 MB.', 'error')
    setUp(o.id)
    try { const n = await api(`/orders/${o.id}/delivery-proof`, { method: 'POST', body: { proof: file } }); setOrders((l) => l.map((x) => (x.id === o.id ? n : x))); notify('Bukti pembayaran ke pengantar terkirim') } catch (x) { notify(x.message, 'error') }
    setUp(0)
  }
  return (
    <div className="page"><div className="wrap"><h1>Pesanan saya</h1><p className="lede">Pantau status pesanan dari diproses sampai tiba.</p>
      {err && <div className="err">{err}</div>}
      {orders === null && !err ? <div className="loading" role="status"><span className="spin" />Memuat…</div> : orders && !orders.length ? (
        <div className="empty"><Icon n="receipt" s={36} /><h3>Belum ada pesanan</h3><p>Pesanan yang kamu buat akan muncul di sini.</p><button className="btn" onClick={() => go('/produk')}>Pesan sekarang</button></div>
      ) : (
        <div className="list">{(orders || []).map((o) => (
          <div className="order" key={o.id}>
            <div><span className="code">{o.code}</span><small>{fdate(o.created_at)} · {o.payment_method} ({o.payment_status}){o.proof && <> · <a className="proof-link" href={mediaUrl(o.proof)} target="_blank" rel="noreferrer">Bukti bayar</a></>}</small>
              <small>{o.latitude != null && <a className="proof-link" href={`https://www.google.com/maps?q=${o.latitude},${o.longitude}`} target="_blank" rel="noreferrer">Lihat lokasi di peta</a>}</small>
              {o.status === 'Dikirim' && isCod(o) && (o.delivery_proof
                ? <div className="dp ok"><Icon n="check" s={16} />Bukti bayar ke pengantar terkirim. <a className="proof-link" href={mediaUrl(o.delivery_proof)} target="_blank" rel="noreferrer">Lihat</a></div>
                : <div className="dp"><b>Pesanan sedang dikirim</b><small>Setelah membayar ke pengantar, unggah foto bukti pembayaran agar pesanan bisa diselesaikan.</small>
                  <label className="btn sm">{up === o.id ? 'Mengunggah…' : 'Unggah bukti bayar ke pengantar'}<input type="file" accept="image/*" hidden disabled={up === o.id} onChange={(e) => upload(o, e)} /></label></div>)}
              {o.status === 'Selesai' && o.delivery_proof && <small><a className="proof-link" href={mediaUrl(o.delivery_proof)} target="_blank" rel="noreferrer">Bukti bayar ke pengantar</a></small>}
              <div style={{ marginTop: 10 }}>{o.items.map((it, i) => <small key={i}>{it.qty}× {it.product_name} {it.size_label} ({it.flavor})</small>)}</div></div>
            <div style={{ textAlign: 'right' }}><span className={'st ' + o.status}>{o.status}</span><div className="price" style={{ marginTop: 8 }}>{rupiah(o.total)}</div></div>
          </div>))}
        </div>
      )}
    </div></div>
  )
}
