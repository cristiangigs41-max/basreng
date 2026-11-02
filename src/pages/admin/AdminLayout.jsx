import '../../admin.css'
import { go } from '../../utils'
import { useApp } from '../../context'
import Icon from '../../components/Icon'
import { Avatar } from '../../components/AdminUI'

const GROUPS = [
  ['Ringkasan', [['', 'Dashboard', 'grid']]],
  ['Katalog', [['produk', 'Kelola Produk', 'box'], ['kategori', 'Kelola Kategori', 'tag'], ['stok', 'Kelola Stok', 'layers']]],
  ['Penjualan', [['pesanan', 'Kelola Pesanan', 'receipt'], ['pelanggan', 'Kelola Pelanggan', 'users'], ['laporan', 'Laporan Penjualan', 'chart']]],
  ['Akun', [['profil', 'Pengaturan Profil', 'sliders']]],
]

export default function AdminLayout({ sub, children }) {
  const { logout, user } = useApp()
  return (
    <div className="adm">
      <aside className="side">
        <a className="brand" onClick={() => go('/admin')} aria-label="Basreng Ibu A3 — dashboard admin">
          <span className="brand-mark">A3</span>
          <span className="brand-txt"><b>Basreng Ibu A3</b><i>Administration</i></span>
        </a>
        <nav aria-label="Menu admin">
          {GROUPS.map(([g, items]) => (
            <div className="nav-g" key={g}>
              <span className="nav-t">{g}</span>
              {items.map(([k, l, ic]) => (
                <a key={k} className={sub === k ? 'on' : ''} aria-current={sub === k ? 'page' : undefined} onClick={() => go('/admin' + (k ? '/' + k : ''))}>
                  <Icon n={ic} s={18} w={1.6} /><span>{l}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">
          <div className="me"><Avatar name={user?.name} size={38} />
            <div><b>{user?.name}</b><small>Administrator</small></div></div>
          <a className="out" onClick={logout}><Icon n="out" s={17} w={1.6} /><span>Keluar</span></a>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
