import { useState } from 'react'
import { useFetch } from '../../hooks'
import { fdate } from '../../utils'
import { PageHead, Search, Empty, Avatar, Loading } from '../../components/AdminUI'

export default function Customers() {
  const { data, err } = useFetch('/admin/customers')
  const [q, setQ] = useState('')
  const list = (data || []).filter((c) => (c.name + ' ' + c.email + ' ' + (c.phone || '')).toLowerCase().includes(q.toLowerCase()))
  return (<>
    <PageHead eyebrow="Penjualan" title="Kelola Pelanggan" sub="Daftar pelanggan terdaftar beserta riwayat pesanannya.">
      <Search value={q} onChange={setQ} placeholder="Cari nama, email, atau WhatsApp…" />
    </PageHead>
    {err && <div className="err">{err}</div>}
    <section className="panel">
      <div className="panel-h"><h3>Pelanggan <span className="cnt">{list.length}</span></h3></div>
      {!data && !err ? <Loading /> : list.length ? <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Pelanggan</th><th>WhatsApp</th><th>Terdaftar</th><th className="num">Pesanan</th></tr></thead><tbody>
        {list.map((c) => <tr key={c.id}>
          <td><span className="pimg"><Avatar name={c.name} /><span><b>{c.name}</b><small>{c.email}</small></span></span></td>
          <td>{c.phone || '—'}</td><td>{fdate(c.created_at)}</td><td className="num"><span className="cat">{c.orders_count}</span></td></tr>)}
      </tbody></table></div> : <Empty icon="users" title="Belum ada pelanggan" text="Pelanggan yang mendaftar akan tampil di sini." />}
    </section>
  </>)
}
