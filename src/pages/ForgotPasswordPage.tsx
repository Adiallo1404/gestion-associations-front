import { useNavigate } from 'react-router-dom'
import { authService } from '../api/authService'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  const handleReset = async () => {
    await authService.forgotPassword()
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.logo}>
          <div style={s.logoDot}>G</div>
          <span style={s.logoName}>GestAssoc</span>
        </div>

        <h2 style={s.title}>Mot de passe oublié ?</h2>
        <p style={s.sub}>
          Vous allez être redirigé vers notre page sécurisée pour
          réinitialiser votre mot de passe.
        </p>

        <button style={s.btn} onClick={handleReset}>
          Réinitialiser mon mot de passe
        </button>

        <p style={s.backLink}>
          <span style={s.link} onClick={() => navigate('/login')}>
            ← Retour à la connexion
          </span>
        </p>
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
  title:    { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' },
  sub:      { fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 },
  btn:      { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 9, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4, width: '100%' },
  backLink: { textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 20 },
  link:     { color: '#2563eb', fontWeight: 600, cursor: 'pointer' },
}