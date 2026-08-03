import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWindowSize } from '../hooks/useWindowSize'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { isMobile } = useWindowSize()

  const handleLogin = async () => {
    await login()
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
          onClick={handleLogin}
          style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Se connecter
        </button>
      </nav>

      {/* BLOC CENTRAL */}
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
          textAlign: 'center',
        }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 38, height: 38, background: '#2563eb', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff' }}>G</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>GestAssoc</span>
          </div>

          <h2 style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 6px', fontSize: isMobile ? 20 : 24 }}>Connexion</h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 28px' }}>
            Vous allez être redirigé vers notre page de connexion sécurisée
          </p>

          <button
            onClick={handleLogin}
            style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 9, fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: isMobile ? '13px' : '12px', width: '100%' }}
          >
            Se connecter
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '16px', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>© 2026 GestAssoc — Tous droits réservés</p>
      </footer>
    </div>
  )
}