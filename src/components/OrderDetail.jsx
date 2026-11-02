import { useEffect } from 'react'
import { fdate, rupiah, isCod } from '../utils'
import { mediaUrl } from '../api'
import Icon from './Icon'

// Detail pesanan untuk admin: data pembeli, lokasi di Google Maps, dan semua bukti pembayaran.
export default function OrderDetail({ o, onClose }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])
  const has = o.latitude != null
  const q = has ? `${o.latitude},${o.longitude}` : o.address
  const cod = isCod(o)
  return (
    <div className="od-back" onClick={onClose} role="presentation">
      <div className="od" role="dialog" aria-modal="true" aria-label={'Detail pesanan ' + o.code} onClick={(e) => e.stopPropagation()}>
        <header><div><b className="code">{o.code}</b><small>{fdate(o.created_at)} · <span className={'st ' + o.status}>{o.status}</span></small></div><button className="od-x" onClick={onClose} aria-label="Tutup">×</button></header>
        <div className="od-body">
          <section>
            <h4>Pembeli</h4>
            <p><b>{o.customer}</b><br />{o.phone && <a href={'https://wa.me/' + String(o.phone).replace(/^0/, '62').replace(/\D/g, '')} target="_blank" rel="noreferrer">{o.phone} (WhatsApp)</a>}</p>
            <h4>Lokasi pembeli</h4>
            <p>{o.address}</p>
            <iframe title="Lokasi pembeli" className="od-map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${encodeURIComponent(q)}&hl=id&z=17&output=embed`} />
            <a className="btn ghost sm" href={has ? `https://www.google.com/maps/dir/?api=1&destination=${q}` : `https://www.google.com/maps/search/${encodeURIComponent(o.address)}`} target="_blank" rel="noreferrer"><Icon n="pin" s={15} />{has ? 'Rute ke lokasi' : 'Cari alamat di Google Maps'}</a>
            {!has && <small className="od-note">Pembeli tidak menandai titik di peta; peta dicari dari alamat.</small>}
          </section>
          <section>
            <h4>Pesanan</h4>
            <ul className="od-items">{o.items.map((it, i) => <li key={i}>{it.qty}× {it.product_name} {it.size_label} ({it.flavor}) <b>{rupiah(it.subtotal)}</b></li>)}</ul>
            <p className="od-total">Total <b>{rupiah(o.total)}</b></p>
            <h4>Pembayaran</h4>
            <p>{o.payment_method} · {o.payment_status}</p>
            {o.proof && <><small>Bukti bayar saat checkout</small><a href={mediaUrl(o.proof)} target="_blank" rel="noreferrer"><img className="od-img" src={mediaUrl(o.proof)} alt="Bukti bayar checkout" /></a></>}
            {cod && (o.delivery_proof
              ? <><small>Bukti bayar ke pengantar</small><a href={mediaUrl(o.delivery_proof)} target="_blank" rel="noreferrer"><img className="od-img" src={mediaUrl(o.delivery_proof)} alt="Bukti bayar ke pengantar" /></a></>
              : <p className="od-warn">Belum ada bukti bayar ke pengantar. Pesanan baru bisa diselesaikan setelah pelanggan mengunggahnya{o.status === 'Dikirim' ? '.' : ' (saat status Dikirim).'}</p>)}
          </section>
        </div>
      </div>
    </div>
  )
}
