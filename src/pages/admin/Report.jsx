import { useState } from 'react'
import { useFetch } from '../../hooks'
import OrderTable from '../../components/OrderTable'
import { rupiah } from '../../utils'
import Icon from '../../components/Icon'
import { PageHead, Loading } from '../../components/AdminUI'

const iso = (d) => d.toISOString().slice(0, 10)
const ago = (n) => iso(new Date(Date.now() - n * 864e5))

export default function Report() {
  const [from, setFrom] = useState(() => ago(6))
  const [to, setTo] = useState(() => iso(new Date()))
  const { data, err } = useFetch(`/admin/report?from=${from}&to=${to}`)
  const preset = (n) => { setFrom(ago(n)); setTo(iso(new Date())) }
  const month = () => { const d = new Date(); setFrom(iso(new Date(d.getFullYear(), d.getMonth(), 2))); setTo(iso(d)) }
  const avg = data && data.count ? data.total / data.count : 0
  return (<>
    <PageHead eyebrow="Penjualan" title="Laporan Penjualan" sub="Rekap pesanan selesai dan pendapatan berdasarkan periode.">
      <button className="btn ghost" onClick={() => window.print()}><Icon n="print" s={16} />Cetak</button>
    </PageHead>

    <section className="panel filter-bar">
      <div className="presets">
        <button onClick={() => preset(6)}>7 hari</button><button onClick={() => preset(29)}>30 hari</button><button onClick={month}>Bulan ini</button>
      </div>
      <div className="range">
        <Icon n="calendar" s={17} w={1.5} />
        <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} aria-label="Dari tanggal" />
        <span>s/d</span>
        <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} aria-label="Sampai tanggal" />
      </div>
    </section>

    {err && <div className="err">{err}</div>}
    {!data && !err ? <Loading /> : data && <>
      <div className="mini-stats three">
        <div><b>{data.count}</b><small>Pesanan selesai</small></div>
        <div className="gold"><b>{rupiah(data.total)}</b><small>Total pendapatan</small></div>
        <div><b>{rupiah(Math.round(avg))}</b><small>Rata-rata per pesanan</small></div>
      </div>
      <section className="panel"><div className="panel-h"><h3>Rincian pesanan</h3></div><OrderTable list={data.orders || []} /></section>
    </>}
  </>)
}
