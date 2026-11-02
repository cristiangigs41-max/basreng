import { useFetch } from '../../hooks'
import OrderTable from '../../components/OrderTable'
import { rupiah, go } from '../../utils'
import Icon from '../../components/Icon'
import { PageHead, Empty, Loading } from '../../components/AdminUI'
import { useApp } from '../../context'

const hari = () => { const h = new Date().getHours(); return h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 19 ? 'Selamat sore' : 'Selamat malam' }

export default function Dashboard() {
  const { user } = useApp()
  const { data: s, err } = useFetch('/admin/stats')
  if (err) return <div className="err">{err}</div>
  if (!s) return <Loading />
  const max = Math.max(...s.sales.map((d) => d.total), 1)
  const week = s.sales.reduce((a, d) => a + d.total, 0)
  const topMax = Math.max(...s.top.map((t) => t.qty), 1)
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return (<>
    <PageHead eyebrow={today} title={`${hari()}, ${user?.name?.split(' ')[0] || 'Admin'}`} sub="Ringkasan performa toko Anda hari ini." />

    <section className="hero-kpi">
      <div className="hk-main">
        <span className="hk-l"><Icon n="crown" s={15} w={1.6} />Total pendapatan</span>
        <b>{rupiah(s.revenue)}</b>
        <small>{rupiah(week)} dalam 7 hari terakhir</small>
      </div>
      <div className="hk-grid">
        <div><Icon n="box" s={19} w={1.5} /><b>{s.products}</b><small>Produk</small></div>
        <div><Icon n="users" s={19} w={1.5} /><b>{s.customers}</b><small>Pelanggan</small></div>
        <div><Icon n="receipt" s={19} w={1.5} /><b>{s.orders}</b><small>Pesanan</small></div>
      </div>
    </section>

    <div className="a-cols">
      <section className="panel">
        <div className="panel-h"><h3>Penjualan 7 hari terakhir</h3><span className="chip-g">{rupiah(week)}</span></div>
        <div className="chart">
          <div className="grid-l"><i /><i /><i /><i /></div>
          <div className="bars">{s.sales.map((d) => (
            <div key={d.date} title={rupiah(d.total)}>{d.total > 0 && <em>{d.total >= 1000 ? Math.round(d.total / 1000) + 'rb' : d.total}</em>}<i style={{ height: Math.max((d.total / max) * 150, 5) }} /></div>
          ))}</div>
        </div>
        <div className="bars-x">{s.sales.map((d) => <span key={d.date}>{d.date.slice(8)}/{d.date.slice(5, 7)}</span>)}</div>
      </section>

      <section className="panel">
        <div className="panel-h"><h3>Produk terlaris</h3></div>
        {s.top.length ? <ol className="rank">{s.top.map((t, i) => (
          <li key={t.name}><span className="rk">{i + 1}</span>
            <div><b>{t.name}</b><div className="rk-bar"><i style={{ width: (t.qty / topMax) * 100 + '%' }} /></div></div>
            <small>{t.qty} terjual</small></li>
        ))}</ol> : <Empty icon="chart" title="Belum ada penjualan" text="Produk terlaris akan muncul setelah ada pesanan." />}
      </section>
    </div>

    <section className="panel">
      <div className="panel-h"><h3>Pesanan terbaru</h3><a className="lnk" onClick={() => go('/admin/pesanan')}>Lihat semua →</a></div>
      <OrderTable list={s.latest} />
    </section>
  </>)
}
