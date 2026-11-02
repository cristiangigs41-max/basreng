import { useState } from 'react'
import { api, mediaUrl } from '../../api'
import { photoFor } from '../../media'
import { useApp } from '../../context'
import { useFetch } from '../../hooks'
import { PageHead, Search, Empty, Loading } from '../../components/AdminUI'

function SizeRow({ s, onSaved }) {
  const { notify } = useApp()
  const [price, setPrice] = useState(s.price)
  const [stock, setStock] = useState(s.stock)
  const dirty = Number(price) !== s.price || Number(stock) !== s.stock
  const save = async () => {
    try { await api('/admin/sizes/' + s.id, { method: 'PUT', body: { price: Number(price), stock: Number(stock) } }); notify('Harga & stok tersimpan'); onSaved() } catch (x) { notify(x.message, 'error') }
  }
  const lvl = s.stock <= 0 ? ['Dibatalkan', 'Habis'] : s.stock <= 5 ? ['Pending', 'Menipis'] : ['Selesai', 'Tersedia']
  return (
    <tr><td><b>{s.label}</b></td>
      <td><div className="money"><span>Rp</span><input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} aria-label={'Harga ' + s.label} /></div></td>
      <td><input className="qty" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} aria-label={'Stok ' + s.label} /></td>
      <td><span className={'st ' + lvl[0]}>{lvl[1]}</span></td>
      <td className="acts"><button className="btn sm" disabled={!dirty} onClick={save}>Simpan</button></td></tr>
  )
}

export default function Stock() {
  const { refreshProducts } = useApp()
  const { data, err, reload } = useFetch('/products')
  const [q, setQ] = useState('')
  const saved = () => { reload(); refreshProducts() }
  const all = data?.products || []
  const list = all.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
  const sizes = all.flatMap((p) => p.sizes)
  const low = sizes.filter((s) => s.stock > 0 && s.stock <= 5).length
  const out = sizes.filter((s) => s.stock <= 0).length
  return (<>
    <PageHead eyebrow="Katalog" title="Kelola Stok & Harga" sub="Perbarui harga dan ketersediaan setiap ukuran kemasan.">
      <Search value={q} onChange={setQ} placeholder="Cari produk…" />
    </PageHead>
    {err && <div className="err">{err}</div>}
    {!data && !err && <Loading />}
    {data && <div className="mini-stats">
      <div><b>{all.length}</b><small>Produk</small></div>
      <div><b>{sizes.length}</b><small>Varian ukuran</small></div>
      <div className={low ? 'warn' : ''}><b>{low}</b><small>Stok menipis</small></div>
      <div className={out ? 'bad' : ''}><b>{out}</b><small>Stok habis</small></div>
    </div>}
    {list.map((p) => (
      <section className="panel" key={p.id}>
        <div className="panel-h"><span className="pimg lg"><img src={mediaUrl(p.image || photoFor(p.name))} alt="" /><h3>{p.name}</h3></span><span className="cat">{p.category}</span></div>
        <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Ukuran</th><th>Harga</th><th>Stok</th><th>Status</th><th /></tr></thead>
          <tbody>{p.sizes.map((s) => <SizeRow key={s.id + '-' + s.price + '-' + s.stock} s={s} onSaved={saved} />)}</tbody></table></div>
      </section>
    ))}
    {data && !list.length && <section className="panel"><Empty title="Produk tidak ditemukan" /></section>}
  </>)
}
