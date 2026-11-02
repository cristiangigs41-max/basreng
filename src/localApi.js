// Mode DEMO: meniru API Laravel memakai localStorage, dipakai otomatis bila backend tidak aktif.
import { fileToDataUrl } from './utils'
const FLAVORS = ['Original', 'Original Daun Jeruk', 'Pedas', 'Pedas Daun Jeruk']
const SIZES = [['Pack 5K', 5000], ['Pack 10K', 10000], ['1/2 Kg', 45000], ['1 Kg', 90000]]
const KEY = 'a3_demo_db_v2'
const err = (message, status = 422) => Object.assign(new Error(message), { status })

async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('a3:' + s))
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
}
const mkSizes = (pid, seq) => SIZES.map(([label, price], i) => ({ id: pid * 10 + i + seq, product_id: pid, label, price, stock: 100 }))

async function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) return d } catch { /* buat baru */ }
  const d = {
    seq: 100,
    users: [{ id: 1, name: 'Admin Ibu A3', email: 'admin@basrengibua3.com', phone: '085267567133', role: 'admin', pass: await sha('admin123'), created_at: new Date().toISOString() }],
    categories: [{ id: 1, name: 'Basreng', slug: 'basreng' }, { id: 2, name: 'Pangsit', slug: 'pangsit' }],
    products: [
      { id: 1, category_id: 1, name: 'Basreng Balok', description: 'Basreng potongan balok panjang, renyah di luar, gurih sampai ke dalam. Digoreng kering dan dibumbui.', image: '/media/foto-1.jpg', is_active: true, sizes: mkSizes(1, 0) },
      { id: 2, category_id: 1, name: 'Basreng Bulat', description: 'Basreng irisan bulat tipis, garing, mudah dikunyah dan cocok untuk semua umur.', image: '/media/foto-2.jpg', is_active: true, sizes: mkSizes(2, 0) },
      { id: 3, category_id: 2, name: 'Keripik Pangsit', description: 'Keripik pangsit garing dengan bumbu gurih. Teman ngemil paling pas.', image: '/media/pangsit-1.jpg', is_active: true, sizes: mkSizes(3, 0) },
    ],
    carts: {}, orders: [],
  }
  localStorage.setItem(KEY, JSON.stringify(d)); return d
}
const save = (d) => localStorage.setItem(KEY, JSON.stringify(d))
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role })
const findSize = (d, id) => { for (const p of d.products) { const s = p.sizes.find((x) => x.id === id); if (s) return [p, s] } return [null, null] }
const orderOut = (d, o) => ({ ...o, customer: d.users.find((u) => u.id === o.customer_id)?.name })

function cartOut(d, uid) {
  const items = (d.carts[uid] || []).map((c) => {
    const [p, s] = findSize(d, c.product_size_id)
    return p ? { id: c.id, product_size_id: s.id, flavor: c.flavor, qty: c.qty, product_name: p.name, size_label: s.label, price: s.price, stock: s.stock, subtotal: s.price * c.qty } : null
  }).filter(Boolean)
  return { items, total: items.reduce((a, i) => a + i.subtotal, 0), count: items.reduce((a, i) => a + i.qty, 0) }
}

export async function localApi(path, { method = 'GET', body } = {}) {
  const d = await load()
  const [p0, qs] = path.split('?')
  const seg = p0.split('/').filter(Boolean)
  const q = new URLSearchParams(qs || '')
  const tok = (() => { try { return localStorage.getItem('a3_token') } catch { return null } })()
  const me = tok?.startsWith('local:') ? d.users.find((u) => u.id === Number(tok.slice(6))) : null
  const need = () => { if (!me) throw err('Silakan login terlebih dahulu.', 401); return me }
  const admin = () => { if (need().role !== 'admin') throw err('Akses khusus admin.', 403); return me }
  const get = (k) => (body instanceof FormData ? body.get(k) : body?.[k])
  const [a, b, c] = seg

  if (a === 'products' && method === 'GET') {
    return { flavors: FLAVORS, categories: d.categories, products: d.products.map((p) => ({ ...p, category: d.categories.find((x) => x.id === p.category_id)?.slug })) }
  }
  if (a === 'register') {
    if ((body.name || '').trim().length < 3) throw err('Nama minimal 3 karakter.')
    if (!/^\S+@\S+\.\S+$/.test(body.email || '')) throw err('Email tidak valid.')
    if (!/^[0-9+]{9,15}$/.test(body.phone || '')) throw err('Nomor WhatsApp tidak valid.')
    if ((body.password || '').length < 6) throw err('Password minimal 6 karakter.')
    if (body.password !== body.password_confirmation) throw err('Konfirmasi password tidak sama.')
    const email = body.email.toLowerCase()
    if (d.users.some((u) => u.email === email)) throw err('Email sudah terdaftar.')
    const u = { id: ++d.seq, name: body.name.trim(), email, phone: body.phone, role: 'customer', pass: await sha(body.password), created_at: new Date().toISOString() }
    d.users.push(u); save(d); return { token: 'local:' + u.id, user: pub(u) }
  }
  if (a === 'login') {
    const u = d.users.find((x) => x.email === (body.email || '').toLowerCase())
    if (!u || u.pass !== (await sha(body.password || ''))) throw err('Email atau password salah.')
    return { token: 'local:' + u.id, user: pub(u) }
  }
  if (a === 'logout') return { message: 'ok' }
  if (a === 'me') {
    need()
    if (method === 'PUT') {
      if ((body.name || '').trim().length < 3) throw err('Nama minimal 3 karakter.')
      me.name = body.name.trim(); me.phone = body.phone; save(d)
    }
    return pub(me)
  }
  if (a === 'cart') {
    need(); const cart = (d.carts[me.id] ||= [])
    if (method === 'POST') {
      const [p, s] = findSize(d, Number(body.product_size_id))
      if (!p || !p.is_active) throw err('Produk tidak tersedia.')
      if (!FLAVORS.includes(body.flavor)) throw err('Rasa tidak valid.')
      const ex = cart.find((x) => x.product_size_id === s.id && x.flavor === body.flavor)
      const qty = (ex?.qty || 0) + Math.max(1, Number(body.qty) || 1)
      if (qty > s.stock) throw err('Stok tidak cukup.')
      if (ex) ex.qty = qty; else cart.push({ id: ++d.seq, product_size_id: s.id, flavor: body.flavor, qty })
      save(d)
    } else if (b) {
      const it = cart.find((x) => x.id === Number(b)); if (!it) throw err('Item tidak ditemukan.', 404)
      if (method === 'PATCH') { const [, s] = findSize(d, it.product_size_id); if (body.qty > s.stock) throw err('Stok tidak cukup.'); it.qty = Math.max(1, body.qty) }
      else d.carts[me.id] = cart.filter((x) => x !== it)
      save(d)
    }
    return cartOut(d, me.id)
  }
  if (a === 'orders' && method === 'POST' && c === 'delivery-proof') {
    need(); const o = d.orders.find((x) => x.id === Number(b) && x.customer_id === me.id)
    if (!o) throw err('Pesanan tidak ditemukan.', 404)
    if (o.status !== 'Dikirim') throw err('Bukti bayar ke pengantar bisa diunggah saat pesanan sedang dikirim.')
    const f = get('proof'); if (!(f instanceof File)) throw err('Pilih foto bukti pembayaran.')
    o.delivery_proof = await fileToDataUrl(f); save(d); return orderOut(d, o)
  }
  if (a === 'orders') { need(); return d.orders.filter((o) => o.customer_id === me.id).map((o) => orderOut(d, o)) }
  if (a === 'checkout') {
    need(); const cart = d.carts[me.id] || []
    if (!cart.length) throw err('Keranjang kosong.')
    if ((body.address || '').trim().length < 10) throw err('Alamat minimal 10 karakter.')
    let proof = null
    if (body.payment_method !== 'COD (Bayar di Tempat)') {
      if (!(body.proof instanceof File)) throw err('Bukti pembayaran wajib diunggah.')
      proof = await fileToDataUrl(body.proof)
    }
    const items = []
    for (const ci of cart) {
      const [p, s] = findSize(d, ci.product_size_id)
      if (!p || !p.is_active) throw err('Ada produk yang sudah tidak tersedia.')
      if (s.stock < ci.qty) throw err(`Stok ${p.name} ${s.label} tidak cukup.`)
      items.push({ product_size_id: s.id, product_name: p.name, size_label: s.label, flavor: ci.flavor, qty: ci.qty, price: s.price, subtotal: s.price * ci.qty })
    }
    cart.forEach((ci) => { findSize(d, ci.product_size_id)[1].stock -= ci.qty })
    const id = d.orders.length + 1
    const o = { id, code: 'A3-' + String(id).padStart(4, '0'), status: 'Pending', total: items.reduce((x, i) => x + i.subtotal, 0), phone: body.phone, address: body.address,
      created_at: new Date().toISOString(), customer_id: me.id, payment_method: body.payment_method, payment_status: 'Belum Dibayar', proof, delivery_proof: null, latitude: body.latitude ?? null, longitude: body.longitude ?? null, items }
    d.orders.unshift(o); d.carts[me.id] = []; save(d); return orderOut(d, o)
  }

  if (a === 'admin') {
    admin()
    const valid = d.orders.filter((o) => o.status !== 'Dibatalkan')
    if (b === 'stats') {
      const sales = [...Array(7)].map((_, i) => { const dt = new Date(); dt.setDate(dt.getDate() - (6 - i)); const k = dt.toISOString().slice(0, 10); return { date: k, total: valid.filter((o) => o.created_at.slice(0, 10) === k).reduce((x, o) => x + o.total, 0) } })
      const top = {}; valid.forEach((o) => o.items.forEach((i) => { const k = `${i.product_name} ${i.size_label}`; top[k] = (top[k] || 0) + i.qty }))
      return { products: d.products.length, customers: d.users.filter((u) => u.role === 'customer').length, orders: d.orders.length, revenue: valid.reduce((x, o) => x + o.total, 0),
        sales, latest: d.orders.slice(0, 5).map((o) => orderOut(d, o)), top: Object.entries(top).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([name, qty]) => ({ name, qty })) }
    }
    if (b === 'orders') {
      if (method === 'PATCH') {
        const o = d.orders.find((x) => x.id === Number(c)); const st = body.status
        if (o.status === 'Dibatalkan') throw err('Pesanan yang dibatalkan tidak bisa dibuka kembali.')
        if (o.status === 'Selesai' && st !== 'Selesai') throw err('Pesanan yang sudah selesai tidak bisa diubah.')
        const NEXT = { Pending: 'Diproses', Diproses: 'Dikirim', Dikirim: 'Selesai' }
        if (st !== o.status && st !== 'Dibatalkan' && NEXT[o.status] !== st) throw err('Urutan status: Pending → Diproses → Dikirim → Selesai.')
        if (st === 'Selesai' && o.payment_method === 'COD (Bayar di Tempat)' && !o.delivery_proof) throw err('Pelanggan wajib mengunggah bukti pembayaran ke pengantar dulu.')
        if (st === 'Dibatalkan') o.items.forEach((i) => { const s = findSize(d, i.product_size_id)[1]; if (s) s.stock += i.qty })
        o.status = st; if (st === 'Selesai') o.payment_status = 'Dibayar'
        save(d); return orderOut(d, o)
      }
      return d.orders.map((o) => orderOut(d, o))
    }
    if (b === 'customers') return d.users.filter((u) => u.role === 'customer').map((u) => ({ ...pub(u), created_at: u.created_at, orders_count: d.orders.filter((o) => o.customer_id === u.id).length }))
    if (b === 'report') {
      const f = q.get('from'), t = q.get('to')
      const list = d.orders.filter((o) => o.status === 'Selesai' && o.created_at.slice(0, 10) >= f && o.created_at.slice(0, 10) <= t)
      return { count: list.length, total: list.reduce((x, o) => x + o.total, 0), orders: list.map((o) => orderOut(d, o)) }
    }
    if (b === 'categories') {
      if (method === 'GET') return d.categories.map((x) => ({ ...x, products_count: d.products.filter((p) => p.category_id === x.id).length }))
      const slug = (n) => n.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
      if (method === 'POST') { if (!body.name) throw err('Nama wajib diisi.'); const x = { id: ++d.seq, name: body.name, slug: slug(body.name) }; d.categories.push(x); save(d); return x }
      const x = d.categories.find((k) => k.id === Number(c))
      if (method === 'PUT') { x.name = body.name; x.slug = slug(body.name); save(d); return x }
      if (d.products.some((p) => p.category_id === x.id)) throw err('Kategori masih memiliki produk.')
      d.categories = d.categories.filter((k) => k !== x); save(d); return { message: 'ok' }
    }
    if (b === 'products') {
      if (method === 'DELETE') { d.products = d.products.filter((p) => p.id !== Number(c)); save(d); return { message: 'ok' } }
      const name = get('name'); if (!name) throw err('Nama produk wajib diisi.')
      const file = get('image'); const img = file instanceof File && file.size ? await new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(file) }) : null
      const fields = { name, description: get('description') || '', category_id: Number(get('category_id')), is_active: get('is_active') === '1' || get('is_active') === 1 }
      if (c) { const p = d.products.find((x) => x.id === Number(c)); Object.assign(p, fields); if (img) p.image = img; save(d); return p }
      const id = ++d.seq; const p = { id, ...fields, image: img, sizes: SIZES.map(([label, price], i) => ({ id: id * 10 + i, product_id: id, label, price, stock: 0 })) }
      d.products.push(p); save(d); return p
    }
    if (b === 'sizes') {
      const s = findSize(d, Number(c))[1]; s.price = Math.max(0, Number(body.price)); s.stock = Math.max(0, Number(body.stock)); save(d); return s
    }
  }
  throw err('Endpoint tidak ditemukan.', 404)
}
