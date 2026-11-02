import { useEffect, useState } from 'react'
import { go } from '../utils'
import { useApp } from '../context'
import Icon from './Icon'
import Logo from './Logo'

export default function Nav({ route }) {
  const { user, cart, logout } = useApp()
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState('') // bagian aktif di beranda: '', 'tentang', 'kontak'

  // Scroll-spy: menandai menu sesuai bagian halaman yang sedang terlihat.
  useEffect(() => {
    if (route !== '/' || user?.role === 'customer') return
    const spy = () => {
      const line = 120
      const top = (id) => document.getElementById(id)?.getBoundingClientRect().top
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4
      const k = top('kontak'), t = top('tentang')
      const cta = document.querySelector('.cta')?.getBoundingClientRect().top
      if (atEnd || (k !== undefined && k < innerHeight * 0.55) || (cta !== undefined && cta <= line)) setSection('kontak')
      else if (t !== undefined && t <= line + 40) setSection('tentang')
      else setSection('')
    }
    const t0 = setTimeout(spy, 0)
    addEventListener('scroll', spy, { passive: true })
    addEventListener('resize', spy)
    return () => { clearTimeout(t0); removeEventListener('scroll', spy); removeEventListener('resize', spy) }
  }, [route, user])
  const nav = (to) => { setOpen(false); go(to) }
  const scroll = (id) => {
    setOpen(false)
    const run = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    if (route !== '/') { go('/'); setTimeout(run, 160) } else run()
  }
  const sec = route === '/' && user?.role !== 'customer' ? section : ''
  const here = (to) => route === to && !(to === '/' && sec)
  const L = (to, label, extra) => <a className={here(to) ? 'on' : ''} aria-current={here(to) ? 'page' : undefined} onClick={() => nav(to)}>{label}{extra}</a>
  const S = (id, label) => <a className={sec === id ? 'on' : ''} aria-current={sec === id ? 'location' : undefined} onClick={() => { setSection(id); scroll(id) }}>{label}</a>
  return (
    <header className="nav"><div className="wrap">
      <Logo onClick={() => nav('/')} />
      <nav className={'links' + (open ? ' open' : '')} aria-label="Menu utama">
        {user?.role === 'customer' ? (<>
          {L('/', 'Beranda')}{L('/produk', 'Produk')}
          {L('/keranjang', 'Keranjang', cart.count > 0 && <span className="badge">{cart.count}</span>)}
          {L('/pesanan', 'Pesanan Saya')}{L('/profil', 'Profil')}
        </>) : (<>
          {L('/', 'Beranda')}{L('/produk', 'Produk')}
          {S('tentang', 'Tentang Kami')}{S('kontak', 'Kontak')}
        </>)}
      </nav>
      <div className="act">
        {user ? <>
          {user.role === 'customer' && <span className="nav-user">Hai, {user.name.split(' ')[0]}</span>}
          <button className="btn ghost sm" onClick={() => { setOpen(false); logout() }}>Keluar</button>
        </> : (<>
          <a className="btn ghost sm" onClick={() => nav('/login')}>Masuk</a>
          <a className="btn sm hide-s" onClick={() => nav('/daftar')}>Daftar</a>
        </>)}
        <button className="burger" aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} onClick={() => setOpen(!open)}><Icon n={open ? 'x' : 'menu'} /></button>
      </div>
    </div></header>
  )
}
