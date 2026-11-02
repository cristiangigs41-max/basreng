// Di hosting, kunci API diisi lewat Environment Variables Vercel, bukan lewat chat.
export default function handler(req, res) {
  res.status(403).json({ message: 'Isi ANTHROPIC_API_KEY lewat Environment Variables di dashboard Vercel.' })
}
