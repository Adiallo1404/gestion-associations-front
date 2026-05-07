import { useNavigate } from 'react-router-dom'
import { useWindowSize } from '../hooks/useWindowSize'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  return (
    <div style={s.page}>
      <div style={s.card}>

        <div style={s.logo}>
          <div style={s.logoDot}>G</div>
          <span style={s.logoName}>GestAssoc</span>
        </div>

        <div style={s.code}>404</div>

        <h1 style={{ ...s.title, fontSize: isMobile ? 20 : 26 }}>
          Page introuvable
        </h1>
        <p style={s.sub}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        <div style={{
          display: 'flex', gap: 12,
          flexDirection: isMobile ? 'column' : 'row',
          width: isMobile ? '100%' : 'auto',
        }}>
          <button style={s.btnPrimary} onClick={() => navigate('/')}>
            🏠 Retour au tableau de bord
          </button>
          <button style={s.btnSecondary} onClick={() => navigate(-1)}>
            ← Page précédente
          </button>
        </div>

        <div style={s.links}>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
            Ou accédez directement à :
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: '🏛️ Associations', path: '/associations' },
              { label: '👥 Membres',       path: '/members' },
              { label: '💰 Cotisations',   path: '/cotisations' },
              { label: '🔔 Notifications', path: '/notifications' },
            ].map((link) => (
              <button
                key={link.path}
                style={s.linkBtn}
                onClick={() => navigate(link.path)}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:         { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: '20px' },
  card:         { background: '#fff', borderRadius: 20, padding: '48px 44px', width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.10)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' },
  logo:         { display: 'flex', alignItems: 'center', gap: 10 },
  logoDot:      { width: 38, height: 38, background: '#2563eb', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#fff' },
  logoName:     { fontSize: 18, fontWeight: 700, color: '#0f172a' },
  code:         { fontSize: 96, fontWeight: 800, color: '#e2e8f0', lineHeight: 1, letterSpacing: '-4px' },
  title:        { fontSize: 26, fontWeight: 700, color: '#0f172a', margin: 0 },
  sub:          { fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: 0 },
  btnPrimary:   { background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  btnSecondary: { background: '#fff', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  links:        { borderTop: '1px solid #f1f5f9', paddingTop: 20, width: '100%' },
  linkBtn:      { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
}