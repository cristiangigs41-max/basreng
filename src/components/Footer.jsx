import { CONTACT, waLink } from '../media'
import { go } from '../utils'
import Icon from './Icon'
import Logo from './Logo'

export default function Footer() {
  return (<>
    <footer id="kontak"><div className="wrap">
      <div className="foot">
        <div><Logo onClick={() => go('/')} /><p className="about-t">Basreng dan pangsit goreng buatan rumahan. Digoreng segar, dibumbui pas, dikemas rapat supaya tetap renyah.</p></div>
        <div><h5>Belanja</h5><a onClick={() => go('/produk')}>Semua produk</a><a onClick={() => go('/keranjang')}>Keranjang</a><a onClick={() => go('/pesanan')}>Pesanan saya</a></div>
        <div><h5>Hubungi kami</h5><a href={waLink()} target="_blank" rel="noreferrer">WhatsApp {CONTACT.waLabel}</a><a href={'mailto:' + CONTACT.email}>{CONTACT.email}</a></div>
      </div>
      <div className="foot-b"><span>© {new Date().getFullYear()} Basreng Ibu A3. Seluruh hak dilindungi.</span><span>Dibuat dengan cinta dari dapur rumah.</span></div>
    </div></footer>
    <a className="wa-fab" href={waLink()} target="_blank" rel="noreferrer" aria-label="Chat WhatsApp"><Icon n="chat" s={26} /></a>
  </>)
}
