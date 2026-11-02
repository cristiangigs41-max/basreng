import { useApp } from '../../context'
import Icon from '../../components/Icon'
import { PageHead, Avatar } from '../../components/AdminUI'

export default function AdminProfile() {
  const { user } = useApp()
  return (<>
    <PageHead eyebrow="Akun" title="Pengaturan Profil" sub="Informasi akun administrator Anda." />
    <section className="panel prof">
      <div className="prof-top"><Avatar name={user.name} size={78} />
        <div><h2>{user.name}</h2><span className="role-b"><Icon n="crown" s={13} w={1.6} />Administrator</span></div></div>
      <dl className="dl">
        <div><dt>Nama lengkap</dt><dd>{user.name}</dd></div>
        <div><dt>Email</dt><dd>{user.email}</dd></div>
        {user.phone && <div><dt>WhatsApp</dt><dd>{user.phone}</dd></div>}
        <div><dt>Peran</dt><dd>Administrator</dd></div>
      </dl>
      <p className="hint"><Icon n="shield" s={16} w={1.5} />Akun admin dibuat lewat seeder/database, bukan dari halaman registrasi.</p>
    </section>
  </>)
}
