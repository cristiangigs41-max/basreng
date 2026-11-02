import { useState } from 'react'
import { api, mediaUrl } from '../../api'
import { photoFor } from '../../media'
import { useApp } from '../../context'
import { useFetch } from '../../hooks'
import { rupiah } from '../../utils'
import Icon from '../../components/Icon'
import { PageHead, Search, Empty } from '../../components/AdminUI'

const EMPTY = { id: null, name: '', description: '', category_id: '', is_active: true, image: null }

export default function ProductsAdmin() {
  const { refreshProducts, notify } = useApp()
  const prods = useFetch('/products')
  const cats = useFetch('/admin/categories')
  const [f, setF] = useState(EMPTY)
  const [show, setShow] = useState(false)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  const reload = () => { prods.reload(); refreshProducts() }
  const save = async (e) => {
    e.preventDefault(); setErr('')
    const fd = new FormData()
    fd.append('name', f.name); fd.append('description', f.description || '')
    fd.append('category_id', f.category_id); fd.append('is_active', f.is_active ? 1 : 0)
    if (f.image) fd.append('image', f.image)
    try {
      await api(f.id ? '/admin/products/' + f.id : '/admin/products', { method: 'POST', body: fd })
      notify('Produk tersimpan'); setShow(false); setF(EMPTY); reload()
    } catch (x) { setErr(x.message) }
  }
  const del = async (p) => {
    if (!confirm(`Hapus produk ${p.name}?`)) return
    try { await api('/admin/products/' + p.id, { method: 'DELETE' }); reload(); refreshProducts(); notify('Produk dihapus', 'info') } catch (x) { notify(x.message, 'error') }
  }
  const edit = (p) => { setF({ ...EMPTY, id: p.id, name: p.name, description: p.description || '', category_id: p.category_id, is_active: p.is_active }); setShow(true); setErr(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const list = (prods.data?.products || []).filter((p) => (p.name + ' ' + p.category).toLowerCase().includes(q.toLowerCase()))

  return (<>
    <PageHead eyebrow="Katalog" title="Kelola Produk" sub="Setiap produk otomatis memiliki ukuran Pack 5K, Pack 10K, 1/2 Kg dan 1 Kg. Harga & stok diatur di Kelola Stok.">
      <button className="btn" onClick={() => { setF({ ...EMPTY, category_id: cats.data?.[0]?.id || '' }); setShow(true); setErr('') }}><Icon n="plus" s={16} />Tambah Produk</button>
    </PageHead>

    {show && (
      <form onSubmit={save} className="panel a-form">
        <div className="panel-h"><h3>{f.id ? 'Ubah produk' : 'Produk baru'}</h3></div>
        {err && <div className="err">{err}</div>}
        <div className="fg">
          <div className="fld"><label>Nama Produk</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></div>
          <div className="fld"><label>Kategori</label>
            <select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })} required>
              <option value="">Pilih…</option>{(cats.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="fld full"><label>Deskripsi</label><textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="fld"><label>Foto Produk <small>(maks 2 MB)</small></label><input type="file" accept="image/*" onChange={(e) => setF({ ...f, image: e.target.files[0] })} /></div>
          <div className="fld"><label>Status</label>
            <label className="sw"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /><i />Aktif — tampil di toko</label></div>
        </div>
        <div className="a-actions"><button className="btn">Simpan produk</button><button type="button" className="btn ghost" onClick={() => setShow(false)}>Batal</button></div>
      </form>
    )}

    <section className="panel">
      <div className="panel-h"><h3>Daftar produk <span className="cnt">{list.length}</span></h3><Search value={q} onChange={setQ} placeholder="Cari produk atau kategori…" /></div>
      {prods.err && <div className="err">{prods.err}</div>}
      {list.length ? <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Produk</th><th>Kategori</th><th>Harga</th><th>Status</th><th /></tr></thead><tbody>
        {list.map((p) => (
          <tr key={p.id}><td><span className="pimg"><img src={mediaUrl(p.image || photoFor(p.name))} alt="" /><b>{p.name}</b></span></td><td><span className="cat">{p.category}</span></td>
            <td><div className="prices">{p.sizes.map((s) => <small key={s.id}>{s.label} <b>{rupiah(s.price)}</b></small>)}</div></td>
            <td><span className={'st ' + (p.is_active ? 'Selesai' : 'Dibatalkan')}>{p.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
            <td className="acts"><button className="ib" title="Edit" aria-label={'Edit ' + p.name} onClick={() => edit(p)}><Icon n="edit" s={16} /></button><button className="ib danger" title="Hapus" aria-label={'Hapus ' + p.name} onClick={() => del(p)}><Icon n="trash" s={16} /></button></td></tr>
        ))}
      </tbody></table></div> : <Empty title="Produk tidak ditemukan" text="Coba kata kunci lain atau tambahkan produk baru." />}
    </section>
  </>)
}
