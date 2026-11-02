import { useState } from 'react'
import { api } from '../api'
import { useApp } from '../context'

export default function Profile() {
  const { user, setUser } = useApp()
  const [f, setF] = useState({ name: user.name, phone: user.phone || '' })
  const [msg, setMsg] = useState(null)
  const save = async (e) => {
    e.preventDefault(); setMsg(null)
    try { setUser(await api('/me', { method: 'PUT', body: f })); setMsg({ ok: true, t: 'Profil tersimpan' }) } catch (x) { setMsg({ ok: false, t: x.message }) }
  }
  return (
    <div className="page"><div className="wrap"><h1>Profil saya</h1><p className="lede">Data ini dipakai untuk mengisi checkout otomatis.</p>
      <form className="box card" style={{ margin: 0 }} onSubmit={save}>
        {msg && <div className={msg.ok ? 'ok' : 'err'} role="status">{msg.t}</div>}
        <label htmlFor="n">Nama lengkap</label><input id="n" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <label htmlFor="e">Email</label><input id="e" value={user.email} disabled />
        <label htmlFor="p">Nomor WhatsApp</label><input id="p" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <button className="btn block" style={{ marginTop: 22 }}>Simpan perubahan</button>
      </form>
    </div></div>
  )
}
