import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, deleteUser } from '../api/userService';
import type { User } from '../types/user';

export default function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [totalElements, setTotalElements] = useState(0);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getUsers({}, 0, 100);
      setUsers(data.content);
      setTotalElements(data.totalElements);
    } catch {
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await deleteUser(id);
      fetchData();
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  const filtered = users.filter(
    (u) =>
      u.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Utilisateurs</h1>
        <button style={styles.btnCreate} onClick={() => navigate('/users/new')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Créer un utilisateur
        </button>
      </div>

      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <span style={styles.countLabel}>
          {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p style={styles.message}>Aucun utilisateur trouvé.</p>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={{ ...styles.th, width: '52px' }}>ID</th>
                <th style={styles.th}>Prénom</th>
                <th style={styles.th}>Nom</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Rôle</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Date création</th>
                <th style={{ ...styles.th, width: '210px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  style={styles.tr}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8F8F8')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={styles.td}>
                    <span style={styles.idBadge}>{user.id}</span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{user.firstName}</td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{user.lastName}</td>
                  <td style={styles.td}>
                    <span style={styles.emailText}>{user.email}</span>
                  </td>
                  <td style={styles.td}>
                    {user.globalRole ? (
                      <span style={styles.roleBadge}>{user.globalRole}</span>
                    ) : (
                      <span style={styles.emptyText}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <span style={user.active ? styles.badgeActive : styles.badgeInactive}>
                      {user.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.dateText}>{formatDate(user.dateCreation)}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button style={styles.btnVoir} onClick={() => navigate(`/users/${user.id}`)}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <ellipse cx="6.5" cy="6.5" rx="5.5" ry="3.5" stroke="currentColor" strokeWidth="1.2" />
                          <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
                        </svg>
                        Voir
                      </button>
                      <button style={styles.btnEdit} onClick={() => navigate(`/users/${user.id}/edit`)}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M9 2l2 2-7 7H2v-2L9 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                        </svg>
                        Modifier
                      </button>
                      <button style={styles.btnDel} onClick={() => handleDelete(user.id!)}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <polyline points="2,4 11,4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                          <path d="M5 4V3h3v1M4 4l1 7h4l1-7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                        </svg>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '2rem 1.5rem',
    background: '#f3f5f3b4',
    minHeight: '100vh',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '1.5rem',
    gap: '1rem',
  },
  title: {
    fontSize: '32px',
    fontWeight: 500,
    color: '#1a1a1a',
    margin: 0,
  },
  btnCreate: {
    background: '#116ecb',
    color: '#e6f1fbb9',
    border: 'none',
    padding: '10px 22px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '1rem',
  },
  searchInput: {
    flex: 1,
    maxWidth: '380px',
    padding: '9px 14px',
    borderRadius: '8px',
    border: '0.5px solid #ccc',
    background: '#fff',
    fontSize: '14px',
    color: '#1a1a1a',
    outline: 'none',
  },
  countLabel: {
    marginLeft: 'auto',
    fontSize: '13px',
    color: '#888',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    border: '0.5px solid #e0e0e0',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  theadRow: {
    background: '#E6F1FB',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: 500,
    fontSize: '13px',
    color: '#0C447C',
    borderBottom: '0.5px solid #B5D4F4',
  },
  tr: {
    borderBottom: '0.5px solid #f0f0f0',
    transition: 'background 0.1s',
  },
  td: {
    padding: '12px 16px',
    color: '#171717',
    verticalAlign: 'middle',
  },
  idBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#f0f0f0',
    fontSize: '12px',
    fontWeight: 500,
    color: '#555',
  },
  emailText: {
    fontSize: '13px',
    color: '#444',
    fontFamily: 'monospace',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '99px',
    background: '#EAF3DE',
    color: '#5ec807',
    fontSize: '12px',
    fontWeight: 500,
  },
  badgeActive: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '99px',
    background: '#E6F4EA',
    color: '#1E6B35',
    fontSize: '12px',
    fontWeight: 500,
  },
  badgeInactive: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '99px',
    background: '#F5F5F5',
    color: '#888',
    fontSize: '12px',
    fontWeight: 500,
  },
  dateText: {
    fontSize: '12px',
    color: '#222121',
    fontFamily: 'monospace',
  },
  emptyText: {
    color: '#bbb',
    fontSize: '13px',
  },
  actions: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  btnVoir: {
    background: '#f5f5f5',
    color: '#333',
    border: '0.5px solid #ccc',
    padding: '5px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  btnEdit: {
    background: '#EAF3DE',
    color: '#6de50b',
    border: '0.5px solid #C0DD97',
    padding: '5px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  btnDel: {
    background: '#FCEBEB',
    color: '#ee1111',
    border: '0.5px solid #F7C1C1',
    padding: '5px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  message: {
    textAlign: 'center',
    marginTop: '2rem',
    color: '#202020',
    fontSize: '15px',
  },
};