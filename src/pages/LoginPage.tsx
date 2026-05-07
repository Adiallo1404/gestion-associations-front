import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWindowSize } from '../hooks/useWindowSize' // ✅

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { isMobile } = useWindowSize() // ✅

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch {
      setError('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={{
        ...s.card,
        padding:    isMobile ? '28px 20px' : '40px 44px',
        maxWidth:   isMobile ? '100%' : 420,
        borderRadius: isMobile ? 12 : 16,
        margin:     isMobile ? '0 12px' : 0,
        boxShadow:  isMobile ? 'none' : '0 4px 24px rgba(0,0,0,0.08)',
        border:     isMobile ? 'none' : '1px solid #e2e8f0',
      }}>

        {/* Logo */}
        <div style={s.logo}>
          <div style={s.logoDot}>G</div>
          <span style={s.logoName}>GestAssoc</span>
        </div>

        <h2 style={{ ...s.title, fontSize: isMobile ? 20 : 24 }}>Connexion</h2>
        <p style={s.sub}>Entrez vos identifiants pour accéder à votre espace</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="votre@email.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div style={s.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={s.label}>Mot de passe</label>
              <span style={s.forgotLink} onClick={() => navigate('/forgot-password')}>
                Mot de passe oublié ?
              </span>
            </div>
            <input
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && <div style={s.error}>⚠️ {error}</div>}

          <button
            style={{ ...s.btn, opacity: loading ? 0.7 : 1, padding: isMobile ? '13px' : '12px' }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p style={s.register}>
          Pas encore de compte ?{' '}
          <span style={s.link} onClick={() => navigate('/register')}>
            S'inscrire
          </span>
        </p>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:       { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  card:       { background: '#fff', width: '100%' },
  logo:       { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoDot:    { width: 38, height: 38, background: '#2563eb', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff' },
  logoName:   { fontSize: 18, fontWeight: 700, color: '#0f172a' },
  title:      { fontWeight: 700, color: '#0f172a', margin: '0 0 6px' },
  sub:        { fontSize: 14, color: '#64748b', margin: '0 0 28px' },
  form:       { display: 'flex', flexDirection: 'column', gap: 18 },
  field:      { display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: 14, fontWeight: 600, color: '#374151' },
  forgotLink: { fontSize: 13, color: '#2563eb', cursor: 'pointer', fontWeight: 500 },
  input:      { padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', color: '#0f172a', background: '#f8fafc' },
  error:      { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 14 },
  btn:        { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4 },
  register:   { textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 20 },
  link:       { color: '#2563eb', fontWeight: 600, cursor: 'pointer' },
}