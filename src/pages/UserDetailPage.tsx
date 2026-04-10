import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserById, deleteUser } from '../api/userService';
import type { User } from '../types/user';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getUserById(Number(id));
        setUser(data);
      } catch {
        setError('Utilisateur introuvable');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await deleteUser(Number(id));
      navigate('/users');
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const formatDate = (raw?: string) => {
    if (!raw) return '—';
    const d = new Date(raw);
    return (
      d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    );
  };

  if (loading) return <p style={styles.message}>Chargement...</p>;
  if (error) return <p style={{ ...styles.message, color: '#A32D2D' }}>{error}</p>;
  if (!user) return <p style={styles.message}>Utilisateur introuvable</p>;

  return (
    <div style={styles.page}>

      <button style={styles.btnBack} onClick={() => navigate('/users')}>
        ← Retour à la liste
      </button>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.avatar}>
            {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={styles.name}>{user.firstName} {user.lastName}</h1>
            <span style={styles.emailText}>{user.email}</span>
          </div>
          <span style={user.active ? styles.badgeActive : styles.badgeInactive}>
            {user.active ? 'Actif' : 'Inactif'}
          </span>
        </div>

        <div style={styles.divider} />

        <div style={styles.grid}>
          <div style={styles.field}>
            <span style={styles.label}>ID</span>
            <span style={styles.value}>{user.id}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Prénom</span>
            <span style={styles.value}>{user.firstName}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Nom</span>
            <span style={styles.value}>{user.lastName}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Email</span>
            <span style={{ ...styles.value, fontFamily: 'monospace' }}>{user.email}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Rôle global</span>
            {user.globalRole ? (
              <span style={styles.roleBadge}>{user.globalRole}</span>
            ) : (
              <span style={styles.emptyText}>—</span>
            )}
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Date de création</span>
            <span style={{ ...styles.value, fontFamily: 'monospace', fontSize: '13px' }}>
              {formatDate(user.dateCreation)}
            </span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Dernière modification</span>
            <span style={{ ...styles.value, fontFamily: 'monospace', fontSize: '13px' }}>
              {formatDate(user.lastModified)}
            </span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Dernière connexion</span>
            <span style={{ ...styles.value, fontFamily: 'monospace', fontSize: '13px' }}>
              {formatDate(user.lastLoginAt)}
            </span>
          </div>
        </div>

        <div style={styles.divider} />

        <div style={styles.actions}>
          <button style={styles.btnEdit} onClick={() => navigate(`/users/${id}/edit`)}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M9 2l2 2-7 7H2v-2L9 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            Modifier
          </button>
          <button style={styles.btnDel} onClick={handleDelete}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <polyline points="2,4 11,4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M5 4V3h3v1M4 4l1 7h4l1-7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            Supprimer
          </button>
        </div>
      </div>

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '2rem 1.5rem',
    background: '#F5F5F3',
    minHeight: '100vh',
    fontFamily: 'system-ui, sans-serif',
  },
  btnBack: {
    background: 'transparent',
    border: '0.5px solid #ccc',
    borderRadius: '8px',
    padding: '7px 14px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#555',
    marginBottom: '1.5rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    border: '0.5px solid #e0e0e0',
    padding: '2rem',
    maxWidth: '680px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  avatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: '#E6F1FB',
    color: '#185FA5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 600,
    flexShrink: 0,
  },
  name: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
  },
  emailText: {
    fontSize: '13px',
    color: '#888',
    fontFamily: 'monospace',
  },
  badgeActive: {
    marginLeft: 'auto',
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '99px',
    background: '#E6F4EA',
    color: '#1E6B35',
    fontSize: '12px',
    fontWeight: 500,
  },
  badgeInactive: {
    marginLeft: 'auto',
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '99px',
    background: '#F5F5F5',
    color: '#888',
    fontSize: '12px',
    fontWeight: 500,
  },
  divider: {
    height: '0.5px',
    background: '#f0f0f0',
    marginBottom: '1.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.2rem',
    marginBottom: '1.5rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  value: {
    fontSize: '14px',
    color: '#1a1a1a',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '99px',
    background: '#EAF3DE',
    color: '#3B6D11',
    fontSize: '12px',
    fontWeight: 500,
    width: 'fit-content',
  },
  emptyText: {
    color: '#bbb',
    fontSize: '13px',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  btnEdit: {
    background: '#EAF3DE',
    color: '#3B6D11',
    border: '0.5px solid #C0DD97',
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  btnDel: {
    background: '#FCEBEB',
    color: '#A32D2D',
    border: '0.5px solid #F7C1C1',
    padding: '8px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  message: {
    textAlign: 'center',
    marginTop: '2rem',
    color: '#555',
    fontSize: '15px',
  },
};