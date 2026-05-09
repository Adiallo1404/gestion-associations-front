import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssociations, deleteAssociation } from '../api/associationService';
import type { Association } from '../types/association';
import ConfirmModal from '../components/ConfirmModal';
import { useWindowSize } from '../hooks/useWindowSize';
import Breadcrumb from '../components/Breadcrumb';

export default function AssociationListPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [modal, setModal] = useState<{ isOpen: boolean; id: number | null; name: string }>
    ({ isOpen: false, id: null, name: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getAssociations(0, 1000);
      setAssociations(data.content || []);
    } catch {
      setError('Erreur lors du chargement des associations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteClick = (id: number, name: string) => setModal({ isOpen: true, id, name });
  const handleConfirmDelete = async () => {
    if (!modal.id) return;
    try {
      await deleteAssociation(modal.id);
      setModal({ isOpen: false, id: null, name: '' });
      fetchData();
    } catch {
      setError('Erreur lors de la suppression');
      setModal({ isOpen: false, id: null, name: '' });
    }
  };
  const handleCancelDelete = () => setModal({ isOpen: false, id: null, name: '' });

  const filtered = associations.filter(a =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.city?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (raw: string) => {
    if (!raw) return '—';
    const d = new Date(raw);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) return <p style={st.message}>Chargement...</p>;
  if (error)   return <p style={{ ...st.message, color: '#A32D2D' }}>{error}</p>;

  return (
    <div style={{ ...st.page, padding: isMobile ? '1rem' : '2rem 1.5rem' }}>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer l'association"
        message={`Êtes-vous sûr de vouloir supprimer "${modal.name}" ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* ✅ BREADCRUMB remplace le bouton "← Retour" */}
      <Breadcrumb />

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
      }}>
        <h1 style={{ ...st.title, fontSize: isMobile ? '22px' : '32px' }}>Associations</h1>
        <button style={st.btnCreate} onClick={() => navigate('/associations/new')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {isMobile ? 'Créer' : 'Créer une association'}
        </button>
      </div>

      {/* TOOLBAR */}
      <div style={st.toolbar}>
        <input
          type="text"
          placeholder="Rechercher par nom ou ville..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...st.searchInput, maxWidth: isMobile ? '100%' : '320px', width: isMobile ? '100%' : 'auto' }}
        />
        <span style={st.countLabel}>{filtered.length} association{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <p style={st.message}>Aucune association trouvée.</p>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((assoc) => (
            <div key={assoc.id} style={st.mobileCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>{assoc.name}</div>
                  <span style={st.cityBadge}>{assoc.city}</span>
                </div>
                <span style={st.idBadge}>{assoc.id}</span>
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>{formatDate(assoc.dateCreation ?? '')}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={{ ...st.btnVoir, flex: 1, justifyContent: 'center' }} onClick={() => navigate(`/associations/${assoc.id}`)}>Voir</button>
                <button style={{ ...st.btnEdit, flex: 1, justifyContent: 'center' }} onClick={() => navigate(`/associations/${assoc.id}/edit`)}>Modifier</button>
                <button style={{ ...st.btnDel, flex: 1, justifyContent: 'center' }} onClick={() => handleDeleteClick(assoc.id, assoc.name ?? '')}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={st.card}>
          <table style={st.table}>
            <thead>
              <tr style={st.theadRow}>
                <th style={{ ...st.th, width: '52px' }}>ID</th>
                <th style={st.th}>Nom</th>
                <th style={st.th}>Ville</th>
                {!isTablet && <th style={st.th}>Date création</th>}
                <th style={{ ...st.th, width: isTablet ? '160px' : '210px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((assoc) => (
                <tr
                  key={assoc.id}
                  style={st.tr}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8F8F8')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={st.td}><span style={st.idBadge}>{assoc.id}</span></td>
                  <td style={{ ...st.td, fontWeight: 500 }}>{assoc.name}</td>
                  <td style={st.td}><span style={st.cityBadge}>{assoc.city}</span></td>
                  {!isTablet && <td style={st.td}><span style={st.dateText}>{formatDate(assoc.dateCreation ?? '')}</span></td>}
                  <td style={st.td}>
                    <div style={st.actions}>
                      <button style={st.btnVoir} onClick={() => navigate(`/associations/${assoc.id}`)}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <ellipse cx="6.5" cy="6.5" rx="5.5" ry="3.5" stroke="currentColor" strokeWidth="1.2" />
                          <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" />
                        </svg>
                        Voir
                      </button>
                      <button style={st.btnEdit} onClick={() => navigate(`/associations/${assoc.id}/edit`)}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M9 2l2 2-7 7H2v-2L9 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                        </svg>
                        {!isTablet && 'Modifier'}
                      </button>
                      <button style={st.btnDel} onClick={() => handleDeleteClick(assoc.id, assoc.name ?? '')}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <polyline points="2,4 11,4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                          <path d="M5 4V3h3v1M4 4l1 7h4l1-7" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                        </svg>
                        {!isTablet && 'Supprimer'}
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

const st: Record<string, React.CSSProperties> = {
  page:        { background: '#F5F5F3', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  title:       { fontSize: '32px', fontWeight: 500, color: '#1a1a1a', margin: 0 },
  btnCreate:   { background: '#185FA5', color: '#E6F1FB', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
  toolbar:     { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' },
  searchInput: { padding: '9px 14px', borderRadius: '8px', border: '0.5px solid #ccc', background: '#fff', fontSize: '14px', color: '#1a1a1a', outline: 'none' },
  countLabel:  { marginLeft: 'auto', fontSize: '13px', color: '#888', whiteSpace: 'nowrap' },
  card:        { background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0e0', overflow: 'hidden' },
  mobileCard:  { background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0e0', padding: '16px' },
  table:       { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  theadRow:    { background: '#E6F1FB' },
  th:          { padding: '14px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#0C447C', borderBottom: '0.5px solid #B5D4F4' },
  tr:          { borderBottom: '0.5px solid #f0f0f0', transition: 'background 0.1s' },
  td:          { padding: '12px 16px', color: '#1a1a1a', verticalAlign: 'middle' },
  idBadge:     { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#f0f0f0', fontSize: '12px', fontWeight: 500, color: '#555' },
  cityBadge:   { display: 'inline-block', padding: '3px 10px', borderRadius: '99px', background: '#EAF3DE', color: '#3B6D11', fontSize: '12px', fontWeight: 500 },
  dateText:    { fontSize: '12px', color: '#888', fontFamily: 'monospace' },
  actions:     { display: 'flex', gap: '6px', alignItems: 'center' },
  btnVoir:     { background: '#f5f5f5', color: '#333', border: '0.5px solid #ccc', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  btnEdit:     { background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  btnDel:      { background: '#FCEBEB', color: '#A32D2D', border: '0.5px solid #F7C1C1', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  message:     { textAlign: 'center', marginTop: '2rem', color: '#555', fontSize: '15px' },
};