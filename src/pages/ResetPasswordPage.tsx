import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../api/authService'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères'); return
    }
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas'); return
    }
    if (!token) {
      setError('Token manquant ou invalide'); return
    }

    setLoading(true)
    try {
      await authService.resetPassword(token, form.password)
      setDone(true)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Lien invalide ou expiré')
    } finally {
      setLoading(false)
    }
  }

  // Token absent dans l'URL
  if (!token) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <div style={s.logo}>
            <div style={s.logoDot}>G</div>
            <span style={s.logoName}>GestAssoc</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={s.bigIcon}>❌</div>
            <h2 style={s.title}>Lien invalide</h2>
            <p style={s.sub}>Ce lien de réinitialisation est invalide ou a expiré.</p>
            <button style={s.btn} onClick={() => navigate('/forgot-password')}>
              Demander un nouveau lien
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.logo}>
          <div style={s.logoDot}>G</div>
          <span style={s.logoName}>GestAssoc</span>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={s.bigIcon}>✅</div>
            <h2 style={s.title}>Mot de passe modifié !</h2>
            <p style={s.sub}>
              Votre mot de passe a été réinitialisé avec succès.
              Vous pouvez maintenant vous connecter.
            </p>
            <button style={s.btn} onClick={() => navigate('/login')}>
              Se connecter
            </button>
          </div>
        ) : (
          <>
            <h2 style={s.title}>Nouveau mot de passe</h2>
            <p style={s.sub}>Choisissez un mot de passe sécurisé d'au moins 8 caractères.</p>

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label}>Nouveau mot de passe</label>
                <input
                  style={s.input}
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Confirmer le mot de passe</label>
                <input
                  style={s.input}
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  required
                />
                {form.confirm && (
                  <span style={{
                    fontSize: 12, marginTop: 4,
                    color: form.password === form.confirm ? '#16a34a' : '#dc2626'
                  }}>
                    {form.password === form.confirm
                      ? '✅ Les mots de passe correspondent'
                      : '❌ Les mots de passe ne correspondent pas'}
                  </span>
                )}
              </div>

              {error && <div style={s.error}>⚠️ {error}</div>}

              <button
                style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Réinitialisation…' : '🔐 Réinitialiser le mot de passe'}
              </button>
            </form>
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
}