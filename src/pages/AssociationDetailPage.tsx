import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAssociationById, deleteAssociation } from '../api/associationService';
import type { Association } from '../types/association';
import { formatDate } from '../utils/formatDate';
import ConfirmModal from '../components/ConfirmModal';
import Breadcrumb from '../components/Breadcrumb';

export default function AssociationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [association, setAssociation] = useState<Association | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleConfirmDelete = async () => {
    try {
      await deleteAssociation(Number(id));
      navigate('/associations');
    } catch {
      setError('Erreur lors de la suppression');
      setIsModalOpen(false);
    }
  };

  if (loading) return <p style={st.message}>Chargement...</p>;
  if (error) return <p style={{ ...st.message, color: '#A32D2D' }}>{error}</p>;
  if (!association) return <p style={st.message}>Association introuvable</p>;

  return (
    <div style={st.page}>
      <ConfirmModal
        isOpen={isModalOpen}
        title="Supprimer l'association"
        message={`Êtes-vous sûr de vouloir supprimer "${association.name}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsModalOpen(false)}
      />

      <Breadcrumb />

      <div style={st.header}>
        <h1 style={st.title}>{association.name}</h1>
        <div style={st.actions}>
          <button style={st.btnEdit} onClick={() => navigate(`/associations/${association.id}/edit`)}>
            Modifier
          </button>
          <button style={st.btnDel} onClick={() => setIsModalOpen(true)}>
            Supprimer
          </button>
        </div>
      </div>

      <div style={st.card}>
        <dl style={st.dl}>
          <div style={st.row}>
            <dt style={st.dt}>ID</dt>
            <dd style={st.dd}><span style={st.idBadge}>{association.id}</span></dd>
          </div>
          <div style={st.row}>
            <dt style={st.dt}>Nom</dt>
            <dd style={st.dd}>{association.name}</dd>
          </div>
          <div style={st.row}>
            <dt style={st.dt}>Description</dt>
            <dd style={st.dd}>{association.description ?? '—'}</dd>
          </div>
          <div style={st.row}>
            <dt style={st.dt}>Ville</dt>
            <dd style={st.dd}>
              {association.city ? <span style={st.cityBadge}>{association.city}</span> : '—'}
            </dd>
          </div>
          <div style={st.row}>
            <dt style={st.dt}>Date de création</dt>
            <dd style={st.dd}><span style={st.dateText}>{formatDate(association.dateCreation)}</span></dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  page:      { background: '#F5F5F3', minHeight: '100vh', padding: '2rem 1.5rem', fontFamily: 'system-ui, sans-serif' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' },
  title:     { fontSize: '32px', fontWeight: 500, color: '#1a1a1a', margin: 0 },
  actions:   { display: 'flex', gap: '8px' },
  card:      { background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0e0', padding: '8px 24px', maxWidth: '600px' },
  dl:        { margin: 0 },
  row:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '0.5px solid #f0f0f0' },
  dt:        { fontSize: '13px', fontWeight: 500, color: '#888', margin: 0 },
  dd:        { fontSize: '14px', color: '#1a1a1a', margin: 0, textAlign: 'right' },
  idBadge:   { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#f0f0f0', fontSize: '12px', fontWeight: 500, color: '#555' },
  cityBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '99px', background: '#EAF3DE', color: '#3B6D11', fontSize: '12px', fontWeight: 500 },
  dateText:  { fontSize: '12px', color: '#888', fontFamily: 'monospace' },
  btnEdit:   { background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 },
  btnDel:    { background: '#FCEBEB', color: '#A32D2D', border: '0.5px solid #F7C1C1', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 },
  message:   { textAlign: 'center', marginTop: '2rem', color: '#555', fontSize: '15px' },
};