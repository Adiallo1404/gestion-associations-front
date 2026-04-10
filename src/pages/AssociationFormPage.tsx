import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssociationById, createAssociation, updateAssociation } from '../api/associationService';

export default function AssociationFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;

    const fetchData = async () => {
      try {
        const data = await getAssociationById(Number(id));
        setName(data.name);
        setDescription(data.description ?? '');
        setCity(data.city ?? '');
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
        await updateAssociation(Number(id), { name, description, city });
        navigate(`/associations/${id}`);
      } else {
        await createAssociation({ name, description, city });
        navigate('/associations');
      }
    } catch {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <div style={card}>

        <button style={btnBack} onClick={() => navigate(-1)}>
          ← Retour
        </button>

        {/* ✅ TITRE CORRIGÉ */}
        <h1 style={title}>
          {isEdit ? "✏️ Modifier une association" : "➕ Créer une association"}
        </h1>

        {error && <p style={errorStyle}>{error}</p>}

        <form onSubmit={handleSubmit} style={formStyle}>

          <div>
            <label style={label}>Nom *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={input}
            />
          </div>

          <div>
            <label style={label}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={input}
            />
          </div>

          <div>
            <label style={label}>Ville</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={input}
            />
          </div>

          <button type="submit" disabled={loading} style={btnSave}>
            {loading
              ? "⏳ Sauvegarde..."
              : isEdit
              ? "💾 Mettre à jour"
              : "✅ Créer"}
          </button>

        </form>
      </div>
    </div>
  );
}

/* 🎨 STYLES */

const container = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "90vh",
  background: "#f4f6f9",
};

const card = {
  background: "white",
  padding: "30px",
  borderRadius: "12px",
  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
  width: "400px",
};

const title = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  fontSize: "26px",           // ✅ taille corrigée
  fontWeight: "bold",
  color: "#2c3e50",           // ✅ couleur pro
  borderBottom: "2px solid #27ae60", // petite ligne verte stylée
  paddingBottom: "10px",
  marginBottom: "20px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "15px",
};

const label = {
  fontWeight: "bold",
  marginBottom: "5px",
  display: "block",
};

const input = {
  width: "100%",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const btnSave = {
  padding: "12px",
  background: "#27ae60",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "16px",
};

const btnBack = {
  marginBottom: "10px",
  background: "#bdc3c7",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
};

const errorStyle = {
  color: "red",
  textAlign: "center" as const,
};