import { useNavigate } from 'react-router-dom'

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.logoDot}>G</div>
          <span style={s.logoName}>GestAssoc</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={s.bigIcon}>🔐</div>
          <h2 style={s.title}>Réinitialisation du mot de passe</h2>
          <p style={s.sub}>
            La réinitialisation de votre mot de passe se fait désormais
            directement depuis la page de connexion sécurisée.
          </p>
          <button style={s.btn} onClick={() => navigate('/forgot-password')}>
            Réinitialiser mon mot de passe
          </button>
        </div>
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
  btn:      { background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 9, padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4, width: '100%' },
}