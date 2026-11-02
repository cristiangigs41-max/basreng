import Icon from './Icon'

// Indikator langkah belanja: Keranjang → Checkout → Selesai
export default function Steps({ now }) {
  const S = ['Keranjang', 'Checkout', 'Pesanan']
  return (
    <ol className="steps" aria-label="Langkah belanja">
      {S.map((s, i) => (
        <li key={s} className={i < now ? 'done' : i === now ? 'now' : ''} aria-current={i === now ? 'step' : undefined}>
          <span className="n">{i < now ? <Icon n="check" s={14} w={3} /> : i + 1}</span>{s}
        </li>))}
    </ol>
  )
}
