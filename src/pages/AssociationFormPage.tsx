import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssociationById, createAssociation, updateAssociation } from '../api/associationService';
import type { AssociationInput } from '../types/association';

export default function AssociationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const data = await getAssociationById(Number(id));
        setName(data.name);
        setDescription(data.description ?? '');
        setCity(data.city ?? '');
      } catch {
        setError('Erreur lors du chargement de l\'association');
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Avoid persisting empty strings: send undefined so optional fields
    // remain null on the backend when left blank.
    const payload: AssociationInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      city: city.trim() || undefined,
    };

    try {
      if (isEdit && id) {
        await updateAssociation(Number(id), payload);
        navigate(`/associations/${id}`);
      } else {
        const created = await createAssociation(payload);
        navigate(`/associations/${created.id}`);
      }
    } catch {
      setError('Erreur lors de la sauvegarde. Veuillez vérifier les champs et réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <p style={st.message}>Chargement...</p>;

  return (
    <div style={st.container}>
      <div style={st.card}>
        <button type="button" style={st.btnBack} onClick={() => navigate(-1)}>
          ← Retour
        </button>

        <h1 style={st.title}>
          {isEdit ? 'Modifier une association' : 'Créer une association'}
        </h1>

        {error && <p style={st.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={st.form}>
          <div>
            <label htmlFor="assoc-name" style={st.label}>Nom *</label>
            <input
              id="assoc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={st.input}
            />
          </div>

          <div>
            <label htmlFor="assoc-description" style={st.label}>Description</label>
            <textarea
              id="assoc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={st.input}
            />
          </div>

          <div>
            <label htmlFor="assoc-city" style={st.label}>Ville</label>
            <input
              id="assoc-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={st.input}
            />
          </div>

          <button type="submit" disabled={loading} style={st.btnSave}>
            {loading ? 'Sauvegarde en cours...' : isEdit ? 'Mettre à jour' : 'Créer'}
          </button>
        </form>
      </div>
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '90vh',
    background: '#F5F5F3',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    background: '#fff',
    padding: '30px',
    borderRadius: '12px',
    border: '0.5px solid #e0e0e0',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    width: '420px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 500,
    color: '#1a1a1a',
    borderBottom: '2px solid #185FA5',
    paddingBottom: '12px',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    fontWeight: 500,
    fontSize: '13px',
    color: '#555',
    marginBottom: '6px',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '0.5px solid #ccc',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  btnSave: {
    padding: '12px',
    background: '#185FA5',
    color: '#E6F1FB',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  btnBack: {
    marginBottom: '16px',
    background: '#f5f5f5',
    color: '#333',
    border: '0.5px solid #ccc',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  error: {
    color: '#A32D2D',
    background: '#FCEBEB',
    border: '0.5px solid #F7C1C1',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  message: {
    textAlign: 'center',
    marginTop: '2rem',
    color: '#555',
    fontSize: '15px',
  },
};