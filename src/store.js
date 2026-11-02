// Data layer (localStorage). Semua harga & total dihitung di sini, bukan dari input pengguna.
export const FLAVORS = ['Original', 'Original Daun Jeruk', 'Pedas', 'Pedas Daun Jeruk']
export const rupiah = (n) => 'Rp' + Number(n).toLocaleString('id-ID')

const DEFAULT_PRODUCTS = ['basreng', 'pangsit'].map((id) => ({
  id,
  name: id === 'basreng' ? 'Basreng' : 'Pangsit Goreng',
  desc: id === 'basreng'
    ? 'Bakso goreng renyah, gurih, dan bikin nagih. Digoreng kering dan dibumbui.'
    : 'Pangsit goreng garing dengan bumbu gurih. Teman ngemil paling pas.',
  active: true,
  sizes: [
    { id: '5k', label: 'Pack 5K', price: 5000, stock: 200 },
    { id: '10k', label: 'Pack 10K', price: 10000, stock: 200 },
    { id: '500g', label: '1/2 Kg', price: 45000, stock: 100 },
    { id: '1kg', label: '1 Kg', price: 90000, stock: 100 },
  ],
}))

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))

export async function hash(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('a3:' + s))
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export const getProducts = () => read('a3_products', DEFAULT_PRODUCTS)
export const saveProducts = (p) => write('a3_products', p)
export const getOrders = () => read('a3_orders', [])
export const saveOrders = (o) => write('a3_orders', o)

export async function getUsers() {
  let u = read('a3_users', null)
  if (!u) {
    u = [{ id: 1, name: 'Admin Ibu A3', email: 'admin@basrengibua3.com', phone: '', role: 'admin', pass: await hash('admin123') }]
    write('a3_users', u)
  }
  return u
}
export const saveUsers = (u) => write('a3_users', u)
export const getSession = () => read('a3_session', null)
export const setSession = (u) => (u ? write('a3_session', u) : localStorage.removeItem('a3_session'))
export const getCart = (uid) => read('a3_cart_' + uid, [])
export const saveCart = (uid, c) => write('a3_cart_' + uid, c)

export function priceLine(products, it) {
  const p = products.find((x) => x.id === it.productId)
  const s = p?.sizes.find((x) => x.id === it.sizeId)
  if (!p || !s) return null
  return { ...it, name: p.name, sizeLabel: s.label, price: s.price, stock: s.stock, subtotal: s.price * it.qty }
}

export function placeOrder(user, cart, info) {
  const products = getProducts()
  const lines = cart.map((c) => priceLine(products, c)).filter(Boolean)
  if (!lines.length) throw new Error('Keranjang kosong')
  for (const l of lines) if (l.qty > l.stock) throw new Error(`Stok ${l.name} ${l.sizeLabel} tidak cukup`)
  lines.forEach((l) => {
    const p = products.find((x) => x.id === l.productId)
    p.sizes.find((s) => s.id === l.sizeId).stock -= l.qty
  })
  saveProducts(products)
  const orders = getOrders()
  const order = {
    id: 'A3-' + String(orders.length + 1).padStart(4, '0'),
    userId: user.id, customer: user.name, phone: info.phone, address: info.address,
    payment: info.payment, status: 'Pending', date: new Date().toISOString(),
    items: lines.map(({ productId, sizeId, flavor, qty, name, sizeLabel, price, subtotal }) => ({ productId, sizeId, flavor, qty, name, sizeLabel, price, subtotal })),
    total: lines.reduce((a, l) => a + l.subtotal, 0),
  }
  saveOrders([order, ...orders])
  saveCart(user.id, [])
  return order
}
