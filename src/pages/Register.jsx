import { useState } from 'react'
import { go } from '../utils'
import { useApp } from '../context'

export default function Register() {
  const { register } = useApp()
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await register(f) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className="auth">
      <div className="auth-art" style={{ backgroundImage: 'url(/media/foto-2.jpg)' }}><div><h2>Gabung dan pesan camilan favoritmu.</h2><p>Simpan alamat, pantau pesanan, dan pesan ulang dengan cepat.</p></div></div>
      <div className="auth-form"><form className="box" onSubmit={submit}>
        <h2>Buat akun</h2><p>Hanya butuh satu menit.</p>
        {err && <div className="err" role="alert">{err}</div>}
        <label htmlFor="nm">Nama lengkap</label><input id="nm" autoComplete="name" value={f.name} onChange={set('name')} required />
        <label htmlFor="em">Email</label><input id="em" type="email" autoComplete="email" value={f.email} onChange={set('email')} required />
        <label htmlFor="ph">Nomor WhatsApp</label><input id="ph" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} placeholder="08xxxxxxxxxx" required />
        <label htmlFor="pw">Kata sandi</label><input id="pw" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} required />
        <label htmlFor="pc">Ulangi kata sandi</label><input id="pc" type="password" autoComplete="new-password" value={f.password_confirmation} onChange={set('password_confirmation')} required />
        <button className="btn block lg" style={{ marginTop: 24 }} disabled={busy}>{busy ? 'Memproses…' : 'Daftar'}</button>
        <div className="alt">Sudah punya akun? <a onClick={() => go('/login')}>Masuk</a></div>
      </form></div>
    </div>
  )
}
