import { useCallback, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api'
import { AppContext } from './context'
import { go } from './utils'
import Nav from './components/Nav'
import Footer from './components/Footer'
import ChatBot from './components/ChatBot'
import Icon from './components/Icon'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Products from './pages/Products'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'
import Profile from './pages/Profile'
import AdminLayout from './pages/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ProductsAdmin from './pages/admin/ProductsAdmin'
import Categories from './pages/admin/Categories'
import Stock from './pages/admin/Stock'
import Orders from './pages/admin/Orders'
import Customers from './pages/admin/Customers'
import Report from './pages/admin/Report'
import AdminProfile from './pages/admin/AdminProfile'

const EMPTY_CART = { items: [], total: 0, count: 0 }
const CUSTOMER_ONLY = ['/keranjang', '/checkout', '/pesanan', '/profil']

function useRoute() {
  const [r, setR] = useState(location.hash.slice(1) || '/')
  useEffect(() => {
    const f = () => { setR(location.hash.slice(1) || '/'); window.scrollTo(0, 0) }
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  return r
}

export default function App() {
  const route = useRoute()
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!getToken())
  const [shop, setShop] = useState({ products: [], categories: [], flavors: [], error: '' })
  const [cart, setCart] = useState(EMPTY_CART)
  const [toasts, setToasts] = useState([])

  // Notifikasi bertumpuk: tipe otomatis 'error' bila pesan berisi kata gagal/tidak/wajib/dll.
  const dismiss = useCallback((id) => setToasts((l) => l.filter((t) => t.id !== id)), [])
  const notify = useCallback((m, type) => {
    if (!m) return
    const kind = type || (/gagal|tidak|wajib|habis|salah|belum|minimal|error|ditolak|cukup/i.test(m) ? 'error' : 'success')
    const id = Date.now() + Math.random()
    setToasts((l) => [...l.slice(-3), { id, m, kind }])
    setTimeout(() => dismiss(id), kind === 'error' ? 4800 : 3000)
  }, [dismiss])
  const refreshProducts = useCallback(() => api('/products').then((d) => setShop({ ...d, error: '' })).catch((e) => setShop((s) => ({ ...s, error: e.message }))), [])
  const refreshCart = useCallback(() => api('/cart').then(setCart).catch(() => setCart(EMPTY_CART)), [])

  useEffect(() => { refreshProducts() }, [refreshProducts])
  useEffect(() => { // pulihkan sesi dari token
    if (!getToken()) return
    api('/me').then((u) => { setUser(u); if (u.role === 'customer') refreshCart() }).catch(() => setToken(null)).finally(() => setReady(true))
  }, [refreshCart])

  const onAuth = (d) => {
    setToken(d.token); setUser(d.user)
    notify(`Selamat datang, ${d.user.name.split(' ')[0]}!`)
    if (d.user.role === 'customer') refreshCart()
    go(d.user.role === 'admin' ? '/admin' : '/produk')
  }
  const login = async (body) => onAuth(await api('/login', { method: 'POST', body }))
  // Setelah daftar, pengguna tidak langsung masuk: wajib login dulu.
  const register = async (body) => {
    await api('/register', { method: 'POST', body })
    notify('Pendaftaran berhasil! Silakan masuk dengan akun Anda.')
    go('/login')
  }
  const logout = async () => {
    try { await api('/logout', { method: 'POST' }) } catch { /* token sudah tidak valid */ }
    setToken(null); setUser(null); setCart(EMPTY_CART); go('/'); notify('Anda sudah keluar. Sampai jumpa!', 'info')
  }
  const guard = async (fn) => { try { await fn() } catch (e) { notify(e.message, 'error') } }
  const addToCart = (body) => guard(async () => { setCart(await api('/cart', { method: 'POST', body })); notify('Ditambahkan ke keranjang') })
  const updateCartItem = (id, qty) => guard(async () => setCart(await api('/cart/' + id, { method: 'PATCH', body: { qty } })))
  const removeCartItem = (id) => guard(async () => { setCart(await api('/cart/' + id, { method: 'DELETE' })); notify('Produk dihapus dari keranjang', 'info') })

  const ctx = { user, setUser, login, register, logout, cart, refreshCart, addToCart, updateCartItem, removeCartItem,
    products: shop.products, categories: shop.categories, flavors: shop.flavors, refreshProducts, notify }

  if (!ready) return <div className="boot" role="status"><span className="spin" /><p>Memuat Basreng Ibu A3…</p></div>

  const isAdminRoute = route.startsWith('/admin')
  let body
  if (isAdminRoute) {
    if (user?.role !== 'admin') {
      body = <div className="page"><div className="wrap"><h1>Akses ditolak</h1><p>Halaman ini khusus admin.</p><a className="btn" style={{ marginTop: 16 }} onClick={() => go(user ? '/' : '/login')}>Kembali</a></div></div>
    } else {
      const sub = route.split('/')[2] || ''
      const pages = { '': Dashboard, produk: ProductsAdmin, kategori: Categories, stok: Stock, pesanan: Orders, pelanggan: Customers, laporan: Report, profil: AdminProfile }
      const Page = pages[sub] || Dashboard
      return <AppContext.Provider value={ctx}><AdminLayout sub={sub}><Page /></AdminLayout><Toasts list={toasts} close={dismiss} /></AppContext.Provider>
    }
  } else if (CUSTOMER_ONLY.includes(route) && user?.role !== 'customer') {
    body = <Login />
  } else {
    const pages = { '/login': Login, '/daftar': Register, '/produk': Products, '/keranjang': Cart, '/checkout': Checkout, '/pesanan': MyOrders, '/profil': Profile }
    const Page = pages[route] || Landing
    body = <Page />
  }

  return (
    <AppContext.Provider value={ctx}>
      {!user && <div className="promo-bar">Digoreng segar setiap hari <span className="hide-s">&middot; Mulai Rp5.000 &middot; Pesan mudah lewat WhatsApp</span></div>}
      <Nav route={route} />
      {user?.role === 'admin' && !isAdminRoute && <div className="notice info">Masuk sebagai admin. <a onClick={() => go('/admin')}>Buka dashboard</a></div>}
      {shop.error && <div className="notice err">{shop.error}</div>}
      {body}
      {route !== '/login' && route !== '/daftar' && <Footer />}
      <ChatBot products={shop.products} flavors={shop.flavors} />
      <Toasts list={toasts} close={dismiss} />
    </AppContext.Provider>
  )
}

function Toasts({ list, close }) {
  return (
    <div className="toasts" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={'toast ' + t.kind} role={t.kind === 'error' ? 'alert' : 'status'}>
          <span className="t-ic"><Icon n={t.kind === 'error' ? 'x' : t.kind === 'info' ? 'spark' : 'check'} s={16} w={2.6} /></span>
          <span className="t-msg">{t.m}</span>
          <button type="button" className="t-x" aria-label="Tutup notifikasi" onClick={() => close(t.id)}><Icon n="x" s={14} w={2.4} /></button>
        </div>))}
    </div>
  )
}
