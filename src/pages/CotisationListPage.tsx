import { useEffect, useState } from "react";
import { getCotisations, deleteCotisation } from "../api/cotisationService";
import { useNavigate } from "react-router-dom";
import type { Cotisation } from "../types/cotisation";
import ConfirmModal from "../components/ConfirmModal";
import { useWindowSize } from "../hooks/useWindowSize";

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: "#f39c12",
  PAYEE:      "#27ae60",
  EN_RETARD:  "#e74c3c",
  ANNULEE:    "#95a5a6",
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  PAYEE:      "Payée",
  EN_RETARD:  "En retard",
  ANNULEE:    "Annulée",
};

const getDeviseSymbol = (devise?: string) => {
  switch (devise) {
    case "XAF":
    case "XOF": return "FCFA";
    case "USD": return "$";
    case "GBP": return "£";
    case "CHF": return "CHF";
    case "GNF": return "GNF";
    case "MAD": return "MAD";
    case "DZD": return "DZD";
    case "TND": return "TND";
    default:    return "€";
  }
};

export default function CotisationListPage() {
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const { isMobile, isTablet } = useWindowSize();

  const [modal, setModal] = useState<{ isOpen: boolean; id: number | null; label: string }>
    ({ isOpen: false, id: null, label: '' });

  const fetchData = async () => {
    try {
      const data = await getCotisations(filters, page);
      setCotisations(data.content);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, [filters, page]);

  const handleDeleteClick = (c: Cotisation) =>
    setModal({ isOpen: true, id: c.id!, label: `cotisation de ${c.montant} ${getDeviseSymbol(c.devise)} (${STATUT_LABELS[c.statut] || c.statut})` });

  const handleConfirmDelete = async () => {
    if (!modal.id) return;
    try {
      await deleteCotisation(modal.id);
      setModal({ isOpen: false, id: null, label: '' });
      fetchData();
    } catch { setModal({ isOpen: false, id: null, label: '' }); }
  };

  const handleCancelDelete = () => setModal({ isOpen: false, id: null, label: '' });

  return (
    <div style={{ padding: isMobile ? '12px' : '20px' }}>

      <ConfirmModal
        isOpen={modal.isOpen}
        title="Supprimer la cotisation"
        message={`Êtes-vous sûr de vouloir supprimer la ${modal.label} ? Cette action est irréversible.`}
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <button style={btnBack} onClick={() => navigate("/")}>← Tableau de bord</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: "#2c3e50", margin: 0, fontSize: isMobile ? 18 : 22 }}>💰 Cotisations</h2>
        <button style={btnAdd} onClick={() => navigate("/cotisations/new")}>
          {isMobile ? '➕' : '➕ Ajouter'}
        </button>
      </div>

      {/* FILTRES */}
      <div style={{ marginBottom: "15px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <select style={inputStyle}
          onChange={(e) => { setPage(0); setFilters({ ...filters, statut: e.target.value || undefined }); }}>
          <option value="">-- Statut --</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="PAYEE">Payée</option>
          <option value="EN_RETARD">En retard</option>
          <option value="ANNULEE">Annulée</option>
        </select>
        {!isMobile && (
          <>
            <input type="number" placeholder="Montant min" style={inputStyle}
              onChange={(e) => { setPage(0); setFilters({ ...filters, montantMin: e.target.value || undefined }); }} />
            <input type="number" placeholder="Montant max" style={inputStyle}
              onChange={(e) => { setPage(0); setFilters({ ...filters, montantMax: e.target.value || undefined }); }} />
          </>
        )}
        <button style={btnPrimary} onClick={fetchData}>🔍</button>
      </div>

      {/* CARDS sur mobile */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cotisations.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9ca3af' }}>Aucune cotisation trouvée</p>
          ) : cotisations.map((c) => (
            <div key={c.id} style={{ background: '#fff', borderRadius: 10, padding: 14, border: '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 16 }}>{c.montant} {getDeviseSymbol(c.devise)}</strong>
                <span style={{ background: STATUT_COLORS[c.statut], color: '#fff', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 'bold' }}>
                  {STATUT_LABELS[c.statut] || c.statut}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                Membre #{c.memberId} · {c.periodeDebut} → {c.periodeFin}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button style={{ ...btnView, flex: 1 }} onClick={() => navigate(`/cotisations/${c.id}`)}>👁️ Voir</button>
                <button style={{ ...btnEdit, flex: 1 }} onClick={() => navigate(`/cotisations/${c.id}/edit`)}>✏️ Modifier</button>
                <button style={{ ...btnDelete, flex: 1 }} onClick={() => handleDeleteClick(c)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // TABLE sur tablette/desktop
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: "#3498db", color: "white" }}>
              <th style={thStyle}>Membre</th>
              <th style={thStyle}>Montant</th>
              <th style={thStyle}>Statut</th>
              {!isTablet && <th style={thStyle}>Période début</th>}
              {!isTablet && <th style={thStyle}>Période fin</th>}
              <th style={thStyle}>Échéance</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cotisations.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Aucune cotisation</td></tr>
            )}
            {cotisations.map((c) => (
              <tr key={c.id} style={{ textAlign: "center", borderBottom: "1px solid #eee" }}>
                <td style={tdStyle}>{c.memberId}</td>
                <td style={tdStyle}>
                  <strong>{c.montant} {getDeviseSymbol(c.devise)}</strong>
                </td>
                <td style={tdStyle}>
                  <span style={{ background: STATUT_COLORS[c.statut] || "#ccc", color: "white", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                    {STATUT_LABELS[c.statut] || c.statut}
                  </span>
                </td>
                {!isTablet && <td style={tdStyle}>{c.periodeDebut}</td>}
                {!isTablet && <td style={tdStyle}>{c.periodeFin}</td>}
                <td style={tdStyle}>{c.dateEcheance || "—"}</td>
                <td style={tdStyle}>
                  <button style={btnView} onClick={() => navigate(`/cotisations/${c.id}`)}>👁️</button>
                  <button style={btnEdit} onClick={() => navigate(`/cotisations/${c.id}/edit`)}>✏️</button>
                  <button style={btnDelete} onClick={() => handleDeleteClick(c)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* PAGINATION */}
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        <button style={btnPage} onClick={() => setPage(page - 1)} disabled={page === 0}>⬅</button>
        <span style={{ margin: "0 10px" }}>Page {page + 1}</span>
        <button style={btnPage} onClick={() => setPage(page + 1)}>➡</button>
      </div>
    </div>
  );
}

const btnBack    = { display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16, background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: 14, padding: 0 } as React.CSSProperties;
const inputStyle = { padding: "8px", borderRadius: "6px", border: "1px solid #ccc", fontSize: 13 };
const btnPrimary = { padding: "8px 12px", background: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" };
const btnAdd     = { padding: "10px 16px", background: "#2ecc71", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 };
const btnView    = { marginRight: "4px", background: "#3498db", color: "white", border: "none", padding: "6px 8px", borderRadius: "5px", cursor: "pointer" };
const btnEdit    = { marginRight: "4px", background: "#27ae60", color: "white", border: "none", padding: "6px 8px", borderRadius: "5px", cursor: "pointer" };
const btnDelete  = { background: "#e74c3c", color: "white", border: "none", padding: "6px 8px", borderRadius: "5px", cursor: "pointer" };
const btnPage    = { padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const, background: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" };
const thStyle    = { padding: "12px 16px" };
const tdStyle    = { padding: "10px 16px" };