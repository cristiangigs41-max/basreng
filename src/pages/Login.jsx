import { useState } from 'react'
import { go } from '../utils'
import { useApp } from '../context'

export default function Login() {
  const { login } = useApp()
  const [f, setF] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try { await login(f) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className="auth">
      <div className="auth-art" style={{ backgroundImage: 'url(/media/foto-4.jpg)' }}><div><h2>Camilan renyah menunggu di keranjangmu.</h2><p>Masuk untuk melanjutkan pesanan dan melihat riwayat belanja.</p></div></div>
      <div className="auth-form"><form className="box" onSubmit={submit}>
        <h2>Selamat datang kembali</h2><p>Masuk ke akun Basreng Ibu A3.</p>
        {err && <div className="err" role="alert">{err}</div>}
        <label htmlFor="em">Email</label><input id="em" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
        <label htmlFor="pw">Kata sandi</label><input id="pw" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        <button className="btn block lg" style={{ marginTop: 24 }} disabled={busy}>{busy ? 'Memproses…' : 'Masuk'}</button>
        <div className="alt">Belum punya akun? <a onClick={() => go('/daftar')}>Daftar gratis</a></div>
      </form></div>
    </div>
  )
}
