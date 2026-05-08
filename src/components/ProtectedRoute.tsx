import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { GlobalRole } from '../hooks/useRole'

interface Props {
  children: React.ReactNode
  roles?: GlobalRole[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, loading, role } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', height: '100vh',
        fontFamily: 'Inter, sans-serif', color: '#64748b'
      }}>
        Chargement…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && role && !roles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}