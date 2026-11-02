import { useState } from 'react'
import { fdate, rupiah, NEXT_STEP, isCod } from '../utils'
import { mediaUrl } from '../api'
import { Empty } from './AdminUI'
import OrderDetail from './OrderDetail'

export default function OrderTable({ list, onStatus }) {
  const [detail, setDetail] = useState(null)
  const open = detail && list.find((x) => x.id === detail)
  if (!list.length) return <Empty icon="receipt" title="Belum ada pesanan" text="Pesanan yang masuk akan tampil di sini." />
  return (<>
    <div className="tbl-wrap"><table className="tbl tbl-orders"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Item</th><th className="num">Total</th><th>Status</th></tr></thead><tbody>
      {list.map((o) => (
        <tr key={o.id}>
          <td data-label="Pesanan"><b className="code">{o.code}</b><small>{fdate(o.created_at)}</small></td>
          <td data-label="Pelanggan"><b>{o.customer}</b><small>{o.phone}</small>{onStatus && <><small>{o.address}</small><button type="button" className="proof-link od-open" onClick={() => setDetail(o.id)}>Detail &amp; lokasi pembeli</button><small className="pay-l">{o.payment_method} • {o.payment_status}</small>{o.proof && <a className="proof-link" href={mediaUrl(o.proof)} target="_blank" rel="noreferrer">Lihat bukti bayar</a>}</>}</td>
          <td data-label="Item">{o.items.map((it, i) => <small key={i} className="it">{it.qty}× {it.product_name} {it.size_label} ({it.flavor})</small>)}</td>
          <td className="num" data-label="Total"><b>{rupiah(o.total)}</b></td>
          <td data-label="Status">{onStatus ? <StatusActions o={o} onStatus={onStatus} /> : <span className={'st ' + o.status}>{o.status}</span>}</td>
        </tr>
      ))}
    </tbody></table></div>
    {open && <OrderDetail o={open} onClose={() => setDetail(null)} />}
  </>)
}

// Tombol alur status: Proses → Kirim → Selesai (+ Batalkan). "Selesai" untuk COD menunggu bukti bayar ke pengantar.
function StatusActions({ o, onStatus }) {
  const next = NEXT_STEP[o.status]
  const wait = next && next[0] === 'Selesai' && isCod(o) && !o.delivery_proof
  const cancel = () => { if (window.confirm(`Batalkan pesanan ${o.code}? Stok akan dikembalikan.`)) onStatus(o.id, 'Dibatalkan') }
  return (
    <div className="st-act">
      <span className={'st ' + o.status}>{o.status}</span>
      {next && <button type="button" className="btn sm st-next" disabled={wait} onClick={() => onStatus(o.id, next[0])}>{next[1]}</button>}
      {wait && <small className="st-wait">Menunggu pelanggan upload bukti bayar ke pengantar</small>}
      {next && <button type="button" className="st-cancel" onClick={cancel}>Batalkan</button>}
    </div>
  )
}
