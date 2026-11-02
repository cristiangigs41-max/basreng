import { useState } from 'react'
import { api } from '../../api'
import { useApp } from '../../context'
import { useFetch } from '../../hooks'
import Icon from '../../components/Icon'
import { PageHead, Empty } from '../../components/AdminUI'

export default function Categories() {
  const { refreshProducts, notify } = useApp()
  const { data, err, reload } = useFetch('/admin/categories')
  const [name, setName] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const run = async (fn) => { try { await fn(); reload(); refreshProducts(); notify('Kategori berhasil disimpan') } catch (x) { notify(x.message, 'error') } }
  const total = (data || []).reduce((a, c) => a + c.products_count, 0)
  return (<>
    <PageHead eyebrow="Katalog" title="Kelola Kategori" sub="Kelompokkan produk agar pelanggan lebih mudah menemukan pilihan." />
    {err && <div className="err">{err}</div>}
    <div className="a-cols side-r">
      <section className="panel">
        <div className="panel-h"><h3>Daftar kategori <span className="cnt">{(data || []).length}</span></h3></div>
        {(data || []).length ? <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Kategori</th><th>Jumlah produk</th><th /></tr></thead><tbody>
          {data.map((c) => (
            <tr key={c.id}>
              <td>{editId === c.id
                ? <form className="inline-f" onSubmit={(e) => { e.preventDefault(); if (editName.trim()) run(() => api('/admin/categories/' + c.id, { method: 'PUT', body: { name: editName } })).then(() => setEditId(null)) }}>
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} aria-label="Nama kategori" /><button className="btn sm">Simpan</button><button type="button" className="btn ghost sm" onClick={() => setEditId(null)}>Batal</button></form>
                : <b>{c.name}</b>}</td>
              <td><span className="cat">{c.products_count} produk</span></td>
              <td className="acts">
                <button className="ib" title="Ubah" aria-label={'Ubah ' + c.name} onClick={() => { setEditId(c.id); setEditName(c.name) }}><Icon n="edit" s={16} /></button>
                <button className="ib danger" title="Hapus" aria-label={'Hapus ' + c.name} onClick={() => confirm('Hapus kategori?') && run(() => api('/admin/categories/' + c.id, { method: 'DELETE' }))}><Icon n="trash" s={16} /></button></td></tr>
          ))}
        </tbody></table></div> : <Empty icon="tag" title="Belum ada kategori" text="Tambahkan kategori pertama Anda." />}
      </section>
      <aside>
        <form className="panel a-form" onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/admin/categories', { method: 'POST', body: { name } }); setName('') }) }}>
          <div className="panel-h"><h3>Kategori baru</h3></div>
          <div className="fld"><label>Nama kategori</label><input placeholder="mis. Basreng Original" value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div className="a-actions"><button className="btn block"><Icon n="plus" s={16} />Tambah kategori</button></div>
        </form>
        <div className="note-card"><b>{total}</b><small>total produk di seluruh kategori</small></div>
      </aside>
    </div>
  </>)
}
