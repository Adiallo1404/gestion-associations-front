import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserById, createUser, updateUser } from '../api/userService';
import type { User, CreateUserDto } from '../types/user';

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [globalRole, setGlobalRole] = useState('USER');
  const [active, setActive] = useState(true);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    const fetchData = async () => {
      try {
        const data = await getUserById(Number(id));
        setEmail(data.email);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setGlobalRole(data.globalRole ?? 'USER');
        setActive(data.active ?? true);
      } catch {
        setError('Erreur lors du chargement');
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        const payload: User = {
          email,
          firstName,
          lastName,
          globalRole: globalRole || undefined,
          active,
        };
        await updateUser(Number(id), payload);
        navigate(`/users/${id}`);
      } else {
        const payload: CreateUserDto = {
          email,
          firstName,
          lastName,
          globalRole: globalRole || undefined,
          password,
        };
        await createUser(payload);
        navigate('/users');
      }
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      <button style={styles.btnBack} onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <div style={styles.card}>
        <h1 style={styles.title}>
          {isEdit ? 'Modifier un utilisateur' : 'Créer un utilisateur'}
        </h1>

        {error && <p style={styles.errorMsg}>{error}</p>}

        <form onSubmit={handleSubmit}>

          <div style={styles.grid}>

            <div style={styles.field}>
              <label style={styles.label}>Prénom *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="ex: Jean"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Nom *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="ex: Dupont"
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ex: jean.dupont@email.com"
                style={styles.input}
              />
            </div>

            {!isEdit && (
              <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Mot de passe *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minimum 6 caractères"
                  style={styles.input}
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Rôle global</label>
              <select
                value={globalRole}
                onChange={(e) => setGlobalRole(e.target.value)}
                style={styles.input}
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Statut</label>
              <div style={styles.toggleRow}>
                <button
                  type="button"
                  onClick={() => setActive(true)}
                  style={active ? styles.toggleActive : styles.toggleInactive}
                >
                  Actif
                </button>
                <button
                  type="button"
                  onClick={() => setActive(false)}
                  style={!active ? styles.toggleActive : styles.toggleInactive}
                >
                  Inactif
                </button>
              </div>
            </div>

          </div>

          <div style={styles.divider} />

          <div style={styles.actions}>
            <button
              type="button"
              style={styles.btnCancel}
              onClick={() => navigate(-1)}
            >
              Annuler
            </button>
            <button
              type="submit"
              style={styles.btnSubmit}
              disabled={loading}
            >
              {loading ? 'Sauvegarde...' : isEdit ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '2rem 1.5rem',
    background: '#f5f5e5',
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
    color: '#232222',
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
    maxWidth: '580px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#0a0a0a',
    margin: '0 0 1.5rem 0',
  },
  errorMsg: {
    background: '#FCEBEB',
    color: '#d10f0f',
    border: '0.5px solid #F7C1C1',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '1rem',
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
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#555',
  },
  input: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '0.5px solid #ccc',
    fontSize: '14px',
    color: '#1a1a1a',
    background: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  toggleRow: {
    display: 'flex',
    gap: '8px',
  },
  toggleActive: {
    padding: '7px 18px',
    borderRadius: '8px',
    border: 'none',
    background: '#185FA5',
    color: '#E6F1FB',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  toggleInactive: {
    padding: '7px 18px',
    borderRadius: '8px',
    border: '0.5px solid #ccc',
    background: '#f5f5f5',
    color: '#888',
    fontSize: '13px',
    cursor: 'pointer',
  },
  divider: {
    height: '0.5px',
    background: '#f0f0f0',
    marginBottom: '1.5rem',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  btnCancel: {
    background: 'transparent',
    border: '0.5px solid #b4a9a9',
    borderRadius: '8px',
    padding: '9px 20px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#555',
  },
  btnSubmit: {
    background: '#156dc5',
    color: '#E6F1FB',
    border: 'none',
    padding: '9px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
};