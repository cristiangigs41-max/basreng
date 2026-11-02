import Icon from './Icon'

// Kepala halaman admin: eyebrow kecil, judul serif, subjudul, dan slot aksi.
export function PageHead({ eyebrow, title, sub, children }) {
  return (
    <header className="ph">
      <div>
        {eyebrow && <span className="ph-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="ph-actions">{children}</div>}
    </header>
  )
}

export function Search({ value, onChange, placeholder }) {
  return (
    <label className="a-search"><Icon n="search" s={17} />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} /></label>
  )
}

export function Empty({ icon = 'box', title, text }) {
  return (
    <div className="a-empty"><span><Icon n={icon} s={26} w={1.4} /></span><b>{title}</b>{text && <p>{text}</p>}</div>
  )
}

export function Loading() {
  return <div className="loading" role="status"><span className="spin" />Memuat…</div>
}

const initials = (n = '') => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'A'
export function Avatar({ name, size = 38 }) {
  return <span className="a-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials(name)}</span>
}
