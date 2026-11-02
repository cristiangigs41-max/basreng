import { mediaUrl } from '../api'
import { photoFor } from '../media'

// Foto produk: pakai foto unggahan admin; bila belum ada, pakai foto dari media.js.
export default function Pack({ p, size }) {
  const src = p.image ? mediaUrl(p.image) : photoFor(p.name)
  return (
    <div className="shot">
      <img src={src} alt={p.name} loading="lazy" onError={(e) => { e.currentTarget.src = photoFor(p.name) }} />
      {size && <span className="tagpill">{size}</span>}
    </div>
  )
}
