import { useState } from 'react'
import { api } from '../../api'
import { useApp } from '../../context'
import { useFetch } from '../../hooks'
import { STATUS } from '../../utils'
import OrderTable from '../../components/OrderTable'
import { PageHead, Search, Loading } from '../../components/AdminUI'

export default function Orders() {
  const { notify, refreshProducts } = useApp()
  const { data, err, reload } = useFetch('/admin/orders')
  const [tab, setTab] = useState('Semua')
  const [q, setQ] = useState('')
  const setStatus = async (id, status) => {
    try { await api(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status } }); reload(); refreshProducts(); notify(status === 'Dibatalkan' ? 'Pesanan dibatalkan' : `Status: ${status}`) } catch (x) { notify(x.message, 'error') }
  }
  const all = data || []
  const count = (s) => (s === 'Semua' ? all.length : all.filter((o) => o.status === s).length)
  const list = all.filter((o) => (tab === 'Semua' || o.status === tab) && (o.code + ' ' + o.customer + ' ' + (o.phone || '')).toLowerCase().includes(q.toLowerCase()))
  return (<>
    <PageHead eyebrow="Penjualan" title="Kelola Pesanan" sub="Pantau dan perbarui status setiap pesanan pelanggan.">
      <Search value={q} onChange={setQ} placeholder="Cari kode, nama, atau telepon…" />
    </PageHead>
    {err && <div className="err">{err}</div>}
    <section className="panel">
      <div className="tabs" role="tablist">{['Semua', ...STATUS].map((s) => (
        <button key={s} role="tab" aria-selected={tab === s} className={tab === s ? 'on' : ''} onClick={() => setTab(s)}>{s}<em>{count(s)}</em></button>
      ))}</div>
      {!data && !err ? <Loading /> : <OrderTable list={list} onStatus={setStatus} />}
    </section>
  </>)
}
