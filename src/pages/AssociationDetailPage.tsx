import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssociationById, deleteAssociation } from '../api/associationService';
import type { Association } from '../types/association';

export default function AssociationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [association, setAssociation] = useState<Association | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAssociationById(Number(id));
        setAssociation(data);
      } catch {
        setError('Association introuvable');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Supprimer cette association ?')) return;
    try {
      await deleteAssociation(Number(id));
      navigate('/associations');
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!association) return <p>Association introuvable</p>;

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => navigate('/associations')}>
        ← Retour à la liste
      </button>

      <h1>{association.name}</h1>

      <table border={1} style={{ marginTop: '20px' }}>
        <tbody>
          <tr>
            <td><strong>ID</strong></td>
            <td>{association.id}</td>
          </tr>
          <tr>
            <td><strong>Nom</strong></td>
            <td>{association.name}</td>
          </tr>
          <tr>
            <td><strong>Description</strong></td>
            <td>{association.description ?? '—'}</td>
          </tr>
          <tr>
            <td><strong>Ville</strong></td>
            <td>{association.city ?? '—'}</td>
          </tr>
          <tr>
            <td><strong>Date de création</strong></td>
            <td>{association.dateCreation ?? '—'}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => navigate(`/associations/${id}/edit`)}>
          ✏️ Modifier
        </button>
        <button onClick={handleDelete} style={{ marginLeft: '10px', color: 'red' }}>
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
}