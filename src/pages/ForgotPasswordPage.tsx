import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../api/authService'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch {
      setError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.logo}>
          <div style={s.logoDot}>G</div>
          <span style={s.logoName}>GestAssoc</span>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={s.bigIcon}>📧</div>
            <h2 style={s.title}>Email envoyé !</h2>
            <p style={s.sub}>
              Si un compte existe avec <strong>{email}</strong>, vous recevrez
              un lien de réinitialisation dans quelques minutes.
            </p>
            <p style={{ ...s.sub, marginTop: 4 }}>Vérifiez aussi vos spams.</p>
            <button style={s.btn} onClick={() => navigate('/login')}>
              ← Retour à la connexion
            </button>
          </div>
        ) : (
          <>
            <h2 style={s.title}>Mot de passe oublié ?</h2>
            <p style={s.sub}>
              Entrez votre adresse email et nous vous enverrons un lien
              pour réinitialiser votre mot de passe.
            </p>

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Adresse email</label>
                <input
                  style={s.input}
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && <div style={s.error}>⚠️ {error}</div>}

              <button
                style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Envoi en cours…' : 'Envoyer le lien'}
              </button>
            </form>

            <p style={s.backLink}>
              <span style={s.link} onClick={() => navigate('/login')}>
                ← Retour à la connexion
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:     { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', 'Segoe UI', sans-serif" },
  card:     { background: '#fff', borderRadius: 16, padding: '40px 44px', width: '100%', maxWidth: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
  logo:     { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoDot:  { width: 38, height: 38, background: '#2563eb', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff' },
  logoName: { fontSize: 18, fontWeight: 700, color: '#0f172a' },
  bigIcon:  { fontSize: 52, marginBottom: 16 },
  title:    { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' },
  sub:      { fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 },
  form:     { display: 'flex', flexDirection: 'column', gap: 18 },
  field:    { display: 'flex', flexDirection: 'column', gap: 6 },
  label:    { fontSize: 14, fontWeight: 600, color: '#374151' },
  input:    { padding: '10px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', color: '#0f172a', background: '#f8fafc' },
  error:    { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 14 },
  btn:      { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 9, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4, width: '100%' },
  backLink: { textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 20 },
  link:     { color: '#2563eb', fontWeight: 600, cursor: 'pointer' },
}