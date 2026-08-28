import { useState } from 'react'
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi'
import { auth, signInWithEmailAndPassword } from './services'
import Logo from './components/Logo'
import Button from './components/Button'
import { Field } from './components/FormCard'

export default function LoginScreen() {
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPass, setShow]   = useState(false)

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await signInWithEmailAndPassword(auth, email, pass) }
    catch { setError('البريد الإلكتروني أو كلمة المرور غير صحيحة') }
    finally { setLoading(false) }
  }

  return (
    <div dir="rtl" className="adm-root adm-login">
      <div className="adm-login-card">
        <div className="adm-login-logo"><Logo size={64} /></div>
        <h1 className="adm-login-title">منتجع العلبي</h1>
        <p className="adm-login-sub">تسجيل الدخول إلى لوحة التحكم</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="البريد الإلكتروني">
            <input type="email" className="adm-input" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="admin@resort.com" />
          </Field>
          <Field label="كلمة المرور">
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} className="adm-input" value={pass}
                onChange={e => setPass(e.target.value)} required placeholder="••••••••" style={{ paddingLeft: 40 }} />
              <button type="button" onClick={() => setShow(s => !s)} aria-label="إظهار كلمة المرور"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </Field>
          {error && (
            <div className="adm-field-error" style={{ background: 'var(--adm-tone-bad-bg)', border: '1px solid var(--adm-tone-bad-border)', borderRadius: 10, padding: '10px 12px' }}>
              <FiAlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}
          <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
            {loading ? 'جارٍ التحقق...' : 'دخول'}
          </Button>
        </form>
      </div>
    </div>
  )
}
