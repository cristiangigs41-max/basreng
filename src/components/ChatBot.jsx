import { useEffect, useRef, useState } from 'react'
import { API } from '../api'
import { CONTACT } from '../media'
import Icon from './Icon'

const HELLO = { role: 'assistant', content: 'Halo! Saya Asisten A3 🍤 Tanya apa saja, soal basreng & pangsit kami maupun hal lain, saya siap jawab.' }
const QUICK = ['Berapa harga basreng?', 'Ada rasa apa saja?', 'Bagaimana cara pesan?', 'Ide resep camilan?']
const ENDPOINT = API ? API + '/chat' : '/ai-chat'
const SETUP = '/ai-setup' // mode Laravel -> /api/chat, mode demo -> server Vite
const STORE = 'a3_chats'
const newConv = () => ({ id: Date.now() + Math.random(), title: 'Chat baru', msgs: [HELLO] })
function loadConvs() {
  try { const l = JSON.parse(localStorage.getItem(STORE)); if (Array.isArray(l) && l.length) return l } catch { /* abaikan */ }
  return [newConv()]
}

export default function ChatBot({ products = [], flavors = [] }) {
  const [open, setOpen] = useState(false)
  const [big, setBig] = useState(false)
  const [convs, setConvs] = useState(loadConvs)
  const [cid, setCid] = useState(() => convs[0].id)
  const msgs = (convs.find((c) => c.id === cid) || convs[0]).msgs
  const upd = (id, fn) => setConvs((l) => l.map((c) => (c.id === id ? fn(c) : c)))
  const setMsgs = (fn) => upd(cid, (c) => ({ ...c, msgs: typeof fn === 'function' ? fn(c.msgs) : fn }))
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [needKey, setNeedKey] = useState(false)
  const [key, setKey] = useState('')
  const end = useRef(null)

  useEffect(() => { try { localStorage.setItem(STORE, JSON.stringify(convs.slice(0, 30))) } catch { /* abaikan */ } }, [convs])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs, busy, open, big])

  const send = async (q) => {
    const content = (q ?? text).trim()
    if (!content || busy) return
    const id = cid
    const next = [...msgs, { role: 'user', content }]
    upd(id, (c) => ({ ...c, msgs: next, title: c.title === 'Chat baru' ? content.slice(0, 32) : c.title })); setText(''); setBusy(true)
    const shop = {
      waLabel: CONTACT.waLabel, flavors,
      products: products.map((p) => ({ name: p.name, desc: p.desc || p.description, active: p.active ?? p.is_active,
        sizes: (p.sizes || []).map((s) => ({ label: s.label, price: s.price, stock: s.stock })) })),
    }
    const history = next.slice(-12)
    let reply = ''
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ messages: history, shop }),
      })
      const d = await res.json()
      reply = d.reply || ''
      setNeedKey(!!d.needKey && !API)
    } catch {
      reply = 'Server chat belum aktif. Hentikan lalu jalankan ulang `npm run dev` dari folder project ini, dan buka situs lewat alamat yang tampil di terminal (jangan dari file dist / XAMPP). Pastikan ANTHROPIC_API_KEY sudah diisi di file .env.'
    }
    upd(id, (c) => ({ ...c, msgs: [...c.msgs, { role: 'assistant', content: reply || 'Maaf, tidak ada jawaban. Coba lagi ya.' }] }))
    setBusy(false)
  }

  const startNew = () => {
    if (busy) return
    const cur = convs.find((c) => c.id === cid)
    if (cur && cur.msgs.length === 1) return // chat kosong sudah terbuka
    const c = newConv(); setConvs((l) => [c, ...l]); setCid(c.id); setText('')
  }
  const remove = (id) => {
    if (busy) return
    const rest = convs.filter((c) => c.id !== id)
    if (!rest.length) { const c = newConv(); setConvs([c]); setCid(c.id); return }
    setConvs(rest); if (id === cid) setCid(rest[0].id)
  }

  const saveKey = async (e) => {
    e.preventDefault()
    try {
      const r = await fetch(SETUP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.message)
      setNeedKey(false); setKey('')
      setMsgs((m) => [...m, { role: 'assistant', content: 'Kunci tersimpan. AI aktif, silakan ulangi pertanyaannya ya!' }])
    } catch (err) { setMsgs((m) => [...m, { role: 'assistant', content: 'Gagal menyimpan kunci: ' + (err.message || 'server chat tidak aktif') }]) }
  }

  return (
    <>
      {open && (
        <section className={'chat' + (big ? ' big' : '')} role="dialog" aria-label="Chat dengan Asisten A3">
          <header className="chat-h">
            <span className="chat-av"><Icon n="spark" s={18} /></span>
            <div><b>Asisten A3</b><small>Dijawab oleh AI</small></div>
            <button type="button" className="chat-hb" onClick={startNew}><Icon n="plus" s={15} w={2.4} /><span>Chat baru</span></button>
            <button type="button" className="chat-x" aria-label={big ? 'Perkecil' : 'Perbesar'} title={big ? 'Perkecil' : 'Perbesar'} onClick={() => setBig((v) => !v)}><Icon n={big ? 'shrink' : 'expand'} s={17} w={2.2} /></button>
            <button type="button" className="chat-x" aria-label="Tutup chat" onClick={() => setOpen(false)}><Icon n="x" s={18} w={2.4} /></button>
          </header>
          <div className="chat-main">
            <aside className="chat-side" aria-label="Riwayat chat">
              <button type="button" className="btn sm" onClick={startNew}><Icon n="plus" s={15} w={2.4} />Chat baru</button>
              <ul>
                {convs.map((c) => (
                  <li key={c.id} className={c.id === cid ? 'on' : ''}>
                    <button type="button" className="chat-it" onClick={() => !busy && setCid(c.id)}>{c.title}</button>
                    <button type="button" className="chat-del" aria-label="Hapus chat" onClick={() => remove(c.id)}><Icon n="trash" s={14} /></button>
                  </li>))}
              </ul>
            </aside>
            <div className="chat-col">
              <div className="chat-b" aria-live="polite">
                {msgs.map((m, i) => <p key={i} className={'cm ' + m.role}>{m.content}</p>)}
                {busy && <p className="cm assistant typing" aria-label="Mengetik"><i /><i /><i /></p>}
                {msgs.length === 1 && <div className="chat-q">{QUICK.map((q) => <button key={q} type="button" onClick={() => send(q)}>{q}</button>)}</div>}
                <div ref={end} />
              </div>
              {needKey && (
                <form className="chat-key" onSubmit={saveKey}>
                  <small>Tempel kunci API Anthropic (sk-ant-…) agar AI aktif. <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">Buat kunci</a></small>
                  <div><input value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-..." aria-label="Kunci API" autoComplete="off" /><button type="submit" className="btn sm">Simpan</button></div>
                </form>
              )}
              <form className="chat-f" onSubmit={(e) => { e.preventDefault(); send() }}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tulis pertanyaan…" maxLength={500} aria-label="Pesan" />
                <button type="submit" className="btn sm" disabled={busy || !text.trim()}>Kirim</button>
              </form>
            </div>
          </div>
        </section>
      )}
      <button type="button" className="chat-fab" aria-label={open ? 'Tutup chat' : 'Tanya asisten AI'} onClick={() => setOpen((o) => !o)}>
        <Icon n={open ? 'x' : 'spark'} s={open ? 22 : 24} w={2} />{!open && <span className="chat-fab-t">Tanya AI</span>}
      </button>
    </>
  )
}
