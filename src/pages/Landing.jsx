import Pack from '../components/Pack'
import Slider from '../components/Slider'
import Icon from '../components/Icon'
import { go, rupiah } from '../utils'
import { useApp } from '../context'
import { GALLERY, HERO_SLIDES, SLIDE_INTERVAL, waLink } from '../media'

const FLAVOR_INFO = {
  'Original': { heat: 0, leaf: false, d: 'Gurih dan renyah tanpa rasa pedas. Cocok untuk semua umur.' },
  'Original Daun Jeruk': { heat: 0, leaf: true, d: 'Rasa original dengan aroma daun jeruk yang harum.' },
  'Pedas': { heat: 3, leaf: false, d: 'Bumbu pedas yang menggigit tapi tetap gurih.' },
  'Pedas Daun Jeruk': { heat: 3, leaf: true, d: 'Pedas dan wangi daun jeruk, dalam satu gigitan renyah.' },
}

export default function Landing() {
  const { products, flavors } = useApp()
  const list = products.filter((p) => p.is_active)
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  return (<>
    <Slider className="hero" slides={HERO_SLIDES} interval={SLIDE_INTERVAL}>
      <div className="wrap hero-copy">
        <div>
          <span className="hero-tag"><Icon n="flame" s={16} />Digoreng segar setiap hari</span>
          <h1>Basreng renyah, pangsit garing, rasa yang bikin balik lagi.</h1>
          <p className="lead">Camilan rumahan buatan Ibu A3. Pilih rasa Original, Daun Jeruk, atau Pedas, dari pack 5 ribu sampai 1 kilo untuk stok.</p>
          <div className="hero-cta">
            <a className="btn lg gold" onClick={() => go('/produk')}>Belanja sekarang</a>
            <a className="btn lg line-w" onClick={() => scrollTo('tentang')}>Kenali Ibu A3</a>
          </div>
          <div className="hero-pts"><span><Icon n="check" s={16} w={2.6} />4 pilihan rasa</span><span><Icon n="check" s={16} w={2.6} />Dikemas rapat</span><span><Icon n="check" s={16} w={2.6} />Mulai Rp5.000</span></div>
        </div>
      </div>
    </Slider>

    <section className="trust" aria-label="Keunggulan"><div className="wrap trust-in">
      <div className="trust-i"><Icon n="flame" s={24} /><div><h4>4 pilihan rasa</h4><p>Original sampai pedas daun jeruk.</p></div></div>
      <div className="trust-i"><Icon n="box" s={24} /><div><h4>4 ukuran kemasan</h4><p>Pack 5K &amp; 10K, atau kiloan ½ &amp; 1 kg.</p></div></div>
      <div className="trust-i"><Icon n="spark" s={24} /><div><h4>Renyah tahan lama</h4><p>Digoreng kering lalu dikemas rapat.</p></div></div>
      <div className="trust-i"><Icon n="truck" s={24} /><div><h4>Kirim ke rumah</h4><p>Pesan online, kami antar ke alamat Anda.</p></div></div>
    </div></section>

    <section className="sec" id="produk"><div className="wrap">
      <div className="sec-head"><div><h2>Tiga camilan favorit</h2><p className="sub">Pilih ukuran dan rasa, lalu masukkan ke keranjang.</p></div>
        <a className="btn ghost" onClick={() => go('/produk')}>Lihat semua produk</a></div>
      <div className="grid">{list.map((p) => (
        <article className="card-lite" key={p.id}><Pack p={p} />
          <div className="pbody">
            <div className="phead"><h3>{p.name}</h3></div>
            <p className="pdesc">{p.description}</p>
            <div className="sizes-line">{p.sizes.map((s) => s.label).join(' · ')}</div>
            <div className="row" style={{ marginTop: 'auto', paddingTop: 12 }}>
              <span className="price"><small>Mulai</small>{rupiah(p.sizes[0]?.price)}</span>
              <a className="btn" onClick={() => go('/produk')}>Pilih rasa</a></div>
          </div></article>))}</div>
    </div></section>

    <section className="sec cream" id="rasa"><div className="wrap">
      <div className="sec-head"><div><h2>Pilih rasa sesukamu</h2><p className="sub">Empat rasa untuk basreng dan pangsit. Tingkat pedas ditandai ikon api.</p></div></div>
      <div className="flavors">{flavors.map((f) => {
        const i = FLAVOR_INFO[f] || { heat: 0, d: '' }
        return (
          <div className="flv-row" key={f}>
            <h3>{f}</h3>
            <p>{i.d}</p>
            <span className="flv-tags">
              {i.leaf && <span className="leaf-tag"><Icon n="leaf" s={14} />Daun jeruk</span>}
              {i.heat ? <span className="heat" aria-label={`Pedas level ${i.heat} dari 3`}>{[1, 2, 3].map((n) => <Icon key={n} n="flame" s={20} className={n <= i.heat ? 'on' : ''} />)}</span>
                : <span className="mild">Tidak pedas</span>}
            </span>
          </div>)
      })}</div>
    </div></section>

    <section className="sec" id="tentang"><div className="wrap about">
      <div>
        <h2>Berawal dari dapur rumah</h2>
        <p className="sub">Basreng Ibu A3 dibuat kecil-kecilan dengan resep rumahan: bumbu yang pas, gorengan kering sampai garing, dan harum daun jeruk. Cocok untuk teman santai, oleh-oleh, atau stok camilan keluarga.</p>
        <div className="stat"><div><b>4</b><span>Pilihan rasa</span></div><div><b>3</b><span>Varian produk</span></div><div><b>100%</b><span>Digoreng segar</span></div></div>
      </div>
      <div className="mosaic">{GALLERY.map((g, k) => <img key={g} src={g} alt={['Basreng berbumbu dengan cabai dan daun jeruk', 'Aneka basreng dan keripik dalam piring kayu', 'Basreng original daun jeruk'][k] || ''} loading="lazy" />)}</div>
    </div></section>

    <section className="cta"><div className="wrap">
      <div><h2>Lapar? Pesan sekarang, kami goreng segar.</h2><p>Pesan lewat toko online ini, atau tanya-tanya dulu lewat WhatsApp.</p></div>
      <div className="cta-btns"><a className="btn lg light" onClick={() => go('/produk')}>Belanja sekarang</a><a className="btn lg line-w" href={waLink()} target="_blank" rel="noreferrer"><Icon n="chat" s={18} />Chat WhatsApp</a></div>
    </div></section>
  </>)
}
