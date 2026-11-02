import { go, rupiah } from '../utils'
import { useApp } from '../context'
import { photoFor } from '../media'
import Icon from '../components/Icon'
import Steps from '../components/Steps'

export default function Cart() {
  const { cart, updateCartItem, removeCartItem } = useApp()
  return (
    <div className="page"><div className="wrap">
      <Steps now={0} />
      <h1>Keranjang</h1>
      <p className="lede">Periksa pesananmu sebelum checkout.</p>
      {!cart.items.length ? (
        <div className="empty"><Icon n="cart" s={36} /><h3>Keranjang masih kosong</h3><p>Tambahkan basreng atau pangsit favoritmu.</p><button className="btn" onClick={() => go('/produk')}>Mulai belanja</button></div>
      ) : (
        <div className="two">
          <div className="list">{cart.items.map((l) => (
            <div className="item" key={l.id}>
              <img src={photoFor(l.product_name)} alt="" />
              <div><b>{l.product_name}</b><br /><small>{l.size_label} · {l.flavor}</small></div>
              <div className="qty"><button aria-label="Kurangi" onClick={() => l.qty > 1 && updateCartItem(l.id, l.qty - 1)}>−</button><span>{l.qty}</span><button aria-label="Tambah" onClick={() => updateCartItem(l.id, l.qty + 1)}>+</button></div>
              <b>{rupiah(l.subtotal)}</b>
              <button className="btn ghost sm" onClick={() => removeCartItem(l.id)} aria-label={`Hapus ${l.product_name}`}>Hapus</button>
            </div>))}
          </div>
          <div className="sum"><h3>Ringkasan</h3>
            <div className="row"><span>Jumlah item</span><span>{cart.count}</span></div>
            <div className="row tot"><span>Total</span><span>{rupiah(cart.total)}</span></div>
            <button className="btn block lg" style={{ marginTop: 18 }} onClick={() => go('/checkout')}>Lanjut ke checkout</button>
            <a className="alt" style={{ display: 'block' }} onClick={() => go('/produk')}>Tambah produk lain</a></div>
        </div>
      )}
    </div></div>
  )
}
