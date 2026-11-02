import { useState } from 'react'
import Pack from './Pack'
import Icon from './Icon'
import { go, rupiah, inGroup } from '../utils'
import { useApp } from '../context'

export default function ProductCard({ p, group }) {
  const { user, flavors, addToCart } = useApp()
  const sizes = group ? p.sizes.filter((s) => inGroup(s.label, group)) : p.sizes
  const firstOk = sizes.find((s) => s.stock > 0) || sizes[0]
  const [sizeId, setSize] = useState(firstOk?.id)
  const [flavor, setFlavor] = useState(flavors[0])
  const [qty, setQty] = useState(1)
  const size = sizes.find((s) => s.id === Number(sizeId)) || firstOk
  if (!size) return null
  const add = () => (user ? addToCart({ product_size_id: size.id, flavor, qty }) : go('/login'))
  const soldOut = size.stock < 1
  return (
    <article className="pcard">
      <Pack p={p} size={size.label} />
      <div className="pbody">
        <div className="phead"><h3>{p.name}</h3>{p.category && <span className="cat">{p.category}</span>}</div>
        <p className="pdesc">{p.description}</p>
        <fieldset><legend>Ukuran</legend>
          <div className="chips">{sizes.map((s) => (
            <button type="button" key={s.id} className={'chip' + (s.id === size.id ? ' on' : '')} aria-pressed={s.id === size.id} disabled={s.stock < 1}
              onClick={() => { setSize(s.id); setQty(1) }}>{s.label}<small>{s.stock < 1 ? 'Habis' : rupiah(s.price)}</small></button>))}
          </div></fieldset>
        <fieldset><legend>Rasa</legend>
          <div className="chips">{flavors.map((f) => (
            <button type="button" key={f} className={'chip flv' + (f === flavor ? ' on' : '')} aria-pressed={f === flavor} onClick={() => setFlavor(f)}>
              {f === flavor && <Icon n="check" s={14} w={2.6} />}{f}</button>))}
          </div></fieldset>
        <div className="pfoot">
          <div className="row">
            <span className="price"><small>Total</small>{rupiah(size.price * qty)}</span>
            <div className="qty" role="group" aria-label="Jumlah">
              <button type="button" aria-label="Kurangi" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span>{qty}</span>
              <button type="button" aria-label="Tambah" onClick={() => setQty(Math.min(Math.max(size.stock, 1), qty + 1))}>+</button></div>
          </div>
          {!soldOut && size.stock <= 10 && <span className="low" style={{ justifySelf: 'start' }}>Sisa {size.stock}</span>}
          <button className="btn block" disabled={soldOut} onClick={add}><Icon n="cart" s={18} />{user ? 'Tambah ke keranjang' : 'Masuk untuk memesan'}</button>
        </div>
      </div>
    </article>
  )
}
