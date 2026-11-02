import { useState } from 'react'
import ProductCard from '../components/ProductCard'
import Icon from '../components/Icon'
import { useApp } from '../context'

export default function Products() {
  const { products, categories } = useApp()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [group, setGroup] = useState('pack')
  const list = products.filter((p) => p.is_active && (cat === 'all' || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="page"><div className="wrap">
      <h1>Produk kami</h1>
      <p className="lede">Pilih jenis kemasan, lalu rasa favoritmu. Harga dan stok selalu diperbarui.</p>
      <div className="pk-tabs" role="tablist" aria-label="Jenis kemasan">
        <button role="tab" aria-selected={group === 'pack'} className={group === 'pack' ? 'on' : ''} onClick={() => setGroup('pack')}>
          <b>Pack Hemat</b><small>Rp5.000 &amp; Rp10.000</small></button>
        <button role="tab" aria-selected={group === 'kilo'} className={group === 'kilo' ? 'on' : ''} onClick={() => setGroup('kilo')}>
          <b>Kiloan</b><small>½ Kg &amp; 1 Kg</small></button>
      </div>
      <div className="toolbar">
        <div className="search"><Icon n="search" s={18} /><input aria-label="Cari produk" placeholder="Cari produk" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select aria-label="Kategori" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">Semua kategori</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
      {!products.length && !list.length ? <div className="grid">{[1, 2, 3].map((k) => <div className="pcard sk" key={k}><div className="shot" /><div className="pbody"><i /><i /><i /></div></div>)}</div>
        : list.length ? <div className="grid">{list.map((p) => <ProductCard key={p.id + group} p={p} group={group} />)}</div>
        : <div className="empty"><Icon n="search" s={34} /><h3>Produk tidak ditemukan</h3><p>Coba kata kunci lain atau tampilkan semua kategori.</p><button className="btn" onClick={() => { setQ(''); setCat('all') }}>Reset pencarian</button></div>}
    </div></div>
  )
}
