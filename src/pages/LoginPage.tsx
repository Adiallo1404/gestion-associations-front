import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWindowSize } from '../hooks/useWindowSize'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { isMobile } = useWindowSize()

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
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* NAVBAR */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px', height: 64, background: '#fff',
        borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/login')}>
          <div style={{ width: 36, height: 36, background: '#1d4ed8', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>G</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>GestAssoc</span>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', gap: 32 }}>
            <span onClick={() => navigate('/login')} style={{ fontSize: 14, color: '#64748b', cursor: 'pointer' }}>Accueil</span>
            <span onClick={() => navigate('/about')} style={{ fontSize: 14, color: '#64748b', cursor: 'pointer' }}>Qui sommes-nous</span>
            <span onClick={() => navigate('/about')} style={{ fontSize: 14, color: '#64748b', cursor: 'pointer' }}>Contact</span>
          </div>
        )}

        <button
          onClick={() => navigate('/login')}
          style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Se connecter
        </button>
      </nav>

      {/* FORMULAIRE */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{
          background: '#fff',
          width: '100%',
          maxWidth: isMobile ? '100%' : 420,
          padding: isMobile ? '28px 20px' : '40px 44px',
          borderRadius: isMobile ? 12 : 16,
          margin: isMobile ? '0 12px' : 0,
          boxShadow: isMobile ? 'none' : '0 4px 24px rgba(0,0,0,0.08)',
          border: isMobile ? 'none' : '1px solid #e2e8f0',
        }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 38, height: 38, background: '#2563eb', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff' }}>G</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>GestAssoc</span>
          </div>

          <h2 style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 6px', fontSize: isMobile ? 20 : 24 }}>Connexion</h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 28px' }}>Entrez vos identifiants pour accéder à votre espace</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Email</label>
              <input
                style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', color: '#0f172a', background: '#f8fafc' }}
                type="email"
                placeholder="votre@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Mot de passe</label>
                <span style={{ fontSize: 13, color: '#2563eb', cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate('/forgot-password')}>
                  Mot de passe oublié ?
                </span>
              </div>
              <input
                style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', color: '#0f172a', background: '#f8fafc' }}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 14 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1, padding: isMobile ? '13px' : '12px', marginTop: 4 }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 20 }}>
            Pas encore de compte ?{' '}
            <span style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/register')}>
              S'inscrire
            </span>
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>© 2026 GestAssoc — Tous droits réservés</p>
      </footer>
    </div>
  )
}