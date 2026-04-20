import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getRoleByUserAndAssociation,
  deleteRole
} from '../api/userAssociationRoleService';
import type { UserAssociationRole } from '../types/userAssociationRole';

export default function UserAssociationRoleDetailPage() {
  const { userId, associationId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState<UserAssociationRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getRoleByUserAndAssociation(
          Number(userId),
          Number(associationId)
        );
        setData(result);
      } catch {
        setError('Affectation introuvable');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, associationId]);

  const handleDelete = async () => {
    if (!data?.id) return;

    if (!confirm('Supprimer cette affectation ?')) return;

    try {
      await deleteRole(data.id);
      navigate('/user-association-roles');
    } catch {
      setError('Erreur lors de la suppression');
    }
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data) return <p>Affectation introuvable</p>;

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => navigate('/user-association-roles')}>
        ← Retour à la liste
      </button>

      <h1>Détail de l'affectation</h1>

      <table border={1} style={{ marginTop: '20px' }}>
        <tbody>
          <tr>
            <td><strong>ID</strong></td>
            <td>{data.id}</td>
          </tr>
          <tr>
            <td><strong>User ID</strong></td>
            <td>{data.userId}</td>
          </tr>
          <tr>
            <td><strong>Association</strong></td>
            <td>{data.associationName ?? '—'} (ID: {data.associationId})</td>
          </tr>
          <tr>
            <td><strong>Role</strong></td>
            <td>{data.roleName ?? '—'} (ID: {data.roleId})</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() =>
            navigate(`/user-association-roles/${data.id}/edit`)
          }
        >
          ✏️ Modifier
        </button>

        <button
          onClick={handleDelete}
          style={{ marginLeft: '10px', color: 'red' }}
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
}